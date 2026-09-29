"use client";

import {
  GoogleAuthProvider,
  signInWithPopup,
  type User,
} from "firebase/auth";

import { getFirebaseAuth } from "@/services/firebase-client";

export type FirebaseGoogleSignInResult = {
  displayName: string | null;
  email: string | null;
  idToken: string;
  photoUrl: string | null;
  providerId: string;
  uid: string;
};

const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account",
});

export async function signInWithFirebaseGoogle(): Promise<FirebaseGoogleSignInResult> {
  const credential = await signInWithPopup(getFirebaseAuth(), googleProvider);
  const idToken = await credential.user.getIdToken(true);

  logFirebaseIdTokenProvider(idToken);

  return mapFirebaseUser(credential.user, idToken);
}

function mapFirebaseUser(
  user: User,
  idToken: string,
): FirebaseGoogleSignInResult {
  return {
    displayName: user.displayName,
    email: user.email,
    idToken,
    photoUrl: user.photoURL,
    providerId: GoogleAuthProvider.PROVIDER_ID,
    uid: user.uid,
  };
}

function logFirebaseIdTokenProvider(idToken: string) {
  try {
    const payload = JSON.parse(decodeBase64Url(idToken.split(".")[1] ?? "")) as {
      firebase?: unknown;
    };

    console.log("[FirebaseGoogleAuth] ID token firebase claim", payload.firebase);
  } catch {
    console.warn("[FirebaseGoogleAuth] Cannot decode Firebase ID token payload.");
  }
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddedBase64 = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );

  return atob(paddedBase64);
}
