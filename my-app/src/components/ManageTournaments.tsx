import React from "react";

const ManageTournaments: React.FC = () => {
  const tournaments = [
    { name: "Tournament 1" },
    { name: "Tournament 2" },
    { name: "Tournament 3" },
  ];

  return (
    <div className="container">
      <div className="row">
        {/* Tournament Card */}
        <div className="col-lg-6">
          <div className="card col-md-4 col-lg-12">
            <img
              className="card-img-top"
              src="/images/card-img.png"
              alt="Tournament card"
            />
            <div className="card-body">
              <h5 className="card-title">Edit/Delete Tournament</h5>
              <p className="card-text">
                Page to change tournaments that get cancelled, rescheduled, etc.
              </p>
              <button
                className="btn btn-primary dropdown-toggle"
                id="dropdownMenuButton"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                Select Tournament
              </button>
              <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
                {tournaments.map((tournament, index) => (
                  <button key={index} className="dropdown-item">
                    {tournament.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Message Card */}
        <div className="col-lg-6">
          <div className="card col-md-4 col-lg-12">
            <img
              className="card-img-top"
              src="/images/message-card.png"
              alt="Message card"
            />
            <div className="card-body">
              <h5 className="card-title">Send Message</h5>
              <p className="card-text">
                Quick and easy way for coaches to send emails to all players.
              </p>
              <button className="btn btn-primary">Go</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageTournaments;