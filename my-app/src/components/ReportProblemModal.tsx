import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import { auth } from "../.firebase/utils/firebase";
import emailjs from "emailjs-com";

// EmailJS config (replace with your real values if needed)
const EMAIL_SERVICE_ID = "service_cfows1h";
const EMAIL_TEMPLATE_ID = "template_mk7qghu";
const EMAIL_USER_ID = "GRAfhbyKXL9qsCDKk";

// BCC list for admins
const PROBLEM_BCC = ["dwij.bhatt@gmail.com", "bhatt.anshu@gmail.com"];

const ReportProblemModal: React.FC<{ show: boolean, onHide: () => void }> = ({ show, onHide }) => {
  const [email, setEmail] = useState("");
  const [problemName, setProblemName] = useState("");
  const [problemDesc, setProblemDesc] = useState("");
  const [sending, setSending] = useState(false);

  // Set email when user logs in/out or modal is shown
  useEffect(() => {
    setEmail(auth.currentUser?.email || "");
  }, [show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    const params = {
      message_type: "PROBLEM REPORTED",
      subject: problemName,
      message: problemDesc,
      to_email: "questsbclub@gmail.com",
      bcc_list: PROBLEM_BCC.join(","),
      from_email: email,
    };
    try {
      await emailjs.send(EMAIL_SERVICE_ID, EMAIL_TEMPLATE_ID, params, EMAIL_USER_ID);
      toast.success("Problem reported!");
      setProblemName("");
      setProblemDesc("");
      setEmail(auth.currentUser?.email || "");
      onHide();
    } catch (err) {
      toast.error("Failed to report problem.");
    }
    setSending(false);
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Report a Problem</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Your Email</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              disabled={!!auth.currentUser}
            />
            <div style={{ fontSize: 12, color: "#888" }}>
              {auth.currentUser
                ? "You’re logged in—using your account email."
                : "We’ll use this to follow up if needed."}
            </div>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Problem Name</Form.Label>
            <Form.Control
              type="text"
              value={problemName}
              onChange={e => setProblemName(e.target.value)}
              placeholder="(e.g., Can't login, Data missing...)"
              required
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Problem Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={problemDesc}
              onChange={e => setProblemDesc(e.target.value)}
              placeholder="Describe what went wrong or what you saw..."
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={sending}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={sending || !problemName || !problemDesc || !email}>
            {sending ? "Reporting..." : "Report Problem"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ReportProblemModal;
