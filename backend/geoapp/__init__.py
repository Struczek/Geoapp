from pyramid.config import Configurator
from sqlalchemy import engine_from_config
from geoapp.config.route import add_routes
from pyramid.renderers import JSON
import datetime
import decimal
from geoapp.models.models import DBSession, Base


def main(global_config, **settings):
    engine = engine_from_config(settings, 'sqlalchemy.')
    DBSession.configure(bind=engine)
    Base.metadata.bind = engine
    config = Configurator(settings=settings)
    json_renderer = JSON()
    def decimal_adapter(obj, request):
        if isinstance(obj, decimal.Decimal):
            return float(obj)
        raise TypeError
    json_renderer.add_adapter(decimal.Decimal, decimal_adapter)
    def datetime_adapter(obj, request):
        return obj.isoformat()
    def date_adapter(obj, request):
        return obj.isoformat()
    json_renderer.add_adapter(datetime.datetime, datetime_adapter)
    json_renderer.add_adapter(datetime.date, date_adapter)
    config.add_renderer('json', json_renderer)
    config.include('pyramid_chameleon')
    add_routes(config)
    config.scan('geoapp.controllers')
    return config.make_wsgi_app()