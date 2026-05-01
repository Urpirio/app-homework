const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ignore backend directory
config.resolver.blockList = [
  ...Array.from(config.resolver.blockList || []),
  /backend-homework\/.*/,
];

module.exports = config;
