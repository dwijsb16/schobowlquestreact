import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import Footer from '../components/footer';

const RED = "#DF2E38";
const SOFT_BG = "#fff";

const teamMembers = [
  { name: 'Lisa Groh', role: 'Head Coach', description: 'Leading our team since 2009' },
  { name: 'Satish Bhatt', role: 'Assistant Coach', description: 'Specializing in history and literature' },
  { name: 'Amy Byrne', role: 'Assistant Coach', description: 'Specializing in science and arts' },
  { name: 'Vikram Manivasagam', role: 'Assistant Coach', description: 'Math and pop culture enthusiast' }
];

const About: React.FC = () => {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: SOFT_BG
    }}>
      <Container fluid className="flex-grow-1 py-4">
        {/* Page Title */}
        <Row className="mb-2 justify-content-center">
          <Col xs={12}>
            <h1
              className="text-center"
              style={{
                fontWeight: 900,
                letterSpacing: 1.5,
                color: "#232323",
                fontSize: 46,
                marginBottom: 18,
                marginTop: 12,
                lineHeight: 1.11,
              }}
            >
              About Our Scholastic Bowl Team
            </h1>
          </Col>
        </Row>

        {/* Mission */}
        <Row className="justify-content-center mb-4">
          <Col xs={12} md={10}>
            <Card
              className="shadow-sm border-0 mb-2"
              style={{
                borderRadius: 30,
                background: "#fff",
                borderLeft: `8px solid ${RED}`,
                padding: "18px 26px",
                boxShadow: "0 4px 24px #DF2E3812"
              }}
            >
              <Card.Body>
                <h2 className="h5 mb-2" style={{ color: RED, fontWeight: 900, fontSize: 25, letterSpacing: 0.5 }}>
                  Our Mission
                </h2>
                <p style={{ fontWeight: 600, color: "#3d2323", fontSize: 17, marginBottom: 0 }}>
                  We strive to foster academic excellence through quiz bowl competitions, promoting critical thinking, quick recall, and teamwork among our students.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* What is Scholastic Bowl */}
        <Row className="justify-content-center mb-4">
          <Col xs={12} md={10} lg={8}>
            <Card
              className="shadow-sm border-0"
              style={{
                borderRadius: 24,
                background: "#fff",
                borderTop: `6px solid ${RED}`,
                padding: "24px 26px",
                boxShadow: "0 4px 20px #df2e3810"
              }}
            >
              <Card.Body>
                <h2 className="h5 mb-2" style={{ color: RED, fontWeight: 900 }}>
                  What is Scholastic Bowl?
                </h2>
                <p style={{ color: "#232323", fontWeight: 500, fontSize: 16, marginBottom: 0 }}>
                Scholastic Bowl is a fast-paced academic quiz competition where teams of 4-5 students answer questions on a variety of subjects; science, history, geography, literature, math, fine arts, mythology, pop culture, technology, sports, home economics, the bible and more!  Players buzz in for toss-up questions, collaborate with teammates on bonus parts, and compete with other middle schools at both local and national levels.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* What formats do we play? */}
        <Row className="justify-content-center mb-5">
          <Col xs={12} md={10} lg={8}>
            <Card
              className="shadow-sm border-0"
              style={{
                borderRadius: 24,
                background: "#fff",
                borderTop: `6px solid ${RED}`,
                padding: "24px 26px",
                boxShadow: "0 4px 20px #df2e3810"
              }}
            >
              <Card.Body>
                <h2 className="h5 mb-2" style={{ color: RED, fontWeight: 900 }}>
                  What Formats Do We Play?
                </h2>
                <div style={{ marginLeft: 10 }}>
                  <ul style={{ fontSize: 15.5, fontWeight: 500, color: "#232323", marginBottom: 0 }}>
                    <li>
                      <b>NAQT</b> — National Academic Quiz Tournaments. Tossup/bonus questions, fast buzzing, and pyramidal clues.
                    </li>
                    <li>
                      <b>IESA</b> — Illinois Elementary School Association. Our official state format, played with local schools across Illinois.
                    </li>
                    <li>
                      <b>NAC</b> — Quiz Bowl National Championship (More info coming soon!)
                    </li>
                  </ul>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Coaches Section */}
        <Row className="justify-content-center mb-4">
          <Col xs={12} md={10}>
            <h2 className="h4 mb-3 text-center" style={{ color: RED, fontWeight: 800 }}>
              Meet Our Coaches
            </h2>
            <Row className="g-4 justify-content-center">
              {teamMembers.map((member, idx) => (
                <Col key={idx} xs={12} sm={8} md={6} lg={4} xl={3}>
                  <Card
                    className="h-100 shadow-sm border-0"
                    style={{
                      borderRadius: 22,
                      background: "#fff",
                      borderTop: `5px solid ${RED}`,
                      boxShadow: "0 3px 18px #df2e3822",
                      minHeight: 160,
                      marginBottom: 6,
                      padding: "20px 10px"
                    }}
                  >
                    <Card.Body className="d-flex flex-column justify-content-center align-items-center py-3">
                      <Card.Title
                        style={{
                          color: RED,
                          fontWeight: 800,
                          fontSize: 20,
                          textAlign: "center"
                        }}
                      >
                        {member.name}
                      </Card.Title>
                      <Card.Subtitle className="mb-2" style={{ color: "#df2e38", fontWeight: 700, fontSize: 15, textAlign: "center" }}>
                        {member.role}
                      </Card.Subtitle>
                      <Card.Text style={{ color: "#333", fontSize: 15, textAlign: "center", fontWeight: 500 }}>
                        {member.description}
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </Container>
      <div style={{ flexShrink: 0 }}>
        <Footer />
      </div>
    </div>
  );
};

export default About;
