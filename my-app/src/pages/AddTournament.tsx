import React from "react";
import Navbar from "../components/Navbar"
import TournamentForm from "../components/TournamentForm";
import Footer from "../components/footer";

const AddTournament: React.FC = () => {
  return (
    <div style={{ paddingTop: "100px", background: "linear-gradient(to bottom, #b22222, #fff)" }}>
      <Navbar />
      <TournamentForm />
      <Footer />
    </div>
  );
};

export default AddTournament;