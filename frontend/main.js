window.onload = init;

function init() {
  // Finds the subway station with the given gid and returns its name
  function getSubwayStationNameByGid(gid) {
    const features = subwaySource.getFeatures();
    const stationFeature = features.find(
      (feature) => feature.get("gid") === gid
    );
    return stationFeature.get("name");
  }

  // Finds the neighborhood with the given gid and returns its name
  function getNeighborhoodNameByGid(gid) {
    const features = NewYorkNeighborhoodsSource.getFeatures();
    const neighborhoodFeature = features.find(
      (feature) => feature.get("gid") === gid
    );
    return neighborhoodFeature ? neighborhoodFeature.get("name") : null;
  }

  // Finds the neighborhood with the given gid and returns its boroname
  function getNeighborhoodBoronameByGid(gid) {
    const features = NewYorkNeighborhoodsSource.getFeatures();
    const neighborhoodFeature = features.find(
      (feature) => feature.get("gid") === gid
    );
    return neighborhoodFeature ? neighborhoodFeature.get("boroname") : null;
  }
  // Stores the gid of the currently highlighted subway station
  let highlightedGid = null;

  // Highlights the subway station with the given gid, centers the map on it, and refreshes the layer
  function highlightSubwayStationByGid(gid, map) {
    highlightedGid = gid;
    const features = subwaySource.getFeatures();
    const stationFeature = features.find(
      (feature) => feature.get("gid") === gid
    );
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
    var center = geometry.getCoordinates();
    map.getView().animate({
      center: center,
      duration: 500,
    });
    NewYorkSubway.changed();
  }

  // Main map function
  const map = new ol.Map({
    view: new ol.View({
      // Coordinates of NewYork
      center: [-8235000.2740258637, 4970000.475650674],
      zoom: 11,
    }),
    target: "js-map",
  });

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

  // Creates a group of base layers and adds it to the map
  const baseLayerGroup = new ol.layer.Group({
    title: "Base Layers",
    layers: [openStreetMapStandard, openStreetMapHumanitarian, stamenTerrain],
  });
  map.addLayer(baseLayerGroup);

  // Defines a fill style with a blue color
  const fillStyle = new ol.style.Fill({
    color: [84, 118, 255, 1],
  });

  // Defines a stroke style with a blue color and specific width
  const strokeStyle = new ol.style.Stroke({
    color: [84, 118, 255, 1],
    width: 1.2,
  });

  // Defines a circle style with a red fill and blue stroke
  const circleStyle = new ol.style.Circle({
    fill: new ol.style.Fill({
      color: [[245, 49, 5, 1]],
    }),
    radius: 7,
    stroke: strokeStyle,
  });

  // Creates a vector source for New York neighborhoods from a GeoJSON endpoint
  const NewYorkNeighborhoodsSource = new ol.source.Vector({
    url: "http://127.0.0.1:6543/api/nyc_neighborhoods/geojson",
    format: new ol.format.GeoJSON(),
  });

  // Creates a vector image layer for neighborhoods with predefined styles and adds it to the map
  const NewYorkNeighborhoods = new ol.layer.VectorImage({
    source: NewYorkNeighborhoodsSource,
    visible: true,
    title: "Neighborhoods",
    style: new ol.style.Style({
      fill: fillStyle,
      stroke: strokeStyle,
      image: circleStyle,
    }),
  });
  map.addLayer(NewYorkNeighborhoods);
  
  // Hides the neighborhoods layer once the data source is fully loaded
  NewYorkNeighborhoodsSource.once("change", function (e) {
    if (NewYorkNeighborhoodsSource.getState() === "ready") {
      NewYorkNeighborhoods.setVisible(false);
    }
  });

  // Creates a vector image layer for New York streets from a GeoJSON endpoint with predefined styles
  const NewYorkStreets = new ol.layer.VectorImage({
    source: new ol.source.Vector({
      url: "http://127.0.0.1:6543/api/nyc_streets/geojson",
      format: new ol.format.GeoJSON(),
    }),
    visible: true,
    title: "Streets",
    style: new ol.style.Style({
      fill: fillStyle,
      stroke: strokeStyle,
      image: circleStyle,
    }),
  });
  map.addLayer(NewYorkStreets);

  // Creates a vector source for New York subway stations from a GeoJSON endpoint
  const subwaySource = new ol.source.Vector({
    url: "http://127.0.0.1:6543/api/nyc_subway_stations/geojson",
    format: new ol.format.GeoJSON(),
  });

  // Creates a clustered source for subway stations with a specified clustering distance
  const clusteredSubwaySource = new ol.source.Cluster({
    distance: 40,
    source: subwaySource,
  });

  const NewYorkSubway = new ol.layer.VectorImage({
    source: clusteredSubwaySource,
    visible: true,
    title: "Subway stations",
    style: function (feature) {
      const size = feature.get("features").length;
      const features = feature.get("features");
      const isHighlighted = features.some(
        (f) => f.get("gid") === highlightedGid
      );
      // If the cluster contains only one station
      if (size === 1) {
        // If the single station is currently highlighted
        if (isHighlighted) {
          return new ol.style.Style({
            image: new ol.style.Circle({
              radius: 8,
              fill: new ol.style.Fill({ color: "yellow" }),
              stroke: new ol.style.Stroke({ color: "red", width: 2 }),
            }),
          });
        } else {
          // Return a default subway icon for a single, non-highlighted station
          return new ol.style.Style({
            image: new ol.style.Icon({
              src: "icons/train-subway-solid.png",
              scale: 0.04,
              color: "#FFFFFF",
            }),
          });
        }
      } else {
        // If the feature represents a cluster of multiple stations
        return new ol.style.Style({
          image: new ol.style.Circle({
            radius: 10,
            fill: new ol.style.Fill({
              color: "rgb(0, 0, 0)",
            }),
            stroke: new ol.style.Stroke({
              color: "#fff",
              width: 1,
            }),
          }),
          text: new ol.style.Text({
            text: size.toString(),
            fill: new ol.style.Fill({
              color: "#fff",
            }),
          }),
        });
      }
    },
  });
  map.addLayer(NewYorkSubway);

  // Creates a cluster selection interaction
  const selectCluster = new ol.interaction.SelectCluster({
    pointRadius: 10,
    animate: false,
    style: null,
  });
  map.addInteraction(selectCluster);

  // Handles cluster selection: zooms to cluster extent or centers map on a single selected feature
  selectCluster.getFeatures().on("add", function (e) {
    const features = e.element.get("features");

    // Exit if there are no features or if currentMode is active
    if (!features || features.length === 0 || currentMode) {
      return;
    }

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

  const homicideSource = new ol.source.Vector({
    url: "http://127.0.0.1:6543/api/nyc_homicides/geojson",
    format: new ol.format.GeoJSON(),
  });

  const clusteredHomicideSource = new ol.source.Cluster({
    distance: 40,
    source: homicideSource,
  });

  const NewYorkHomicides = new ol.layer.VectorImage({
    source: clusteredHomicideSource,
    visible: true,
    title: "Homicides",
    style: function (feature) {
      const size = feature.get("features").length;
      // If the cluster contains only one homicide incident
      if (size === 1) {
        // Use a skull icon to represent a single homicide
        return new ol.style.Style({
          image: new ol.style.Icon({
            src: "icons/skull-crossbones-solid.png",
            scale: 0.04,
            color: "#FFFFFF",
          }),
        });
      } else {
        // If the feature represents multiple incidents (a cluster),
        // use a red circle with the number of incidents displayed
        return new ol.style.Style({
          image: new ol.style.Circle({
            radius: 10,
            fill: new ol.style.Fill({
              color: "rgb(255, 0, 0)",
            }),
            stroke: new ol.style.Stroke({
              color: "#fff",
              width: 1,
            }),
          }),
          text: new ol.style.Text({
            text: size.toString(),
            fill: new ol.style.Fill({
              color: "#fff",
            }),
          }),
        });
      }
    },
  });
  map.addLayer(NewYorkHomicides);

  // Vector Feature
  const overlayContainerElement = document.querySelector(".overlay-container");
  const overlayLayer = new ol.Overlay({
    element: overlayContainerElement,
  });
  map.addOverlay(overlayLayer);
  const overlayFeatureName = document.getElementById("feature-name");
  const overlayAdditionInfo = document.getElementById(
    "feature-additional-info"
  );

  // Handles map click events for two modes: 'features' and 'api'
  map.on("click", function (e) {
    let clickedCoordinate = e.coordinate;
    // Hide any previous overlay
    overlayLayer.setPosition(undefined);
    panel.style.display = 'none';

    // If 'features' mode is active, display data from clicked vector features
    if (currentMode === "features") {
      map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
        const layerTitle = layer.get("title");

        // Display street feature info
        if (layerTitle === "Streets") {
          overlayFeatureName.innerHTML = feature.get("name");
          overlayAdditionInfo.innerHTML =
            "One way: " +
            feature.get("oneway") +
            "<br>Type: " +
            feature.get("type");
          // Display subway station info
        } else if (layerTitle === "Subway stations") {
          overlayFeatureName.innerHTML = feature.get("features")[0].get("name");
          overlayAdditionInfo.innerHTML =
            "Color: " + feature.get("features")[0].get("color");
          // Display homicide incident info
        } else if (layerTitle === "Homicides") {
          overlayFeatureName.innerHTML = "Homicide";
          overlayAdditionInfo.innerHTML =
            "Incident date: " + feature.get("features")[0].get("incident_d");
          // Display neighborhood info
        } else if (layerTitle === "Neighborhoods") {
          overlayFeatureName.innerHTML = feature.get("boroname");
          overlayAdditionInfo.innerHTML = "Name: " + feature.get("name");
        // Default case for unknown layers
        } else {
          overlayFeatureName.innerHTML = "User layer";
          overlayAdditionInfo.innerHTML = "No additional info";
        }

        overlayLayer.setPosition(clickedCoordinate);
      });
    // If 'api' mode is active, fetch spatial data from backend API
    } else if (currentMode === "api") {
      const [x, y] = e.coordinate;
      fetch(`http://127.0.0.1:6543/api/spatial_data?x=${x}&y=${y}`)
        .then((response) => {
          if (!response.ok) throw new Error("Request failed");
          return response.json();
        })
        .then((data) => {
          // Display neighborhood info from API if available
          if (data.neighborhoods) {
            overlayFeatureName.innerHTML = `${getNeighborhoodNameByGid(
              data.neighborhoods[0].neighborhood_gid
            )}<br>${getNeighborhoodBoronameByGid(
              data.neighborhoods[0].neighborhood_gid
            )}`;
          } else {
            overlayFeatureName.innerHTML = "No neighborhoods";
          }
          // Highlight nearest subway station and show related info
          highlightSubwayStationByGid(data.subway.subway_gid, map);
          overlayAdditionInfo.innerHTML = `Nearby homicides: ${
            data.number_of_homicides
          }<br>Subway: ${getSubwayStationNameByGid(
            data.subway.subway_gid
          )}<br>Distance: ${parseFloat(data.subway.subway_distance).toFixed(
            2
          )}m`;
        })
        .catch((error) => {
          console.error("Błąd:", error);
          overlayFeatureName.innerHTML = "Błąd podczas pobierania danych";
          overlayAdditionInfo.innerHTML = "";
        });
      overlayLayer.setPosition(clickedCoordinate);
    }
  });
  const source = new ol.source.Vector();

  // Enables drag-and-drop of GeoJSON files onto the map and adds them as new vector layers
  const dragAndDropInteraction = new ol.interaction.DragAndDrop({
    source: source,
    formatConstructors: [ol.format.GeoJSON],
  });

  map.addInteraction(dragAndDropInteraction);
  // When features are added via drag-and-drop, create a new vector layer and zoom to its extent
  dragAndDropInteraction.on("addfeatures", function (event) {
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
  // Add LayerSwitcher
  const layerSwitcher = new ol.control.LayerSwitcher({
    tipLabel: "Layers",
  });
  map.addControl(layerSwitcher);

  // Control Select
  var select = new ol.interaction.Select({});
  map.addInteraction(select);

  // Creates a search control for subway stations based on the 'name' property,
  // highlights the selected station and zooms to its location on selection
  var subwaySearch = new ol.control.SearchFeature({
    source: subwaySource,
    property: "name",
    sort: function (f1, f2) {
      if (subwaySearch.getSearchString(f1) < subwaySearch.getSearchString(f2))
        return -1;
      if (subwaySearch.getSearchString(f1) > subwaySearch.getSearchString(f2))
        return 1;
      return 0;
    },
  });

  // When a search result is selected, highlight the station and fit the map view to its extent
  subwaySearch.on("select", function (e) {
    var feature = e.search;
    var geometry = feature.getGeometry();
    highlightSubwayStationByGid(feature.get("gid"), map);
    if (geometry) {
      var extent = geometry.getExtent();
      map.getView().fit(extent, {
        maxZoom: 18,
        duration: 500,
      });
    }
  });

  var printControl = new ol.control.PrintDialog({});
  printControl.setSize("A4");
  printControl.on(["print", "error"], function (e) {
    // Print success
    if (e.image) {
      if (e.pdf) {
        // Export pdf using the print info
        var pdf = new jsPDF({
          orientation: e.print.orientation,
          unit: e.print.unit,
          format: e.print.size,
        });
        pdf.addImage(
          e.image,
          "JPEG",
          e.print.position[0],
          e.print.position[0],
          e.print.imageWidth,
          e.print.imageHeight
        );
        pdf.save(e.print.legend ? "legend.pdf" : "map.pdf");
      } else {
        // Save image as file
        e.canvas.toBlob(
          function (blob) {
            var name =
              (e.print.legend ? "legend." : "map.") +
              e.imageType.replace("image/", "");
            saveAs(blob, name);
          },
          e.imageType,
          e.quality
        );
      }
    } else {
      console.warn("No canvas to export");
    }
  });

  const controlBar = new ol.control.Bar({
    toggleOne: true,
    group: true,
  });
  let currentMode = "features";

  // Button to enable 'features' mode — shows info from vector layers
  const layersButton = new ol.control.Button({
    html: '<i class="fa fa-info"></i>',
    title: "Additional info",
    handleClick: function () {
      currentMode = "features";
      panel.style.display = 'none';
    },
  });

  // Button to enable 'api' mode — fetches spatial data from the backend
  const apiButton = new ol.control.Button({
    html: '<i class="fa fa-info-circle"></i>',
    title: "Spatial info",
    handleClick: function () {
      currentMode = "api";
      panel.style.display = 'none';
    },
  });

  // Button to clear current mode, hide overlays, reset highlights, and disable drawing
  const clearButton = new ol.control.Button({
    html: '<i class="fa fa-times"></i>',
    title: "Clear mode",
    handleClick: function () {
      overlayLayer.setPosition(undefined);
      currentMode = null;
      highlightedGid = null;
      map.removeInteraction(draw);
      draw = null;
      NewYorkSubway.changed();
      panel.style.display = 'none';
    },
  });
  let draw = null;

  var notification = new ol.control.Notification({
    autoClose: false
  });
  map.addControl(notification);

  // Creates a button that activates polygon drawing on the map and displays its area in hectares
  const drawButton = new ol.control.Button({
    html: '<i class="fa fa-pencil"></i>',
    title: "Draw a polygon",
    handleClick: function () {
      currentMode = null;
      if (draw) {
        return;
      }

      draw = new ol.interaction.Draw({
        source: source,
        type: "Polygon",
      });

      map.addInteraction(draw);
      draw.once("drawend", function (event) {
        const polygon = event.feature.getGeometry();
        const area = ol.sphere.getArea(polygon);
        const areaHa = area / 10000;
        // Create info popup content
        const div = document.createElement("div");
        div.textContent = `Polygon area: ${areaHa.toFixed(2)} ha `;
        const closeLink = document.createElement("a");
        closeLink.textContent = "Close";
        closeLink.addEventListener("click", function (e) {
          e.preventDefault();
          notification.hide();
        });

        div.appendChild(closeLink);
        notification.show(div, { timeout: 0 });
        // Clean up draw interaction
        map.removeInteraction(draw);
        draw = null;
      });
    },
  });
  controlBar.addControl(subwaySearch);
  controlBar.addControl(printControl);
  controlBar.addControl(layersButton);
  controlBar.addControl(apiButton);
  controlBar.addControl(clearButton);
  controlBar.addControl(drawButton);


  // Creates a custom options panel for selecting the subway search property,
  // adds it as a control to the map, and sets up dynamic property switching
  const wrapper = document.createElement('div');
  wrapper.style.display = 'inline-block';
  // Create the hidden panel with dropdown for search property
  const panel = document.createElement('div');
  panel.style.display = 'none';
  panel.style.position = 'absolute';
  panel.style.top = '30px'; 
  panel.style.right = '-20px';
  panel.style.background = 'rgba(255,255,255,0.95)';
  panel.style.borderRadius = '5px';
  panel.style.padding = '8px';
  panel.style.minWidth = '180px';
  panel.style.fontSize = '13px';
  panel.innerHTML = `
    <strong>Options</strong><br/>
    <label>
      search property:
      <select id="searchProperty">
        <option value="name">Name</option>
        <option value="long_name">Long name</option>
        <option value="label">Label</option>
      </select>
    </label>
  `;

  // Create a gear icon button to toggle panel visibility
  const btn = document.createElement('button');
  btn.innerHTML = '<i class="fa fa-gear"></i>';
  btn.title = 'Show options';
  btn.onclick = () => {
    if (panel.style.display === 'none'){
      panel.style.display = 'block';
    } else {
      panel.style.display = 'none';
    }
  };

  
  // Assemble panel and button inside wrapper
  wrapper.appendChild(btn);
  wrapper.appendChild(panel);
  const optionsControl = new ol.control.Control({ element: wrapper });
  controlBar.addControl(optionsControl);
  map.addControl(controlBar);
  map.addControl(new ol.control.ScaleLine());

  // Update subway search to use selected property and rerun search
  document.getElementById("searchProperty").addEventListener("change", function () {
    subwaySearch.set("property", this.value);
    subwaySearch.search();
  });
}
