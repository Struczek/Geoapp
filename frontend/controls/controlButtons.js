import { overlayLayer } from "../interactions/mapClick.js";
import { setCurrentMode } from "../map/mapState.js";
import { setHighlightedGid } from "../subway/subwayState.js";
import { map } from "../map/createMap.js";
import { setDraw, getDraw } from "../map/mapState.js";
import { setPanelStyleDisplay } from "../controls/optionsControl.js";
// Button to enable 'features' mode — shows info from vector layers
export const layersButton = new ol.control.Button({
  html: '<i class="fa fa-info"></i>',
  title: "Additional info",
  handleClick: function () {
    setCurrentMode("features");
    setPanelStyleDisplay("none");
  },
});

// Button to enable 'api' mode — fetches spatial data from the backend
export const apiButton = new ol.control.Button({
  html: '<i class="fa fa-info-circle"></i>',
  title: "Spatial info",
  handleClick: function () {
    setCurrentMode("api");
    setPanelStyleDisplay("none");
  },
});

export function createClearButton(NewYorkSubway) {
  // Button to clear current mode, hide overlays, reset highlights, and disable drawing
  const clearButton = new ol.control.Button({
    html: '<i class="fa fa-times"></i>',
    title: "Clear mode",
    handleClick: function () {
      overlayLayer.setPosition(undefined);
      setCurrentMode(null);
      setHighlightedGid(null);
      map.removeInteraction(getDraw());
      setDraw(null);
      NewYorkSubway.changed();
      setPanelStyleDisplay("none");
    },
  });
  return clearButton;
}
