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
    <div className="container">
      <div className="row align-items-center">
        <div className="col-12 col-md-3 d-flex justify-content-center justify-content-md-start mb-2 mb-md-0">
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
        </div>
        <div className="col-12 col-md-9 text-center text-md-left" style={{ fontSize: 15, color: "#48586e" }}>
          <span>
            Copyright © Quest Academy. All rights reserved. {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
