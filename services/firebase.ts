import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyCrYqDaJRJm9j2paIP7Q0BtW6vUPQv75e4",
    authDomain: "lab-flow-732bf.firebaseapp.com",
    projectId: "lab-flow-732bf",
    storageBucket: "lab-flow-732bf.firebasestorage.app",
    messagingSenderId: "66349869652",
    appId: "1:66349869652:web:6f91b8916a05aafdf81bc1",
    measurementId: "G-F8YXPQ5PFV"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);