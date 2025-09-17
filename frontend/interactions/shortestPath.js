import { map } from "../map/createMap.js";
import { ENDPOINTS } from "../config/config.js";
import { notification } from "../controls/drawControl.js";
// Creates a vector source that loads New York street data from a GeoJSON endpoint.
const rawSource = new ol.source.Vector({
  url: ENDPOINTS.NYC_STREETS,
  format: new ol.format.GeoJSON(),
  strategy: ol.loadingstrategy.all,
});

export const rawLayer = new ol.layer.Vector({ source: rawSource });
rawLayer.set("displayInLayerSwitcher", false);
map.addLayer(rawLayer);

// After all features are loaded, build a graph from the street data.
rawSource.on("featuresloadend", () => {
  buildGraphFromRaw();
});

// After 250ms, refresh the source if no features were loaded initially.
setTimeout(() => {
  if (rawSource.getFeatures().length === 0) {
    rawSource.refresh();
  }
}, 250);
const graphSource = new ol.source.Vector();

export let result = new ol.source.Vector();
// Creates a vector layer to display the shortest path with a red line.
export const shortestPathLayer = new ol.layer.Vector({
  source: result,
  title: "Shortest Path",
  style: new ol.style.Style({
    stroke: new ol.style.Stroke({
      width: 2,
      color: "#f00",
    }),
  }),
});

// Builds a routing graph from raw street data by extracting segments from geometries.
function buildGraphFromRaw() {
  const features = rawSource.getFeatures();
  features.forEach((feature) => {
    const geometry = feature.getGeometry();
    if (!geometry) return;
    // If it's a LineString, add its coordinates as segments to the graph.
    if (geometry.getType() === "LineString") {
      addSegmentsFromCoordinates(geometry.getCoordinates());
    } // If it's a MultiLineString, split into LineStrings and add their segments.
    else if (geometry.getType() === "MultiLineString") {
      geometry
        .getLineStrings()
        .forEach((ls) => addSegmentsFromCoordinates(ls.getCoordinates()));
    }
  });
  if (graphSource.getFeatures().length > 0) {
    rawLayer.setVisible(false);
  }
}

// Prefer immediate build if already ready
if (rawSource.getState() === "ready") {
  buildGraphFromRaw();
} else {
  // Otherwise wait for load (either event works)
  rawSource.once("featuresloadend", () => {
    buildGraphFromRaw();
  });
}

// Start / end Placemark
export let popStart = new ol.Overlay.Placemark({
  popupClass: "flagv",
  color: "#080",
});
map.addOverlay(popStart);
export let popEnd = new ol.Overlay.Placemark({
  popupClass: "flag finish",
  color: "#000",
});
map.addOverlay(popEnd);

// Split each line into per-edge segments so junctions become nodes
function addSegmentsFromCoordinates(coordinates) {
  for (let i = 1; i < coordinates.length; i++) {
    const edgeFeature = new ol.Feature({
      geometry: new ol.geom.LineString([coordinates[i - 1], coordinates[i]]),
    });
    graphSource.addFeature(edgeFeature);
  }
}

// Dijkstra: pure distance, bidirectional everywhere
export const dijkstraRouter = new ol.graph.Dijkstra({
  source: graphSource,
  maxIteration: 100000000,
  stepIteration: 1000000,
});

dijkstraRouter.weight = function () {
  return 1;
};

// ignore one-way: make every edge usable both directions
dijkstraRouter.direction = function () {
  return 2;
};

// geodesic length in meters for lon/lat GeoJSON
dijkstraRouter.getLength = function (geometryOrFeature) {
  const geometry = geometryOrFeature.getGeometry
    ? geometryOrFeature.getGeometry()
    : geometryOrFeature;
  return ol.sphere.getLength(geometry);
};

// Clear previous results when Dijkstra routing starts.
dijkstraRouter.on("start", () => {
  result.clear();
});

// When routing finishes, display the result and show distance info.
dijkstraRouter.on("finish", (event) => {
  result.clear();

  // draw route + show distance
  result.addFeatures(event.route);
  // Create info popup content
  const div = document.createElement("div");
  if (!event.distance || event.distance === 0) {
    div.textContent = "Route unavailable. ";
  } else {
    div.textContent = `Travel distance: ${(event.distance / 1000).toFixed(2)} km.`;
  }
  const closeLink = document.createElement("a");
  closeLink.textContent = "Close";
  closeLink.addEventListener("click", function (e) {
    e.preventDefault();
    notification.hide();
    result.clear();
    popStart.hide();
    popEnd.hide();
    map.removeLayer(shortestPathLayer);
  });
  div.appendChild(closeLink);
  notification.show(div, { timeout: 0 });
});

dijkstraRouter.on("calculating", () => {
  result.clear();
  result.addFeatures(dijkstraRouter.getBestWay());
});
