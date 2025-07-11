import json

def model_rows_to_geojson(rows, geom_column="geom_json"):
    """
    Converts SQLAlchemy ORM rows with geometry column to GeoJSON FeatureCollection.
    """
    features = []
    for row in rows:
        geom = getattr(row, geom_column, None)
        if geom:
            geometry = json.loads(geom)
        else:
            geometry = None

        properties={}
        for key in row[0].__table__.columns.keys():
            if key != geom_column and key != "geom":
                properties[key] = getattr(row[0],key)

        features.append({
            "type": "Feature",
            "geometry": geometry,
            "properties": properties
        })
    
    response ={
        "type": "FeatureCollection",
        "features": features
    }
    return response
