import React, { useState } from "react";
import { Container, Row, Col, Form, Button, Card } from "react-bootstrap";
import Footer from "../components/footer";
import { getDocs, collection, query, where } from "firebase/firestore";
import { db } from "../.firebase/utils/firebase";
import { toast, ToastContainer } from "react-toastify";
import emailjs from "emailjs-com";

const RED = "#DF2E38";
const LIGHT_GREY = "#F7F7F7";
const BLACK = "#232323";

const EMAIL_SERVICE_ID = "service_cfows1h";
const EMAIL_TEMPLATE_ID = "template_mk7qghu";
const EMAIL_USER_ID = "GRAfhbyKXL9qsCDKk";

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  async function fetchCoachEmails(): Promise<string[]> {
    const coachQuery = query(collection(db, "users"), where("role", "==", "coach"));
    const snapshot = await getDocs(coachQuery);
    return snapshot.docs.map(doc => doc.data().email).filter(Boolean);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    let bccEmails: string[] = [];
    try {
      bccEmails = await fetchCoachEmails();
    } catch {
      bccEmails = [];
    }
    const templateParams = {
      subject: formData.subject,
      message: formData.message + `\n\nFrom: ${formData.name} (${formData.email})`,
      to_email: "questsbclub@gmail.com",
      bcc_list: bccEmails.join(","),
      message_type: "CONTACT COACHES MESSAGE",
      from_email: formData.email,
    };

    try {
      await emailjs.send(EMAIL_SERVICE_ID, EMAIL_TEMPLATE_ID, templateParams, EMAIL_USER_ID);
      toast.success("Message sent!", { theme: "colored" });
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch {
      toast.error("Failed to send message. Please try again.", { theme: "colored" });
    }
    setLoading(false);
  }

  return (
    <div style={{ background: LIGHT_GREY, minHeight: "100vh", paddingTop: 24 }}>
      <ToastContainer
        position="top-center"
        autoClose={2800}
        hideProgressBar
        theme="colored"
      />
      <Container style={{ maxWidth: 650 }}>
        <h1
          className="text-center mb-4"
          style={{
            color: RED,
            fontWeight: 900,
            letterSpacing: 2,
            fontSize: "2.6rem",
            marginTop: 18
          }}
        >
          Contact Us
        </h1>
        <p
          className="lead text-center mb-5"
          style={{
            color: BLACK,
            fontWeight: 500,
            fontSize: 20,
            maxWidth: 550,
            margin: "0 auto"
          }}
        >
          Have a question for the Quest Scholastic Bowl Team? Want to get in touch with a coach?  
          <br />
          <b>Fill out the form below and our team will get back to you as soon as possible!</b>
        </p>
        <Row className="justify-content-center">
          <Col md={12} className="mb-4">
            <Card
              className="shadow"
              style={{
                borderRadius: 24,
                border: `2px solid ${RED}`,
                background: "#fff",
              }}
            >
              <Card.Body style={{ padding: "2.4rem 2rem" }}>
                <Form onSubmit={handleSubmit} autoComplete="on">
                  <Form.Group className="mb-4">
                    <Form.Label style={{ color: BLACK, fontWeight: 600 }}>Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      size="lg"
                      style={{ background: LIGHT_GREY, borderRadius: 12 }}
                      autoFocus
                    />
                  </Form.Group>
                  <Form.Group className="mb-4">
                    <Form.Label style={{ color: BLACK, fontWeight: 600 }}>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      size="lg"
                      style={{ background: LIGHT_GREY, borderRadius: 12 }}
                      autoComplete="from_email"
                      inputMode="email"
                    />
                  </Form.Group>
                  <Form.Group className="mb-4">
                    <Form.Label style={{ color: BLACK, fontWeight: 600 }}>Subject</Form.Label>
                    <Form.Control
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      size="lg"
                      style={{ background: LIGHT_GREY, borderRadius: 12 }}
                    />
                  </Form.Group>
                  <Form.Group className="mb-4">
                    <Form.Label style={{ color: BLACK, fontWeight: 600 }}>Message</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={6}
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      style={{
                        background: LIGHT_GREY,
                        borderRadius: 12,
                        fontSize: 17
                      }}
                    />
                  </Form.Group>
                  <Button
                    variant="danger"
                    type="submit"
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "12px 0",
                      fontWeight: 700,
                      fontSize: 20,
                      borderRadius: 12,
                      background: RED,
                      border: "none",
                      boxShadow: "0 2px 10px #df2e381a"
                    }}
                  >
                    {loading ? "Sending..." : "Send Message"}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <div className="mt-5">
          <Footer />
        </div>
      </Container>
      <style>
        {`
          .btn-danger:hover, .btn-danger:focus {
            background: #b71c1c !important;
          }
          .form-control:focus {
            border-color: #df2e38;
            box-shadow: 0 0 0 0.08rem #df2e3844;
          }
        `}
      </style>
    </div>
  );
};

export default Contact;
