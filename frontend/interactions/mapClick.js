import { setOverlayContent } from "../map/mapState.js";
import { ENDPOINTS } from "../config/config.js";
import { getCurrentMode } from "../map/mapState.js";
import { getFeaturePropertyByGid } from "../services/featureServices.js";
import { map } from "../map/createMap.js";
import { highlightSubwayStationByGid } from "../subway/subwayService.js";
import { setPanelStyleDisplay } from "../controls/optionsControl.js";
// Vector Feature
const overlayContainerElement = document.querySelector(".overlay-container");
export const overlayLayer = new ol.Overlay({
  element: overlayContainerElement,
});
map.addOverlay(overlayLayer);
export function initMapClick(subwaySource, neighborhoodsSource, NewYorkSubway) {
  // Handles map click events for two modes: 'features' and 'api'
  map.on("click", function (e) {
    let clickedCoordinate = e.coordinate;
    // Hide any previous overlay
    overlayLayer.setPosition(undefined);
    setPanelStyleDisplay("none");
    // panel.style.display = "none";

    // If 'features' mode is active, display data from clicked vector features
    if (getCurrentMode() === "features") {
      map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
        const layerTitle = layer.get("title");

        // Display street feature info
        if (layerTitle === "Streets") {
          setOverlayContent(
            feature.get("name"),
            "One way: " +
              feature.get("oneway") +
              "<br>Type: " +
              feature.get("type")
          );
          // Display subway station info
        } else if (layerTitle === "Subway stations") {
          setOverlayContent(
            feature.get("features")[0].get("name"),
            "Color: " + feature.get("features")[0].get("color")
          );
          // Display homicide incident info
        } else if (layerTitle === "Homicides") {
          setOverlayContent(
            "Homicide",
            "Incident date: " + feature.get("features")[0].get("incident_d")
          );
          // Display neighborhood info
        } else if (layerTitle === "Neighborhoods") {
          setOverlayContent(
            feature.get("boroname"),
            "Name: " + feature.get("name")
          );
          // Default case for unknown layers
        } else {
          setOverlayContent("User layer", "No additional info");
        }

        overlayLayer.setPosition(clickedCoordinate);
      });
      // If 'api' mode is active, fetch spatial data from backend API
    } else if (getCurrentMode() === "api") {
      const [x, y] = e.coordinate;
      fetch(`${ENDPOINTS.SPATIAL_DATA}?x=${x}&y=${y}`)
        .then((response) => {
          if (!response.ok) throw new Error("Request failed");
          return response.json();
        })
        .then((data) => {
          let featureName;
          // Display neighborhood info from API if available
          if (data.neighborhoods) {
            featureName = `${getFeaturePropertyByGid(
              data.neighborhoods[0].neighborhood_gid,
              neighborhoodsSource,
              "name"
            )}<br>${getFeaturePropertyByGid(
              data.neighborhoods[0].neighborhood_gid,
              neighborhoodsSource,
              "boroname"
            )}`;
          } else {
            featureName = "No neighborhoods";
          }
          // Highlight nearest subway station and show related info
          highlightSubwayStationByGid(
            data.subway.subway_gid,
            map,
            subwaySource,
            NewYorkSubway
          );
          let additionInfo = `Nearby homicides: ${
            data.number_of_homicides
          }<br>Subway: ${getFeaturePropertyByGid(
            data.subway.subway_gid,
            subwaySource,
            "name"
          )}<br>Distance: ${parseFloat(data.subway.subway_distance).toFixed(
            2
          )}m`;
          setOverlayContent(featureName, additionInfo);
        })
        .catch((error) => {
          console.error("Błąd:", error);
          setOverlayContent("Błąd podczas pobierania danych", "");
        });
      overlayLayer.setPosition(clickedCoordinate);
    }
  });
}
