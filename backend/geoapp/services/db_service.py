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

        # Builds a flat list of alternating key-value pairs (column name and column object)
        # for all columns except the geometry columns. This list is used to construct
        # the "properties" object in each GeoJSON Feature using jsonb_build_object.
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
        Retrieves spatial information for a given coordinate in EPSG:3857 (Web Mercator),
        including neighborhood details, number of nearby homicides, and proximity to the nearest subway station.

        Args:
            x (float): X-coordinate (easting) in EPSG:3857.
            y (float): Y-coordinate (northing) in EPSG:3857.

        Returns:
            dict: A dictionary containing:
                - name (str): Name of the neighborhood the point falls within.
                - boroname (str): Name of the borough the point falls within.
                - number_of_homicides (int): Number of homicides near the point.
                - station_name (str): Name of the nearest subway station.
                - distance_meters (float): Distance to the nearest subway station in meters.
        """
        point_geom = self._make_transformed_point(x, y)
        name, boroname = self._get_neighborhood(point_geom)
        number_of_homicides = self._count_homicides_nearby(point_geom)
        station_name, distance_meters = self._get_nearest_subway_station(point_geom)

        return {
            "name": name,
            "boroname": boroname,
            "number_of_homicides": number_of_homicides,
            "station_name": station_name,
            "distance_meters": distance_meters,
        }

    def _make_transformed_point(self, x, y):
        """
        Creates a point geometry from coordinates in EPSG:3857 and transforms it to EPSG:26918.

        Args:
            x (float): X-coordinate (easting) in EPSG:3857.
            y (float): Y-coordinate (northing) in EPSG:3857.

        Returns:
            sqlalchemy.sql.functions.Function: SQLAlchemy expression representing the transformed geometry point in EPSG:26918.
        """
        return func.ST_Transform(func.ST_SetSRID(func.ST_MakePoint(x, y), 3857), 26918)

    def _get_neighborhood(self, point_geom):
        """
        Finds the neighborhood and borough that contain the given geometry point.

        The input geometry is expected to be in EPSG:26918 (e.g., created using `_make_transformed_point`).

        Args:
            point_geom (sqlalchemy.sql.functions.Function): A geometry point in EPSG:26918.

        Returns:
            tuple:
                - name (str or None): Name of the neighborhood containing the point, or None if not found.
                - boroname (str or None): Name of the borough containing the point, or None if not found.
        """
        stmt = select(NycNeighborhoods.name, NycNeighborhoods.boroname).where(
            func.ST_Intersects(NycNeighborhoods.geom, point_geom)
        )
        result = self.session.execute(stmt).first()

        if result:
            name, boroname = result
        else:
            name, boroname = None, None

        return name, boroname

    def _count_homicides_nearby(self, point_geom, radius=100):
        """
        Counts the number of homicides within a specified distance from the given point geometry.

        The input geometry is expected to be in EPSG:26918 (e.g., created using `_make_transformed_point`).
        The search is performed using a radial buffer defined by `radius` in meters.

        Args:
            point_geom (sqlalchemy.sql.functions.Function): Geometry point in EPSG:26918.
            radius (int, optional): Search radius in meters. Defaults to 100.

        Returns:
            int: Number of homicide incidents within the given radius of the point.
        """
        stmt = (
            select(func.count())
            .select_from(NycHomicides)
            .where(func.ST_DWithin(NycHomicides.geom, point_geom, radius))
        )

        return self.session.execute(stmt).scalar()

    def _get_nearest_subway_station(self, point_geom):
        """
        Finds the nearest subway station to the given geometry point and returns its name and distance.

        The input geometry is expected to be in EPSG:26918 (e.g., created using `_make_transformed_point`).
        Uses a spatial index operator for efficient nearest-neighbor search.

        Args:
            point_geom (sqlalchemy.sql.functions.Function): Geometry point in EPSG:26918.

        Returns:
            tuple:
                - name (str or None): Name of the nearest subway station, or None if not found.
                - distance (float or None): Distance to the station in meters, rounded to two decimal places,
                or None if not found.
        """
        stmt = (
            select(
                NycSubwayStations.name,
                func.ST_Distance(NycSubwayStations.geom, point_geom).label("distance"),
            )
            .order_by(NycSubwayStations.geom.op("<->")(point_geom))
            .limit(1)
        )
        result = self.session.execute(stmt).first()

        if result:
            name, distance = result
            distance = round(distance, 2)
        else:
            name, distance = None, None

        return name, distance
