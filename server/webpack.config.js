const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

function readLocalEnv(filePath) {
  try {
    const fs = require('fs');
    if (!fs.existsSync(filePath)) return {};
    const out = {};
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const equalsIndex = line.indexOf('=');
      if (equalsIndex <= 0) continue;
      const key = line.slice(0, equalsIndex).trim();
      let value = line.slice(equalsIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const root = __dirname;
  const localEnv = readLocalEnv(path.resolve(root, '..', '.env.local'));
  const authToken =
    process.env.BOT_BUILDER_AUTH_TOKEN ||
    process.env.VITE_BOT_BUILDER_AUTH_TOKEN ||
    localEnv.BOT_BUILDER_AUTH_TOKEN ||
    localEnv.VITE_BOT_BUILDER_AUTH_TOKEN ||
    '';
  const authBootstrap = {
    token:
      process.env.BOT_BUILDER_AUTH_TOKEN ||
      process.env.VITE_BOT_BUILDER_AUTH_TOKEN ||
      localEnv.BOT_BUILDER_AUTH_TOKEN ||
      localEnv.VITE_BOT_BUILDER_AUTH_TOKEN ||
      '',
    identifier:
      process.env.BOT_BUILDER_AUTH_IDENTIFIER ||
      localEnv.BOT_BUILDER_AUTH_IDENTIFIER ||
      '',
    password:
      process.env.BOT_BUILDER_AUTH_PASSWORD ||
      localEnv.BOT_BUILDER_AUTH_PASSWORD ||
      '',
    deviceId:
      process.env.BOT_BUILDER_AUTH_DEVICE_ID ||
      localEnv.BOT_BUILDER_AUTH_DEVICE_ID ||
      'chart-main',
    geoLocation:
      process.env.BOT_BUILDER_AUTH_GEO_LOCATION ||
      localEnv.BOT_BUILDER_AUTH_GEO_LOCATION ||
      'Nairobi, Kenya',
    appVersion:
      process.env.BOT_BUILDER_AUTH_APP_VERSION ||
      localEnv.BOT_BUILDER_AUTH_APP_VERSION ||
      '0.1.6',
  };

  return {
    entry: './src/index.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      clean: true,
    },
    resolve: {
      extensions: ['.ts', '.js', '.json'],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'src/index.html'),  // Now looking in src folder
        filename: 'index.html',
        inject: 'body',
        templateParameters: {
          authToken,
          authBootstrap,
        },
      }),
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      compress: true,
      port: 48185,
      hot: true,
      open: true,
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    },
  };
};
