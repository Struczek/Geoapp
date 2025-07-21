def add_routes(config):
    config.add_route("db_controller.db_view", "/api/{model}/geojson")