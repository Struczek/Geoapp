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
  return dragAndDropInteraction;
}
