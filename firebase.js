// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const firestore = getFirestore(app);

export { firestore };