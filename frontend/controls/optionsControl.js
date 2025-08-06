// Creates a custom options panel for selecting the subway search property,
// adds it as a control to the map, and sets up dynamic property switching
const wrapper = document.createElement("div");
wrapper.style.display = "inline-block";
// Create the hidden panel with dropdown for search property
const panel = document.createElement("div");
panel.style.display = "none";
panel.style.position = "absolute";
panel.style.top = "30px";
panel.style.right = "-20px";
panel.style.background = "rgba(255,255,255,0.95)";
panel.style.borderRadius = "5px";
panel.style.padding = "8px";
panel.style.minWidth = "180px";
panel.style.fontSize = "13px";
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
const btn = document.createElement("button");
btn.innerHTML = '<i class="fa fa-gear"></i>';
btn.title = "Show options";
btn.onclick = () => {
  if (panel.style.display === "none") {
    panel.style.display = "block";
  } else {
    panel.style.display = "none";
  }
};

// Assemble panel and button inside wrapper
wrapper.appendChild(btn);
wrapper.appendChild(panel);
export const optionsControl = new ol.control.Control({ element: wrapper });

export function setPanelStyleDisplay(value) {
  panel.style.display = value;
}
