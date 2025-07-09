import React, { useState, useEffect } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../.firebase/utils/firebase";
import { useNavigate } from "react-router-dom";
import { addDocument } from "../hooks/firestore"; // Adjust as needed!
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../.firebase/utils/firebase";

const GRADE_OPTIONS = [
  "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"
];

const SignupPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("player");
  const [grade, setGrade] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const navigate = useNavigate();

  // On mount, check auth state
  useEffect(() => {
    setCurrentUser(auth.currentUser);
    // If you want this to be more robust to auth changes, use onAuthStateChanged here
  }, []);

  
const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);

  try {
    let uid: string, signupEmail: string;

    // 1. If already logged in, just use current user
    if (currentUser) {
      uid = currentUser.uid;
      signupEmail = currentUser.email;
    } else {
      // 2. Otherwise, create new Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      uid = userCredential.user.uid;
      signupEmail = userCredential.user.email!;
    }

    // 3. Check if a Firestore user doc with this UID exists
    const userDocRef = doc(db, "users", uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      setError("A profile already exists for this account.");
      alert("You already have a user profile!");
      navigate("/");
      return;
    }

    // 4. Optionally, also check by email (if you want to enforce email uniqueness at the Firestore level)
    // const emailQuery = query(collection(db, "users"), where("email", "==", signupEmail));
    // const emailSnap = await getDocs(emailQuery);
    // if (!emailSnap.empty) {
    //   setError("A profile with this email already exists.");
    //   return;
    // }

    // 5. Build user object for Firestore
    const newUser = {
      uid,
      email: signupEmail,
      firstName,
      lastName,
      role,
      ...(role === "player" && { grade }),
    };

    // 6. Add to Firestore using the user's UID as the doc ID
    await setDoc(userDocRef, newUser);

    alert("Signup/Profile successful!");
    navigate("/");
  } catch (err: any) {
    console.error("Signup failed:", err);
    if (err.code === "auth/email-already-in-use") {
      setError("This email is already in use with another account.");
    } else {
      setError("An unexpected error occurred. Please try again.");
    }
  }
};


  return (
    <div className="container">
      <h2 className="text-center mt-4">{currentUser ? "Complete Your Profile" : "Create an Account"}</h2>
      <form onSubmit={handleSignup} className="mt-3">
        {currentUser ? (
          <div className="form-group">
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
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </>
        )}

        <div className="form-group">
          <label>First Name</label>
          <input
            type="text"
            className="form-control"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Last Name</label>
          <input
            type="text"
            className="form-control"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Role</label>
          <select
            className="form-control"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          >
            <option value="player">Player</option>
            <option value="coach">Coach</option>
            <option value="parent">Parent</option>
          </select>
        </div>
        {role === "player" && (
          <div className="form-group">
            <label>Grade</label>
            <select
              className="form-control"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
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
        <button className="btn btn-primary mt-3">
          {currentUser ? "Save Profile" : "Sign Up"}
        </button>
      </form>
    </div>
  );
};

export default SignupPage;
