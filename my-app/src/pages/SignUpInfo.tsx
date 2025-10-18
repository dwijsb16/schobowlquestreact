import React, { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { createUserWithEmailAndPassword, UserCredential, User } from "firebase/auth";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "../.firebase/utils/firebase";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
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
// put near the top of the file
const userBase = (p: {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  provider: "google" | "password";
}) => ({
  uid: p.uid,
  email: p.email,
  firstName: p.firstName || "",
  lastName: p.lastName || "",
  provider: p.provider,
  linkedPlayers: [],             // ✅ default
});


const SERVICE_ID = "service_9marpbs";
const TEMPLATE_ID = "template_3psu4d8";
const PUBLIC_KEY = "1F-ljhM3B95nu3_4i";

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

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
  // Add these to your component state:
const [showCompleteProfile, setShowCompleteProfile] = useState(false);
const [gpUid, setGpUid] = useState<string>("");
const [gpEmail, setGpEmail] = useState<string>("");
const [gpFirst, setGpFirst] = useState<string>("");
const [gpLast, setGpLast] = useState<string>("");

// This is the profile form state that will be saved to Firestore
const [cpRole, setCpRole] = useState<"player" | "parent" | "alumni" | "">("");
const [cpGrade, setCpGrade] = useState<string>("");
const [cpSuburb, setCpSuburb] = useState<string>("");
const [cpSaving, setCpSaving] = useState(false);
const [cpError, setCpError] = useState<string | null>(null);
// tiny helper
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

// global finishing overlay state (used for both Google modal + email verify flows)
const [isFinishing, setIsFinishing] = useState(false);
const [finishMsg, setFinishMsg] = useState<string>(""); // e.g. "Setting up your account…"



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
  // const handleGoogleSignup = async () => {
  //   setError(null);
  //   try {
  //     const result = await signInWithPopup(auth, provider);
  //     const user = result.user;
  //     setSignupMethod("google");
  //     setCurrentUser(user);
  //     setEmail(user.email || "");
  //     setFirstName(user.displayName?.split(" ")[0] || "");
  //     setLastName(user.displayName?.split(" ").slice(1).join(" ") || "");
  //     setRole("player");
  //     setGrade("");
  //   } catch (err: any) {
  //     setError("Google sign-in failed. Try again.");
  //   }
  // };
  // 

async function handleGoogleSignupSimple() {
  try {
    const { user } = await signInWithPopup(auth, provider);
    const uid = user.uid;
    const email = user.email ?? "";
    const display = user.displayName ?? "";
    const first = display.split(" ")[0] || "";
    const last  = display.split(" ").slice(1).join(" ") || "";

    // Pre-fill and show the Complete Profile dialog
    setGpUid(uid);
    setGpEmail(email);
    setGpFirst(first);
    setGpLast(last);

    // Optionally try to load an existing profile; if it exists, skip the dialog.
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      // Already has a profile -> go straight to /profile
      navigate("/profile");
      return;
    }

    setShowCompleteProfile(true);
  } catch (err) {
    console.error("Google signup failed:", err);
    alert("Google sign-in failed. Please try again.");
  }
}
async function saveCompletedProfile() {
  setCpError(null);

  if (!cpRole) return setCpError("Please select a role.");
  if (!cpSuburb) return setCpError("Please enter your suburb/town.");
  if (cpRole === "player" && !cpGrade) return setCpError("Please select a grade.");

  setCpSaving(true);
  try {
    // fill in profile
    await setDoc(
      doc(db, "users", gpUid),
      {
        ...userBase({ uid: gpUid, email: gpEmail, firstName: gpFirst, lastName: gpLast, provider: "google" }),
        role: cpRole,
        suburb: cpSuburb,
        ...(cpRole === "player" ? { grade: cpGrade } : { grade: null }),
        onboardingRequired: false,     // ✅ finished
        updatedAt: serverTimestamp(),
        // createdAt left as-is (merge won't overwrite if already present)
      },
      { merge: true }
    );
    ;
    

    if (cpRole === "player") {
      await setDoc(
        doc(db, "players", gpUid),
        {
          uid: gpUid,
          email: gpEmail,
          firstName: gpFirst,
          lastName: gpLast,
          grade: cpGrade,
          suburb: cpSuburb,
          linkedUsers: [],
          provider: "google",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    // optional: read-back to be extra safe
    // const confirm = await getDoc(doc(db, "users", gpUid));
    // if (!confirm.exists()) { setCpError("Could not verify save, try again."); setCpSaving(false); return; }

    setShowCompleteProfile(false);
    // 3) Done
// show a brief finishing overlay and give Firestore/guards a beat
setFinishMsg("Setting up your account…");
setIsFinishing(true);
await sleep(650);

navigate("/profile", { replace: true });
setIsFinishing(false);
setFinishMsg("");

    navigate("/profile");
  } catch (e) {
    console.error(e);
    setCpError("Could not save your profile. Please try again.");
  } finally {
    setCpSaving(false);
  }
}



  

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
  // const handleSignup = async (e: FormEvent) => {
  //   e.preventDefault();
  //   setError(null);

  //   if (!emailValid) return setError("Please enter a valid email address.");
  //   if (!firstName) return setError("First name is required.");
  //   if (!lastName) return setError("Last name is required.");
  //   if (!role) return setError("Please select a role.");
  //   if (role === "player" && !grade) return setError("Please select a grade.");

  //   let uid: string, signupEmail: string;
  //   try {
  //     if (signupMethod === "email") {
  //       if (
  //         !pwStrength.length ||
  //         !pwStrength.upper ||
  //         !pwStrength.lower ||
  //         !pwStrength.digit ||
  //         !pwStrength.hasSpecial
  //       ) {
  //         return setError(
  //           "Password must have at least 6 characters, one uppercase, one lowercase, one digit, and one special character."
  //         );
  //       }
  //       if (!pwMatch) return setError("Passwords do not match.");
  //       if (!password) return setError("Password is required.");

  //       //const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
  //       //uid = userCredential.user.uid;
  //       //signupEmail = userCredential.user.email!;
  //     } else if (signupMethod === "google" && currentUser) {
  //       uid = currentUser.uid;
  //       signupEmail = currentUser.email!;
  //     } else {
  //       return setError("Please choose a signup method.");
  //     }

  //     const newUser = {
  //       uid,
  //       email: signupEmail,
  //       firstName,
  //       lastName,
  //       role,
  //       ...(role === "player" && { grade }),
  //       ...(suburb && { suburb }),
  //       linkedPlayers: [],
  //     };

  //     let playerDoc = null;
  //     if (role === "player") {
  //       playerDoc = {
  //         uid,
  //         email: signupEmail,
  //         firstName,
  //         lastName,
  //         grade,
  //         suburb,
  //         linkedUsers: [],
  //       };
  //     }

  //     setPendingFirestoreUser({ newUser, uid });
  //     setPendingPlayerDoc(playerDoc);

  //     const code = generateCode();
  //     await sendVerificationEmail(signupEmail, firstName, code);

  //     setSentCode(code);
  //     setShowVerification(true);
  //     setVerifStatus("pending");
  //     setCodeSentAt(Date.now());
  //     setTimer(VERIFICATION_TIMEOUT);
  //     setVerifError(null);
  //   } catch (err: any) {
  //     if (err.code === "auth/email-already-in-use") {
  //       setError("This email is already in use with another account.");
  //     } else if (err.code === "auth/invalid-email") {
  //       setError("Please enter a valid email address.");
  //     } else if (err.code === "auth/weak-password") {
  //       setError("Password should be at least 6 characters.");
  //     } else {
  //       setError("An unexpected error occurred. Please try again.");
  //     }
  //   }
  // };
  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
  
    // Basic validation
    if (!emailValid) return setError("Please enter a valid email address.");
    if (!firstName) return setError("First name is required.");
    if (!lastName) return setError("Last name is required.");
    if (!role) return setError("Please select a role.");
    if (role === "player" && !grade) return setError("Please select a grade.");
  
    if (signupMethod === "email") {
      // Password rules (email method only)
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
    } else if (signupMethod === "google") {
      // For Google, you already called signInWithPopup elsewhere.
    } else {
      return setError("Please choose a signup method.");
    }
  
    // Stash everything needed to finalize the account AFTER verification
    setPendingFirestoreUser({
      email,
      // Only needed for email/password flow. Keep empty string for Google.
      password: signupMethod === "email" ? password : "",
      signupMethod,
      role,
      firstName,
      lastName,
      suburb,
      grade: role === "player" ? grade : "",
    });
  
    setPendingPlayerDoc(
      role === "player"
        ? { email, firstName, lastName, grade, suburb, linkedUsers: [] }
        : null
    );
  
    try {
      // Send verification code via EmailJS
      const code = generateCode();
      await sendVerificationEmail(email, firstName, code);
  
      setSentCode(code);
      setShowVerification(true);
      setVerifStatus("pending");
      setCodeSentAt(Date.now());
      setTimer(VERIFICATION_TIMEOUT);
      setVerifError(null);
    } catch (err) {
      setError("Could not send verification email. Please try again.");
    }
  };
  
  

  // VERIFICATION HANDLER
  // const handleVerify = async (e: FormEvent) => {
  //   e.preventDefault();
  //   if (!sentCode) return;
  //   if (verifStatus === "expired") {
  //     setVerifError("Code expired. Please resend email.");
  //     return;
  //   }
  //   if (verificationCode === sentCode) {
  //     setVerifStatus("success");
  //     setVerifError(null);
  //     try {
  //       const { newUser, uid } = pendingFirestoreUser;
  //       const userDocRef = doc(db, "users", uid);
  //       const userDocSnap = await getDoc(userDocRef);
  //       if (userDocSnap.exists()) {
  //         setVerifError("A profile already exists for this account.");
  //         setTimeout(() => (window.location.href = "/profile"), 2000);
  //         return;
  //       }
  //       await setDoc(userDocRef, newUser);
  //       if (pendingPlayerDoc) {
  //         const playerDocRef = doc(db, "players", uid);
  //         await setDoc(playerDocRef, pendingPlayerDoc);
  //       }
  //       setTimeout(() => (window.location.href = "/profile"), 1200);
  //     } catch (err) {
  //       setVerifError("Error saving profile. Try again.");
  //     }
  //   } else {
  //     setVerifStatus("failed");
  //     setVerifError("Incorrect code. Please try again.");
  //   }
  // };
  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (!sentCode) return;
  
    if (verifStatus === "expired") {
      setVerifError("Code expired. Please resend email.");
      return;
    }
  
    if (verificationCode !== sentCode) {
      setVerifStatus("failed");
      setVerifError("Incorrect code. Please try again.");
      return;
    }
  
    // Code OK — proceed
    setVerifStatus("success");
    setVerifError(null);
  
    try {
      if (!pendingFirestoreUser) {
        setVerifError("Missing pending signup data. Please restart signup.");
        return;
      }
  
      const {
        email: pendingEmail,
        password: pendingPassword,
        signupMethod,
        role: pendingRole,
        firstName: pendingFirst,
        lastName: pendingLast,
        suburb: pendingSuburb,
        grade: pendingGrade,
      } = pendingFirestoreUser as {
        email: string;
        password: string;      // "" for Google
        signupMethod: "email" | "google";
        role: string;
        firstName: string;
        lastName: string;
        suburb?: string;
        grade?: string;
      };
  
      // 1) Create the Auth user *now* (email flow) OR use existing Google user
      // with this:
const cred = await createUserWithEmailAndPassword(auth, pendingEmail, pendingPassword);
const uid = cred.user.uid;
  
      // 2) Build Firestore user document
      const newUserDoc = {
        ...userBase({
          uid,
          email: pendingEmail,
          firstName: pendingFirst,
          lastName: pendingLast,
          provider: "password",
        }),
        role: pendingRole,
        ...(pendingRole === "player" && { grade: pendingGrade }),
        ...(pendingSuburb ? { suburb: pendingSuburb } : {}),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        onboardingRequired: false,   // email flow is done after verification
      };
      
  
      // Safety: avoid duplicate profiles if user retries
      const userDocRef = doc(db, "users", uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        // Already has a profile — just continue
      } else {
        await setDoc(userDocRef, newUserDoc);
      }
  
      // 3) Write players/{uid} if role=player
      if (pendingRole === "player" && pendingPlayerDoc) {
        const playerDocRef = doc(db, "players", uid);
        const playerSnap = await getDoc(playerDocRef);
        if (!playerSnap.exists()) {
          await setDoc(playerDocRef, { uid, ...pendingPlayerDoc });
        }
      }
  
      // 4) Go to profile
      setFinishMsg("Creating your account…");
setIsFinishing(true);
await sleep(650);

navigate("/profile", { replace: true });
setIsFinishing(false);
setFinishMsg("");
    } catch (err: any) {
      // Common auth errors surfaced here
      if (err.code === "auth/email-already-in-use") {
        setVerifError("This email is already in use with another account.");
      } else if (err.code === "auth/invalid-email") {
        setVerifError("Please enter a valid email address.");
      } else if (err.code === "auth/weak-password") {
        setVerifError("Password should be at least 6 characters.");
      } else {
        setVerifError("Error creating account after verification. Please try again.");
      }
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
                  onClick={() => handleGoogleSignupSimple()}
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
        {showCompleteProfile && (
  <div className="modal-backdrop" style={{
    position: "fixed", inset: 0, background: "#0006",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
  }}>
    <div className="card p-4" style={{ width: 520, borderRadius: 16 }}>
      <h4 style={{ color: "#DF2E38", fontWeight: 800, marginBottom: 12 }}>
        Complete your profile
      </h4>

      <div className="mb-3">
        <label>Email</label>
        <input className="form-control" value={gpEmail} disabled />
      </div>
      <div className="mb-3 d-flex gap-2">
        <div style={{ flex: 1 }}>
          <label>First Name</label>
          <input className="form-control" value={gpFirst} disabled />
        </div>
        <div style={{ flex: 1 }}>
          <label>Last Name</label>
          <input className="form-control" value={gpLast} disabled />
        </div>
      </div>

      <div className="mb-3">
        <label>Role</label>
        <select
          className="form-control"
          value={cpRole}
          onChange={(e) => setCpRole(e.target.value as any)}
        >
          <option value="">Select role</option>
          <option value="player">Player</option>
          <option value="parent">Parent</option>
          <option value="alumni">Alumni</option>
        </select>
      </div>

      {cpRole === "player" && (
        <div className="mb-3">
          <label>Grade</label>
          <select
            className="form-control"
            value={cpGrade}
            onChange={(e) => setCpGrade(e.target.value)}
          >
            <option value="">Select grade</option>
            {GRADE_OPTIONS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      )}

      <div className="mb-3">
        <label>Suburb or Town</label>
        <input
          className="form-control"
          value={cpSuburb}
          onChange={(e) => setCpSuburb(e.target.value)}
          placeholder="e.g. Palatine"
        />
      </div>

      {cpError && (
        <div className="alert alert-danger">{cpError}</div>
      )}

      <div className="d-flex justify-content-end gap-2">
        <button className="btn btn-secondary" onClick={() => setShowCompleteProfile(false)} disabled={cpSaving}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={saveCompletedProfile} disabled={cpSaving}>
          {cpSaving ? "Saving..." : "Save & Continue"}
        </button>
      </div>
    </div>
  </div>
)}
{(cpSaving || isFinishing) && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "#0007",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10000
    }}
  >
    <div
      className="card p-4 text-center"
      style={{ width: 340, borderRadius: 16, background: WHITE }}
    >
      <div className="mb-3">
        <div className="spinner-border" role="status" aria-hidden="true" />
      </div>
      <div style={{ color: BLACK, fontWeight: 600 }}>
        {finishMsg || "Saving…"}
      </div>
      <div style={{ color: GREY, fontSize: 13, marginTop: 6 }}>
        This will only take a moment.
      </div>
    </div>
  </div>
)}

      </div>
    </div>
  );
};

export default SignupPage;
