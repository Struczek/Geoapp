import { map } from "../map/createMap.js";
import { setCurrentMode } from "../map/mapState.js";

export let currentHotspotLayer = null;

// Creates a button that toggles the hotspot layer on the map.
export function createHotspotpButton(homicideSource) {
  const hotspotButton = new ol.control.Button({
    html: '<i class="fa fa-dot-circle-o"></i>',
    title: "Hotspot",
    handleClick: function () {
      setCurrentMode(null);
      if (currentHotspotLayer) {
        map.removeLayer(currentHotspotLayer);
        currentHotspotLayer = null;
        return;
      }
      const vector = new ol.layer.Heatmap({
        source: homicideSource,
        title: "Hotspot layer",
        blur: 15,
        radius: 10,
      });
      vector.set("displayInLayerSwitcher", false);
      map.addLayer(vector);
      currentHotspotLayer = vector;
    },
  });
  return hotspotButton;
}
