/* global process */

import admin from 'firebase-admin';

// enable the use of .env files
import dotenv from 'dotenv';
dotenv.config();

const serviceAccount = {
  "type": "service_account",
  "project_id": process.env.FIREBASE_PROJECT_ID,
  "private_key_id": process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY_ID,
  "private_key": process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY,
  "client_email": process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL,
  "client_id": process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT_ID,
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": `https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-9fnmn%40${process.env.FIREBASE_PROJECT_ID}.iam.gserviceaccount.com`
}

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const database = admin.database();

export {app, database};
