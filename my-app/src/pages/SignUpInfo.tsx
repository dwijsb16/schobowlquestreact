import React, { useState, useEffect } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../.firebase/utils/firebase";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../.firebase/utils/firebase";
import { Eye, EyeOff } from "lucide-react";

const GRADE_OPTIONS = [
  "5th", "6th", "7th", "8th"
];

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

const SignupPage: React.FC = () => {
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

  const navigate = useNavigate();

  // Email pattern validation
  useEffect(() => {
    if (!email) setEmailValid(true);
    else setEmailValid(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  }, [email]);

  // On mount, check auth state
  useEffect(() => {
    setCurrentUser(auth.currentUser);
  }, []);

  const pwStrength = checkPasswordStrength(password);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Pre-validation
    if (!emailValid) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!currentUser) {
      // Only validate password if not already logged in
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
    }

    try {
      let uid: string, signupEmail: string;

      if (currentUser) {
        uid = currentUser.uid;
        signupEmail = currentUser.email;
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        uid = userCredential.user.uid;
        signupEmail = userCredential.user.email!;
      }

      // Check if Firestore user doc with this UID exists
      const userDocRef = doc(db, "users", uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        setError("A profile already exists for this account.");
        alert("You already have a user profile!");
        window.location.href = "/profile";
        return;
      }

      const newUser = {
        uid,
        email: signupEmail,
        firstName,
        lastName,
        role,
        ...(role === "player" && { grade }),
      };

      await setDoc(userDocRef, newUser);

      // Force reload to update AuthContext!
      window.location.href = "/profile";
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

  return (
    <div className="container">
      <div className="row justify-content-center mt-5 mb-5">
        <div className="col-md-7 col-lg-6">
          <div className="card shadow-lg p-4" style={{ borderRadius: 18 }}>
            <h2 className="text-center mb-4" style={{ color: "#0058c9", fontWeight: 700 }}>
              {currentUser ? "Complete Your Profile" : "Create an Account"}
            </h2>
            <form onSubmit={handleSignup}>
              {currentUser ? (
                <div className="form-group mb-3">
                  <label>Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={currentUser.email}
                    readOnly
                    disabled
                  />
                  <small className="form-text text-muted">You are signed in as {currentUser.email}</small>
                </div>
              ) : (
                <>
                  <div className="form-group mb-3">
                    <label>Email</label>
                    <input
                      type="email"
                      className={`form-control ${!emailValid ? "is-invalid" : ""}`}
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoComplete="username"
                    />
                    {!emailValid && (
                      <div className="invalid-feedback">
                        Please enter a valid email address.
                      </div>
                    )}
                  </div>
                  <div className="form-group mb-3" style={{ position: "relative" }}>
                    <label>Password</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      className={`form-control ${error && password ? "is-invalid" : ""}`}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      style={{ paddingRight: 40 }}
                    />
                    {/* Eye icon absolutely positioned */}
                    <button
                      type="button"
                      onClick={() => setShowPassword(s => !s)}
                      style={{
                        position: "absolute",
                        right: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        border: "none",
                        background: "none",
                        padding: 0,
                        margin: 0,
                        cursor: "pointer",
                        zIndex: 2
                      }}
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                    </button>
                    <ul className="mt-2 mb-0 pl-4" style={{ fontSize: 13, color: "#777" }}>
                      {passwordRules.map((rule) => (
                        <li key={rule.key} style={{
                          color: pwStrength[rule.key as keyof typeof pwStrength] ? "#51c775" : "#aaa"
                        }}>
                          {rule.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              <div className="form-group mb-3">
                <label>First Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  required
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
                />
              </div>
              <div className="form-group mb-3">
                <label>Role</label>
                <select
                  className="form-control"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  required
                >
                  <option value="player">Player</option>
                  <option value="coach">Coach</option>
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
                  >
                    <option value="">Select grade</option>
                    {GRADE_OPTIONS.map((g) => (
                      <option value={g} key={g}>{g}</option>
                    ))}
                  </select>
                </div>
              )}
              {error && <div className="alert alert-danger mt-2">{error}</div>}
              <button className="btn btn-primary mt-3 w-100" type="submit">
                {currentUser ? "Save Profile" : "Sign Up"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
