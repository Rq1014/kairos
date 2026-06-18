const expoConfig = require('eslint-config-expo/flat');
const { defineConfig } = require('eslint/config');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'build/**',
      'backend/**',
      '**/backend/**',
      'prototype/**',
      '**/prototype/**',
      'kairos-kakomon-extracted/**',
      '**/kairos-kakomon-extracted/**',
      'Kairos-kakomon/**',
      '**/Kairos-kakomon/**',
    ],
  },
]);
