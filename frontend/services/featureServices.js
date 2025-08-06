// Returns the value of the specified property for the feature with the given gid from the provided source
export function getFeaturePropertyByGid(gid, source, property) {
  const features = source.getFeatures();
  const feature = features.find((feature) => feature.get("gid") === gid);
  return feature ? feature.get(property) : null;
}
