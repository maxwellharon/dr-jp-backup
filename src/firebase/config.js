import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCE3QDTlvp51E9UbfdxlwoAVO_uqxATvUs",   // ← Paste the exact one from test.html
  authDomain: "dr-ogalo-dashboard.firebaseapp.com",
  projectId: "dr-ogalo-dashboard",
  storageBucket: "dr-ogalo-dashboard.firebasestorage.app",
  messagingSenderId: "991201907262",
  appId: "1:991201907262:web:3d2b0a2e5f4a01da7bf76f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log("✅ Firebase initialized");
