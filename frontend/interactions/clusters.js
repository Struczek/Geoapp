import { getCurrentMode } from "../map/mapState.js";
// Creates a cluster selection interaction
export function createCluster() {
  const selectCluster = new ol.interaction.SelectCluster({
    pointRadius: 10,
    animate: false,
    style: null,
  });

  // Handles cluster selection: zooms to cluster extent or centers map on a single selected feature
  selectCluster.getFeatures().on("add", function (e) {
    const features = e.element.get("features");

    // Exit if there are no features or if currentMode is active
    if (!features || features.length === 0 || getCurrentMode()) {
      return;
    }

    const map = selectCluster.getMap();
    if (!map) return;

    // If multiple features are selected, zoom to their combined extent
    if (features.length > 1) {
      const extent = ol.extent.createEmpty();
      features.forEach((f) => {
        ol.extent.extend(extent, f.getGeometry().getExtent());
      });

      map.getView().fit(extent, {
        padding: [50, 50, 50, 50],
        duration: 500,
        maxZoom: 20,
      });
      // If exactly one feature is selected, center the map on its coordinates
    } else if (features.length === 1) {
      const coord = features[0].getGeometry().getCoordinates();
      map.getView().animate({
        center: coord,
        duration: 500,
      });
    }
  });

  return selectCluster;
}
