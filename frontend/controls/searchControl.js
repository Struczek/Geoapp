import { map } from "../map/createMap.js";
import { highlightSubwayStationByGid } from "../subway/subwayService.js";
export function crateSubwaySearch(subwaySource, NewYorkSubway) {
  // Creates a search control for subway stations based on the 'name' property,
  // highlights the selected station and zooms to its location on selection
  const subwaySearch = new ol.control.SearchFeature({
    source: subwaySource,
    property: "name",
    sort: function (f1, f2) {
      if (subwaySearch.getSearchString(f1) < subwaySearch.getSearchString(f2))
        return -1;
      if (subwaySearch.getSearchString(f1) > subwaySearch.getSearchString(f2))
        return 1;
      return 0;
    },
  });

  // When a search result is selected, highlight the station and fit the map view to its extent
  subwaySearch.on("select", function (e) {
    alert('Selected!');
    console.log('Selected!', e);
    let feature = e.search;
    let geometry = feature.getGeometry();
    highlightSubwayStationByGid(
      feature.get("gid"),
      map,
      subwaySource,
      NewYorkSubway
    );
    if (geometry) {
      let extent = geometry.getExtent();
      map.getView().fit(extent, {
        maxZoom: 18,
        duration: 500,
      });
    }
  });
  return subwaySearch;
}
