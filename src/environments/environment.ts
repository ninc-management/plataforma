/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

declare let ENV_VARS: { [key: string]: string };

export const environment = {
  production: false,
  msalClientId: ENV_VARS.MSAL_CLIENT_ID,
  msalRedirectUri: ENV_VARS.MSAL_REDIRECT_URI
    ? ENV_VARS.MSAL_REDIRECT_URI
    : ENV_VARS.GITPOD_WORKSPACE_URL.slice(0, 8) + '3000-' + ENV_VARS.GITPOD_WORKSPACE_URL.slice(8),
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
