import { legendItems } from "./legendItems.js";
// Main map function
export const map = new ol.Map({
  view: new ol.View({
    // Coordinates of NewYork
    center: [-8235000.2740258637, 4970000.475650674],
    zoom: 11,
  }),
  target: "js-map",
});

const legend = new ol.legend.Legend({
  title: "Legend",
  margin: 5,
  items: legendItems,
});

const legendCtrl = new ol.control.Legend({
  legend,
  collapsed: false,
  margin: 5,
});
map.addControl(legendCtrl);
