const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Esta línea ayuda a Metro a manejar archivos especiales y a ignorar 
// módulos de web que no se usan en Android.
config.resolver.assetExts.push('wasm');

module.exports = config;