import { map } from "../map/createMap.js";
import { setCurrentMode } from "../map/mapState.js";
import { ENDPOINTS } from "../config/config.js";
import { strokeStyleRed, fillStyleRed, circleStyle } from "../map/mapStyles.js";
import { getHeatmapRadius } from "../map/mapState.js";

// Stores the currently active proximity layer.
export let currentProximityLayer = null;
// Creates a button that highlights street segments within a proximity buffer around points.
export function createProximityDistanceButton() {
  const heatmapButton = new ol.control.Button({
    html: '<i class="fa fa-stumbleupon-circle"></i>',
    title: "Proximity distance",
    handleClick: function () {
      setCurrentMode(null);
      if (currentProximityLayer) {
        map.removeLayer(currentProximityLayer);
        currentProximityLayer = null;
        return;
      }

      const source = new ol.source.Vector({
        url: function (extent) {
          return ENDPOINTS.PROXIMITY + "?radius=" + getHeatmapRadius();
        },
        format: new ol.format.GeoJSON(),
      });
      const highlightLayer = new ol.layer.VectorImage({
        source: source,
        visible: true,
        title: "Proximity",
        style: new ol.style.Style({
          fill: fillStyleRed,
          stroke: strokeStyleRed,
          image: circleStyle,
        }),
      });

      map.addLayer(highlightLayer);
      currentProximityLayer = highlightLayer;

      source.once("featuresloadend", () => {
        const extent = source.getExtent();
        if (!ol.extent.isEmpty(extent)) {
          map.getView().fit(extent, { duration: 1000 });
        }
      });
    },
  });
  return heatmapButton;
}
