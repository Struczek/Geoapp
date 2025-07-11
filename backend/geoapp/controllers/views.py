from pyramid.view import (
    view_config,
    view_defaults
    )
from pyramid.httpexceptions import HTTPNotFound, HTTPBadRequest
from backend.geoapp.services.db_service import get_features
from geoapp.models.registry import MODEL_REGISTRY
from pyramid.response import Response
from geoapp.models.models import DBSession, Base

class TutorialViews:
    def __init__(self, request):
        self.request = request

    @view_config(route_name='home')
    def home(self):
        return Response('<body>Hello World</body>')



@view_defaults(renderer='json')
class GeoJsonViews:
    def __init__(self, request):
        self.request = request

    @view_config(route_name='geojson_generic', request_method='GET')
    def geojson_view(self):
        model_name = self.request.matchdict.get("model")
        model = MODEL_REGISTRY.get(model_name)
        if not model:
            raise HTTPNotFound(f"Model '{model_name}' not found.")
        
        filters = {}
        invalid_filters = []

        for key, value in self.request.params.items():
            if hasattr(model, key):
                filters[key] = value
            else:
                invalid_filters.append(key)

        if invalid_filters:
            raise HTTPBadRequest(f"Invalid filter parameters: {', '.join(invalid_filters)}.")


        return get_features(
            session=DBSession,
            model=model,
            filters=filters
        )