import React from "react";

const Footer: React.FC = () => (
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
      <span
        style={{
          fontSize: 15,
          color: "#48586e",
          textAlign: "center"
        }}
      >
        Copyright © Quest Academy. All rights reserved. {new Date().getFullYear()}
      </span>
    </div>
  </footer>
);

export default Footer;
