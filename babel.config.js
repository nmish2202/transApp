module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@components': './src/components',
          '@database': './src/database',
          '@hooks': './src/hooks',
          '@screens': './src/screens',
          '@services': './src/services',
          '@store': './src/store',
          '@app-types': './src/types',
          '@utils': './src/utils'
        }
      }
    ]
  ]
};