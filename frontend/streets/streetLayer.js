import { ENDPOINTS } from "../config/config.js";
import { fillStyle, strokeStyle, circleStyle } from "../map/mapStyles.js";
export function createStreetsLayer() {
  // Creates a vector image layer for New York streets from a GeoJSON endpoint with predefined styles
  const NewYorkStreets = new ol.layer.VectorImage({
    source: new ol.source.Vector({
      url: ENDPOINTS.NYC_STREETS
      ,
      format: new ol.format.GeoJSON(),
    }),
    visible: true,
    title: "Streets",
    style: new ol.style.Style({
      fill: fillStyle,
      stroke: strokeStyle,
      image: circleStyle,
    }),
  });
  return { NewYorkStreets };
}
