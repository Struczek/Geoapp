import { createSubwayLayer } from "./subway/subwayLayer.js";
import { createHomicidesLayer } from "./homicides/homicidesLayer.js";
import { createStreetsLayer } from "./streets/streetLayer.js";
import { createNeighborhoodsLayer } from "./neighborhoods/neighborhoodsLayer.js";
import { baseLayerGroup } from "./map/mapBaseLayer.js";
import { map } from "./map/createMap.js";
import { createCluster } from "./interactions/clusters.js";
import { initMapClick } from "./interactions/mapClick.js";
import { createDragAndDropInteraction } from "./interactions/dragAndDrop.js";
import { crateSubwaySearch } from "./controls/searchControl.js";
import { createPrintControl } from "./controls/printControl.js";
import { layersButton, apiButton, createClearButton } from "./controls/controlButtons.js";
import { drawButton, notification } from "./controls/drawControl.js";
import { optionsControl } from "./controls/optionsControl.js";
window.onload = init;

function init() {
  map.addLayer(baseLayerGroup);
  const { NewYorkNeighborhoods, neighborhoodsSource } =
    createNeighborhoodsLayer();
  map.addLayer(NewYorkNeighborhoods);
  const { NewYorkStreets } = createStreetsLayer();
  map.addLayer(NewYorkStreets);
  const { subwaySource, NewYorkSubway } = createSubwayLayer();
  map.addLayer(NewYorkSubway);
  const selectCluster = createCluster();
  map.addInteraction(selectCluster);
  const { NewYorkHomicides } = createHomicidesLayer();
  map.addLayer(NewYorkHomicides);
  initMapClick(subwaySource, neighborhoodsSource, NewYorkSubway);
  const dragAndDropInteraction = createDragAndDropInteraction();
  map.addInteraction(dragAndDropInteraction);
  // Add LayerSwitcher
  const layerSwitcher = new ol.control.LayerSwitcher({
    tipLabel: "Layers",
  });
  map.addControl(layerSwitcher);
  // Control Select
  let select = new ol.interaction.Select({});
  map.addInteraction(select);
  let subwaySearch = crateSubwaySearch(subwaySource, NewYorkSubway);
  let printControl = createPrintControl();
  const controlBar = new ol.control.Bar({
    toggleOne: true,
    group: true,
  });

  map.addControl(notification);
  let clearButton = createClearButton(NewYorkSubway);
  controlBar.addControl(subwaySearch);
  controlBar.addControl(printControl);
  controlBar.addControl(layersButton);
  controlBar.addControl(apiButton);
  controlBar.addControl(clearButton);
  controlBar.addControl(drawButton);
  controlBar.addControl(optionsControl);
  map.addControl(controlBar);
  map.addControl(new ol.control.ScaleLine());
  // Update subway search to use selected property and rerun search
  document
    .getElementById("searchProperty")
    .addEventListener("change", function () {
      subwaySearch.set("property", this.value);
      subwaySearch.search();
    });
}
