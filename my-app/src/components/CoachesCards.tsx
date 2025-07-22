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

  return (
    <div className="container py-3">
      <div className="row justify-content-center">
        {cards.map((card, index) => (
          <div
            key={index}
            className="col-12 col-md-6 col-lg-4 mb-4 d-flex align-items-stretch"
          >
            <div
              className="card shadow-sm border-0 w-100 h-100"
              style={{
                borderRadius: 20,
                background: "#fff",
                minHeight: 225,
                minWidth: 320,
                maxWidth: 400,
                margin: "0 auto",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 4px 24px #F6A5A58c",
                border: "1.5px solid #F7F7F7",
                transition: "box-shadow 0.12s",
              }}
            >
              <div style={{ textAlign: "center", padding: "28px 0 12px" }}>
                <div
                  style={{
                    display: "inline-block",
                    background: "#fff",
                    border: "2.5px solid #DF2E38",
                    borderRadius: "50%",
                    padding: 13,
                    boxShadow: "0 1.5px 10px #f6f6f6",
                  }}
                >
                  <img
                    src="/images/quest-Q-logo.png"
                    alt="Quest Q logo"
                    style={{
                      width: 48,
                      height: 48,
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                </div>
              </div>
              <div className="card-body text-center" style={{ padding: "0 1.2em" }}>
                <h5 className="card-title" style={{
                  fontWeight: 900,
                  color: "#DF2E38",
                  letterSpacing: 0.1,
                  marginBottom: 11,
                  fontSize: 22,
                }}>
                  {card.title}
                </h5>
                <p className="card-text" style={{
                  fontSize: 15,
                  color: "#232323",
                  minHeight: 38,
                  fontWeight: 400,
                  letterSpacing: 0.01,
                  marginBottom: 3
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
                    padding: "9px 28px",
                    borderRadius: 13,
                    border: "none",
                    boxShadow: "0 2px 8px #ffccd5",
                    letterSpacing: 0.1,
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
