import { setDraw, getDraw, setCurrentMode } from "../map/mapState.js";
import { map } from "../map/createMap.js";

export let notification = new ol.control.Notification({
  autoClose: false,
});
// Creates a button that activates polygon drawing on the map and displays its area in hectares
export const drawButton = new ol.control.Button({
  html: '<i class="fa fa-pencil"></i>',
  title: "Draw a polygon",
  handleClick: function () {
    setCurrentMode(null);
    if (getDraw()) {
      return;
    }

    let newDraw = new ol.interaction.Draw({
      source: new ol.source.Vector(),
      type: "Polygon",
    });
    setDraw(newDraw);

    map.addInteraction(getDraw());
    getDraw().once("drawend", function (event) {
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
      map.removeInteraction(getDraw());
      setDraw(null);
    });
  },
});
