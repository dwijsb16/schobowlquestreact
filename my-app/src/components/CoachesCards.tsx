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
      title: "Manage Events",
      description: "Add a new event, edit existing events, or delete events!",
      link: "/manage-events",
    },
    {
      title: "Make Teams",
      description: "Build and assign teams for upcoming tournaments using current signups.",
      link: "/coaches/make-teams",
    },
    {
      title: "Send Messages",
      description: "E-mail certain players or send announcements to all players",
      link: "/coaches/send-messages",
    },
    {
      title: "Coaches Schedule",
      description: "Master calendar: view all scheduled tournaments and quick stats.",
      link: "/coaches/calendar",
    },
    {
      title: "Assign Coaches",
      description: "Assign users to the Coach Role",
      link: "/assign-coaches",
    },
    {
      title: "View Players",
      description: "View all players with website accounts right now and users linked to them.",
      link: "/playerlist",
    }
  ];

  return (<div className="container py-4">
    <div className="row justify-content-center">
      {cards.map((card, index) => (
        <div
          key={index}
          className="col-12 col-md-6 col-lg-4 mb-4 d-flex align-items-stretch"
        >
          <div
            className="card shadow-sm border-0 w-100 h-100"
            style={{
              borderRadius: 22,
              background: "#fff",
              minHeight: 320,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 6px 32px #EDEDED, 0 1.5px 8px #F7F7F7",
              border: "1.5px solid #F7F7F7",
              transition: "transform 0.12s, box-shadow 0.12s"
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(-7px) scale(1.02)";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "0 16px 44px #EDEDED";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = "none";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 32px #EDEDED, 0 1.5px 8px #F7F7F7";
            }}
          >
            <div style={{ textAlign: "center", padding: "32px 0 14px" }}>
              <div
                style={{
                  display: "inline-block",
                  background: "#fff",
                  border: "2.5px solid #DF2E38",
                  borderRadius: "50%",
                  padding: 17,
                  boxShadow: "0 1px 10px #EDEDED",
                }}
              >
                <img
                  src="/images/quest-Q-logo.png"
                  alt="Quest Q logo"
                  style={{
                    width: 62,
                    height: 62,
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>
            </div>
            <div className="card-body text-center">
              <h5 className="card-title" style={{
                fontWeight: 800,
                color: "#DF2E38",
                letterSpacing: 0.3,
                marginBottom: 12,
              }}>
                {card.title}
              </h5>
              <p className="card-text" style={{
                fontSize: 15.5,
                color: "#232323",
                minHeight: 54,
                fontWeight: 400,
                letterSpacing: 0.03,
              }}>
                {card.description}
              </p>
            </div>
            <div className="pb-4 d-flex justify-content-center">
              <Link
                to={card.link}
                className="btn"
                style={{
                  background: "#DF2E38",
                  color: "#fff",
                  fontWeight: 700,
                  padding: "10px 34px",
                  borderRadius: 18,
                  border: "none",
                  boxShadow: "0 2px 10px #F7F7F7",
                  letterSpacing: 0.5,
                  fontSize: 16,
                  transition: "background 0.12s",
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
