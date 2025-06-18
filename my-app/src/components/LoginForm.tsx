// components/LoginForm.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, signInWithGooglePopup } from "../.firebase/utils/firebase";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { User } from "../types/user";

const LoginForm: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const logGoogleUser = async () => {
    setErrorMessage(null);
    try {
      const response = await signInWithGooglePopup();
      const user: User = {
        uid: response.user.uid,
        firstName: response.user.displayName?.split(" ")[0] || "",
        email: response.user.email || "",
        lastName: "",
        role: "player"
      };
      console.log(user);
      toast.success("Logged In! ✅", { 
        autoClose: 2000,
        onClose: () => navigate("/")
      });
    } catch (error: any) {
      console.error("Google sign-in failed:", error);
      setErrorMessage("Google sign-in failed. Please try again.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user: User = {
        uid: userCredential.user.uid,
        firstName: userCredential.user.displayName?.split(" ")[0] || "",
        email: userCredential.user.email || "",
        lastName: "",
        role: "player"
      };
      console.log(user);
      toast.success("Logged In! ✅", { autoClose: 2000 });
      setTimeout(() => navigate("/"), 2000);
    } catch (error: any) {
      console.error("Login failed:", error);
      setErrorMessage(firebaseErrorParser(error));
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