import { setCurrentMode } from "../map/mapState.js";
import { dijkstraRouter } from "../interactions/shortestPath.js";

// Adds a map button to enable path mode and compute the shortest path using Dijkstra.
export const distanceButton = new ol.control.Button({
  html: '<i class="fa fa-location-arrow"></i>',
  title: "Shortest path",
  handleClick: function () {
    setCurrentMode("path");
  },
});

// Returns the shortest path between start and end points using Dijkstra's algorithm.
export function findShortestPath(startPath, endPath) {
  return dijkstraRouter.path(startPath, endPath);
}
