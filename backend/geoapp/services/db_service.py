from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import JSONB


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
