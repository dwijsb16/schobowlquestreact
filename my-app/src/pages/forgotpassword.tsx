import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../.firebase/utils/firebase";
import { signInWithEmailAndPassword, fetchSignInMethodsForEmail, signInWithCustomToken } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Footer from "../components/footer";

type PasswordStrengthKey = "length" | "upper" | "lower" | "digit" | "hasSpecial";

const passwordRules: { key: PasswordStrengthKey; text: string }[] = [
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

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = new URLSearchParams(location.search).get("token") || "";
  const [verified, setVerified] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const pwStrength = checkPasswordStrength(password);

  useEffect(() => {
    // Step 1: Validate the token from Firestore
    if (!token) {
      setError("Missing or invalid reset code.");
      return;
    }
    (async () => {
      try {
        const tokenDoc = await getDoc(doc(db, "reset_tokens", token));
        if (!tokenDoc.exists()) {
          setError("Invalid or expired reset link.");
          return;
        }
        const { email, expires, used } = tokenDoc.data();
        if (!email || !expires) {
          setError("Invalid reset link data.");
          return;
        }
        if (used) {
          setError("This reset link has already been used.");
          return;
        }
        // --- FIX: compare expires as Timestamp ---
        if (Date.now() > expires.toMillis()) {
          setError("This reset link has expired.");
          return;
        }
        setEmail(email);
        setVerified(true);
      } catch {
        setError("Invalid or expired reset link.");
      }
    })();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (
      !pwStrength.length || !pwStrength.upper ||
      !pwStrength.lower || !pwStrength.digit || !pwStrength.hasSpecial
    ) {
      setError("Password does not meet requirements.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (!methods.length) {
        setError("No user even exists. Please try again later.");
        return;
      }
      setError("Please implement server-side password reset logic here, or use Firebase's email reset flow.");
      // --- If you had a way to sign in the user or use admin SDK, you would do:
      // await updatePassword(user, password);
      // await setDoc(doc(db, "reset_tokens", token), { used: true }, { merge: true });
      // setSuccess(true);
      // setTimeout(() => navigate("/login"), 1500);
    } catch (e) {
      setError("Password reset failed. Please try again.");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "#f8fafc"
    }}>
      <div style={{
        flexGrow: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div className="card shadow-sm p-4"
          style={{
            minWidth: 320,
            maxWidth: 370,
            borderRadius: 18,
            margin: 24
          }}>
          <h3 className="mb-3 text-primary fw-bold text-center">Reset Password</h3>
          {!verified ? (
            <div className="text-danger text-center" style={{fontWeight: 500, fontSize: 16}}>
              {error || "Verifying reset link..."}
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-2">Set new password for <b>{email}</b></div>
              <label className="mb-1 fw-semibold">New Password:</label>
              <input
                type="password" className="form-control mb-2" value={password}
                onChange={e => setPassword(e.target.value)} required minLength={6}
              />
              <label className="mb-1 fw-semibold">Confirm New Password:</label>
              <input
                type="password" className="form-control mb-2" value={confirm}
                onChange={e => setConfirm(e.target.value)} required minLength={6}
              />
              <ul style={{listStyle: "none", padding: 0, marginTop: 12, marginBottom: 8}}>
                {passwordRules.map(rule => (
                  <li key={rule.key} style={{color: pwStrength[rule.key] ? "#48bb78" : "#aaa", display: "flex", alignItems: "center", fontSize: 14}}>
                    <span style={{marginRight: 5, fontWeight: 700, fontSize: 16}}>
                      {pwStrength[rule.key] ? "✓" : "✗"}
                    </span>
                    {rule.text}
                  </li>
                ))}
              </ul>
              {error && <div className="alert alert-danger py-2 mb-2 text-center">{error}</div>}
              {success && <div className="alert alert-success py-2 mb-2 text-center">Done!</div>}
              <button className="btn btn-primary w-100" type="submit" disabled={success}>Set New Password</button>
            </form>
          )}
        </div>
      </div>
      {/* Footer always at bottom */}
      <Footer />
    </div>
  );
  
};

export default ResetPassword;
