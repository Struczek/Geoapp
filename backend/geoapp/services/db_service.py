from geoapp.utils.geojson_util import model_rows_to_geojson
from sqlalchemy import func

def get_features(session, model, filters, target_srid=4326, precision=6 ):
    rows = session.query(
        model,
        func.ST_AsGeoJSON(
            func.ST_Transform(model.geom, target_srid), precision
        ).label("geom_json")
    ).filter_by(**filters).all()

    return model_rows_to_geojson(rows)