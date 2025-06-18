import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../.firebase/utils/firebase';
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const Navigation = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
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
      <Navbar fixed="top" expand="lg" bg="light" className="navbar-light">
        <Container>
          <Navbar.Brand as={Link} to="/">
            <img
              src="/images/quest-academy-logo.png"
              alt="Quest Academy Logo"
              width="200"
              height="61"
              className="img-fluid"
            />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="navbarSupportedContent1" />
          <Navbar.Collapse id="navbarSupportedContent1">
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/about">About</Nav.Link>
              <Nav.Link as={Link} to="/calendar">Calendar</Nav.Link>
              <Nav.Link as={Link} to="/resources">Resources</Nav.Link>
              <Nav.Link as={Link} to="/contact">Contact</Nav.Link>
              <Nav.Link as={Link} to="/coaches">Coaches</Nav.Link>
              {isLoggedIn ? (
                  <>
                <Nav.Link as={Link} to="/profile">Profile</Nav.Link>
                <Nav.Link onClick={handleLogout}>Sign Out</Nav.Link>
                  </>
                  ) : (
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                  )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Toast container only for sign-out feedback */}
      <ToastContainer />
    </>
  );
};

export default Navigation;
