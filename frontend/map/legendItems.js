import { fillStyle, strokeStyle, circleStyle } from "../map/mapStyles.js";
// Defines legend items for the map, including their titles, geometry types, and display styles.
export const legendItems = [
  {
    title: "Homicides",
    typeGeom: "Point",
    style: new ol.style.Style({
      image: new ol.style.Icon({
        src: "./icons/skull-crossbones-solid.png",
        crossOrigin: "anonymous",
        scale: 0.05,
      }),
    }),
  },
  {
    title: "Subway stations",
    typeGeom: "Point",
    style: new ol.style.Style({
      image: new ol.style.Icon({
        src: "./icons/train-subway-solid.png",
        crossOrigin: "anonymous",
        scale: 0.05,
      }),
    }),
  },
  {
    title: "Streets",
    typeGeom: "LineString",
    style: new ol.style.Style({
      stroke: strokeStyle,
    }),
  },
  {
    title: "Neighborhoods",
    typeGeom: "Polygon",
    style: new ol.style.Style({
      fill: fillStyle,
      stroke: strokeStyle,
      circle: circleStyle,
    }),
  },
];
