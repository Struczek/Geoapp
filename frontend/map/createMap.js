// Main map function
export const map = new ol.Map({
  view: new ol.View({
    // Coordinates of NewYork
    center: [-8235000.2740258637, 4970000.475650674],
    zoom: 11,
  }),
  target: "js-map",
});
