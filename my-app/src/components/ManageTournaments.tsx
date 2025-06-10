import React from "react";

const ManageTournaments: React.FC = () => {
  const tournaments = ["Jr. Wildcat", "IESA State (5/)", "MSNCT (5/)"];

  return (
    <div className="container">
      <h1 className="text-center text-capitalize">Manage Tournaments</h1>
      <div className="row">
        <div className="col-lg-6">
          <div className="card col-md-4 col-lg-12">
            <img
              className="card-img-top"
              src="/images/card-img.png"
              alt="Card image cap"
            />
            <div className="card-body">
              <h5 className="card-title">Edit/Delete Tournament</h5>
              <p className="card-text">
                Page to change tournaments that get cancelled, rescheduled, etc.
              </p>
              <a
                href="#"
                className="btn btn-primary dropdown-toggle"
                id="dropdownMenuButton"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                Select Tournament
              </a>
              <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
                {tournaments.map((tournament, index) => (
                  <a key={index} className="dropdown-item" href="#">
                    {tournament}
                  </a>
                ))}
              </div>
              <a href="edit_tournament.html" className="btn btn-warning">
                Edit
              </a>
              <a href="#" className="btn btn-danger">
                Delete
              </a>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card col-md-4 col-lg-11">
            <img
              className="card-img-top"
              src="/images/card-img.png"
              alt="Card image cap"
            />
            <div className="card-body">
              <h5 className="card-title">Send Message</h5>
              <p className="card-text">
                Quick and easy way for coaches to send emails to all players.
              </p>
              <a href="#" className="btn btn-primary">
                Go
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageTournaments;