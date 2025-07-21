import unittest


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

    def test_db_with_gid_param(self):
        res = self.testapp.get("/api/nyc_subway_stations/geojson?gid=1", status=200)
        self.assertIn(b"FeatureCollection", res.body)
        import json

        data = json.loads(res.body)
        assert len(data["features"]) == 1
        assert data["features"][0]["properties"]["gid"] == 1
