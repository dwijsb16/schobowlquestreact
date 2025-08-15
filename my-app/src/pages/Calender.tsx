import React from "react";
import Navbar from "../components/Navbar";
import Calendar from "../components/Calendar";
import AtAGlance from "../components/AtAGlance";
import Footer from "../components/footer";

const CalendarPage: React.FC = () => {
  return (
    <div style={{ paddingTop: "70px" }}>
      <Navbar />
      <br />
      <div className="container-fluid">
        <div className="container">
          <div className="row">
            <Calendar />
            <AtAGlance />
          </div>
        </div>
        <div className="mt-5">
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;