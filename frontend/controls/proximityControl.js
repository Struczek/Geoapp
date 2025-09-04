import { map } from "../map/createMap.js";
import { getHeatmapRadius, setCurrentMode } from "../map/mapState.js";

// Creates a button that highlights street segments within a proximity buffer around points.
export function createProximityDistanceButton(homicideSource, NewYorkStreets) {
  const heatmapButton = new ol.control.Button({
    html: '<i class="fa fa-stumbleupon-circle"></i>',
    title: "Proximity distance",
    handleClick: function () {
      setCurrentMode(null);
      // Convert OpenLayers features to GeoJSON for Turf.js
      const format = new ol.format.GeoJSON();

      // OL → GeoJSON (WGS84) for Turf
      const fc = format.writeFeaturesObject(homicideSource.getFeatures(), {
        featureProjection: map.getView().getProjection(),
        dataProjection: "EPSG:4326",
      });
      const sc = format.writeFeaturesObject(
        NewYorkStreets.getSource().getFeatures(),
        {
          featureProjection: map.getView().getProjection(),
          dataProjection: "EPSG:4326",
        }
      );
      // Will hold streets that intersect any buffer zone.
      const selectedStreetFeatures = [];
      // Helper: flatten MultiLineString into array of LineString features.
      function flattenMultiLineStringToLineStrings(multiLineFeature) {
        const coords = multiLineFeature.geometry.coordinates;
        return coords.map((lineCoords) => {
          return turf.lineString(lineCoords, multiLineFeature.properties || {});
        });
      }
      // Iterate over all points and check nearby streets
      for (const point of fc.features) {
        // Create a buffer of N meters around the point.
        const buffer = turf.buffer(point, getHeatmapRadius(), { units: "meters", steps: 4 });
        // For each street feature, check if it's within the buffer.
        for (const street of sc.features) {
          if (street.geometry.type === "MultiLineString") {
            const lineStrings = flattenMultiLineStringToLineStrings(street);
            if (turf.booleanDisjoint(lineStrings[0], buffer)) continue;
            const polygonLine = turf.buffer(lineStrings[0], 0.0001, {
              units: "meters",
            });
            const collection = turf.featureCollection([polygonLine, buffer]);
            const clipped = turf.intersect(collection);
            if (clipped) {
              selectedStreetFeatures.push(clipped);
            }
          }
        }
      }
      const selectedGeoJSON = turf.featureCollection(selectedStreetFeatures);

      const olFeatures = format.readFeatures(selectedGeoJSON, {
        dataProjection: "EPSG:4326", 
        featureProjection: map.getView().getProjection(),
      });

      const highlightLayer = new ol.layer.Vector({
        source: new ol.source.Vector({
          features: olFeatures,
        }),
        style: new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: "red",
            width: 3,
          }),
        }),
      });

      map.addLayer(highlightLayer);
    },
  });
  return heatmapButton;
}
