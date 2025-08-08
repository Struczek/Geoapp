// Creates a visible base tile layer using the standard OpenStreetMap source
const openStreetMapStandard = new ol.layer.Tile({
  baseLayer: true,
  source: new ol.source.OSM(),
  visible: true,
  title: "OSM Standard",
});

// Creates a hidden base tile layer using the humanitarian  OpenStreetMap source
const openStreetMapHumanitarian = new ol.layer.Tile({
  baseLayer: true,
  source: new ol.source.OSM({
    url: "https://{a-c}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
  }),
  visible: false,
  title: "OSM Humanitarian",
});

// Creates a hidden base tile layer using the Stamen Terrain map from Stadia Maps
const stamenTerrain = new ol.layer.Tile({
  baseLayer: true,
  source: new ol.source.XYZ({
    url: "https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}@2x.png",
    attributions:
      "Map tiles by Stamen Design, under CC BY 4.0. Data by OpenStreetMap, under ODbL.",
  }),
  visible: false,
  title: "Stamen Terrain",
});

// Creates a group of base layers
export const baseLayerGroup = new ol.layer.Group({
  title: "Base Layers",
  layers: [openStreetMapStandard, openStreetMapHumanitarian, stamenTerrain],
});
