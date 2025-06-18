import React from 'react';
import { Container, Row, Col, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/footer';

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container fluid className="py-5">
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={6} className="text-center">
            <img
              src="/images/unauthorized.png"
              alt="Unauthorized Access"
              className="img-fluid mb-4"
              style={{ maxWidth: '200px' }}
            />
            
            <Alert variant="danger" className="mb-4">
              <Alert.Heading>Access Denied</Alert.Heading>
              <p className="mb-0">
                You don't have permission to access this page. This area might be restricted to specific user roles.
              </p>
            </Alert>

            <div className="d-grid gap-2 d-md-flex justify-content-md-center">
              <Button 
                variant="primary" 
                onClick={() => navigate('/')}
                className="me-md-2"
              >
                Return to Home
              </Button>
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate(-1)}
              >
                Go Back
              </Button>
            </div>
          </Col>
        </Row>

        <Footer />
      </Container>
    </Container>
  );
};

export default UnauthorizedPage;