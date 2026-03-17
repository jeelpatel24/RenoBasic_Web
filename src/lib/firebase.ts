import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCRzlxHctEOsqUfHfOd1dNMVp-NCMlvLyU",
  authDomain: "renobasics-d33a1.firebaseapp.com",
  projectId: "renobasics-d33a1",
  storageBucket: "renobasics-d33a1.firebasestorage.app",
  messagingSenderId: "785918978262",
  appId: "1:785918978262:web:2d8a45e412f15d35d08177",
  measurementId: "G-C2YBL90K57",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
