/** @type {import('next').NextConfig} */
const webpack = require('webpack');

const nextConfig = {
  webpack: (config) => {
    // Ignore React Native modules that MetaMask SDK tries to import
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': false,
    };
    
    // Add a plugin to ignore these modules
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^@react-native-async-storage\/async-storage$/,
      })
    );
    
    return config;
  },
};

module.exports = nextConfig;

