from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import JSONB
from geoapp.models.models import NycNeighborhoods, NycHomicides, NycSubwayStations


class DbServices:
    """
    A service class for interacting with a database to retrieve and transform geospatial data.

    This class provides methods to query geospatial features from a database, apply spatial transformations,
    and return the results in GeoJSON format. It supports filtering features based on specified conditions and
    can handle spatial reference system transformations with precision control.
    """

    def __init__(self, session, target_srid=4326, precision=6, geom_column="geom_json"):
        self.session = session
        self.target_srid = target_srid
        self.precision = precision
        self.geom_column = geom_column

    def get_features(self, model, filters):
        """
        Retrieves features from the database, applies spatial transformations,
        and returns them as GeoJSON objects.

        Args:
            model (SQLAlchemy model): The database model from which features are retrieved.
            filters (dict): A dictionary of filters to apply when querying the database.

        Returns:
            list: A list of GeoJSON objects representing the transformed geometries and associated data.
        """
        subquery_properties = select(model).filter_by(**filters).subquery()
        columns = subquery_properties.c
        json_fields = []

        # Skip geometry columns to include only non-geometry fields in GeoJSON properties
        for col in columns:
            if col.name != "geom" and col.name != "geom_invalid":
                json_fields.extend([col.name, col])

        subquery_features = select(
            func.jsonb_build_object(
                "type",
                "Feature",
                "geometry",
                func.ST_AsGeoJSON(
                    func.ST_Transform(subquery_properties.c.geom, self.target_srid),
                    self.precision,
                ).cast(JSONB),
                "properties",
                func.jsonb_build_object(*json_fields),
            )
        )

        geojson_query = select(
            func.jsonb_build_object(
                "type",
                "FeatureCollection",
                "features",
                func.jsonb_agg(subquery_features.c[0]),
            )
        )
        result = self.session.execute(geojson_query).scalar()

        return result

    def get_spatial_data(self, x, y):
        """
        Retrieves spatial information for a given coordinate in EPSG:3857.
        """
        point_geom = self._make_transformed_point(x, y)
        neighborhood = self._get_neighborhoods(point_geom)
        number_of_homicides = self._count_homicides_nearby(point_geom)
        subway = self._get_nearest_subway_station(point_geom)

        return {
            "neighborhood": neighborhood,
            "number_of_homicides": number_of_homicides,
            "subway": subway,
        }

    def _make_transformed_point(self, x, y):
        """
        Creates a point geometry from coordinates in EPSG:3857 and transforms it to EPSG:26918.
        """
        return func.ST_Transform(func.ST_SetSRID(func.ST_MakePoint(x, y), 3857), 26918)

    def _get_neighborhoods(self, point_geom):
        """
        Returns GIDs of neighborhoods that contain the given point geometry, or None if not found.
        """
        stmt = select(NycNeighborhoods.gid).where(
            func.ST_Intersects(NycNeighborhoods.geom, point_geom)
        )
        result = self.session.execute(stmt).all()

        if result:
            neighborhoods = []
            for row in result:
                neighborhoods.append({"neighborhood_gid": row.gid})
        else:
            neighborhoods = None

        return neighborhoods

    def _count_homicides_nearby(self, point_geom, radius=100):
        """
        Counts the number of homicides within a specified distance from the given point geometry.
        The default value of radius is 100 meters.
        """
        stmt = (
            select(func.count())
            .select_from(NycHomicides)
            .where(func.ST_DWithin(NycHomicides.geom, point_geom, radius))
        )

        return self.session.execute(stmt).scalar()

    def _get_nearest_subway_station(self, point_geom):
        """
        Returns the GID and distance in meters of the nearest subway station to the given point geometry.
        """
        stmt = (
            select(
                NycSubwayStations.gid,
                func.ST_Distance(NycSubwayStations.geom, point_geom).label("distance"),
            ).order_by(NycSubwayStations.geom.op("<->")(point_geom))
            # Only fetch the closest station
            .limit(1)
        )
        result = self.session.execute(stmt).first()

        if result:
            response = {"subway_gid": result.gid, "subway_distance": result.distance}
        else:
            response = None

        return response
