import React from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, PencilLine } from "lucide-react";
import Footer from "../components/footer";

const ManageEvents: React.FC = () => {
  const navigate = useNavigate();

  const cardStyle: React.CSSProperties = {
    borderRadius: 24,
    boxShadow: "0 2px 18px #DF2E3810",
    background: "#fff",
    minHeight: 280,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    transition: "box-shadow .2s",
    border: "none"
  };

  const iconStyle: React.CSSProperties = {
    color: "#DF2E38",
    marginBottom: 24,
    filter: "drop-shadow(0 2px 10px #DF2E3835)",
    width: 80,
    height: 80,
  };

  return (
    // Flex container for full page
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Main content, grows to fill */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fafbfc"
      }}>
        <div className="container">
          <div className="row g-4 justify-content-center">
            {/* --- Add Event Card --- */}
            <div className="col-12 col-md-6 col-lg-5 d-flex justify-content-center">
              <div className="card p-4" style={cardStyle}>
                <PlusCircle style={iconStyle} />
                <h4 className="mb-2 fw-bold" style={{ color: "#232323", fontWeight: 900 }}>Add Event</h4>
                <p className="text-muted mb-4 text-center" style={{ fontSize: 16 }}>
                  Create a new tournament or event for your club.
                </p>
                <button
                  className="btn btn-lg rounded-pill fw-semibold px-4"
                  style={{
                    background: "linear-gradient(90deg,#DF2E38,#B71C1C 100%)",
                    color: "#fff",
                    letterSpacing: ".03em",
                    fontWeight: 800,
                    fontSize: "1.22rem",
                    border: "none",
                    boxShadow: "0 2px 10px #DF2E3833"
                  }}
                  onClick={() => navigate("/coaches/add-tournament")}
                >
                  Add Event
                </button>
              </div>
            </div>
            {/* --- Edit/Delete Event Card --- */}
            <div className="col-12 col-md-6 col-lg-5 d-flex justify-content-center">
              <div className="card p-4" style={cardStyle}>
                <PencilLine style={iconStyle} />
                <h4 className="mb-2 fw-bold" style={{ color: "#232323", fontWeight: 900 }}>Edit or Delete Event</h4>
                <p className="text-muted mb-4 text-center" style={{ fontSize: 16 }}>
                  Update, reschedule, or remove tournaments and events.
                </p>
                <button
                  className="btn btn-lg rounded-pill fw-semibold px-4"
                  style={{
                    background: "#fff",
                    color: "#DF2E38",
                    border: "2px solid #DF2E38",
                    letterSpacing: ".03em",
                    fontWeight: 800,
                    fontSize: "1.22rem",
                    boxShadow: "0 2px 10px #DF2E3813"
                  }}
                  onClick={() => navigate("/edit-tournament")}
                >
                  Edit / Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Sticky footer at the bottom */}
      <Footer />
    </div>
  );
};

export default ManageEvents;
