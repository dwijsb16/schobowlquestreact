import { useEffect, useRef } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../.firebase/utils/firebase";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// Set your timeout in milliseconds (30 mins = 1800000 ms)
const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes

export function useAutoLogout() {
  const navigate = useNavigate();
  const timer = useRef<NodeJS.Timeout | null>(null);

  // Reset timer whenever user is active
  const resetTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await signOut(auth);
      } catch {}
      toast.info("Session expired. Please log in again.", { autoClose: 2500 });
      navigate("/login");
    }, INACTIVITY_LIMIT);
  };

  useEffect(() => {
    // Activity events
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];

    events.forEach(event =>
      window.addEventListener(event, resetTimer)
    );
    resetTimer(); // Start timer on mount

    return () => {
      if (timer.current) clearTimeout(timer.current);
      events.forEach(event =>
        window.removeEventListener(event, resetTimer)
      );
    };
    // Dependencies intentionally omitted for useNavigate
    // eslint-disable-next-line
  }, []);
}
