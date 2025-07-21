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

    def test_spatial_data_view(self):
        res = self.testapp.get(
            "/api/spatial_data?x=-8239434.211335423&y=4955524.41983333", status=200
        )
        self.assertIn(b"name", res.body)
        self.assertIn(b"boroname", res.body)
        self.assertIn(b"station_name", res.body)
        self.assertIn(b"number_of_homicides", res.body)
        self.assertIn(b"distance_meters", res.body)

    def test_spatial_data_view_invalid_coords(self):
        res = self.testapp.get("/api/spatial_data?x=abc&y=4507520.0", status=400)
        self.assertIn(b"Invalid or missing x,y", res.body)
