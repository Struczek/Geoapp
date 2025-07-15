from sqlalchemy import func
import json


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

    def model_rows_to_geojson(self, rows):
        """
        Converts a list of database query rows into a GeoJSON FeatureCollection.

        Args:
            rows (list): A list of query rows from the database, where each row contains
                        a model instance with geometry and other attribute data.

        Returns:
            dict: A GeoJSON FeatureCollection containing features with geometry and properties.
                The properties are derived from the model's columns, excluding geometry columns.
        """
        features = []
        for row in rows:
            geom = getattr(row, self.geom_column, None)
            if geom:
                geometry = json.loads(geom)
            else:
                geometry = None

            properties = {}
            for key in row[0].__table__.columns.keys():
                if key != self.geom_column and key != "geom" and key != "geom_invalid":
                    properties[key] = getattr(row[0], key)

            features.append(
                {"type": "Feature", "geometry": geometry, "properties": properties}
            )

        response = {"type": "FeatureCollection", "features": features}
        return response

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
        rows = (
            self.session.query(
                model,
                func.ST_AsGeoJSON(
                    func.ST_Transform(model.geom, self.target_srid), self.precision
                ).label("geom_json"),
            )
            .filter_by(**filters)
            .all()
        )

        return self.model_rows_to_geojson(rows)
