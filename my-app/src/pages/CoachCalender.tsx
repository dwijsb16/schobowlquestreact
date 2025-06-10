import React from "react";
import Navbar from "../components/Navbar";
import Accordion from "../components/Accordion2";
import Footer from "../components/footer";

const CoachCalendarPage: React.FC = () => {
  return (
    <div style={{ paddingTop: "90px" }}>
      <Navbar />
      <h1 className="text-center text-capitalize">Coach Calendar</h1>
      <Accordion />
      <Footer />
    </div>
  );
};

export default CoachCalendarPage;