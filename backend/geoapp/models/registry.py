from geoapp.models.models import Docks, Lakes, NycCensusBlocks, NycHomicides, NycNeighborhoods
from geoapp.models.models import NycStreets, NycStreetsHistory, NycSubwayStationEvents, NycSubwayStations
from geoapp.models.models import SpatialRefSys, Topology, Layer

MODEL_REGISTRY = {
    "docks": Docks,
    "lakes": Lakes,
    "nyc_census_blocks": NycCensusBlocks,
    "nyc_homicides": NycHomicides,
    "nyc_neighborhoods": NycNeighborhoods,
    "nyc_streets": NycStreets,
    "nyc_streets_history": NycStreetsHistory,
    "nyc_subway_station_events": NycSubwayStationEvents,
    "nyc_subway_stations": NycSubwayStations,
    "spatial_ref_sys": SpatialRefSys,
    "topology": Topology,
    "layer": Layer,
}
