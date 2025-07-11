import React, { useState } from "react";

// Demo Data
const accordionData = [
  {
    title: "Announcements for Tournament Day",
    content:
      "Be sure to arrive 15 minutes early for check-in. Bring a water bottle and your team shirt.",
  },
  {
    title: "Announcements for Tournament Teams",
    content:
      "Team rosters will be posted at 9:00 AM. Coaches, please check in with all players.",
  },
  {
    title: "News",
    content:
      "Our team made it to Regionals! Check back soon for a new practice schedule.",
  },
];

const Accordion: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="accordion my-5 shadow-sm rounded" id="qaAccordion">
      {accordionData.map((item, idx) => (
        <div className="accordion-item" key={idx}>
          <h2 className="accordion-header" id={`heading${idx}`}>
            <button
              className={`accordion-button ${openIdx === idx ? "" : "collapsed"}`}
              type="button"
              aria-expanded={openIdx === idx}
              aria-controls={`collapse${idx}`}
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              style={{
                fontWeight: 600,
                fontSize: "1.1rem",
                background: openIdx === idx ? "#f4f8fc" : "#fff",
                color: openIdx === idx ? "#0a7de1" : "#333",
                border: "none",
                borderRadius: openIdx === idx ? "14px 14px 0 0" : "14px",
                transition: "background 0.2s",
              }}
            >
              {item.title}
            </button>
          </h2>
          <div
            id={`collapse${idx}`}
            className={`accordion-collapse collapse ${openIdx === idx ? "show" : ""}`}
            aria-labelledby={`heading${idx}`}
            data-bs-parent="#qaAccordion"
          >
            <div className="accordion-body" style={{
              background: "#f9fcff",
              borderRadius: "0 0 14px 14px",
              borderTop: "1px solid #eee"
            }}>
              {item.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Accordion;
