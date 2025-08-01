import React, { useState } from "react";
import ReportProblemModal from "./ReportProblemModal";
import { FaGithub } from "react-icons/fa";
import { FaLinkedin } from "react-icons/fa";

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
    {/* Top Row: Logo, Copyright, Report */}
    <div
      className="d-flex align-items-center justify-content-center flex-wrap"
      style={{ width: "100%", gap: 16 }}
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
        }}
      />
      <span style={{ fontSize: 15, color: "#48586e" }}>
        Copyright © Quest Academy. All rights reserved. {new Date().getFullYear()}
      </span>
      <a
        href="#"
        style={{
          color: "#1f66e0",
          textDecoration: "underline",
          fontWeight: 600,
          cursor: "pointer",
          fontSize: 15,
        }}
        onClick={(e) => {
          e.preventDefault();
          setShowReportModal(true);
        }}
      >
        Report Problem
      </a>
    </div>

    {/* Signature Row */}
    <div
      style={{
        fontSize: 13,
        color: "#666",
        fontStyle: "italic",
        marginTop: 6,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span>created by Dwij Bhatt</span>
      <a
        href="https://github.com/dwijsb16"
        target="_blank"
        rel="noopener noreferrer"
        title="GitHub"
      >
        <img
          src="https://cdn.simpleicons.org/github/24292e"
          alt="GitHub"
          style={{ width: 18, height: 18 }}
        />
      </a>
      <a
        href="https://www.linkedin.com/in/dwij-bhatt-54a8ab324/"
        target="_blank"
        rel="noopener noreferrer"
        title="LinkedIn"
      >
        <img
          src="https://cdn.simpleicons.org/linkedin/0a66c2"
          alt="LinkedIn"
          style={{ width: 18, height: 18 }}
        />
      </a>
    </div>
  </div>
</footer>

      <ReportProblemModal show={showReportModal} onHide={() => setShowReportModal(false)} />
    </>
  );
};

export default Footer;
