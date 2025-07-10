import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../.firebase/utils/firebase';
import { ToastContainer, toast } from "react-toastify";
import { getDoc, doc as firestoreDoc } from "firebase/firestore";
import { useLocation } from "react-router-dom";
import { db } from "../.firebase/utils/firebase";
import 'react-toastify/dist/ReactToastify.css';


const Navigation = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState<string | null>(null);

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoggedIn(!!user);
      if (user) {
        // Fetch the user's role from Firestore
        const userDoc = await getDoc(firestoreDoc(db, "users", user.uid));
        setUserRole(userDoc.exists() ? userDoc.data().role : null);
      } else {
        setUserRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully! ✅", { 
        autoClose: 2000, 
        onClose: () => navigate('/')
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error("Error signing out. Please try again.");
    }
  };

  return (
    <>
  <Navbar
    fixed="top"
    expand="lg"
    style={{
      background: "linear-gradient(90deg,#2a5298 0,#1e3c72 100%)",
      boxShadow: "0 2px 14px rgba(46,85,136,0.15)",
      borderRadius: "0 0 18px 18px",
      zIndex: 1020
    }}
    variant="dark"
    className="py-2"
  >
    <Container>
      <Navbar.Brand as={Link} to="/" style={{paddingRight:16}}>
        <img
          src="/images/quest-academy-logo.png"
          alt="Quest Academy Logo"
          width="175"
          height="54"
          className="img-fluid"
          style={{ filter: "drop-shadow(0 2px 8px #21325b77)" }}
        />
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="navbarSupportedContent1" />
      <Navbar.Collapse id="navbarSupportedContent1">
        <Nav className="ms-auto align-items-center" style={{ gap: "12px" }}>
          {[
            { to: "/about", label: "About" },
            { to: "/calendar", label: "Calendar" },
            { to: "/resources", label: "Resources" },
            { to: "/contact", label: "Contact" },
          ].map(link => (
            <Nav.Link
              key={link.to}
              as={Link}
              to={link.to}
              active={location.pathname === link.to}
              style={{
                fontWeight: 500,
                color: location.pathname === link.to ? "#FFD93D" : "#fff",
                borderRadius: 8,
                background: location.pathname === link.to ? "#21325b" : "transparent",
                padding: "7px 20px",
                transition: "all .2s"
              }}
            >
              {link.label}
            </Nav.Link>
          ))}

          {/* Only show "Coaches" if userRole is 'coach' */}
          {(userRole === "coach") && (
            <Nav.Link
              as={Link}
              to="/coaches"
              active={location.pathname === "/coaches"}
              style={{
                fontWeight: 600,
                color: location.pathname === "/coaches" ? "#FFD93D" : "#fff",
                background: location.pathname === "/coaches" ? "#215D52" : "#278a7c80",
                borderRadius: 8,
                padding: "7px 20px"
              }}
            >
              Coaches
            </Nav.Link>
          )}

          {isLoggedIn ? (
            <>
              <Nav.Link
                as={Link}
                to="/profile"
                active={location.pathname === "/profile"}
                style={{
                  fontWeight: 500,
                  color: location.pathname === "/profile" ? "#FFD93D" : "#fff",
                  borderRadius: 8,
                  background: location.pathname === "/profile" ? "#21325b" : "transparent",
                  padding: "7px 20px"
                }}
              >
                Profile
              </Nav.Link>
              <Nav.Link
                onClick={handleLogout}
                style={{
                  fontWeight: 500,
                  color: "#FF6B6B",
                  borderRadius: 8,
                  background: "#fff2f2",
                  padding: "7px 20px"
                }}
              >
                Sign Out
              </Nav.Link>
            </>
          ) : (
            <Nav.Link
              as={Link}
              to="/login"
              active={location.pathname === "/login"}
              style={{
                fontWeight: 500,
                color: location.pathname === "/login" ? "#FFD93D" : "#fff",
                borderRadius: 8,
                background: location.pathname === "/login" ? "#21325b" : "transparent",
                padding: "7px 20px"
              }}
            >
              Login
            </Nav.Link>
          )}
        </Nav>
      </Navbar.Collapse>
    </Container>
  </Navbar>
  <ToastContainer />
</>

  );
};

export default Navigation;
