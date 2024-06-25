/** @type {import('next').NextConfig} */
require('dotenv').config({ path: "/Users/ekanshgupta/hotelEndpoints/src/app/api/backend/src/.env" });

const webpack = require('webpack');

module.exports = {
  images: {
    domains: ['cdn.worldota.net'], // Add the hostname here
  },
  webpack: (config, { isServer }) => {
    config.plugins = config.plugins.filter(
      plugin => !(plugin instanceof webpack.EnvironmentPlugin && plugin.definitions && plugin.definitions['process.env.__NEXT_OPTIMIZE_FONTS'])
    );

    if (!process.env.__NEXT_OPTIMIZE_FONTS) {
      config.plugins.push(
        new webpack.EnvironmentPlugin({
          ...process.env,
          __NEXT_OPTIMIZE_FONTS: 'true'
        })
      );
    }
    if (!process.env.NEXT_RUNTIME && !isServer) {
      config.plugins.push(
        new webpack.EnvironmentPlugin({
          ...process.env,
          NEXT_RUNTIME: 'development'
        })
      );
    }
    return config;
  }
};
