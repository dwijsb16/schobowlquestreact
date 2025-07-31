// SignupToggle.jsx
import React from "react";
interface SignupToggleProps {
  signupMode: "player" | "coach";
  setSignupMode: (mode: "player" | "coach") => void;
  isCoach: boolean;
}

export default function SignupToggle({ signupMode, setSignupMode, isCoach }: SignupToggleProps) {
  return (
    <div className="mb-4 d-flex gap-3 justify-content-center">
      <button
        className={`btn ${signupMode === "player" ? "btn-danger" : "btn-outline-danger"}`}
        style={{ borderRadius: 13, fontWeight: 700, minWidth: 140 }}
        onClick={() => setSignupMode("player")}
      >
        PLAYER SIGNUP
      </button>
      {isCoach && (
        <button
          className={`btn ${signupMode === "coach" ? "btn-primary" : "btn-outline-primary"}`}
          style={{ borderRadius: 13, fontWeight: 700, minWidth: 140 }}
          onClick={() => setSignupMode("coach")}
        >
          COACH SIGNUP
        </button>
      )}
    </div>
  );
}
