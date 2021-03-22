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
      },
    }),
  ],
};
