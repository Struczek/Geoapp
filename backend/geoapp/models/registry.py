from geoapp.models.models import (
    NycCensusBlocks,
    NycHomicides,
    NycNeighborhoods,
)
from geoapp.models.models import (
    NycStreets,
    NycStreetsHistory,
    NycSubwayStationEvents,
    NycSubwayStations,
)

MODEL_REGISTRY = {
    "nyc_census_blocks": NycCensusBlocks,
    "nyc_homicides": NycHomicides,
    "nyc_neighborhoods": NycNeighborhoods,
    "nyc_streets": NycStreets,
    "nyc_streets_history": NycStreetsHistory,
    "nyc_subway_station_events": NycSubwayStationEvents,
    "nyc_subway_stations": NycSubwayStations,
}
