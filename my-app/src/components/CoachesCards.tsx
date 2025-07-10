import React from "react";
import { Link } from "react-router-dom";

interface CardData {
  title: string;
  description: string;
  link: string;
}

const CoachesCards: React.FC = () => {
  const cards: CardData[] = [
    {
      title: "Add a Tournament",
      description: "Add a new tournament and specify important event details for your club.",
      link: "/coaches/add-tournament",
    },
    {
      title: "Make Teams",
      description: "Build and assign teams for upcoming tournaments using current signups.",
      link: "/coaches/make-teams",
    },
    {
      title: "Manage Tournaments",
      description: "Edit and update info for tournaments already in your system.",
      link: "/coaches/manage-tournaments",
    },
    {
      title: "Coaches Schedule",
      description: "Master calendar: view all scheduled tournaments and quick stats.",
      link: "/coaches/calendar",
    },
  ];

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        {cards.map((card, index) => (
          <div key={index} className="col-12 col-md-6 col-lg-4 mb-4 d-flex align-items-stretch">
            <div
              className="card shadow-sm border-0 w-100 h-100"
              style={{
                borderRadius: 20,
                background: "linear-gradient(110deg, #e8f0fe 60%, #fffbe7 100%)",
                minHeight: 330,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "transform 0.15s, box-shadow 0.15s"
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-6px) scale(1.035)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px 0 #b6cfff55";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = "none";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px 0 #c2d6f5";
              }}
            >
              <div style={{ textAlign: "center", padding: "40px 0 18px" }}>
                <div
                  style={{
                    display: "inline-block",
                    background: "linear-gradient(135deg,#b6d5ff,#ffe7ab)",
                    borderRadius: "50%",
                    padding: 24,
                    boxShadow: "0 2px 16px #c3e1ff66",
                  }}
                >
                  <img
                    src="/images/quest-Q-logo.png"
                    alt="Quest Q logo"
                    style={{
                      width: 90,
                      height: 90,
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                </div>
              </div>
              <div className="card-body text-center">
                <h5 className="card-title" style={{ fontWeight: 700, color: "#253c60" }}>{card.title}</h5>
                <p className="card-text" style={{ fontSize: 15, color: "#4b5766", minHeight: 60 }}>{card.description}</p>
              </div>
              <div className="pb-4 d-flex justify-content-center">
                <Link
                  to={card.link}
                  className="btn"
                  style={{
                    background: "linear-gradient(90deg,#69b5fc,#ffc560)",
                    color: "#1a1a1a",
                    fontWeight: 600,
                    padding: "8px 28px",
                    borderRadius: 20,
                    border: "none",
                    boxShadow: "0 2px 6px #e7e7e7",
                    letterSpacing: 1,
                  }}
                >
                  Go
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoachesCards;
