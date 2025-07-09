// components/LoginForm.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, signInWithGooglePopup, db } from "../.firebase/utils/firebase";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { getDoc, doc,  collection, query, where, getDocs } from "firebase/firestore";

const LoginForm: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle Google Sign-In
  const logGoogleUser = async () => {
    setErrorMessage(null);
    try {
      const response = await signInWithGooglePopup();
      const firebaseUser = response.user;
      const uid = firebaseUser.uid;
      const email = firebaseUser.email;
  
      // 1. Fastest: try direct UID doc first
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
  
      if (userSnap.exists()) {
        // All good!
        navigate("/");
        return;
      }
  
      // 2. Not found by UID, try to find by email
      const q = query(collection(db, "users"), where("email", "==", email));
      const querySnap = await getDocs(q);
  
      if (!querySnap.empty) {
        // Migration/legacy case: optionally merge or migrate to new UID
        // For now, just treat as profile found:
        navigate("/");
        return;
      }
  
      // 3. No doc by uid or email: must create profile
      navigate("/signup");
  
    } catch (error) {
      // Handle errors
    }
  };

  // Handle Email/Password Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Check if Firestore user doc exists for this user
      const uid = userCredential.user.uid;
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        toast.success("Logged In! ✅", { 
          autoClose: 2000,
          onClose: () => navigate("/")
        });
      } else {
        toast.info("Welcome! Please finish setting up your account.", {
          autoClose: 2500,
          onClose: () => navigate("/signup")
        });
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      const message = firebaseErrorParser(error);
      setErrorMessage(message);

      if (error.code === "auth/user-not-found") {
        toast.info("Account not found. Redirecting to signup...", {
          autoClose: 2500,
          onClose: () => navigate("/signup")
        });
      }
    }
  };

  const firebaseErrorParser = (error: any): string => {
    switch (error.code) {
      case "auth/email-already-in-use": return "This email is already in use.";
      case "auth/invalid-email": return "Please enter a valid email address.";
      case "auth/weak-password": return "Password should be at least 6 characters.";
      case "auth/wrong-password": return "Incorrect password.";
      case "auth/user-not-found": return "No account found with this email.";
      default: return "An unexpected error occurred.";
    }
  };

  return (
    <div className="container">
      <h1 className="text-center">Quest Academy Scholastic Bowl Club</h1>
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label htmlFor="email">Email address</label>
          <input type="email" className="form-control" id="email"
            placeholder="Enter email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input type="password" className="form-control" id="password"
            placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <div className="text-center mt-3">
          <button type="submit" className="btn btn-primary">Login</button>
        </div>
      </form>

      {errorMessage && <div className="alert alert-danger text-center mt-3">{errorMessage}</div>}

      <hr />

      <div className="text-center mt-3">
        <button 
          onClick={logGoogleUser} 
          className="btn btn-light border p-2 shadow-sm d-flex align-items-center justify-content-center"
          style={{ width: "250px", margin: "0 auto" }}
        >
          <img 
            src="/images/google-logo.png" 
            alt="Google Logo" 
            style={{ width: "24px", height: "24px", marginRight: "10px" }} 
          />
          Sign in with Google
        </button>
      </div>

      <div className="text-center mt-4">
        First time signing in? <a href="/signup">Create an account</a>
      </div>

      <ToastContainer />
    </div>
  );
};

export default LoginForm;
