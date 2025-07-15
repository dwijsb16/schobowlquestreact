import React from "react";
import Navbar from "../components/Navbar";
import CoachesCards from "../components/CoachesCards";
import Footer from "../components/footer";

const CoachesOnlyPage: React.FC = () => {
  return (
    <div style={{ paddingTop: "50px" }}>
      <Navbar />
      <div className="container">
        <h1 className="text-center text-capitalize">Coaches Only Page!</h1>
      </div>
      <CoachesCards />
      <Footer />
    </div>
  );
};

export default CoachesOnlyPage;