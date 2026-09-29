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
  const idToken = await credential.user.getIdToken();

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
