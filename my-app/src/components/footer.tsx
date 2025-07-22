import React, { useState } from "react";
import ReportProblemModal from "./ReportProblemModal";

const Footer: React.FC = () => {
  const [showReportModal, setShowReportModal] = useState(false);

  return (
    <>
      <footer
        style={{
          width: "100%",
          background: "#f6f9fd",
          borderTop: "1px solid #e4eaf2",
          padding: "0.75rem 0",
          marginTop: 48,
          minHeight: 68,
          position: "relative",
          zIndex: 10,
        }}
      >
        <div className="container d-flex flex-column align-items-center">
          {/* ROW: Q logo + copyright + report */}
          <div
            className="d-flex align-items-center justify-content-center gap-2"
            style={{ width: "100%" }}
          >
            <img
              src="/images/quest-Q-logo.png"
              alt="Quest Q Logo"
              style={{
                width: 40,
                height: 40,
                objectFit: "contain",
                background: "#fff",
                borderRadius: 12,
                border: "2px solid #e3f0fa",
                boxShadow: "0 2px 8px #e3f0fa",
                marginRight: 16,
              }}
            />
            <span style={{ fontSize: 15, color: "#48586e", textAlign: "center" }}>
              Copyright © Quest Academy. All rights reserved. {new Date().getFullYear()}
            </span>
            <a
              href="#"
              style={{
                color: "#1f66e0",
                textDecoration: "underline",
                fontWeight: 600,
                cursor: "pointer",
                marginLeft: 12,
                fontSize: 15,
              }}
              onClick={e => {
                e.preventDefault();
                setShowReportModal(true);
              }}
            >
              Report Problem
            </a>
          </div>
          {/* Signature: next line, centered */}
          <div style={{ fontSize: 12, color: "#888", fontStyle: "italic", marginTop: 6 }}>
            created by Dwij Bhatt
          </div>
        </div>
      </footer>
      <ReportProblemModal show={showReportModal} onHide={() => setShowReportModal(false)} />
    </>
  );
};

export default Footer;
