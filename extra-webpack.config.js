const webpack = require('webpack');

module.exports = {
  plugins: [
    new webpack.DefinePlugin({
      ENV_VARS: {
        FIREBASE_APIKEY: JSON.stringify(process.env.FIREBASE_APIKEY),
        FIREBASE_MSENDERID: JSON.stringify(process.env.FIREBASE_MSENDERID),
        FIREBASE_APPID: JSON.stringify(process.env.FIREBASE_APPID),
        FIREBASE_MID: JSON.stringify(process.env.FIREBASE_MID),
        MSAL_CLIENT_ID: JSON.stringify(process.env.MSAL_CLIENT_ID),
        MSAL_REDIRECT_URI: JSON.stringify(process.env.MSAL_REDIRECT_URI),
        DEMO: JSON.stringify(process.env.DEMO),
        API_TOKEN: JSON.stringify(process.env.API_TOKEN),
        GITPOD_WORKSPACE_URL: JSON.stringify(process.env.GITPOD_WORKSPACE_URL),
      },
    }),
    new webpack.NormalModuleReplacementPlugin(/type-graphql$|@typegoose\/typegoose$/, (resource) => {
      resource.request = resource.request.replace(/type-graphql/, 'type-graphql/dist/browser-shim.js');
      resource.request = resource.request.replace(
        /@typegoose\/typegoose/,
        '@typegoose/../../config/typegoose-browser-shim.js'
      );
    }),
  ],
};
