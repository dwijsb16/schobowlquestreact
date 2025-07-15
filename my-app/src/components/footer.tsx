import React, { useState } from "react";
import ReportProblemModal from "./ReportProblemModal"; // Adjust path if needed

const Footer: React.FC = () => {
  const [showReportModal, setShowReportModal] = useState(false);

  return (
    <>
      <footer style={{
        width: "100%",
        background: "#f6f9fd",
        borderTop: "1px solid #e4eaf2",
        padding: "0.75rem 0",
        marginTop: 48,
        minHeight: 68,
        position: "relative",
        zIndex: 10
      }}>
        <div className="container d-flex flex-column flex-md-row justify-content-center align-items-center gap-3">
          <img
            src="/images/quest-Q-logo.png"
            alt="Quest Q Logo"
            style={{
              width: 56,
              height: 56,
              objectFit: "contain",
              background: "#fff",
              borderRadius: 14,
              border: "2px solid #e3f0fa",
              boxShadow: "0 2px 8px #e3f0fa"
            }}
          />
          <span style={{ fontSize: 15, color: "#48586e", textAlign: "center" }}>
            Copyright © Quest Academy. All rights reserved. {new Date().getFullYear()}
            &nbsp;
            <a
              href="#"
              style={{
                color: "#1f66e0",
                textDecoration: "underline",
                fontWeight: 600,
                cursor: "pointer",
                marginLeft: 8
              }}
              onClick={e => {
                e.preventDefault();
                setShowReportModal(true);
              }}
            >
              Report Problem
            </a>
          </span>
        </div>
      </footer>
      <ReportProblemModal show={showReportModal} onHide={() => setShowReportModal(false)} />
    </>
  );
};

export default Footer;
