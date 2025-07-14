from sqlalchemy import func
import json


class DbServices:
    def __init__(self, session, model, filters, target_srid=4326, precision=6, geom_column="geom_json"):
        self.session = session
        self.model = model
        self.filters = filters
        self.target_srid = target_srid
        self.precision = precision
        self.geom_column = geom_column
    
    def model_rows_to_geojson(self,rows):
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
    
    def get_features(self):
        rows = (
            self.session.query(
                self.model,
                func.ST_AsGeoJSON(
                    func.ST_Transform(self.model.geom, self.target_srid), self.precision
                ).label("geom_json"),
            )
            .filter_by(**self.filters)
            .all()
        )

        return self.model_rows_to_geojson(rows)
