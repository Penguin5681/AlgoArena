import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import dotenv from "dotenv";

dotenv.config();

const firebaseConfig = {
  apiKey: "AIzaSyCjJ1vb8voB9elIM5OGKMZAizoGbHvr_UI",
  authDomain: "algo-arena-85b81.firebaseapp.com",
  projectId: "algo-arena-85b81",
  storageBucket: "algo-arena-85b81.firebasestorage.app",
  messagingSenderId: "175622746504",
  appId: "1:175622746504:web:204f6fc31ec43fd1390a3d",
  measurementId: "G-M5HZPX29XJ"
};

let firebaseApp;
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApps()[0];
}

export const auth = getAuth(firebaseApp);
export default firebaseApp;
