
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"], // includes Expo Router transforms
    plugins: [], // no "expo-router/babel" here
  };
};
