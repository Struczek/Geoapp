import unittest
import json


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
        data = json.loads(res.body)
        assert len(data["features"]) == 1
        assert data["features"][0]["properties"]["gid"] == 1

    def test_spatial_data_view(self):
        res = self.testapp.get(
            "/api/spatial_data?x=-8239434.211335423&y=4955524.41983333", status=200
        )
        data = json.loads(res.body)
        assert data["neighborhood"][0]["neighborhood_gid"] == 72
        assert data["number_of_homicides"] == 0
        assert data["subway"]["subway_gid"] == 98
        assert abs(data["subway"]["subway_distance"] - 1293.1) < 0.5

    def test_spatial_data_view_invalid_coords(self):
        res = self.testapp.get("/api/spatial_data?x=abc&y=4507520.0", status=400)
        self.assertIn(b"Invalid or missing x,y", res.body)

    def test_spatial_data_view_no_neighborhood(self):
        res = self.testapp.get(
            "/api/spatial_data?x=-9239434.211335423&y=4955524.41983333", status=200
        )
        data = json.loads(res.body)
        assert data["neighborhood"] == None
        assert data["number_of_homicides"] == 0
        assert data["subway"]["subway_gid"] == 478
        assert abs(data["subway"]["subway_distance"] - 741470.2135) < 0.5
