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
  msalRedirectUri: 'http://localhost:4200',
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
