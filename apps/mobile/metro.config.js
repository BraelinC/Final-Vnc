const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [monorepoRoot];

// Let Metro know where to resolve packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Ensure symlinked packages work
config.resolver.disableHierarchicalLookup = true;

// Handle workspace packages
config.resolver.extraNodeModules = {
  "@healthymama/ui": path.resolve(monorepoRoot, "packages/ui/src"),
};

// Tamagui optimization
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
};

config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== "svg"
);
config.resolver.sourceExts = [...config.resolver.sourceExts, "svg"];

module.exports = config;
