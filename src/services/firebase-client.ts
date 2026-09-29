import "client-only";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

type FirebaseClientConfig = {
  apiKey: string;
  appId: string;
  authDomain: string;
  projectId: string;
};

const FIREBASE_ENV_KEYS = {
  apiKey: "NEXT_PUBLIC_FIREBASE_API_KEY",
  appId: "NEXT_PUBLIC_FIREBASE_APP_ID",
  authDomain: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  projectId: "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
} as const;

export function isFirebaseAuthConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID &&
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  );
}

export function getFirebaseApp(): FirebaseApp {
  assertBrowser();

  if (getApps().length) {
    return getApp();
  }

  return initializeApp(getFirebaseClientConfig());
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

function getFirebaseClientConfig(): FirebaseClientConfig {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  };
  const missingKeys = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => FIREBASE_ENV_KEYS[key as keyof FirebaseClientConfig]);

  if (missingKeys.length) {
    throw new Error(
      `Missing Firebase client environment variables: ${missingKeys.join(", ")}`,
    );
  }

  return config as FirebaseClientConfig;
}

function assertBrowser() {
  if (typeof window === "undefined") {
    throw new Error("Firebase client can only be initialized in the browser.");
  }
}
