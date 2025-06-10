import React, { useState } from "react";

const TournamentPage: React.FC = () => {
  const [availability, setAvailability] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const showStartTime = availability === "late";
  const showEndTime = availability === "early";
  const showBothTimes = availability === "late_early";

  return (
    <div style={{ paddingTop: "70px" }}>
      <div className="container-fluid">
        <div className="container">
          {/* Title and Logo */}
          <div className="row my-4 text-center">
            <div className="col-12">
              <h1 className="display-4">Register for an Event!</h1>
              <img
                src="images/5043616.png"
                alt="Tournament Logo"
                width="256"
                height="256"
                className="img-fluid my-3"
              />
            </div>
          </div>

          {/* Registration Form */}
          <div className="card shadow-sm p-4 mb-5">
            <h4 className="mb-4">Event Registration Form</h4>

            {/* Student Name */}
            <div className="form-group">
              <label htmlFor="studentName">Student Name:</label>
              <input type="text" className="form-control" id="studentName" placeholder="Enter student name" />
            </div>

            {/* Parent Name */}
            <div className="form-group mt-3">
              <label htmlFor="parentName">Parent Name:</label>
              <input type="text" className="form-control" id="parentName" placeholder="Enter parent name" />
            </div>

            {/* Carpool Options */}
            <div className="form-group mt-3">
              <label htmlFor="carpoolOptions">Carpool Options:</label>
              <select multiple className="form-control" id="carpoolOptions" style={{ height: "100px" }}>
                <option value="can-drive">Can Drive</option>
                <option value="needs-ride">Needs a Ride</option>
              </select>
            </div>

            {/* Drive Capacity */}
            <div className="form-group mt-3">
              <label htmlFor="driveCapacity">Can drive how many people?</label>
              <input type="number" className="form-control" id="driveCapacity" placeholder="Enter number" />
            </div>

            {/* Additional Help */}
            <div className="form-group mt-3">
              <label>Additional Options:</label>
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="canModerate" />
                <label className="form-check-label" htmlFor="canModerate">Can Moderate</label>
              </div>
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="canScorekeep" />
                <label className="form-check-label" htmlFor="canScorekeep">Can Scorekeep</label>
              </div>
            </div>

            {/* Availability */}
            <div className="form-group mt-3">
              <label htmlFor="availability">Availability:</label>
              <select
                id="availability"
                className="form-control"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
              >
                <option value="">Select Availability</option>
                <option value="yes">Can Attend</option>
                <option value="no">Cannot Attend</option>
                <option value="early">Can Come but Has to Leave Early</option>
                <option value="late">Can Come Late</option>
                <option value="late_early">Can Come Late and Leave Early</option>
              </select>
            </div>

            {showStartTime && (
              <div className="form-group mt-3">
                <label htmlFor="startTime">Estimated Arrival Time:</label>
                <input
                  type="time"
                  className="form-control"
                  id="startTime"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            )}

            {showEndTime && (
              <div className="form-group mt-3">
                <label htmlFor="endTime">Estimated Departure Time:</label>
                <input
                  type="time"
                  className="form-control"
                  id="endTime"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            )}

            {showBothTimes && (
              <>
                <div className="form-group mt-3">
                  <label htmlFor="startTime">Estimated Arrival Time:</label>
                  <input
                    type="time"
                    className="form-control"
                    id="startTime"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="form-group mt-3">
                  <label htmlFor="endTime">Estimated Departure Time:</label>
                  <input
                    type="time"
                    className="form-control"
                    id="endTime"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Additional Info */}
            <div className="form-group mt-3">
              <label htmlFor="additionalInfo">Additional Information:</label>
              <textarea className="form-control" id="additionalInfo" rows={3} placeholder="Any notes or comments..." />
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-5">
            <div className="row">
              <div className="offset-xl-3 col-xl-1">
                <img
                  src="images/quest-Q-logo.png"
                  className="img-fluid img-thumbnail"
                  alt="Quest Academy Logo"
                />
              </div>
              <div className="col-xl-6 text-center">
                Copyright © Quest Academy. All rights reserved. 2023
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default TournamentPage;
