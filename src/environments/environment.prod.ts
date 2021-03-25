/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

declare let ENV_VARS: { [key: string]: string };

export const environment = {
  msalClientId: ENV_VARS.MSAL_CLIENT_ID,
  msalRedirectUri: ENV_VARS.MSAL_REDIRECT_URI,
  onedriveUri: ENV_VARS.ONEDRIVE_URI,
  firebaseConfig: {
    apiKey: ENV_VARS.FIREBASE_APIKEY,
    authDomain: 'plataforma-nortan.firebaseapp.com',
    databaseURL: 'https://plataforma-nortan.firebaseio.com',
    projectId: 'plataforma-nortan',
    storageBucket: 'plataforma-nortan.appspot.com',
    messagingSenderId: ENV_VARS.FIREBASE_MSENDERID,
    appId: ENV_VARS.FIREBASE_APPID,
    measurementId: ENV_VARS.FIREBASE_MID,
  },
};
