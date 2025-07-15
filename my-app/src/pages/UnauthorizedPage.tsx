import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/footer';

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  // SVG lock icon (big and red)
  const LockSVG = (
    <svg width="115" height="115" viewBox="0 0 115 115" fill="none">
      <circle cx="57.5" cy="57.5" r="57.5" fill="#DF2E38" fillOpacity="0.12" />
      <rect x="29" y="53" width="56" height="38" rx="12" fill="#DF2E38" />
      <rect x="41.5" y="38" width="32" height="23" rx="12" fill="#fff" stroke="#DF2E38" strokeWidth="4"/>
      <circle cx="57.5" cy="72.5" r="6.5" fill="#fff" stroke="#fff" strokeWidth="2"/>
      <rect x="55" y="72" width="5" height="10" rx="2.5" fill="#fff" />
    </svg>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: "#fff9fa" }}>
      <Container className="flex-grow-1 d-flex flex-column justify-content-center align-items-center">
        <Row className="w-100 justify-content-center">
          <Col xs={12} md={10} lg={8} xl={6} className="text-center">
            <div className="mb-4" style={{ width: 130, margin: "0 auto" }}>
              {LockSVG}
            </div>

            <div
              className="mb-4 px-4 py-3"
              style={{
                display: "inline-block",
                background: "#DF2E38",
                color: "#fff",
                borderRadius: 22,
                boxShadow: "0 2px 24px #df2e3824",
                fontWeight: 700,
                fontSize: 24,
                letterSpacing: ".02em"
              }}
            >
              Access Denied
            </div>
            <div className="mb-4" style={{ color: "#B92D2B", fontWeight: 500, fontSize: 19 }}>
              You don&apos;t have permission to access this page.<br />
              This area may be restricted to specific user roles.
            </div>

            <div className="d-grid gap-3 d-md-flex justify-content-md-center mb-5">
              <button
                style={{
                  background: "linear-gradient(90deg, #DF2E38 70%, #b71c1c 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 16,
                  padding: "12px 34px",
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: ".04em",
                  boxShadow: "0 2px 12px #df2e3818"
                }}
                onClick={() => navigate('/')}
                className="me-md-3"
              >
                Return to Home
              </button>
              <button
                style={{
                  background: "#fff",
                  color: "#DF2E38",
                  border: "2.5px solid #DF2E38",
                  borderRadius: 16,
                  padding: "12px 34px",
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: ".04em",
                  boxShadow: "0 2px 12px #df2e3810"
                }}
                onClick={() => navigate(-1)}
              >
                Go Back
              </button>
            </div>
          </Col>
        </Row>
      </Container>
      <div style={{ flexShrink: 0 }}>
        <Footer />
      </div>
    </div>
  );
};

export default UnauthorizedPage;
