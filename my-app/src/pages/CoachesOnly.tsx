import React, { useState } from "react";
import Navbar from "../components/Navbar";
import CoachesCards from "../components/CoachesCards";
import Footer from "../components/footer";
import { Modal, Button, InputGroup, FormControl, Form } from "react-bootstrap";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../.firebase/utils/firebase";

const signupLink = `${window.location.origin}/signup`;

const RED = "#DF2E38";

const CoachesOnlyPage: React.FC = () => {
  // For Signup Link modal
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // For Upload Stats modal
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [stat, setStat] = useState({ title: "", link: "", date: "" });
  const [uploading, setUploading] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(signupLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleStatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStat((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const handleUploadStat = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      await addDoc(collection(db, "stats"), {
        ...stat,
        createdAt: serverTimestamp(),
      });
      setStat({ title: "", link: "", date: "" });
      setShowStatsModal(false);
    } catch {
      // handle error if needed
    }
    setUploading(false);
  };

  return (
    <div style={{ paddingTop: 0, background: "#fff", minHeight: "100vh" }}>
      <Navbar />
      <div className="container py-0">
        <h1
          className="mb-3"
          style={{
            color: "#232629",
            fontWeight: 500,
            fontSize: "3rem",
            textAlign: "center",
            marginTop: "1.3em",
            marginBottom: "0.7em",
            letterSpacing: 0,
          }}
        >
          Coaches Only Page!
        </h1>
        {/* Buttons Row */}
        <div className="text-center mb-4" style={{ display: "flex", justifyContent: "center", gap: 20 }}>
          <Button
            variant="danger"
            style={{
              fontWeight: 700,
              borderRadius: 14,
              fontSize: 18,
              padding: "9px 28px",
              boxShadow: "0 2px 10px #f2b8bb33",
              minWidth: 180,
            }}
            onClick={() => setShowModal(true)}
          >
            Get Signup Link
          </Button>
          <Button
            variant="outline-danger"
            style={{
              fontWeight: 700,
              borderRadius: 14,
              fontSize: 18,
              padding: "9px 28px",
              minWidth: 180,
            }}
            onClick={() => setShowStatsModal(true)}
          >
            Upload Stats
          </Button>
        </div>

        {/* Stats/Coaches cards */}
        <CoachesCards />

        <Footer />

        {/* Signup Link Modal */}
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
                    borderBottomLeftRadius: 12,
                  }}
                />
                <Button
                  variant={copied ? "success" : "outline-danger"}
                  onClick={handleCopy}
                  style={{
                    borderTopRightRadius: 12,
                    borderBottomRightRadius: 12,
                    fontWeight: 600,
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

        {/* Upload Stats Modal */}
        <Modal
          show={showStatsModal}
          onHide={() => setShowStatsModal(false)}
          centered
          backdrop="static"
        >
          <Modal.Header closeButton>
            <Modal.Title>Upload Stats</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleUploadStat}>
              <Form.Group className="mb-3">
                <Form.Label>Stat Title</Form.Label>
                <Form.Control
                  type="text"
                  name="title"
                  value={stat.title}
                  onChange={handleStatChange}
                  required
                  autoFocus
                  placeholder="Title"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Link</Form.Label>
                <Form.Control
                  type="url"
                  name="link"
                  value={stat.link}
                  onChange={handleStatChange}
                  required
                  placeholder="https://..."
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Date</Form.Label>
                <Form.Control
                  type="date"
                  name="date"
                  value={stat.date}
                  onChange={handleStatChange}
                  required
                />
              </Form.Group>
              <Button
                variant="danger"
                type="submit"
                className="w-100"
                style={{ fontWeight: 700, borderRadius: 11, fontSize: 18 }}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowStatsModal(false)} style={{ borderRadius: 10 }}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default CoachesOnlyPage;
