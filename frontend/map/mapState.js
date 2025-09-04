export let currentMode = null;

export function setCurrentMode(mode) {
  currentMode = mode;
}

export function getCurrentMode() {
  return currentMode;
}

export let draw = null;

export function setDraw(newDraw) {
  draw = newDraw;
}

export function getDraw() {
  return draw;
}

const overlayFeatureName = document.getElementById("feature-name");
const overlayAdditionInfo = document.getElementById("feature-additional-info");

export function setOverlayContent(title, info) {
  overlayFeatureName.innerHTML = title ?? "";
  overlayAdditionInfo.innerHTML = info ?? "";
}

export let heatmapRadius = 100;

export function setHeatmapRadius(value) {
  heatmapRadius = value;
}

export function getHeatmapRadius() {
  return heatmapRadius;
}

export let startPath = null;

export function setStartPath(value) {
  startPath = value;
}

export function getStartPath() {
  return startPath;
}

export let endPath = null;

export function setEndPath(value) {
  endPath = value;
}

export function getEndPath() {
  return endPath;
}
