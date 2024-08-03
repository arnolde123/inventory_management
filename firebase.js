// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getFirestore} from 'firebase/firestore'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDpUhNX5uySMXgGfDmH1ElbMJpVYLRO4h0",
  authDomain: "inventory-management-e0493.firebaseapp.com",
  projectId: "inventory-management-e0493",
  storageBucket: "inventory-management-e0493.appspot.com",
  messagingSenderId: "1017979667442",
  appId: "1:1017979667442:web:2fb0b3fc7ca34fbdb9a16b",
  measurementId: "G-XEH34TSFS4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const firestore = getFirestore(app)

export {firestore}