import React from "react";
import Navbar from "../components/Navbar";
import ManageTournaments from "../components/ManageTournaments";
import Footer from "../components/footer";

const ManageTournamentsPage: React.FC = () => {
  return (
    <div style={{ paddingTop: "90px" }}>
      <Navbar />
      <ManageTournaments />
      <Footer />
    </div>
  );
};

export default ManageTournamentsPage;