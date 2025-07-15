import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import Footer from '../components/footer';

const About: React.FC = () => {
  const teamMembers = [
    { name: 'Lisa Groh', role: 'Head Coach', description: 'Leading our team since 1999' },
    { name: 'Satish Bhatt', role: 'Assistant Coach', description: 'Specializing in history and literature' },
    { name: 'Amy Byrne', role: 'Assistant Coach', description: 'Specializing in history and literature' },
    { name: 'Vikram smth', role: 'Assistant Coach', description: 'Specializing in history and literature' }
  ];

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "#fff9fa" // warm, soft background
    }}>
      <Container fluid className="flex-grow-1 py-5">
        {/* HEADER ROW */}
        <Row className="mb-5 justify-content-center">
          <Col xs={12}>
            <h1
              className="text-center mb-3"
              style={{
                fontWeight: 900,
                letterSpacing: 1.2,
                color: "#DF2E38", // Main red
                textShadow: "0 2px 10px #DF2E3812"
              }}
            >
              About Our Scholastic Bowl Club
            </h1>
            <p
              className="lead text-center"
              style={{
                fontSize: 26,
                color: "#b12c1b", // slightly deeper, friendlier red
                fontWeight: 600,
                marginBottom: 0,
                letterSpacing: 0.1,
                textShadow: "0 1px 0 #fff"
              }}
            >
              Welcome to Quest Academy's Scholastic Bowl Club, where knowledge meets competition!
            </p>
          </Col>
        </Row>

        {/* MISSION ROW */}
        <Row className="mb-5 justify-content-center">
          <Col lg={10} md={11} xs={12}>
            <Card
              className="shadow-sm border-0"
              style={{
                borderRadius: 40,
                background: "#fff",
                borderLeft: "14px solid #DF2E38",
                padding: "36px 38px",
                minHeight: 200,
                boxShadow: "0 8px 36px #DF2E3812"
              }}
            >
              <Card.Body>
                <h2
                  className="h3 mb-4"
                  style={{ color: "#DF2E38", fontWeight: 800, fontSize: 32 }}
                >
                  Our Mission
                </h2>
                <p style={{ fontWeight: 600, color: "#3d2323", fontSize: 20 }}>
                  We strive to foster academic excellence through competitive quiz bowl competitions,
                  promoting critical thinking, quick recall, and teamwork among our students.
                </p>
                <p style={{ fontWeight: 500, color: "#3d2323", fontSize: 18 }}>
                  Our club participates in various regional and national tournaments, providing
                  students with opportunities to showcase their knowledge and compete with peers
                  from other schools.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* TEAM MEMBERS ROW */}
        <Row className="g-4 justify-content-center">
          {teamMembers.map((member, index) => (
            <Col key={index} xs={12} sm={8} md={6} lg={4} xl={3}>
              <Card
                className="h-100 shadow-sm border-0"
                style={{
                  borderRadius: 30,
                  background: "#fff",
                  borderTop: "7px solid #DF2E38",
                  boxShadow: "0 6px 30px #df2e3822",
                  minHeight: 180,
                  marginBottom: 14,
                  padding: "28px 18px"
                }}
              >
                <Card.Body className="d-flex flex-column justify-content-center align-items-center py-4">
                  <Card.Title
                    style={{
                      color: "#DF2E38",
                      fontWeight: 800,
                      fontSize: 24,
                      textAlign: "center"
                    }}
                  >
                    {member.name}
                  </Card.Title>
                  <Card.Subtitle className="mb-3" style={{ color: "#df2e38", fontWeight: 700, fontSize: 18, textAlign: "center" }}>
                    {member.role}
                  </Card.Subtitle>
                  <Card.Text style={{ color: "#333", fontSize: 17, textAlign: "center", fontWeight: 500 }}>
                    {member.description}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      {/* Sticky Footer */}
      <div style={{ flexShrink: 0 }}>
        <Footer />
      </div>
    </div>
  );
};

export default About;
