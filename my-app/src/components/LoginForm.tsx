import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, signInWithGooglePopup, db } from "../.firebase/utils/firebase";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { getDoc, doc, collection, query, where, getDocs } from "firebase/firestore";
import { Eye, EyeOff } from "lucide-react";

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle Google Sign-In
  const logGoogleUser = async () => {
    setErrorMessage(null);
    try {
      const response = await signInWithGooglePopup();
      const firebaseUser = response.user;
      const uid = firebaseUser.uid;
      const email = firebaseUser.email;
  
      // Check Firestore
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
  
      if (userSnap.exists()) {
        navigate("/"); // All good
        return;
      }
  
      // Not found by UID, check by email (redundant but safe)
      const q = query(collection(db, "users"), where("email", "==", email));
      const querySnap = await getDocs(q);
  
      if (!querySnap.empty) {
        navigate("/");
        return;
      }
  
      // Not found: Need registration!
      // You can use localStorage, sessionStorage, or React Context to pass this info
      localStorage.setItem("pendingGoogleEmail", email || "");
      localStorage.setItem("pendingGoogleName", firebaseUser.displayName || "");
      navigate("/signup?google=1"); // add a query param if you want
    } catch (error) {
      toast.error("Google sign-in failed. Try again!");
    }
  };
  

  // Handle Email/Password Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        toast.success("Logged In! ✅", {
          autoClose: 1800,
          onClose: () => navigate("/")
        });
      } else {
        toast.info("Welcome! Please finish setting up your account.", {
          autoClose: 2000,
          onClose: () => navigate("/signup")
        });
      }
    } catch (error: any) {
      const message = firebaseErrorParser(error);
      setErrorMessage(message);

      if (error.code === "auth/user-not-found") {
        toast.info("Account not found. Redirecting to signup...", {
          autoClose: 1800,
          onClose: () => navigate("/signup")
        });
      } else {
        toast.error(message, { autoClose: 2000 });
      }
    }
  };

  const firebaseErrorParser = (error: any): string => {
    switch (error.code) {
      case "auth/email-already-in-use": return "This email is already in use.";
      case "auth/invalid-email": return "Please enter a valid email address.";
      case "auth/weak-password": return "Password should be at least 6 characters.";
      case "auth/wrong-password": return "Incorrect password. Please try again.";
      case "auth/user-not-found": return "No account found with this email.";
      case "auth/too-many-requests": return "Too many failed attempts. Try again later.";
      default: return "An unexpected error occurred. Please try again.";
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100"
      style={{
        background: "linear-gradient(90deg,#4F8CFD 0,#183A66 100%)",
        minHeight: "100vh"
      }}
    >
      <div className="card p-4 shadow-lg"
        style={{
          minWidth: 340, maxWidth: 400, borderRadius: 18, border: "none", background: "#fff"
        }}>
        <div className="mb-4 text-center">
          <h2 style={{
            color: "#2155CD", fontWeight: 700, letterSpacing: 0.5
          }}>Quest Academy <span style={{ color: "#5C7AEA" }}>Scholastic Bowl</span></h2>
          <div style={{
            fontSize: 16, color: "#7fa2b2", fontWeight: 400
          }}>Sign in to your account</div>
        </div>
        <form onSubmit={handleLogin}>
          <div className="form-group mb-3">
            <label htmlFor="email" style={{ fontWeight: 500 }}>Email</label>
            <input type="email" className="form-control" id="email"
              placeholder="Enter email" value={email}
              onChange={(e) => setEmail(e.target.value)} required
              style={{
                borderRadius: 12,
                border: "1px solid #e7eaf6",
                padding: "12px",
                fontSize: 15
              }}
            />
          </div>
          {/* Password field with show/hide eye */}
          <div className="form-group mb-2" style={{ position: "relative" }}>
            <label htmlFor="password" style={{ fontWeight: 500 }}>Password</label>
            <input
              type={showPassword ? "text" : "password"}
              className="form-control"
              id="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                borderRadius: 12,
                border: "1px solid #e7eaf6",
                padding: "12px",
                fontSize: 15,
                paddingRight: 40, // Make room for the eye icon
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              tabIndex={-1}
              style={{
                position: "absolute",
                right: 14,
                top: "65%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                padding: 0,
                margin: 0,
                cursor: "pointer",
                zIndex: 2,
                color: "#333"
              }}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
            </button>
          </div>
          {/* Error message */}
          {errorMessage && (
            <div className="alert alert-danger text-center mt-2 mb-0"
              style={{
                borderRadius: 12, fontWeight: 500, fontSize: 15,
                color: "#D7263D", background: "#fff3f6", border: "1px solid #ffe2ea"
              }}>
              <span>{errorMessage}</span>
              <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>
                Forgot password? <a href="/reset" style={{ color: "#2155CD", textDecoration: "underline", fontWeight: 600 }}>Reset here</a>
              </div>
            </div>
          )}
          <div className="text-center mt-4 mb-2">
            <button type="submit"
              className="btn"
              style={{
                background: "linear-gradient(90deg,#2155CD 0,#6BCB77 100%)",
                color: "#fff", fontWeight: 600,
                borderRadius: 12, padding: "12px 0",
                width: "100%", fontSize: 16, boxShadow: "0 2px 8px #c7e0ff33"
              }}>
              Login
            </button>
          </div>
        </form>
        <hr style={{ background: "#d7e6fc", margin: "30px 0 18px 0" }} />
        <div className="text-center">
          <button
            onClick={logGoogleUser}
            className="btn d-flex align-items-center justify-content-center mx-auto"
            style={{
              background: "#fff",
              color: "#21325b",
              border: "1px solid #b4c4ec",
              borderRadius: 14,
              boxShadow: "0 2px 8px #b4c4ec2d",
              padding: "10px 24px",
              fontWeight: 600,
              fontSize: 15,
              minWidth: 220
            }}
          >
            <svg width="22" height="22" style={{ marginRight: 10 }} viewBox="0 0 48 48">
              <g>
                <path fill="#4285F4" d="M43.6 20.5h-1.7V20H24v8h11.3c-1.2 3.2-4.1 5.5-7.6 5.5A8.5 8.5 0 1 1 36.5 24c0-.7-.1-1.3-.2-1.9H24v4.2h8.9A4.3 4.3 0 0 0 36.5 24c0-2.5-2.1-4.5-4.5-4.5S27.5 21.5 27.5 24H24v4.2h8.9A4.3 4.3 0 0 0 36.5 24c0-2.5-2.1-4.5-4.5-4.5S27.5 21.5 27.5 24"></path>
                <path fill="#34A853" d="M24 44c5.3 0 9.8-1.7 13.1-4.7l-6.3-5.1C29.3 36.1 26.8 36.9 24 36.9c-4.1 0-7.7-2.6-9-6.2H8.7v5.5A19.9 19.9 0 0 0 24 44z"></path>
                <path fill="#FBBC05" d="M15 28.7a8.7 8.7 0 0 1 0-5.5V17.7H8.7a20 20 0 0 0 0 12.6L15 28.7z"></path>
                <path fill="#EA4335" d="M24 15.1c2.3 0 4.4.8 6 2.4l4.5-4.5A14 14 0 0 0 24 8a16 16 0 0 0-15.3 11.7l6.3 5.1c1.3-3.7 4.9-6.3 9-6.3z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </g>
            </svg>
            Sign in with Google
          </button>
        </div>
        <div className="text-center mt-4" style={{ fontSize: 15 }}>
          <span style={{ color: "#888" }}>First time? </span>
          <a href="/signup" style={{
            color: "#2155CD",
            textDecoration: "underline",
            fontWeight: 600
          }}>Create an account</a>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default LoginForm;
