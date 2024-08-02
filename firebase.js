// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"; // Import Firebase Storage

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCyd09n40MIkDKntmz-tM8QDD2lKeoQDzk",
  authDomain: "inventory-tracker-3dbba.firebaseapp.com",
  projectId: "inventory-tracker-3dbba",
  storageBucket: "inventory-tracker-3dbba.appspot.com",
  messagingSenderId: "187316408090",
  appId: "1:187316408090:web:54ee0d0aab052b49e366a3",
  measurementId: "G-RKRWCL53YL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app); // Initialize Firebase Storage

export { auth, firestore, storage };
