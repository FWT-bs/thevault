const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Optional OS-specific lightningcss packages can be absent on Windows; Metro’s watcher
// sometimes trips on missing darwin/linux folders under node_modules. Block those paths.
const existingBlockList = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(existingBlockList)
    ? existingBlockList
    : existingBlockList
      ? [existingBlockList]
      : []),
  /node_modules[/\\].*[/\\]lightningcss-(darwin|linux|freebsd|android)-/,
];

module.exports = withNativeWind(config, { input: "./global.css" });
