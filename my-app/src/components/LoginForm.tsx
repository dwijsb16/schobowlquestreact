import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithGooglePopup } from "../.firebase/utils/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../.firebase/utils/firebase";

const LoginForm: React.FC = () => {
  const navigate = useNavigate();

  // State for email, password, and errors
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle Google sign-in
  const logGoogleUser = async () => {
    setErrorMessage(null);
    try {
      const response = await signInWithGooglePopup();
      console.log(response);
      navigate("/");
    } catch (error: any) {
      console.error("Google sign-in failed:", error);
      setErrorMessage("Google sign-in failed. Please try again.");
    }
  };

  // Handle email/password login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log(userCredential.user);
      navigate("/");
    } catch (error: any) {
      console.error("Login failed:", error);
      setErrorMessage(firebaseErrorParser(error));
    }
  };

  // Handle email/password sign-up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log(userCredential.user);
      navigate("/");
    } catch (error: any) {
      console.error("Sign-up failed:", error);
      setErrorMessage(firebaseErrorParser(error));
    }
  };

  // Parse Firebase error codes into human-readable messages
  const firebaseErrorParser = (error: any) => {
    if (error.code) {
      switch (error.code) {
        case "auth/email-already-in-use":
          return "This email is already in use.";
        case "auth/invalid-email":
          return "Please enter a valid email address.";
        case "auth/weak-password":
          return "Password should be at least 6 characters.";
        case "auth/wrong-password":
          return "Incorrect password.";
        case "auth/user-not-found":
          return "No account found with this email.";
        default:
          return "An unexpected error occurred. Please try again.";
      }
    }
    return "An unknown error occurred.";
  };

  return (
    <div className="container">
      <h1 className="text-center text-capitalize">
        Quest Academy Scholastic Bowl Club
      </h1>
      <div>
        <form>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              type="email"
              className="form-control"
              id="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <small id="emailHelp" className="form-text text-muted">
              We'll never share your email with anyone else.
            </small>
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              className="form-control"
              id="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="text-center mt-3">
            <button onClick={handleLogin} className="btn btn-primary">
              Login
            </button>
            <button onClick={handleSignUp} className="btn btn-success ml-2">
              Sign Up
            </button>
          </div>
        </form>

        {errorMessage && (
          <div className="alert alert-danger text-center mt-3">{errorMessage}</div>
        )}

        <hr />

        <div className="text-center mt-3">
          <button onClick={logGoogleUser} className="btn btn-danger">
            Sign In With Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;