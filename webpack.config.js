const path = require('path')

module.exports = {
  entry: './src/secure-webstore.ts',
  target: 'web',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },  
  output: {
    path: path.resolve(__dirname, 'dist/cjs'),
    filename: 'secure-webstore.js',
    library: 'SecureStore',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  resolve: {
    fallback: {
      fs: false
    }
  },
  resolve: {
    extensions: ['.ts', '.js', '.json']
  }
}
