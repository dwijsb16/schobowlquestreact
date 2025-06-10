import React from "react";
import Navbar from "../components/Navbar";
import TeamManagement from "../components/TeamManagement";
import Footer from "../components/footer";

const MakeTeamsPage: React.FC = () => {
  return (
    <div style={{ paddingTop: "90px" }}>
      <Navbar />
      <TeamManagement />
      <Footer />
    </div>
  );
};

export default MakeTeamsPage;