import React from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, PencilLine } from "lucide-react";

const ManageEvents: React.FC = () => {
  const navigate = useNavigate();

  // Style objects typed as React.CSSProperties
  const cardStyle: React.CSSProperties = {
    borderRadius: 20,
    boxShadow: "0 2px 18px rgba(70,110,180,0.09)",
    background: "#fff",
    minHeight: 260,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    transition: "box-shadow .2s",
  };

  const iconStyle: React.CSSProperties = {
    color: "#2255c9",
    marginBottom: 22,
  };

  return (
    <div className="container py-5">
      <div className="row g-4 justify-content-center">
        {/* --- Add Event Card --- */}
        <div className="col-12 col-md-6 col-lg-5">
          <div className="card p-4" style={cardStyle}>
            <PlusCircle size={56} style={iconStyle} />
            <h4 className="mb-2 fw-bold text-primary">Add Event</h4>
            <p className="text-muted mb-4 text-center" style={{ fontSize: 16 }}>
              Create a new tournament or event for your club.
            </p>
            <button
              className="btn btn-primary btn-lg rounded-pill fw-semibold px-4"
              style={{ letterSpacing: ".02em", fontSize: "1.15rem" }}
              onClick={() => navigate("/coaches/add-tournament")}
            >
              Add Event
            </button>
          </div>
        </div>
        {/* --- Edit/Delete Event Card --- */}
        <div className="col-12 col-md-6 col-lg-5">
          <div className="card p-4" style={cardStyle}>
            <PencilLine size={56} style={iconStyle} />
            <h4 className="mb-2 fw-bold text-primary">Edit or Delete Event</h4>
            <p className="text-muted mb-4 text-center" style={{ fontSize: 16 }}>
              Update, reschedule, or remove tournaments and events.
            </p>
            <button
              className="btn btn-outline-primary btn-lg rounded-pill fw-semibold px-4"
              style={{ letterSpacing: ".02em", fontSize: "1.15rem" }}
              onClick={() => navigate("/edit-tournament")}
            >
              Edit / Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageEvents;
