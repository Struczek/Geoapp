import { ENDPOINTS } from "../config/config.js";
import { fillStyle, strokeStyle, circleStyle } from "../map/mapStyles.js";
export function createNeighborhoodsLayer() {
  const neighborhoodsSource = new ol.source.Vector({
    url: ENDPOINTS.NYC_NEIGHBORHOODS,
    format: new ol.format.GeoJSON(),
  });

  // Creates a vector image layer for neighborhoods with predefined styles and adds it to the map
  const NewYorkNeighborhoods = new ol.layer.VectorImage({
    source: neighborhoodsSource,
    visible: true,
    title: "Neighborhoods",
    style: new ol.style.Style({
      fill: fillStyle,
      stroke: strokeStyle,
      image: circleStyle,
    }),
  });

  // Hides the neighborhoods layer once the data source is fully loaded
  neighborhoodsSource.once("change", function (e) {
    if (neighborhoodsSource.getState() === "ready") {
      NewYorkNeighborhoods.setVisible(false);
    }
  });

  return { NewYorkNeighborhoods, neighborhoodsSource };
}
