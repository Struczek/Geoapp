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
        import json

        data = json.loads(res.body)
        assert data["neighborhood"][0]["name"] == "Dyker Heights"
        assert data["neighborhood"][0]["boroname"] == "Brooklyn"
        assert data["number_of_homicides"] == 0
        assert data["station_name"] == "95th St"
        assert abs(data["distance_meters"] - 1293.1) < 0.5

    def test_spatial_data_view_invalid_coords(self):
        res = self.testapp.get("/api/spatial_data?x=abc&y=4507520.0", status=400)
        self.assertIn(b"Invalid or missing x,y", res.body)

    def test_spatial_data_view_no_neighborhood(self):
        res = self.testapp.get(
            "/api/spatial_data?x=-9239434.211335423&y=4955524.41983333", status=200
        )
        import json

        data = json.loads(res.body)
        assert data["neighborhood"] == []
        assert data["number_of_homicides"] == 0
        assert data["station_name"] == "Tottenville"
        assert abs(data["distance_meters"] - 741470.2135) < 0.5
