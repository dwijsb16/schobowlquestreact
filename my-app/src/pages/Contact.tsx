import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card } from 'react-bootstrap';
import Footer from '../components/footer';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission logic
    console.log('Form submitted:', formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Container fluid className="py-5">
      <Container>
        <h1 className="text-center mb-5">Contact Us</h1>
        
        <Row className="justify-content-center">
          <Col md={6} className="mb-4">
            <Card className="shadow-sm">
              <Card.Body>
                <h2 className="h4 mb-4">Send us a Message</h2>
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Subject</Form.Label>
                    <Form.Control
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Message</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>

                  <Button variant="primary" type="submit">
                    Send Message
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="shadow-sm">
              <Card.Body>
                <h2 className="h4 mb-4">Contact Information</h2>
                
                <div className="mb-4">
                  <h3 className="h6">Address</h3>
                  <p className="mb-0">500 North Benton</p>
                  <p>Palatine, IL 60067</p>
                </div>

                <div className="mb-4">
                  <h3 className="h6">Email</h3>
                  <p className="mb-0">contact@questacademy.org</p>
                </div>

                <div className="mb-4">
                  <h3 className="h6">Phone</h3>
                  <p className="mb-0">(847) 202-8035</p>
                </div>

                <div>
                  <h3 className="h6">Office Hours</h3>
                  <p className="mb-0">Monday - Friday</p>
                  <p>8:00 AM - 4:00 PM</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Footer />
      </Container>
    </Container>
  );
};

export default Contact;