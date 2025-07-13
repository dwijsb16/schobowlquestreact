import React, { useState, useEffect } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../.firebase/utils/firebase";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../.firebase/utils/firebase";
import { Eye, EyeOff } from "lucide-react";
import emailjs from "emailjs-com";

const GRADE_OPTIONS = ["5th", "6th", "7th", "8th"];
const VERIFICATION_TIMEOUT = 10 * 60 * 1000; // 10 mins in ms

const passwordRules = [
  { key: "length", text: "At least 6 characters" },
  { key: "upper", text: "At least one uppercase letter" },
  { key: "lower", text: "At least one lowercase letter" },
  { key: "digit", text: "At least one digit" },
  { key: "hasSpecial", text: "At least one special character (e.g. !@#$%^&*)" }
];

function checkPasswordStrength(password: string) {
  return {
    length: password.length >= 6,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /\d/.test(password),
    hasSpecial: /[!@#$%^&*()[\]{};:'",.<>/?\\|`~_\-+=]/.test(password),
  };
}

const SERVICE_ID = "service_9marpbs";
const TEMPLATE_ID = "template_3psu4d8";
const PUBLIC_KEY = "1F-ljhM3B95nu3_4i";

const SignupPage: React.FC = () => {
  // Main state
  const [email, setEmail] = useState("");
  const [emailValid, setEmailValid] = useState(true);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("player");
  const [grade, setGrade] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwMatch, setPwMatch] = useState(true);
  const [fromGoogle, setFromGoogle] = useState(false);
  //const navigate = useNavigate();

  // Verification state
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [sentCode, setSentCode] = useState<string | null>(null);
  const [codeSentAt, setCodeSentAt] = useState<number>(0);
  const [verifStatus, setVerifStatus] = useState<"pending" | "success" | "expired" | "failed">("pending");
  const [verifError, setVerifError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState<number>(VERIFICATION_TIMEOUT);

  // For Firestore after verification
  const [pendingFirestoreUser, setPendingFirestoreUser] = useState<any>(null);
  const [pendingPlayerDoc, setPendingPlayerDoc] = useState<any>(null);

  const navigate = useNavigate();

  // Email pattern validation
  useEffect(() => {
    if (!email) setEmailValid(true);
    else setEmailValid(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  }, [email]);
  useEffect(() => {
    const url = new URL(window.location.href);
    const isGoogle = url.searchParams.get("google") === "1";
    setFromGoogle(isGoogle);
    if (isGoogle) {
      setEmail(localStorage.getItem("pendingGoogleEmail") || "");
      setFirstName(localStorage.getItem("pendingGoogleName") || "");
    }
  }, []);

  // On mount, check auth state
  useEffect(() => {
    setCurrentUser(auth.currentUser);
    // If you want this to be more robust to auth changes, use onAuthStateChanged here
  }, []);

  const pwStrength = checkPasswordStrength(password);
  useEffect(() => {
    setPwMatch(confirmPassword === "" || password === confirmPassword);
  }, [password, confirmPassword]);

  // Timer countdown effect
  useEffect(() => {
    if (!showVerification || verifStatus !== "pending") return;
    const interval = setInterval(() => {
      const now = Date.now();
      const left = Math.max(0, codeSentAt + VERIFICATION_TIMEOUT - now);
      setTimer(left);
      if (left <= 0) {
        setVerifStatus("expired");
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [showVerification, codeSentAt, verifStatus]);

  // Helper: Send email via EmailJS
  const sendVerificationEmail = async (to_email: string, to_name: string, code: string) => {
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      { to_email, to_name, code },
      PUBLIC_KEY
    );
  };

  const generateCode = () => String(Math.floor(100000 + Math.random() * 900000));
  function formatTimer(ms: number) {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  }

  // MAIN SIGNUP HANDLER
    const handleSignup = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
    
      // === COMMON FIELD VALIDATION ===
      if (!emailValid) {
        setError("Please enter a valid email address.");
        return;
      }
      if (!firstName) {
        setError("First name is required.");
        return;
      }
      if (!lastName) {
        setError("Last name is required.");
        return;
      }
      if (!role) {
        setError("Please select a role.");
        return;
      }
      if (role === "player" && !grade) {
        setError("Please select a grade.");
        return;
      }
    
      try {
        let uid: string;
        let signupEmail: string;
        if (!currentUser) {
          // Validate password fields
          if (
            !pwStrength.length ||
            !pwStrength.upper ||
            !pwStrength.lower ||
            !pwStrength.digit ||
            !pwStrength.hasSpecial
          ) {
            setError(
              "Password must have at least 6 characters, one uppercase, one lowercase, one digit, and one special character."
            );
            return;
          }
          if (!pwMatch) {
            setError("Passwords do not match.");
            return;
          }
          if (!password) {
            setError("Password is required.");
            return;
          }
          // --- CREATE FIREBASE USER ---
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          uid = userCredential.user.uid;
          signupEmail = userCredential.user.email!;
        } else {
          // === ALREADY AUTHED (Google, etc) ===
          uid = currentUser.uid;
          signupEmail = currentUser.email!;
        }
  
      // Step 2: Prepare objects for Firestore, but DO NOT SAVE YET
      const newUser = {
        uid,
        email: signupEmail,
        firstName,
        lastName,
        role,
        ...(role === "player" && { grade }),
        linkedPlayers: [],
      };
  
      let playerDoc: any = null;
      if (role === "player") {
        playerDoc = {
          uid,
          email: signupEmail,
          firstName,
          lastName,
          grade,
          linkedUsers: [],
        };
      }
  
      setPendingFirestoreUser({ newUser, uid });
      setPendingPlayerDoc(playerDoc);
  
      // Step 3: Send verification code & show code input box
      const code = generateCode();
      await sendVerificationEmail(signupEmail, firstName, code);
  
      setSentCode(code);
      setShowVerification(true);
      setVerifStatus("pending");
      setCodeSentAt(Date.now());
      setTimer(VERIFICATION_TIMEOUT);
      setVerifError(null);
  
    } catch (err: any) {
      console.error("Signup failed:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already in use with another account.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    }
  };
  

  // Handler: verification code entry
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sentCode) return;
    if (verifStatus === "expired") {
      setVerifError("Code expired. Please resend email.");
      return;
    }
    if (verificationCode === sentCode) {
      setVerifStatus("success");
      setVerifError(null);
      // Now actually add to Firestore
      try {
        const { newUser, uid } = pendingFirestoreUser;
        const userDocRef = doc(db, "users", uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setVerifError("A profile already exists for this account.");
          setTimeout(() => (window.location.href = "/profile"), 2000);
          return;
        }
        await setDoc(userDocRef, newUser);
        if (pendingPlayerDoc) {
          const playerDocRef = doc(db, "players", uid);
          await setDoc(playerDocRef, pendingPlayerDoc);
        }
        setTimeout(() => (window.location.href = "/profile"), 1200);
      } catch (err) {
        setVerifError("Error saving profile. Try again.");
      }
    } else {
      setVerifStatus("failed");
      setVerifError("Incorrect code. Please try again.");
    }
  };

  // Handler: resend code
  const handleResend = async () => {
    setResending(true);
    try {
      const code = generateCode();
      await sendVerificationEmail(email, firstName, code);
      setSentCode(code);
      setCodeSentAt(Date.now());
      setTimer(VERIFICATION_TIMEOUT);
      setVerifStatus("pending");
      setVerifError(null);
    } catch (e) {
      setVerifError("Could not resend code. Try again.");
    }
    setResending(false);
  };

  return (
    <div className="container">
      <div className="row justify-content-center mt-5 mb-5">
        <div className="col-md-7 col-lg-6">
          <div className="card shadow-lg p-4" style={{ borderRadius: 18 }}>
            <h2 className="text-center mb-4" style={{ color: "#0058c9", fontWeight: 700 }}>
              {currentUser ? "Complete Your Profile" : "Create an Account"}
            </h2>
            {/* ---------- GOOGLE LOADING SPINNER OR FORM ---------- */}
              <form onSubmit={handleSignup}>
                <div className="form-group mb-3">
                  <label>Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                    disabled={fromGoogle}
                  />
                  {!emailValid && (
                    <div className="invalid-feedback">
                      Please enter a valid email address.
                    </div>
                  )}
                </div>
                <div className="form-group mb-3">
  <label>Password</label>
  <input
    type="password"
    className={`form-control ${error && password ? "is-invalid" : ""}`}
    value={password}
    onChange={e => setPassword(e.target.value)}
    required
    autoComplete="new-password"
    disabled={showVerification || !!auth.currentUser}
  />
  <ul className="mt-2 mb-0 pl-4" style={{ fontSize: 13, color: "#777" }}>
    {passwordRules.map((rule) => (
      <li key={rule.key} style={{
        color: checkPasswordStrength(password)[rule.key as keyof typeof pwStrength] ? "#51c775" : "#aaa"
      }}>
        {rule.text}
      </li>
    ))}
  </ul>
</div>
<div className="form-group mb-3">
  <label>Confirm Password</label>
  <input
    type="password"
    className={`form-control ${!pwMatch && confirmPassword ? "is-invalid" : ""}`}
    value={confirmPassword}
    onChange={e => setConfirmPassword(e.target.value)}
    required
    autoComplete="new-password"
    disabled={showVerification || !!auth.currentUser}
  />
  {!pwMatch && confirmPassword && (
    <div className="invalid-feedback" style={{ display: "block" }}>
      Passwords do not match.
    </div>
  )}
</div>

                <div className="form-group mb-3">
                  <label>First Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    required
                    disabled={showVerification}
                  />
                </div>
                <div className="form-group mb-3">
                  <label>Last Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    required
                    disabled={showVerification}
                  />
                </div>
                <div className="form-group mb-3">
                  <label>Role</label>
                  <select
                    className="form-control"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    required
                    disabled={showVerification}
                  >
                    <option value="player">Player</option>
                    <option value="parent">Parent</option>
                  </select>
                </div>
                {role === "player" && (
                  <div className="form-group mb-3">
                    <label>Grade</label>
                    <select
                      className="form-control"
                      value={grade}
                      onChange={e => setGrade(e.target.value)}
                      required
                      disabled={showVerification}
                    >
                      <option value="">Select grade</option>
                      {GRADE_OPTIONS.map((g) => (
                        <option value={g} key={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                )}
                {error && <div className="alert alert-danger mt-2">{error}</div>}
                <button className="btn btn-primary mt-3 w-100" type="submit" disabled={showVerification}>
                  {currentUser ? "Save Profile" : "Sign Up"}
                </button>
              </form>
            {/* --- VERIFICATION CODE ENTRY --- */}
            {showVerification && (
              <div className="card mt-4 p-3" style={{ borderRadius: 10, background: "#f6fafd" }}>
                <h5 style={{ color: "#0a8754" }}>Email Verification</h5>
                <p>
                  A 6-digit code was sent to <b>{email}</b>.<br />
                  Please enter it below.<br />
                  <span style={{ color: "#888" }}>Expires in: <b>{formatTimer(timer)}</b></span>
                </p>
                <form onSubmit={handleVerify} className="d-flex mb-2">
                  <input
                    className="form-control mr-2"
                    style={{ maxWidth: 150, letterSpacing: "0.2em" }}
                    maxLength={6}
                    type="text"
                    pattern="\d{6}"
                    inputMode="numeric"
                    placeholder="Enter code"
                    value={verificationCode}
                    onChange={e => {
                      setVerificationCode(e.target.value);
                      setVerifStatus("pending");
                      setVerifError(null);
                    }}
                    disabled={verifStatus === "success" || timer <= 0}
                    required
                  />
                  <button
                    className="btn btn-success"
                    type="submit"
                    disabled={verifStatus === "success" || timer <= 0}
                  >
                    Verify
                  </button>
                </form>
                {verifStatus === "success" && (
                  <div className="alert alert-success">Success! Verified.</div>
                )}
                {verifStatus === "expired" && (
                  <div className="alert alert-warning">
                    Code expired. Please click "Resend Email".
                  </div>
                )}
                {verifError && (
                  <div className="alert alert-danger">{verifError}</div>
                )}
                <button
                  className="btn btn-link"
                  style={{ color: "#0058c9" }}
                  onClick={handleResend}
                  disabled={resending || timer > 0}
                >
                  {resending ? "Sending..." : "Resend Email"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
