import React, { useState } from "react";
import Navbar from "../components/Navbar";
import CoachesCards from "../components/CoachesCards";
import Footer from "../components/footer";
import { Modal, Button, InputGroup, FormControl } from "react-bootstrap";

const signupLink = `${window.location.origin}/signup`;

const CoachesOnlyPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(signupLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback in case clipboard api fails
      setCopied(false);
    }
  };

  return (
    <div style={{ paddingTop: "50px" }}>
      <Navbar />
      <div className="container py-4">
        <h1 className="text-center text-capitalize mb-4">Coaches Only Page!</h1>
        <div className="d-flex justify-content-center mb-4">
          <Button
            variant="danger"
            style={{
              fontWeight: 700,
              borderRadius: 14,
              fontSize: 18,
              boxShadow: "0 2px 16px #f2b8bb44"
            }}
            onClick={() => setShowModal(true)}
          >
            Get Signup Link
          </Button>
        </div>
      </div>
      <CoachesCards />
      <Footer />

      {/* Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>Share Signup Link</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <div style={{ fontWeight: 500, marginBottom: 10 }}>
              Copy and share this link with new users:
            </div>
            <InputGroup>
              <FormControl
                value={signupLink}
                readOnly
                style={{
                  fontWeight: 600,
                  background: "#f8f9fa",
                  borderTopLeftRadius: 12,
                  borderBottomLeftRadius: 12
                }}
              />
              <Button
                variant={copied ? "success" : "outline-danger"}
                onClick={handleCopy}
                style={{
                  borderTopRightRadius: 12,
                  borderBottomRightRadius: 12,
                  fontWeight: 600
                }}
              >
                {copied ? "Copied!" : "Copy"}
              </Button>
            </InputGroup>
          </div>
          <div className="text-muted" style={{ fontSize: 14 }}>
            <b>Tip:</b> Only coaches should distribute this link!
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)} style={{ borderRadius: 10 }}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CoachesOnlyPage;
