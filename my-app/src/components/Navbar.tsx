import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Navigation = () => {
  return (
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
            <Nav.Link as={Link} to="/login">Login</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;