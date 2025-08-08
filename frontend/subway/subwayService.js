import { setHighlightedGid } from "./subwayState.js";
// Highlights the subway station with the given gid, centers the map on it, and refreshes the layer
export function highlightSubwayStationByGid(
  gid,
  map,
  subwaySource,
  NewYorkSubway
) {
  setHighlightedGid(gid);
  const features = subwaySource.getFeatures();
  const stationFeature = features.find((feature) => feature.get("gid") === gid);
  stationFeature.setStyle(
    new ol.style.Style({
      image: new ol.style.Circle({
        radius: 8,
        fill: new ol.style.Fill({ color: "yellow" }),
        stroke: new ol.style.Stroke({ color: "red", width: 2 }),
      }),
    })
  );
  const geometry = stationFeature.getGeometry();
  let center = geometry.getCoordinates();
  map.getView().animate({
    center: center,
    duration: 500,
  });
  NewYorkSubway.getSource().changed();
}
