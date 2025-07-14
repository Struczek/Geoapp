import unittest
from pyramid import testing


class DatabaselViewTests(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()

    def tearDown(self):
        testing.tearDown()

    def test_db(self):
        from geoapp.controllers.views import GeoJsonViews

        request = testing.DummyRequest()
        request.matchdict = {"model": "nyc_subway_stations"}
        inst = GeoJsonViews(request)
        res = inst.geojson_view()
        assert res["type"] == "FeatureCollection"


class DatabaseFunctionalTests(unittest.TestCase):
    def setUp(self):
        from pyramid.paster import get_app

        app = get_app("development.ini")
        from webtest import TestApp

        self.testapp = TestApp(app)

    def tearDown(self):
        from .models.models import DBSession

        DBSession.remove()

    def test_db(self):
        res = self.testapp.get("/api/nyc_subway_stations/geojson", status=200)
        self.assertIn(b"FeatureCollection", res.body)
