// Defines a fill style with a blue color
export const fillStyle = new ol.style.Fill({
  color: [84, 118, 255, 1],
});

// Defines a stroke style with a blue color and specific width
export const strokeStyle = new ol.style.Stroke({
  color: [84, 118, 255, 1],
  width: 1.2,
});

// Defines a circle style with a red fill and blue stroke
export const circleStyle = new ol.style.Circle({
  fill: new ol.style.Fill({
    color: [245, 49, 5, 1],
  }),
  radius: 7,
  stroke: strokeStyle,
});
