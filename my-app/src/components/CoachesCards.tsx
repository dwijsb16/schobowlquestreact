import React from "react";
import { Link } from "react-router-dom"; // Import Link from React Router


interface CardData {
  title: string;
  description: string;
  link: string;
}

const CoachesCards: React.FC = () => {
  const cards: CardData[] = [
    {
      title: "Add a Tournament",
      description:
        "This page will allow coaches to add tournaments and add varying specifications that are tournament specific.",
      link: "/coaches/add-tournament",
    },
    {
      title: "Make Teams",
      description:
        "This page will allow coaches to make teams for specific tournaments given the people who have signed up.",
      link: "/coaches/make-teams",
    },
    {
      title: "Manage Tournaments",
      description:
        "This page will allow coaches to manage important tournament information for tournaments that already exist.",
      link: "/coaches/manage-tournaments",
    },
    {
      title: "Coaches Schedule",
      description:
        "This page will have a master view of all tournaments that are scheduled for the year and a summary of relevant data.",
      link: "/coaches/calendar",
    },
  ];

  return (
    <div className="container">
      <div className="row">
        {cards.map((card, index) => (
          <div className="col-lg-4" key={index}>
            <div className="card" style={{ width: "18rem" }}>
              <img
                className="card-img-top"
                src="/images/quest-Q-logo.png"
                alt="Quest Q logo"
              />
              <div className="card-body">
                <h5 className="card-title">{card.title}</h5>
                <p className="card-text">{card.description}</p>
                <Link to={card.link} className="btn btn-primary">
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