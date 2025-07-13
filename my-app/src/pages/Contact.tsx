import React, { useState } from "react";
import { Container, Row, Col, Form, Button, Card } from "react-bootstrap";
import Footer from "../components/footer";
import { getDocs, collection, query, where } from "firebase/firestore";
import { db } from "../.firebase/utils/firebase";
import { toast, ToastContainer } from "react-toastify";
// @ts-ignore
import { gapi } from "gapi-script";

const GMAIL_CLIENT_ID = "430877906839-qfj30rff9auh5u9oaqcrasfbo75m1v1r.apps.googleusercontent.com"; // Put your real client ID here!
const GMAIL_API_SCOPE = "https://www.googleapis.com/auth/gmail.send";

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  // ======= FIX: Real handleChange function ======
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  // Gmail OAuth/Send logic...
  async function authenticateWithGoogle() {
    return new Promise((resolve, reject) => {
      gapi.load("client:auth2", async () => {
        await gapi.client.init({
          clientId: GMAIL_CLIENT_ID,
          scope: GMAIL_API_SCOPE,
          discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"],
        });
        gapi.auth2.getAuthInstance()
          .signIn()
          .then(resolve)
          .catch(reject);
      });
    });
  }

  async function sendEmailViaGmail(to: string, bcc: string[], subject: string, body: string) {
    const message = [
      `To: ${to}`,
      bcc.length > 0 ? `Bcc: ${bcc.join(", ")}` : "",
      `Subject: ${subject}`,
      "Content-Type: text/plain; charset=utf-8",
      "",
      body,
    ].join("\n");
    const encodedMessage = btoa(unescape(encodeURIComponent(message)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return gapi.client.gmail.users.messages.send({
      userId: "me",
      resource: { raw: encodedMessage }
    });
  }

  async function fetchCoachEmails(): Promise<string[]> {
    const coachQuery = query(collection(db, "users"), where("role", "==", "coach"));
    const snapshot = await getDocs(coachQuery);
    return snapshot.docs.map(doc => doc.data().email).filter(Boolean);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const coachEmails = await fetchCoachEmails();
      await authenticateWithGoogle();
      const subject = `${formData.subject} (From ${formData.name})`;
      const to = "questsbclub@gmail.com";
      const body = formData.message + `\n\nFrom: ${formData.name} (${formData.email})`;
      await sendEmailViaGmail(to, coachEmails, subject, body);

      toast.success("Message sent!");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      toast.error("Failed to send message. Please try again.");
    }
    setLoading(false);
  };

  return (
    <Container fluid className="py-5">
      <ToastContainer />  {/* <--- Add this for toasts */}
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
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? "Sending..." : "Send Message"}
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
