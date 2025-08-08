// Returns the value of the specified property for the feature with the given gid from the provided source
export function getFeatureByGid(gid, source) {
  const features = source.getFeatures();
  const feature = features.find((feature) => feature.get("gid") === gid);
  return feature ? feature : null;
}
