import { map } from "../map/createMap.js";
export function createDragAndDropInteraction() {
  // Enables drag-and-drop of GeoJSON files onto the map and adds them as new vector layers
  const dragAndDropInteraction = new ol.interaction.DragAndDrop({
    source: new ol.source.Vector(),
    formatConstructors: [ol.format.GeoJSON],
  });

  // When features are added via drag-and-drop, create a new vector layer and zoom to its extent
  dragAndDropInteraction.on("addfeatures", function (event) {
    const map = dragAndDropInteraction.getMap();
    if (!map) return;
    const newSource = new ol.source.Vector({
      features: event.features,
    });

    const newLayer = new ol.layer.Vector({
      source: newSource,
      // Name layer by import time
      title: "User " + new Date().toLocaleTimeString(),
    });

    map.addLayer(newLayer);
    const extent = newSource.getExtent();
    // Zoom to the extent of imported features
    map.getView().fit(extent, { duration: 1000 });
  });
  // Use the OL viewport element (most reliable for pointer events)
  const dropTarget = map.getViewport();

  dropTarget.addEventListener("drop", (e) => {
    e.preventDefault();
    dropTarget.classList.remove("is-dragover");

    const dt = e.dataTransfer;

    // Grab a single file
    let file = null;

    if (dt.files && dt.files.length) {
      file = dt.files[0];
    }
    let looksZipByName = /\.zip$/i.test(file.name);
    if (!looksZipByName) {
      return;
    }
    file
      .arrayBuffer()
      .then((buf) => window.shp(buf))
      .then((result) => {
        const fmt = new ol.format.GeoJSON();

        const dataProjection = "EPSG:4326";

        const features = fmt.readFeatures(result, {
          dataProjection: dataProjection,
          featureProjection: map.getView().getProjection(),
        });

        // Build a vector source from the parsed features
        const source = new ol.source.Vector({ features });

        const layer = new ol.layer.VectorImage({
          source,
          visible: true,
          title: "User " + new Date().toLocaleTimeString(),
        });

        map.addLayer(layer);

        // Zoom to the extent of imported features
        const extent = source.getExtent();
        map.getView().fit(extent, { duration: 1000 });
      });
  });

  return dragAndDropInteraction;
}
