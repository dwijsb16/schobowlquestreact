import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, signInWithGooglePopup, db } from "../.firebase/utils/firebase";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { getDoc, doc, collection, query, where, getDocs, setDoc, Timestamp } from "firebase/firestore";
import { Eye, EyeOff } from "lucide-react";
import emailjs from "emailjs-com";

const RED = "#DF2E38";
const DARK_RED = "#B71C1C";
const WHITE = "#fff";
const BLACK = "#212121";
const GREY = "#858585";
const LIGHT_GREY = "#f7f7f7";

// EmailJS config
const EMAILJS_SERVICE_ID = "service_9marpbs";
const EMAILJS_TEMPLATE_ID = "template_4lyuban";
const EMAILJS_PUBLIC_KEY = "1F-ljhM3B95nu3_4i";

// Helper to generate a random token
function generateResetToken() {
  return Math.random().toString(36).slice(2) + Date.now();
}

const MAX_RESENDS = 3;

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot Password UI
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Resend logic state
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendCount, setResendCount] = useState(0);

  // Handle Google Sign-In — locked down
  const logGoogleUser = async () => {
    setErrorMessage(null);
    try {
      const response = await signInWithGooglePopup();
      const firebaseUser = response.user;
      const uid = firebaseUser.uid;
      // Only let them in if the user is pre-approved
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        toast.success("Logged In! ✅", {
          autoClose: 1800,
          onClose: () => navigate("/")
        });
      } else {
        toast.error("Your account is not authorized. Please contact your coach.");
        // No redirect to signup!
      }
    } catch (error) {
      toast.error("Google sign-in failed. Try again!");
    }
  };

  // Handle Email/Password Login — locked down
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
        toast.error("Your account is not authorized. Please contact your coach.");
        // No redirect to signup!
      }
    } catch (error: any) {
      const message = firebaseErrorParser(error);
      setErrorMessage(message);
      if (error.code === "auth/user-not-found") {
        toast.error("Your account is not authorized. Please contact your coach.");
        // No redirect to signup!
      } else {
        toast.error(message, { autoClose: 2000 });
      }
    }
  };

  // Forgot Password Functionality with Resend (unchanged)
  const handleForgotPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSending(true);
    setSent(false);

    try {
      const usersQuery = query(collection(db, "users"), where("email", "==", resetEmail));
      const userSnap = await getDocs(usersQuery);
      if (userSnap.empty) {
        toast.error("No user with this email exists. Please try again.");
        setSending(false);
        return;
      }
      // 1. Generate reset token and expiration (30 mins)
      const token = generateResetToken();
      const expires = Timestamp.fromDate(new Date(Date.now() + 30 * 60 * 1000));
      await setDoc(doc(db, "reset_tokens", token), {
        email: resetEmail,
        expires,
        used: false
      });

      // 2. Build reset link and send email via EmailJS
      const resetLink = `${window.location.origin}/reset?token=${token}`;
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email: resetEmail,
          reset_link: resetLink
        },
        EMAILJS_PUBLIC_KEY
      );

      toast.success("Reset email sent! Check your inbox.");
      setSent(true);
      setResendCount((c) => c + 1);
      setCanResend(false);
      setResendCooldown(30);
    } catch (err) {
      toast.error("Failed to send reset email. Try again later.");
    }
    setSending(false);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
    } else if (sent && resendCount < MAX_RESENDS) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown, sent, resendCount]);

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
    <>
      <div
        className="d-flex justify-content-center align-items-center min-vh-100"
        style={{
          background: `linear-gradient(90deg,${LIGHT_GREY} 0,${WHITE} 100%)`,
          minHeight: "100vh"
        }}
      >
        <div
          className="card p-4 shadow-lg"
          style={{
            minWidth: 340,
            maxWidth: 400,
            borderRadius: 18,
            border: "1.7px solid #f4c6c9",
            background: WHITE,
            boxShadow: "0 2px 24px #f2b8bb22"
          }}
        >
          <div className="mb-4 text-center">
            <h2 style={{
              color: RED,
              fontWeight: 700,
              letterSpacing: 0.5
            }}>
              Quest Academy <span style={{ color: BLACK }}>Scholastic Bowl</span>
            </h2>
            <div style={{
              fontSize: 16,
              color: GREY,
              fontWeight: 400
            }}>Sign in to your account</div>
          </div>
          {!showForgot ? (
            <form onSubmit={handleLogin}>
              <div className="form-group mb-3">
                <label htmlFor="email" style={{ fontWeight: 500, color: BLACK }}>Email</label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    borderRadius: 12,
                    border: `1.3px solid ${LIGHT_GREY}`,
                    padding: "12px",
                    fontSize: 15,
                    background: "#fff",
                    color: BLACK,
                  }}
                />
              </div>
              <div className="form-group mb-2" style={{ position: "relative" }}>
                <label htmlFor="password" style={{ fontWeight: 500, color: BLACK }}>Password</label>
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
                    border: `1.3px solid ${LIGHT_GREY}`,
                    padding: "12px",
                    fontSize: 15,
                    background: "#fff",
                    color: BLACK,
                    paddingRight: 40,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  tabIndex={-1}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "65%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    zIndex: 2,
                    color: "#B71C1C",
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
              {errorMessage && (
                <div
                  className="alert alert-danger text-center mt-2 mb-0"
                  style={{
                    borderRadius: 12,
                    fontWeight: 500,
                    fontSize: 15,
                    color: "#B71C1C",
                    background: "#ffeef0",
                    border: "1px solid #ffd3db",
                  }}
                >
                  <span>{errorMessage}</span>
                </div>
              )}
              <div style={{ fontSize: 13, color: GREY, marginTop: 2 }}>
                Forgot password?{" "}
                <button
                  className="btn btn-link p-0 m-0"
                  type="button"
                  style={{
                    color: RED,
                    fontWeight: 600,
                    textDecoration: "underline",
                    fontSize: 14,
                  }}
                  onClick={() => setShowForgot(true)}
                >
                  Reset here
                </button>
              </div>
              <div className="text-center mt-4 mb-2">
                <button
                  type="submit"
                  className="btn"
                  style={{
                    background: `linear-gradient(90deg,${RED} 0,${DARK_RED} 100%)`,
                    color: "#fff",
                    fontWeight: 600,
                    borderRadius: 12,
                    padding: "12px 0",
                    width: "100%",
                    fontSize: 16,
                    boxShadow: "0 2px 8px #f2b8bb33",
                    border: "none"
                  }}
                >
                  Login
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword}>
              <div className="form-group mt-3">
                <label htmlFor="resetEmail" style={{ fontWeight: 500, color: BLACK }}>
                  Email for Reset
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="resetEmail"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  disabled={sending || sent}
                  style={{
                    borderRadius: 12,
                    border: `1.3px solid ${LIGHT_GREY}`,
                    background: WHITE,
                    color: BLACK
                  }}
                />
              </div>
              <div className="text-center mt-3">
                <button
                  type="submit"
                  className="btn"
                  style={{
                    background: RED,
                    color: WHITE,
                    borderRadius: 10,
                    fontWeight: 600,
                    minWidth: 120,
                    border: "none",
                  }}
                  disabled={sending || sent}
                >
                  {sending ? "Sending..." : sent ? "Sent!" : "Send Reset Email"}
                </button>
              </div>
              {sent && resendCount < MAX_RESENDS && (
                <div className="text-center mt-3">
                  <span style={{ fontSize: 14, color: GREY }}>
                    Didn’t receive the email?&nbsp;
                  </span>
                  <button
                    type="button"
                    className="btn btn-link"
                    disabled={!canResend || sending}
                    style={{
                      color: canResend ? RED : "#aaa",
                      fontWeight: 600,
                      textDecoration: "underline",
                      fontSize: 14,
                      cursor: canResend ? "pointer" : "not-allowed",
                      marginLeft: 0,
                    }}
                    onClick={() => {
                      setSent(false);
                      handleForgotPassword();
                    }}
                  >
                    {canResend
                      ? "Resend Email"
                      : `Resend available in ${resendCooldown}s`}
                  </button>
                </div>
              )}
              {resendCount >= MAX_RESENDS && (
                <div className="text-center mt-2" style={{ fontSize: 13, color: RED }}>
                  You have reached the maximum number of resends. Please try again later.
                </div>
              )}
              <div className="text-center mt-2">
                <button
                  type="button"
                  className="btn btn-link"
                  style={{ fontSize: 14, color: RED }}
                  onClick={() => setShowForgot(false)}
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}
          <hr style={{ background: "#ffccd4", margin: "30px 0 18px 0" }} />
          <div className="text-center">
            <button
              onClick={logGoogleUser}
              className="btn d-flex align-items-center justify-content-center mx-auto"
              style={{
                background: WHITE,
                color: RED,
                border: `1.4px solid ${RED}`,
                borderRadius: 14,
                boxShadow: "0 2px 8px #f2b8bb2d",
                padding: "10px 24px",
                fontWeight: 600,
                fontSize: 15,
                minWidth: 220
              }}
            >
              {/* Google icon svg here */}
              Sign in with Google
            </button>
          </div>
          <div className="text-center mt-4" style={{ fontSize: 15 }}>
            <span style={{ color: GREY }}>
                Want to sign up?{" "}
              <span style={{
              color: RED,
              fontWeight: 600
              }}>
              Ask your coach for a signup link!
              </span>
            </span>
          </div>

          {/* REMOVED: Sign up link below */}
          {/* <div className="text-center mt-4" style={{ fontSize: 15 }}>
            <span style={{ color: GREY }}>First time? </span>
            <a href="/signup" style={{
              color: RED,
              textDecoration: "underline",
              fontWeight: 600
            }}>Create an account</a>
          </div> */}
        </div>
        <ToastContainer />
      </div>
    </>
  );
};

export default LoginForm;
