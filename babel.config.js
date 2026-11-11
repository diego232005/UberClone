module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 4: el plugin vive en worklets y debe ir al final
    plugins: ['react-native-worklets/plugin'],
  };
};
