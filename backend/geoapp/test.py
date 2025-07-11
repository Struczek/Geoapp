import unittest

from pyramid import testing

class TutorialViewTests(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()

    def tearDown(self):
        testing.tearDown()

    def test_home(self):
        from geoapp.controllers.views import TutorialViews

        request = testing.DummyRequest()
        inst = TutorialViews(request)
        response = inst.home()
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Hello World', response.body)


class TutorialFunctionalTests(unittest.TestCase):
    def setUp(self):
        from pyramid.paster import get_app
        app = get_app('development.ini')
        from webtest import TestApp

        self.testapp = TestApp(app)

    def tearDown(self):
        from .models.models import DBSession
        DBSession.remove()

    def test_home(self):
        res = self.testapp.get('/', status=200)
        self.assertIn(b'Hello World', res.body)

class DatabaselViewTests(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()

    def tearDown(self):
        testing.tearDown()

    def test_db(self):
        from geoapp.controllers.views import GeoJsonViews

        request = testing.DummyRequest()
        request.matchdict = {'model': 'nyc_subway_stations'}
        inst = GeoJsonViews(request)
        res = inst.geojson_view()
        assert res['type'] == 'FeatureCollection'


class DatabaseFunctionalTests(unittest.TestCase):
    def setUp(self):
        from pyramid.paster import get_app
        app = get_app('development.ini')
        from webtest import TestApp

        self.testapp = TestApp(app)

    def tearDown(self):
        from .models.models import DBSession
        DBSession.remove()

    def test_db(self):
        res = self.testapp.get('/api/nyc_subway_stations/geojson', status=200)
        self.assertIn(b'FeatureCollection', res.body)