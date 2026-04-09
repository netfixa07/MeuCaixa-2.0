import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfigJson from '../firebase-applet-config.json';

// Hardcoded config to ensure validity and bypass potential import/env issues
const firebaseConfig = {
  apiKey: "AIzaSyCaw45EWsOPWFe3D9eNThakkeOfymYAyMo",
  authDomain: "meucaixa-ef117.firebaseapp.com",
  projectId: "meucaixa-ef117",
  storageBucket: "meucaixa-ef117.firebasestorage.app",
  messagingSenderId: "295022963319",
  appId: "1:295022963319:web:3136aab64fd1da288e7472",
  firestoreDatabaseId: "ai-studio-dff8f95f-cfc8-47bf-b9d9-c2135008111d"
};

let app;
try {
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "TODO_KEYHERE") {
    console.warn("Firebase API Key is missing or invalid. Please check your configuration.");
  }
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error("Firebase initialization failed:", error);
  // Fallback to avoid crashing the whole app
  app = { name: '[DEFAULT]' } as any; 
}

console.log("Firebase initialized with project:", firebaseConfig.projectId);
console.log("Config used:", {
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  appId: firebaseConfig.appId.substring(0, 10) + "..."
});
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
