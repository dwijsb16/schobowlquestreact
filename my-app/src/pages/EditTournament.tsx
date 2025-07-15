import React from "react";
import Navbar from "../components/Navbar";
import EditTournamentForm from "../components/EditTournamentForm";
import Footer from "../components/footer";

const EditTournamentPage: React.FC = () => {
  return (
    <div>
      <Navbar />
      <EditTournamentForm />
      <Footer />
    </div>
  );
};

export default EditTournamentPage;