// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAtYepyiEnmbX8tC-WCOqPljd6aBng7CAI",
  authDomain: "questsb-website.firebaseapp.com",
  projectId: "questsb-website",
  storageBucket: "questsb-website.firebasestorage.app",
  messagingSenderId: "1087643125650",
  appId: "1:1087643125650:web:7a5d5985b330f0fc43634b",
  measurementId: "G-NH57Q4YDR2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// Initialize Firebase Auth provider
const provider = new GoogleAuthProvider();
  
// whenever a user interacts with the provider, we force them to select an account
provider.setCustomParameters({   
    prompt : "select_account "
});
export const auth = getAuth(app);
export const signInWithGooglePopup = () => signInWithPopup(auth, provider);
export default app;