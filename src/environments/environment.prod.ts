/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

declare let ENV_VARS: { [key: string]: string };

export const environment = {
  production: true,
  msalClientId: ENV_VARS.MSAL_CLIENT_ID,
  msalRedirectUri: ENV_VARS.MSAL_REDIRECT_URI,
  onedriveUri: 'https://graph.microsoft.com/v1.0/drives/',
  onedriveNortanID: ENV_VARS.ONEDRIVE_NORTAN_ID,
  onedriveAdmID: ENV_VARS.ONEDRIVE_ADM_ID,
  demo: ENV_VARS.DEMO,
  apiToken: ENV_VARS.API_TOKEN,
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
