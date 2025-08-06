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
