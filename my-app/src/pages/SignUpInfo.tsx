import React, { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { createUserWithEmailAndPassword, UserCredential, User } from "firebase/auth";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "../.firebase/utils/firebase";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Eye, EyeOff } from "lucide-react";
import emailjs from "emailjs-com";

const RED = "#DF2E38";
const DARK_RED = "#B71C1C";
const BLACK = "#212121";
const GREY = "#888";
const LIGHT_GREY = "#f7f7f7";
const WHITE = "#fff";
const GREEN = "#51c775";

const GRADE_OPTIONS = ["4th","5th", "6th", "7th", "8th"];
const VERIFICATION_TIMEOUT = 10 * 60 * 1000; // 10 minutes in ms

const passwordRules = [
  { key: "length", text: "At least 6 characters" },
  { key: "upper", text: "At least one uppercase letter" },
  { key: "lower", text: "At least one lowercase letter" },
  { key: "digit", text: "At least one digit" },
  { key: "hasSpecial", text: "At least one special character (e.g. !@#$%^&*)" }
];

type PasswordStrength = {
  length: boolean;
  upper: boolean;
  lower: boolean;
  digit: boolean;
  hasSpecial: boolean;
};

function checkPasswordStrength(password: string): PasswordStrength {
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

const provider = new GoogleAuthProvider();

const SignupPage: React.FC = () => {
  // Types
  type SignupMethod = null | "email" | "google";

  const [signupMethod, setSignupMethod] = useState<SignupMethod>(null);
  const [email, setEmail] = useState<string>("");
  const [emailValid, setEmailValid] = useState<boolean>(true);
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [role, setRole] = useState<string>("player");
  const [grade, setGrade] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [pwMatch, setPwMatch] = useState<boolean>(true);
  const [suburb, setSuburb] = useState<string>("");

  // Verification
  const [showVerification, setShowVerification] = useState<boolean>(false);
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [sentCode, setSentCode] = useState<string | null>(null);
  const [codeSentAt, setCodeSentAt] = useState<number>(0);
  const [verifStatus, setVerifStatus] = useState<"pending" | "success" | "expired" | "failed">("pending");
  const [verifError, setVerifError] = useState<string | null>(null);
  const [resending, setResending] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(VERIFICATION_TIMEOUT);

  // For Firestore after verification
  const [pendingFirestoreUser, setPendingFirestoreUser] = useState<any>(null);
  const [pendingPlayerDoc, setPendingPlayerDoc] = useState<any>(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (!email) setEmailValid(true);
    else setEmailValid(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  }, [email]);

  useEffect(() => {
    setPwMatch(confirmPassword === "" || password === confirmPassword);
  }, [password, confirmPassword]);

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

  const pwStrength = checkPasswordStrength(password);

  const sendVerificationEmail = async (to_email: string, to_name: string, code: string) => {
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      { to_email, to_name, code },
      PUBLIC_KEY
    );
  };

  const generateCode = (): string => String(Math.floor(100000 + Math.random() * 900000));
  function formatTimer(ms: number): string {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  }

  // GOOGLE SIGNUP
  const handleGoogleSignup = async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      setSignupMethod("google");
      setCurrentUser(user);
      setEmail(user.email || "");
      setFirstName(user.displayName?.split(" ")[0] || "");
      setLastName(user.displayName?.split(" ").slice(1).join(" ") || "");
      setRole("player");
      setGrade("");
    } catch (err: any) {
      setError("Google sign-in failed. Try again.");
    }
  };

  // EMAIL SIGNUP
  const handleShowEmailSignup = () => {
    setSignupMethod("email");
    setCurrentUser(null);
    setEmail("");
    setFirstName("");
    setLastName("");
    setPassword("");
    setConfirmPassword("");
    setRole("player");
    setGrade("");
  };

  // MAIN SIGNUP
  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!emailValid) return setError("Please enter a valid email address.");
    if (!firstName) return setError("First name is required.");
    if (!lastName) return setError("Last name is required.");
    if (!role) return setError("Please select a role.");
    if (role === "player" && !grade) return setError("Please select a grade.");

    let uid: string, signupEmail: string;
    try {
      if (signupMethod === "email") {
        if (
          !pwStrength.length ||
          !pwStrength.upper ||
          !pwStrength.lower ||
          !pwStrength.digit ||
          !pwStrength.hasSpecial
        ) {
          return setError(
            "Password must have at least 6 characters, one uppercase, one lowercase, one digit, and one special character."
          );
        }
        if (!pwMatch) return setError("Passwords do not match.");
        if (!password) return setError("Password is required.");

        const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
        uid = userCredential.user.uid;
        signupEmail = userCredential.user.email!;
      } else if (signupMethod === "google" && currentUser) {
        uid = currentUser.uid;
        signupEmail = currentUser.email!;
      } else {
        return setError("Please choose a signup method.");
      }

      const newUser = {
        uid,
        email: signupEmail,
        firstName,
        lastName,
        role,
        ...(role === "player" && { grade }),
        ...(suburb && { suburb }),
        linkedPlayers: [],
      };

      let playerDoc = null;
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

      const code = generateCode();
      await sendVerificationEmail(signupEmail, firstName, code);

      setSentCode(code);
      setShowVerification(true);
      setVerifStatus("pending");
      setCodeSentAt(Date.now());
      setTimer(VERIFICATION_TIMEOUT);
      setVerifError(null);
    } catch (err: any) {
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

  // VERIFICATION HANDLER
  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (!sentCode) return;
    if (verifStatus === "expired") {
      setVerifError("Code expired. Please resend email.");
      return;
    }
    if (verificationCode === sentCode) {
      setVerifStatus("success");
      setVerifError(null);
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

  // --- FORM ---
  return (
    <div className="container-fluid" style={{ background: LIGHT_GREY, minHeight: "100vh" }}>
      <div className="row justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
        <div className="col-md-7 col-lg-6">
          <div className="card shadow-lg p-4" style={{
            borderRadius: 18,
            border: `1.8px solid ${RED}22`,
            background: WHITE,
            boxShadow: "0 2px 32px #d1a2a822"
          }}>
            <h2 className="text-center mb-4" style={{
              color: RED, fontWeight: 700, letterSpacing: 0.5
            }}>
              Create an Account
            </h2>

            {/* Signup Method Selection */}
            {!signupMethod && !showVerification && (
              <div className="d-flex flex-column align-items-center mb-4">
                <button
                  className="btn btn-lg mb-3"
                  style={{
                    background: `linear-gradient(90deg,${RED} 0,${DARK_RED} 100%)`,
                    color: WHITE, fontWeight: 700,
                    borderRadius: 14, width: 260, fontSize: 18
                  }}
                  onClick={handleShowEmailSignup}
                >
                  Sign Up with Email
                </button>
                <button
                  className="btn btn-lg"
                  style={{
                    background: "#fff",
                    color: RED,
                    fontWeight: 700,
                    borderRadius: 14,
                    width: 260,
                    fontSize: 18,
                    border: `2px solid ${RED}`,
                    boxShadow: "0 2px 8px #f2b8bb2d"
                  }}
                  onClick={handleGoogleSignup}
                >
                  Sign Up with Google
                </button>
              </div>
            )}

            {/* FORM */}
            {(signupMethod && !showVerification) && (
              <form onSubmit={handleSignup}>
                {/* EMAIL */}
                <div className="form-group mb-3">
                  <label style={{ fontWeight: 500, color: BLACK }}>Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                    disabled={signupMethod === "google"}
                    style={{
                      borderRadius: 12,
                      border: `1.3px solid ${LIGHT_GREY}`,
                      background: signupMethod === "google" ? "#f7ffe7" : WHITE,
                      color: BLACK,
                      fontWeight: signupMethod === "google" ? 600 : 400,
                    }}
                  />
                  {!emailValid && (
                    <div className="invalid-feedback" style={{ display: "block", color: RED }}>
                      Please enter a valid email address.
                    </div>
                  )}
                </div>
                {/* PASSWORD */}
                {signupMethod === "email" && (
                  <>
                    <div className="form-group mb-3" style={{ position: "relative" }}>
                      <label style={{ fontWeight: 500, color: BLACK }}>Password</label>
                      <input
                        type={showPassword ? "text" : "password"}
                        className={`form-control ${error && password ? "is-invalid" : ""}`}
                        value={password}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        style={{
                          borderRadius: 12,
                          border: `1.3px solid ${LIGHT_GREY}`,
                          background: WHITE,
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
                          color: DARK_RED,
                        }}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                      </button>
                      <ul className="mt-2 mb-0 pl-4" style={{ fontSize: 13, color: GREY }}>
                        {passwordRules.map((rule) => (
                          <li key={rule.key} style={{
                            color: pwStrength[rule.key as keyof PasswordStrength] ? GREEN : "#aaa"
                          }}>
                            {rule.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="form-group mb-3">
                      <label style={{ fontWeight: 500, color: BLACK }}>Confirm Password</label>
                      <input
                        type="password"
                        className={`form-control ${!pwMatch && confirmPassword ? "is-invalid" : ""}`}
                        value={confirmPassword}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        style={{
                          borderRadius: 12,
                          border: `1.3px solid ${LIGHT_GREY}`,
                          background: WHITE,
                          color: BLACK
                        }}
                      />
                      {!pwMatch && confirmPassword && (
                        <div className="invalid-feedback" style={{ display: "block", color: RED }}>
                          Passwords do not match.
                        </div>
                      )}
                    </div>
                  </>
                )}
                {/* FIRST/LAST */}
                <div className="form-group mb-3">
                  <label style={{ fontWeight: 500, color: BLACK }}>First Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={firstName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
                    required
                    disabled={showVerification}
                    style={{
                      borderRadius: 12, border: `1.3px solid ${LIGHT_GREY}`,
                      background: signupMethod === "google" ? "#f7ffe7" : WHITE,
                      color: BLACK,
                      fontWeight: signupMethod === "google" ? 600 : 400,
                    }}
                  />
                </div>
                <div className="form-group mb-3">
                  <label style={{ fontWeight: 500, color: BLACK }}>Last Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={lastName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
                    required
                    disabled={showVerification}
                    style={{
                      borderRadius: 12, border: `1.3px solid ${LIGHT_GREY}`,
                      background: signupMethod === "google" ? "#f7ffe7" : WHITE,
                      color: BLACK,
                      fontWeight: signupMethod === "google" ? 600 : 400,
                    }}
                  />
                </div>
                {/* ROLE */}
                <div className="form-group mb-3">
                  <label style={{ fontWeight: 500, color: BLACK }}>Role</label>
                  <select
                    className="form-control"
                    value={role}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setRole(e.target.value)}
                    required
                    style={{ borderRadius: 12, border: `1.3px solid ${LIGHT_GREY}` }}
                  >
                    <option value="player">Player</option>
                    <option value="parent">Parent</option>
                    <option value="alumni">Alumni</option>
                  </select>
                </div>
                {/* GRADE */}
                {role === "player" && (
                  <div className="form-group mb-3">
                    <label style={{ fontWeight: 500, color: BLACK }}>Grade</label>
                    <select
                      className="form-control"
                      value={grade}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setGrade(e.target.value)}
                      required
                      disabled={showVerification}
                      style={{ borderRadius: 12, border: `1.3px solid ${LIGHT_GREY}` }}
                    >
                      <option value="">Select grade</option>
                      {GRADE_OPTIONS.map((g) => (
                        <option value={g} key={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="form-group mb-3">
  <label style={{ fontWeight: 500, color: BLACK }}>Suburb or Town</label>
  <input
    type="text"
    className="form-control"
    value={suburb}
    required={true}
    onChange={(e: ChangeEvent<HTMLInputElement>) => setSuburb(e.target.value)}
    placeholder="Enter here (e.g. Palatine)"
    style={{
      borderRadius: 12,
      border: `1.3px solid ${LIGHT_GREY}`,
      background: WHITE,
      color: BLACK
    }}
  />
</div>
                {/* ERRORS */}
                {error && <div className="alert alert-danger mt-2" style={{
                  background: "#ffeef0", color: RED, border: `1px solid #ffd3db`
                }}>{error}</div>}
                <button
                  className="btn mt-3 w-100"
                  type="submit"
                  disabled={showVerification}
                  style={{
                    background: `linear-gradient(90deg,${RED} 0,${DARK_RED} 100%)`,
                    color: WHITE, fontWeight: 600, borderRadius: 12,
                    padding: "12px 0", fontSize: 16, border: "none",
                    boxShadow: "0 2px 12px #f2b8bb55"
                  }}
                >
                  Sign Up
                </button>
              </form>
            )}

            {/* --- VERIFICATION CODE ENTRY --- */}
            {showVerification && (
              <div className="card mt-4 p-3" style={{
                borderRadius: 10, background: "#fff8f8", border: `1.5px solid #fad5da`
              }}>
                <h5 style={{ color: RED, fontWeight: 700 }}>Email Verification</h5>
                <p style={{ color: BLACK }}>
                  A 6-digit code was sent to <b>{email}</b>.<br />
                  Please enter it below.<br />
                  <span style={{ color: GREY }}>Expires in: <b>{formatTimer(timer)}</b></span>
                </p>
                <form onSubmit={handleVerify} className="d-flex mb-2">
                  <input
                    className="form-control mr-2"
                    style={{
                      maxWidth: 150, letterSpacing: "0.2em",
                      borderRadius: 12, border: `1.2px solid ${LIGHT_GREY}`,
                      background: WHITE, color: BLACK
                    }}
                    maxLength={6}
                    type="text"
                    pattern="\d{6}"
                    inputMode="numeric"
                    placeholder="Enter code"
                    value={verificationCode}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setVerificationCode(e.target.value);
                      setVerifStatus("pending");
                      setVerifError(null);
                    }}
                    disabled={verifStatus === "success" || timer <= 0}
                    required
                  />
                  <button
                    className="btn"
                    type="submit"
                    disabled={verifStatus === "success" || timer <= 0}
                    style={{
                      background: GREEN, color: WHITE,
                      fontWeight: 600, borderRadius: 8, border: "none",
                      marginLeft: 12,
                    }}
                  >
                    Verify
                  </button>
                </form>
                {verifStatus === "success" && (
                  <div className="alert alert-success" style={{
                    background: "#f0fcf5", color: GREEN, border: "1px solid #c1efdb"
                  }}>Success! Verified.</div>
                )}
                {verifStatus === "expired" && (
                  <div className="alert alert-warning" style={{
                    background: "#fff7eb", color: "#ff9e36", border: "1px solid #ffe4bd"
                  }}>
                    Code expired. Please click "Resend Email".
                  </div>
                )}
                {verifError && (
                  <div className="alert alert-danger" style={{
                    background: "#ffeef0", color: RED, border: "1px solid #ffd3db"
                  }}>{verifError}</div>
                )}
                <button
                  className="btn btn-link"
                  style={{
                    color: RED, fontWeight: 600, textDecoration: "underline"
                  }}
                  onClick={handleResend}
                  disabled={resending || timer > 0}
                  type="button"
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
