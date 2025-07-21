from pyramid.view import view_config
from pyramid.httpexceptions import HTTPNotFound, HTTPBadRequest
from geoapp.services.db_service import DbServices
from geoapp.models.registry import MODEL_REGISTRY
from geoapp.models.models import DBSession


class DbController:
    """
    Controller for handling database operations and managing filters for
    model queries. It provides methods for extracting filter parameters from
    the request, validating them against a given model, and fetching data
    from the database based on those filters.
    """

    def __init__(self, request):
        self.request = request
        self.db_service = DbServices(DBSession)

    @view_config(
        route_name="db_controller.db_view",
        request_method="GET",
        renderer="json",
    )
    def db_view(self):
        """
        Handles the GET request for the database view. It validates the model specified in the request,
        retrieves the corresponding filters, fetches the relevant data from the database, and returns
        the data in JSON format. The response is configured to allow cross-origin requests.

        Raises:
            HTTPNotFound: If the model specified in the request URL is not found in the model registry.

        Returns:
            dict: The data fetched from the database based on the model and filter parameters specified in the request.
        """
        model_name = self.request.matchdict.get("model")
        model = MODEL_REGISTRY.get(model_name)

        if not model:
            raise HTTPNotFound(f"Model '{model_name}' not found.")

        filters = self.get_filters(model)
        data = self.db_service.get_features(model, filters)

        self.request.response.headers.update(
            {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            }
        )

        return data
    
    @view_config(
        route_name="db_controller.spatial_data_view",
        request_method="GET",
        renderer="json",
    )
    def spatial_data_view(self):
        """
        Handles a GET request to retrieve spatial information for a given point (x, y) in EPSG:3857.

        Expects 'x' and 'y' parameters in the query string. If valid, returns spatial data
        such as neighborhood name, borough name, number of nearby homicides, and the nearest subway station.

        Raises:
            HTTPBadRequest: If 'x' or 'y' parameter is missing or cannot be converted to float.

        Returns:
            dict: JSON-serializable dictionary containing spatial data:
                - name (str): Name of the neighborhood.
                - boroname (str): Name of the borough.
                - number_of_homicides (int): Number of homicides near the point.
                - station_name (str): Nearest subway station name.
                - distance_meters (float): Distance to the nearest station in meters.
        """
        try:
            x = float(self.request.params.get('x'))
            y = float(self.request.params.get('y'))
        except (TypeError, ValueError):
             raise HTTPBadRequest("Invalid or missing lat/lon")

        data = self.db_service.get_spatial_data(x, y)

        self.request.response.headers.update(
            {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            }
        )

        return data
    
    def get_filters(self, model):
        """
        Extracts valid filter parameters from the request and checks them against
        the given model. Returns a dictionary of valid filters. If any invalid
        filters are provided, an HTTPBadRequest is raised.

        Args:
            model (SQLAlchemy model): The model class against which filter keys will be validated.
                        Each key in the filter dictionary must be an attribute of the model.

        Raises:
            HTTPBadRequest: If any filter parameter does not correspond to an attribute
                            of the given model.

        Returns:
            dict: A dictionary of valid filter parameters where keys are model attribute
                names and values are the corresponding filter values.
        """
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