from pyramid.view import view_config, view_defaults
from pyramid.httpexceptions import HTTPNotFound, HTTPBadRequest
from geoapp.services.db_service import DbServices
from geoapp.models.registry import MODEL_REGISTRY
from geoapp.models.models import DBSession


@view_defaults(renderer="json")
class GeoJsonViews:
    def __init__(self, request):
        self.request = request

    def get_filters(self, model):
        filters = {}
        invalid_filters = []

        for key, value in self.request.params.items():
            if hasattr(model, key):
                filters[key] = value
            else:
                invalid_filters.append(key)

        if invalid_filters:
            raise HTTPBadRequest(
                f"Invalid filter parameters: {', '.join(invalid_filters)}."
            )

        return filters

    def fetch_data(self, model, filters):
        db_services = DbServices(DBSession, model, filters)
        return db_services.get_features()

    @view_config(route_name="geojson_generic", request_method="GET")
    def geojson_view(self):
        model_name = self.request.matchdict.get("model")
        model = MODEL_REGISTRY.get(model_name)

        if not model:
            raise HTTPNotFound(f"Model '{model_name}' not found.")

        filters = self.get_filters(model)
        data = self.fetch_data(model, filters)

        # Set CORS headers
        self.request.response.headers.update(
            {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            }
        )

        return data
