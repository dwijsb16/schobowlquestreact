import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import Footer from '../components/footer';

const About: React.FC = () => {
  const teamMembers = [
    {
      name: 'Lisa Groh',
      role: 'Head Coach',
      description: 'Leading our team since 1999'
    },
    {
      name: 'Satish Bhatt',
      role: 'Assistant Coach',
      description: 'Specializing in history and literature'
    },
    {
      name: 'Amy Byrne',
      role: 'Assistant Coach',
      description: 'Specializing in history and literature'
    }
  ];

  return (
    <Container fluid className="py-5">
      <Container>
        <Row className="mb-5">
          <Col>
            <h1 className="text-center mb-4">About Our Scholastic Bowl Club</h1>
            <p className="lead text-center">
              Welcome to Quest Academy's Scholastic Bowl Club, where knowledge meets competition!
            </p>
          </Col>
        </Row>

        <Row className="mb-5">
          <Col md={8} className="mx-auto">
            <Card className="shadow-sm">
              <Card.Body>
                <h2 className="h4 mb-3">Our Mission</h2>
                <p>
                  We strive to foster academic excellence through competitive quiz bowl competitions,
                  promoting critical thinking, quick recall, and teamwork among our students.
                </p>
                <p>
                  Our club participates in various regional and national tournaments, providing
                  students with opportunities to showcase their knowledge and compete with peers
                  from other schools.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          {teamMembers.map((member, index) => (
            <Col key={index} md={6} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <Card.Title>{member.name}</Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">{member.role}</Card.Subtitle>
                  <Card.Text>{member.description}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        <Footer />
      </Container>
    </Container>
  );
};

export default About;