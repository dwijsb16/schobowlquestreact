import React from "react";
import Navbar from "../components/Navbar";
import EditTournamentForm from "../components/EditTournamentForm";
import Footer from "../components/footer";

const EditTournamentPage: React.FC = () => {
  return (
    <div style={{ paddingTop: "100px", background: "linear-gradient(to bottom, #b22222, #fff)" }}>
      <Navbar />
      <EditTournamentForm />
      <Footer />
    </div>
  );
};

export default EditTournamentPage;