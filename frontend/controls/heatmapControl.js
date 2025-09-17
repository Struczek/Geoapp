import { map } from "../map/createMap.js";
import { setCurrentMode } from "../map/mapState.js";
import { getHeatmapRadius } from "../map/mapState.js";

// Defines a semi-transparent fill style for soft heatmap visualization.
let styleSoft = new ol.style.Style({
  fill: new ol.style.Fill({ color: [255, 87, 34, 0.4] }),
  stroke: new ol.style.Stroke({
    color: [255, 87, 34, 1],   // border color (no transparency)
    width: 2,                  // border thickness
  }),
});


// Defines a solid fill style for heatmap with invisible stroke.
let styleSolid = new ol.style.Style({
  fill: new ol.style.Fill({ color: "#ff5722" }),
  stroke: new ol.style.Stroke({
    color: "rgba(255, 0, 0, 0)",
    width: 0,
  }),
});

// Tracks the current style index used for toggling.
let currentHeatmapStyleIdx = 0;
// Stores the currently active heatmap layer.
export let currentHeatMapLayer = null;

// Toggles the heatmap layer on the map using the given homicide source.
export function toggleHeatmap(homicideSource) {
  setCurrentMode(null);
  if (currentHeatMapLayer) {
    map.removeLayer(currentHeatMapLayer);
    currentHeatMapLayer = null;
    return;
  }

  const format = new ol.format.GeoJSON();

  // OL → GeoJSON (WGS84) for Turf
  const featureCollection  = format.writeFeaturesObject(homicideSource.getFeatures(), {
    featureProjection: map.getView().getProjection(),
    dataProjection: "EPSG:4326",
  });

  // Turf buffer with radius parameter
  const buffered = turf.buffer(featureCollection , getHeatmapRadius(), { units: "meters" });

  let union = turf.union(buffered);

  // GeoJSON → OL
  const bufferedFeatures = format.readFeatures(union, {
    dataProjection: "EPSG:4326",
    featureProjection: map.getView().getProjection(),
  });
  // Chooses the initial style based on the current style index.
  const initialStyle = currentHeatmapStyleIdx === 0 ? styleSoft : styleSolid;
  let bufferedLayer = new ol.layer.Vector({
    source: new ol.source.Vector({ features: bufferedFeatures }),
    maxResolution: 50,
    title: "Homicides heatmap",
    style: initialStyle,
  });

  bufferedLayer.set("_styleIdx", currentHeatmapStyleIdx);
  bufferedLayer.set("displayInLayerSwitcher", false);
  map.addLayer(bufferedLayer);
  currentHeatMapLayer = bufferedLayer;
}
// Creates a button control that toggles the heatmap layer on the map.
export function createHeatmapButton(homicideSource) {
  const heatmapButton = new ol.control.Button({
    html: '<i class="fa fa-fire"></i>',
    title: "Heatmap",
    handleClick: function () {
      toggleHeatmap(homicideSource);
    },
  });
  return heatmapButton;
}

// Toggles the visual style of the active heatmap layer.
export function toggleHeatmapStyle() {
  if (!currentHeatMapLayer) return;

  // init if missing
  let idx = currentHeatMapLayer.get("_styleIdx");
  if (idx !== 0 && idx !== 1) {
    idx = 0;
    currentHeatMapLayer.setStyle(styleSoft);
  }

  if (idx === 0) {
    idx = 1;
  } else {
    idx = 0;
  }

  currentHeatMapLayer.set("_styleIdx", idx);
  currentHeatmapStyleIdx = idx;
  currentHeatMapLayer.setStyle(idx === 0 ? styleSoft : styleSolid);
}
