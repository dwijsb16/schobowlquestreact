import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const tournaments = [
  { name: "Tournament 1", id: 1 },
  { name: "Tournament 2", id: 2 },
  { name: "Tournament 3", id: 3 },
];

const ManageTournaments: React.FC = () => {
  const navigate = useNavigate();
  const [showMessageModal, setShowMessageModal] = useState(false);

  return (
    <div className="container py-5">
      <div className="row g-4 justify-content-center">

        {/* Tournaments Card */}
        {/* Tournaments Card */}
<div className="col-12 col-lg-6">
  <div
    className="card shadow-lg rounded-4 border-0 p-4 h-100"
    style={{ transition: "box-shadow .2s", minHeight: 420 }}
  >
    <img
      className="card-img-top mb-3 rounded-3"
      src="/images/card-img.png"
      alt="Tournament card"
      style={{ objectFit: "cover", height: 180 }}
    />
    <div className="card-body p-0">
      <h5 className="card-title fw-bold mb-2 text-primary">
        Edit or Delete Tournaments
      </h5>
      <p className="card-text text-muted mb-4">
        Change, cancel, or reschedule tournaments with just a click.
      </p>
      <div className="d-flex justify-content-center">
        <button
          className="btn btn-primary btn-lg rounded-pill px-5 shadow-sm"
          style={{
            fontWeight: 700,
            letterSpacing: ".06em",
            fontSize: "1.3rem",
            boxShadow: "0 2px 16px rgba(46,85,136,0.07)",
          }}
          onClick={() => navigate("/edit-tournament")}
        >
          Go
        </button>
      </div>
    </div>
  </div>
</div>

        {/* Send Message Card */}
        <div className="col-12 col-lg-6">
          <div
            className="card shadow-lg rounded-4 border-0 p-4 h-100"
            style={{
              background:
                "linear-gradient(125deg, #e3f2fd 0%, #e8eaf6 100%)",
              transition: "box-shadow .2s",
              minHeight: 420,
            }}
          >
            <img
              className="card-img-top mb-3 rounded-3"
              src="/images/message-card.png"
              alt="Message card"
              style={{ objectFit: "cover", height: 180 }}
            />
            <div className="card-body p-0">
              <h5 className="card-title fw-bold mb-2 text-primary">
                Send Message
              </h5>
              <p className="card-text text-muted mb-4">
                Instantly send an email to all players.
              </p>
              <button
                className="btn btn-primary btn-lg rounded-pill shadow-sm px-4"
                style={{ fontWeight: 600, letterSpacing: ".04em" }}
                onClick={() => setShowMessageModal(true)}
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Message Modal */}
      {showMessageModal && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{
            background: "rgba(44, 62, 80, 0.18)",
            backdropFilter: "blur(1.5px)",
          }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-0 pb-1">
                <h5 className="modal-title fw-bold text-primary">
                  Send Message
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setShowMessageModal(false)}
                />
              </div>
              <div className="modal-body pt-0">
                <input
                  className="form-control mb-3 rounded-3"
                  placeholder="Subject"
                  style={{ fontSize: "1rem" }}
                />
                <textarea
                  className="form-control rounded-3"
                  placeholder="Type your message here..."
                  rows={5}
                  style={{ fontSize: "1rem" }}
                />
              </div>
              <div className="modal-footer border-0 pt-0">
                <button
                  className="btn btn-outline-secondary rounded-pill"
                  onClick={() => setShowMessageModal(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary rounded-pill px-4">
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageTournaments;
