import React from "react";

const TournamentForm: React.FC = () => {
  return (
    <div className="container d-flex justify-content-center align-items-center mt-5">
      <div className="card p-4 shadow" style={{ maxWidth: "700px", width: "100%" }}>
        <h2 className="text-center mb-4">Add an Event</h2>
        <form>
          <div className="form-group mb-3">
            <label htmlFor="tourn_name">Event Name</label>
            <input
              type="text"
              className="form-control"
              id="tourn_name"
              placeholder="Type here..."
            />
          </div>

          <div className="row mb-3">
            <div className="form-group col-md-6">
              <label htmlFor="date">Date</label>
              <input type="date" className="form-control" id="date" />
            </div>
            <div className="form-group col-md-3">
              <label htmlFor="start_time">Start Time</label>
              <input type="time" className="form-control" id="start_time" />
            </div>
            <div className="form-group col-md-3">
              <label htmlFor="end_time">End Time</label>
              <input type="time" className="form-control" id="end_time" />
            </div>
          </div>

          <div className="row mb-3">
          <div className="form-group col-md-6">
          <label htmlFor="date">Date</label>
          <input type="date" className="form-control" id="date" />
          </div>
          <div className="form-group col-md-3">
          <label htmlFor="start_time">RSVP Time</label>
          <input type="time" className="form-control" id="start_time" />
          </div>
          </div>

          <div className="form-group mb-3">
            <label htmlFor="rules_tourn">Rules</label>
            <textarea
              className="form-control"
              id="rules_tourn"
              rows={3}
              placeholder="Enter rules..."
            ></textarea>
          </div>

          <div className="form-group mb-3">
            <label htmlFor="address">Tournament Location</label>
            <input
              type="text"
              className="form-control"
              id="address"
              placeholder="Type an address"
            />
          </div>
          <div className="form-group mb-4">
            <label htmlFor="additional_info">Shirt Color</label>
            <input
              type="text"
              className="form-control"
              id="additional_info"
              placeholder="Type here"
            />
          </div>
          <div className="form-group mb-4">
            <label htmlFor="additional_info">Additional Information</label>
            <input
              type="text"
              className="form-control"
              id="additional_info"
              placeholder="Type here"
            />
          </div>

          <div className="text-center">
            <button type="submit" className="btn btn-primary px-4 py-2">
              Create Tournament
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TournamentForm;