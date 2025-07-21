import unittest
from pyramid import testing
from sqlalchemy import create_engine
from geoapp.models.models import DBSession


class DatabaselViewTests(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()

        engine = create_engine(
            "postgresql+psycopg2://postgres:admin@localhost:5432/nyc"
        )
        DBSession.configure(bind=engine)

    def tearDown(self):
        testing.tearDown()

    def test_db(self):
        from geoapp.controllers.db_controller import DbController

        request = testing.DummyRequest()
        request.matchdict = {"model": "nyc_subway_stations"}
        inst = DbController(request)
        res = inst.db_view()
        assert res["type"] == "FeatureCollection"

    def test_db_with_gid_param(self):
        from geoapp.controllers.db_controller import DbController

        request = testing.DummyRequest(params={"gid": "1"})
        request.matchdict = {"model": "nyc_subway_stations"}
        inst = DbController(request)
        res = inst.db_view()
        assert res["type"] == "FeatureCollection"
        assert len(res["features"]) == 1
        assert res["features"][0]["properties"]["gid"] == 1


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

        feature = data["features"][0]
        assert feature["properties"]["gid"] == 1
