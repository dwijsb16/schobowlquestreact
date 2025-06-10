import React from "react";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Routes, Route } from "react-router-dom";
import Navigation from "./components/Navbar";
import Home from "./pages/home";
import About from "./pages/About";
import Calendar from "./pages/Calender";
import LoginPage from "./pages/login";
import CoachesOnlyPage from "./pages/CoachesOnly";
import AddTournamentPage from "./pages/AddTournament";
import MakeTeamsPage from "./pages/MakeTeams";
import ManageTournamentsPage from "./pages/ManageTournamentsPage";
import CoachesCalendarPage from "./pages/CoachCalender";
import Contact from "./pages/Contact";
import Resources from "./pages/Resources";
import TournamentPage from "./pages/TournamentDetail";


const App = () => {
  return (
    <>
      <Navigation />
      {/* Add padding below the navbar */}
      <div style={{ paddingTop: "90px" }}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/tournament" element={<TournamentPage />} />
          {/* Coaches-only routes */}
          <Route path="/coaches" element={<CoachesOnlyPage />} />
          <Route path="/coaches/add-tournament" element={<AddTournamentPage />} />
          <Route path="/coaches/make-teams" element={<MakeTeamsPage />} />
          <Route path="/coaches/manage-tournaments" element={<ManageTournamentsPage />} />
          <Route path="/coaches/calendar" element={<CoachesCalendarPage />} />
        </Routes>
      </div>
    </>
  );
};

export default App;