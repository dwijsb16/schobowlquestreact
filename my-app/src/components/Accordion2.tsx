import React from "react";

interface Tournament {
  title: string;
  location: string;
  startEndTime: string;
  playersComing: string;
  teams: string;
  shirtColor: string;
  carpool: string;
  moderate: string;
}

const Accordion: React.FC = () => {
  const tournaments: Tournament[] = [
    {
      title: "Jr. Wildcat Tournament (3/17)",
      location: "Location:",
      startEndTime: "Start/End Time:",
      playersComing: "Players Coming:",
      teams: "Teams:",
      shirtColor: "Shirt Color:",
      carpool: "People who can Carpool:",
      moderate: "People who can Moderate:",
    },
    {
      title: "IESA State (5/)",
      location: "Location:",
      startEndTime: "Start/End Time:",
      playersComing: "Players Coming:",
      teams: "Teams:",
      shirtColor: "Shirt Color:",
      carpool: "People who can Carpool:",
      moderate: "People who can Moderate:",
    },
    {
      title: "MSNCT (5/)",
      location: "Location:",
      startEndTime: "Start/End Time:",
      playersComing: "Players Coming:",
      teams: "Teams:",
      shirtColor: "Shirt Color:",
      carpool: "People who can Carpool:",
      moderate: "People who can Moderate:",
    },
  ];

  return (
    <div id="accordion1" role="tablist">
      {tournaments.map((tournament, index) => (
        <div className="card" key={index}>
          <div className="card-header" role="tab" id={`heading${index}`}>
            <h5 className="mb-0">
              <a
                data-toggle="collapse"
                href={`#collapse${index}`}
                role="button"
                aria-expanded={index === 0}
                aria-controls={`collapse${index}`}
              >
                {tournament.title}
              </a>
            </h5>
          </div>
          <div
            id={`collapse${index}`}
            className={`collapse ${index === 0 ? "show" : ""}`}
            role="tabpanel"
            aria-labelledby={`heading${index}`}
            data-parent="#accordion1"
          >
            <div className="card-body">
              <p>{tournament.location}</p>
              <p>{tournament.startEndTime}</p>
              <p>{tournament.playersComing}</p>
              <p>{tournament.teams}</p>
              <p>{tournament.shirtColor}</p>
              <p>{tournament.carpool}</p>
              <p>{tournament.moderate}</p>
              <a href="edit_tournament.html" className="btn btn-warning">
                Edit Tournament Info
              </a>
              <a href="Make_teams.html" className="btn btn-success">
                Add Teams
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Accordion;