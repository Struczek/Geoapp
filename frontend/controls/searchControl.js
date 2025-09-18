import { map } from "../map/createMap.js";
import { highlightSubwayStationByGid } from "../subway/subwayService.js";
import { overlayLayer } from "../interactions/mapClick.js";
import { setOverlayContent } from "../map/mapState.js";
export function createSubwaySearch(subwaySource, NewYorkSubway) {
  // Creates a search control for subway stations based on the 'name' property,
  // highlights the selected station and zooms to its location on selection
  const subwaySearch = new ol.control.SearchFeature({
    source: subwaySource,
    property: null,
    getSearchString: function (f) {
      const props = f.getProperties();
      return Object.keys(props)
        .filter((k) => k !== "geometry")
        .map((k) => String(props[k]))
        .join(" ")
        .toLowerCase();
    },
    sort: (f1, f2) => {
      const s1 = subwaySearch.getSearchString(f1);
      const s2 = subwaySearch.getSearchString(f2);
      return s1.localeCompare(s2);
    },
  });
  // When a search result is selected, highlight the station and fit the map view to its extent
  subwaySearch.on("select", function (e) {
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
      let coords = geometry.getCoordinates();
      let adjustedCoords = [coords[0], coords[1] + 10];
      setOverlayContent(feature.get("name"), "Color: " + feature.get("color"));
      overlayLayer.setPosition(adjustedCoords);
    }
  });

  return subwaySearch;
}
