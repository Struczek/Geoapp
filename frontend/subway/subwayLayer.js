import { getHighlightedGid } from "../subway/subwayState.js";
import { ENDPOINTS } from "../config/config.js";
export function createSubwayLayer() {
  // Creates a vector source for New York subway stations from a GeoJSON endpoint
  const subwaySource = new ol.source.Vector({
    url: ENDPOINTS.NYC_SUBWAY_STATIONS,
    format: new ol.format.GeoJSON(),
  });

  // Creates a clustered source for subway stations with a specified clustering distance
  const clusteredSubwaySource = new ol.source.Cluster({
    distance: 40,
    source: subwaySource,
  });

  const NewYorkSubway = new ol.layer.VectorImage({
    source: clusteredSubwaySource,
    visible: true,
    title: "Subway stations",
    style: function (feature) {
      const size = feature.get("features").length;
      const features = feature.get("features");
      const isHighlighted = features.some(
        (f) => f.get("gid") === getHighlightedGid()
      );
      // If the cluster contains only one station
      if (size === 1) {
        // If the single station is currently highlighted
        if (isHighlighted) {
          return new ol.style.Style({
            image: new ol.style.Circle({
              radius: 8,
              fill: new ol.style.Fill({ color: "yellow" }),
              stroke: new ol.style.Stroke({ color: "red", width: 2 }),
            }),
          });
        } else {
          // Return a default subway icon for a single, non-highlighted station
          return new ol.style.Style({
            image: new ol.style.Icon({
              src: "./icons/train-subway-solid.png",
              scale: 0.04,
              color: "#FFFFFF",
            }),
          });
        }
      } else {
        // If the feature represents a cluster of multiple stations
        return new ol.style.Style({
          image: new ol.style.Circle({
            radius: 10,
            fill: new ol.style.Fill({
              color: "rgb(0, 0, 0)",
            }),
            stroke: new ol.style.Stroke({
              color: "#fff",
              width: 1,
            }),
          }),
          text: new ol.style.Text({
            text: size.toString(),
            fill: new ol.style.Fill({
              color: "#fff",
            }),
          }),
        });
      }
    },
  });
  return { subwaySource, NewYorkSubway };
}
