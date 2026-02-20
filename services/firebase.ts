
import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  onSnapshot,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { AppData } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyA32u6hSd6mj4oJvlsa-EHMReKx0im2e80",
  authDomain: "chitpro-9affd.firebaseapp.com",
  projectId: "chitpro-9affd",
  storageBucket: "chitpro-9affd.firebasestorage.app",
  messagingSenderId: "754344187587",
  appId: "1:754344187587:web:bbf672119ace7551153476",
  measurementId: "G-SZ6RP1RSL9"
};

const isPlaceholder = firebaseConfig.apiKey.includes("Placeholder");

const app = initializeApp(firebaseConfig);

// Use modern persistentLocalCache API (Firebase v10+)
const db = isPlaceholder
  ? initializeFirestore(app, {})
  : initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });

const CHIT_DOC_ID = "main-group-v1";

export const subscribeToChitData = (
  onUpdate: (data: AppData | null) => void,
  onError: (err: any) => void
) => {
  if (isPlaceholder) {
    onError({ code: "placeholder-config", message: "Firebase not configured" });
    return () => {};
  }

  return onSnapshot(
    doc(db, "groups", CHIT_DOC_ID),
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as AppData);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      if (
        error.name === "AbortError" ||
        error.message?.includes("aborted") ||
        error.code === "cancelled"
      ) return;
      console.error("Firebase Sync Error:", error);
      onError(error);
    }
  );
};

export const saveChitData = async (data: AppData) => {
  if (isPlaceholder) return;
  try {
    await setDoc(doc(db, "groups", CHIT_DOC_ID), data, { merge: true });
  } catch (error: any) {
    if (
      error.name === "AbortError" ||
      error.message?.includes("aborted") ||
      error.code === "cancelled"
    ) return;
    console.error("Firebase Save Error:", error);
    throw error;
  }
};

export const getInitialData = async (): Promise<AppData | null> => {
  if (isPlaceholder) return null;
  try {
    const docRef = doc(db, "groups", CHIT_DOC_ID);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as AppData) : null;
  } catch (error: any) {
    if (
      error.name === "AbortError" ||
      error.message?.includes("aborted") ||
      error.code === "cancelled"
    ) return null;
    console.warn("Failed to get initial data:", error.message);
    return null;
  }
};
