import React from "react";
import Navbar from "../components/Navbar"
import TournamentForm from "../components/TournamentForm";
import Footer from "../components/footer";

const AddTournament: React.FC = () => {
  return (
    <div>
      <Navbar />
      <TournamentForm />
      <Footer />
    </div>
  );
};

export default AddTournament;