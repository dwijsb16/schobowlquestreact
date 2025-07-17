import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../.firebase/utils/firebase';
import { ToastContainer, toast } from "react-toastify";
import { getDoc, doc as firestoreDoc } from "firebase/firestore";
import { db } from "../.firebase/utils/firebase";
import 'react-toastify/dist/ReactToastify.css';

// Color palette
const RED = "#DF2E38";
const DARK_RED = "#B71C1C";
const WHITE = "#fff";
const BLACK = "#212121";
const LIGHT_GREY = "#f7f7f7";
const GREY = "#858585";

const Navigation = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    setIsLoggedIn(!!user);
    if (user) {
      const userDoc = await getDoc(firestoreDoc(db, "users", user.uid));
      setUserRole(userDoc.exists() ? userDoc.data().role : null);
    } else {
      setUserRole(null);
    }
    setAuthChecked(true); // Done checking!
  });
  return () => unsubscribe();
}, []);

if (!authChecked) {
  return null; // Or a spinner
}


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
          background: WHITE,
          boxShadow: "0 2px 18px #ebebeb",
          borderRadius: "0 0 18px 18px",
          zIndex: 1020,
          borderBottom: `3px solid ${RED}`,
        }}
        variant="light"
        className="py-2"
      >
        <Container>
          <Navbar.Brand as={Link} to="/" style={{ paddingRight: 16 }}>
            <img
              src="/images/quest-academy-logo.png"
              alt="Quest Academy Logo"
              width="170"
              height="48"
              className="img-fluid"
              style={{
                filter: `drop-shadow(0 2px 8px #DF2E3822)`
              }}
            />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="navbarSupportedContent1" />
          <Navbar.Collapse id="navbarSupportedContent1">
            <Nav className="ms-auto align-items-center" style={{ gap: "12px" }}>
              {[
                { to: "/about", label: "About" },
                { to: "/resources", label: "Resources" },
                { to: "/contact", label: "Contact" },
              ].map(link => (
                <Nav.Link
                  key={link.to}
                  as={Link}
                  to={link.to}
                  active={location.pathname === link.to}
                  style={{
                    fontWeight: 600,
                    color: location.pathname === link.to ? WHITE : BLACK,
                    background: location.pathname === link.to ? RED : WHITE,
                    borderRadius: 9,
                    padding: "9px 22px",
                    border: location.pathname === link.to
                      ? `2.5px solid ${RED}`
                      : `2.5px solid transparent`,
                  }}
                  className="nav-link-hover"
                >
                  {link.label}
                </Nav.Link>
              ))}

              {isLoggedIn && (
                <Nav.Link
                  key="/calendar"
                  as={Link}
                  to="/calendar"
                  active={location.pathname === "/calendar"}
                  style={{
                    fontWeight: 600,
                    color: location.pathname === "/calendar" ? WHITE : BLACK,
                    background: location.pathname === "/calendar" ? RED : WHITE,
                    borderRadius: 9,
                    padding: "9px 22px",
                    border: location.pathname === "/calendar"
                      ? `2.5px solid ${RED}`
                      : `2.5px solid transparent`,
                  }}
                  className="nav-link-hover"
                >
                  Calendar
                </Nav.Link>
              )}

              {(userRole === "coach") && (
                <Nav.Link
                  as={Link}
                  to="/coaches"
                  active={location.pathname === "/coaches"}
                  style={{
                    fontWeight: 600,
                    color: location.pathname === "/calendar" ? WHITE : BLACK,
                    background: location.pathname === "/calendar" ? RED : WHITE,
                    borderRadius: 9,
                    padding: "9px 22px",
                    border: location.pathname === "/calendar"
                      ? `2.5px solid ${RED}`
                      : `2.5px solid transparent`,
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
                      fontWeight: 600,
                      color: location.pathname === "/profile" ? WHITE : BLACK,
                      background: location.pathname === "/profile" ? RED : WHITE,
                      borderRadius: 9,
                      padding: "9px 22px",
                      border: location.pathname === "/profile"
                        ? `2.5px solid ${RED}`
                        : `2.5px solid transparent`,
                    }}
                  >
                    Profile
                  </Nav.Link>
                  <Nav.Link
                    onClick={handleLogout}
                    style={{
                      fontWeight: 600,
                      color: location.pathname === "/calendar" ? WHITE : BLACK,
                      background: location.pathname === "/calendar" ? RED : WHITE,
                      borderRadius: 9,
                      padding: "9px 22px",
                      border: location.pathname === "/calendar"
                        ? `2.5px solid ${RED}`
                        : `2.5px solid transparent`,
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
                    fontWeight: 700,
                    color: location.pathname === "/login" ? WHITE : BLACK,
                    background: location.pathname === "/login" ? RED : WHITE,
                    borderRadius: 9,
                    padding: "9px 22px",
                    border: location.pathname === "/login"
                      ? `2.5px solid ${RED}`
                      : `2.5px solid transparent`,
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
      <style>
        {`
          .nav-link-hover:hover {
            background: #DF2E38 !important;
            color: #fff !important;
            border: 2.5px solid #DF2E38 !important;
            transition: all 0.13s;
          }
        `}
      </style>
    </>
  );
};

export default Navigation;
