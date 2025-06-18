import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/footer";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../.firebase/utils/firebase";
import { ToastContainer, toast } from "react-toastify";
import { addDocument } from "../hooks/firestore";
import "react-toastify/dist/ReactToastify.css";
import { User } from "../types/user";
import { Player } from "../types/player";

const SignUpInfo: React.FC = () => {
  const [fname, setFirstName] = useState("");
  const [lname, setLastName] = useState("");
  const [role, setRole] = useState("");
  const [grade, setGrade] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      const userData: User = {
        uid,
        firstName: fname,
        lastName: lname,
        email,
        role: role as User["role"],
        ...(role === "player" && { grade }),
      };

      await addDocument("users", userData);

      if (role === "player") {
        const playerData: Player = {
          uid,
          firstName: fname,
          lastName: lname,
          email,
          role: "player",
          grade,
          linkedUsers: [uid],
        };
        await addDocument("players", playerData);
      }

      toast.success("Account created successfully! ✅", {
        autoClose: 2000,
        onClose: () => navigate("/profile"),
      });

    } catch (error: any) {
      console.error("Sign-up failed:", error);
      const message = firebaseErrorParser(error);
      toast.error(message);
    }
  };

  const firebaseErrorParser = (error: any) => {
    if (error.code) {
      switch (error.code) {
        case "auth/email-already-in-use":
          return "This email is already in use.";
        case "auth/invalid-email":
          return "Please enter a valid email address.";
        case "auth/weak-password":
          return "Password should be at least 6 characters.";
        default:
          return "An unexpected error occurred. Please try again.";
      }
    }
    return "An unknown error occurred.";
  };

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: "90px" }}>
        <h1 className="text-center">Sign Up</h1>
        <form onSubmit={handleSubmit} className="mt-4">

          {/* Name Input */}
          <div className="form-group">
            <label htmlFor="first">First Name</label>
            <input type="text" className="form-control" id="first" placeholder="Enter your first name"
              value={fname} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="last">Last Name</label>
            <input type="text" className="form-control" id="last" placeholder="Enter your last name"
              value={lname} onChange={(e) => setLastName(e.target.value)} required />
          </div>

          {/* Email Input */}
          <div className="form-group mt-3">
            <label htmlFor="email">Email address</label>
            <input type="email" className="form-control" id="email" placeholder="Enter email"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          {/* Password Input */}
          <div className="form-group mt-3">
            <label htmlFor="password">Password</label>
            <input type="password" className="form-control" id="password" placeholder="Password"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          {/* Role Selection */}
          <div className="form-group mt-3">
            <label>Role</label>
            <div className="form-check">
              <input className="form-check-input" type="radio" name="role" id="player" value="player"
                onChange={(e) => setRole(e.target.value)} required />
              <label className="form-check-label" htmlFor="player">Player</label>
            </div>
            <div className="form-check">
              <input className="form-check-input" type="radio" name="role" id="parent" value="parent"
                onChange={(e) => setRole(e.target.value)} required />
              <label className="form-check-label" htmlFor="parent">Parent</label>
            </div>
            <div className="form-check">
              <input className="form-check-input" type="radio" name="role" id="coach" value="coach"
                onChange={(e) => setRole(e.target.value)} required />
              <label className="form-check-label" htmlFor="coach">Coach</label>
            </div>
          </div>

          {/* Grade Dropdown (only for players) */}
          {role === "player" && (
            <div className="form-group mt-3">
              <label htmlFor="grade">Grade</label>
              <select className="form-control" id="grade" value={grade} onChange={(e) => setGrade(e.target.value)} required>
                <option value="" disabled>Select your grade</option>
                <option value="5">5th Grade</option>
                <option value="6">6th Grade</option>
                <option value="7">7th Grade</option>
                <option value="8">8th Grade</option>
              </select>
            </div>
          )}

          {/* Submit Button */}
          <div className="text-center mt-4">
            <button type="submit" className="btn btn-primary">Create Account</button>
          </div>

        </form>
        <ToastContainer />
      </div>
      <Footer />
    </>
  );
};

export default SignUpInfo;
