// EventRegistrationForm.jsx
import React from "react";

interface EventRegistrationFormProps {
  signupMode: string;
  favoritePlayer: any;
  playerOptions: any[];
  selectedPlayer: any;
  setSelectedPlayer: (value: any) => void;
  availability: string;
  setAvailability: (value: string) => void;
  showStartTime: boolean;
  startTime: string;
  setStartTime: (value: string) => void;
  showEndTime: boolean;
  endTime: string;
  setEndTime: (value: string) => void;
  carpool: string;
  setCarpool: (value: string) => void;
  driveCapacity: number;
  setDriveCapacity: (value: number) => void;
  parentAttending: boolean;
  setParentAttending: (value: boolean) => void;
  parentName: string;
  setParentName: (value: string) => void;
  canModerate: boolean;
  setCanModerate: (value: boolean) => void;
  canScorekeep: boolean;
  setCanScorekeep: (value: boolean) => void;
  additionalInfo: string;
  setAdditionalInfo: (value: string) => void;
  fetchingSignup: boolean;
  submitting: boolean;
  handleSubmit: () => void;
  existingSignupDocId?: string;
}

export default function EventRegistrationForm({
  signupMode,
  favoritePlayer,
  playerOptions,
  selectedPlayer,
  setSelectedPlayer,
  availability,
  setAvailability,
  showStartTime,
  startTime,
  setStartTime,
  showEndTime,
  endTime,
  setEndTime,
  carpool,
  setCarpool,
  driveCapacity,
  setDriveCapacity,
  parentAttending,
  setParentAttending,
  parentName,
  setParentName,
  canModerate,
  setCanModerate,
  canScorekeep,
  setCanScorekeep,
  additionalInfo,
  setAdditionalInfo,
  fetchingSignup,
  submitting,
  handleSubmit,
  existingSignupDocId,
}: EventRegistrationFormProps) {
  return (
    <div className="card shadow-lg" style={{ borderRadius: 20, border: "1.5px solid #DF2E38", background: "#fff" }}>
      <div className="card-body px-5 py-4">
        <h4 className="mb-4" style={{ fontWeight: 700, color: "#DF2E38" }}>Event Registration</h4>
        {signupMode === "coach" && favoritePlayer && (
          <div className="alert alert-primary mb-3" style={{ borderRadius: 14, fontWeight: 600 }}>
            <span style={{ color: "#2949B8", fontWeight: 800 }}>Favorite Player:</span>
            {" "}{favoritePlayer.firstName} {favoritePlayer.lastName}
          </div>
        )}
        <div className="form-group mb-3">
          <label htmlFor="playerSelect" style={{ fontWeight: 500 }}>Select Player:</label>
          <select className="form-control" id="playerSelect" value={selectedPlayer} onChange={e => setSelectedPlayer(e.target.value)}>
            <option value="">-- Choose a player --</option>
            {playerOptions.map((p) => (
              <>
                {favoritePlayer && (
                  <optgroup label="Favorite Player">
                    <option value={favoritePlayer.uid}>
                      ⭐ {favoritePlayer.firstName} {favoritePlayer.lastName} (Favorite)
                    </option>
                  </optgroup>
                )}
                <optgroup label="All Players">
                  {playerOptions
                    .filter(p => !favoritePlayer || p.uid !== favoritePlayer.uid)
                    .map((p) => (
                      <option key={p.uid} value={p.uid}>
                        {p.firstName} {p.lastName}
                      </option>
                    ))}
                </optgroup>
              </>
            ))}
          </select>
        </div>
        {playerOptions.length === 0 && (
          <div className="alert alert-info mt-3" style={{ borderRadius: 12 }}>
            No players linked to your account. Please link a player in your profile to register for events.
          </div>
        )}
        {fetchingSignup && (
          <div className="text-center text-secondary py-3">
            <span className="spinner-border spinner-border-sm" /> Loading signup info...
          </div>
        )}
        {selectedPlayer && !fetchingSignup && (
          <>
            <div className="form-group mb-3">
              <label htmlFor="availability" style={{ fontWeight: 500 }}>Availability:</label>
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
              <div className="form-group mb-3">
                <label htmlFor="startTime" style={{ fontWeight: 500 }}>Estimated Arrival Time:</label>
                <input type="time" className="form-control" id="startTime" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
            )}
            {showEndTime && (
              <div className="form-group mb-3">
                <label htmlFor="endTime" style={{ fontWeight: 500 }}>Estimated Departure Time:</label>
                <input type="time" className="form-control" id="endTime" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
            )}
            <div className="form-group mb-3">
              <label style={{ fontWeight: 500 }}>Carpool Options:</label>
              <div style={{ display: "flex", gap: "14px" }}>
              <button
  type="button"
  className={`btn ${carpool === "can-drive" ? "btn-success" : "btn-outline-secondary"}`}
  style={{ borderRadius: 12, fontWeight: 600 }}
  onClick={() => setCarpool("can-drive")}
>
  {signupMode === "player" ? "Parent Can Drive" : "Can Drive"}
</button>

                <button type="button" className={`btn ${carpool === "needs-ride" ? "btn-warning" : "btn-outline-secondary"}`}
                  style={{ borderRadius: 12, fontWeight: 600 }}
                  onClick={() => setCarpool("needs-ride")}
                >Needs A Ride</button>
              </div>
            </div>
            {carpool === "can-drive" && (
              <div className="form-group mb-3">
                <label htmlFor="driveCapacity" style={{ fontWeight: 500 }}>How many seats available?</label>
                <input type="number" className="form-control" id="driveCapacity" value={driveCapacity} onChange={e => setDriveCapacity(Number(e.target.value))} />
              </div>
            )}
            {signupMode === "player" && (
              <>
                <div className="form-group mb-3">
                  <label style={{ fontWeight: 500 }}>Will a Parent Attend?</label>
                  <select className="form-control" value={parentAttending ? "yes" : "no"} onChange={e => setParentAttending(e.target.value === "yes")}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                {parentAttending && (
                  <div className="form-group mb-3">
                    <label htmlFor="parentName" style={{ fontWeight: 500 }}>Parent's Name</label>
                    <input
                      type="text"
                      className="form-control"
                      id="parentName"
                      value={parentName}
                      onChange={e => setParentName(e.target.value)}
                      required={parentAttending}
                      placeholder="Enter parent’s full name"
                      style={{ borderRadius: 10, fontSize: 15 }}
                    />
                    <label style={{ fontWeight: 500, marginTop: 10 }}>Parent Volunteer Options:</label>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="canModerate" checked={canModerate} onChange={() => setCanModerate(!canModerate)} />
                      <label className="form-check-label" htmlFor="canModerate">Can Moderate</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="canScorekeep" checked={canScorekeep} onChange={() => setCanScorekeep(!canScorekeep)} />
                      <label className="form-check-label" htmlFor="canScorekeep">Can Scorekeep</label>
                    </div>
                  </div>
                )}
              </>
            )}
            <div className="form-group mb-3">
              <label htmlFor="additionalInfo" style={{ fontWeight: 500 }}>Additional Information:</label>
              <textarea className="form-control" id="additionalInfo" rows={3} value={additionalInfo} onChange={e => setAdditionalInfo(e.target.value)} style={{ borderRadius: 10, fontSize: 15 }} />
            </div>
            <div className="text-center mt-4">
              <button
                className="btn"
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  background: "linear-gradient(90deg,#DF2E38 0,#B71C1C 100%)",
                  color: "#fff",
                  fontWeight: 700,
                  borderRadius: 15,
                  padding: "13px 0",
                  width: "70%",
                  fontSize: 17,
                  boxShadow: "0 2px 10px #ffccd5",
                  letterSpacing: "0.04em",
                }}
              >
                {submitting ? "Submitting..." : existingSignupDocId ? "Edit Signup" : "Submit Registration"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
