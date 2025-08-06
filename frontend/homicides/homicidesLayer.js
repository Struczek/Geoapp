import { ENDPOINTS } from "../config/config.js";
export function createHomicidesLayer() {
  const homicideSource = new ol.source.Vector({
    url: ENDPOINTS.NYC_HOMICIDES,
    format: new ol.format.GeoJSON(),
  });

  const clusteredHomicideSource = new ol.source.Cluster({
    distance: 40,
    source: homicideSource,
  });

  const NewYorkHomicides = new ol.layer.VectorImage({
    source: clusteredHomicideSource,
    visible: true,
    title: "Homicides",
    style: function (feature) {
      const size = feature.get("features").length;
      // If the cluster contains only one homicide incident
      if (size === 1) {
        // Use a skull icon to represent a single homicide
        return new ol.style.Style({
          image: new ol.style.Icon({
            src: "./icons/skull-crossbones-solid.png",
            scale: 0.04,
            color: "#FFFFFF",
          }),
        });
      } else {
        // If the feature represents multiple incidents (a cluster),
        // use a red circle with the number of incidents displayed
        return new ol.style.Style({
          image: new ol.style.Circle({
            radius: 10,
            fill: new ol.style.Fill({
              color: "rgb(255, 0, 0)",
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
  return { NewYorkHomicides };
}
