// frontend/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 🔴 PASTE YOUR REAL CONFIG HERE
const firebaseConfig = {
  apiKey: "AIzaSyBKPaTxIObNy3lbTrY_DEgQieFrliT1IeY",
  authDomain: "earn-learn-cbd74.firebaseapp.com",
  projectId: "earn-learn-cbd74",
  storageBucket: "earn-learn-cbd74.firebasestorage.app",
  messagingSenderId: "214662522202",
  appId: "1:214662522202:web:beb0d50c8d8f2ec8b2ff63",
  measurementId: "G-3KGKY10TM5"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export {
  auth,
  db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  onSnapshot
};