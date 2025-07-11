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
import UnauthorizedPage from "./pages/UnauthorizedPage";
import ProtectedRoute from "./components/ProtectedRoute";
import SignUpInfo from "./pages/SignUpInfo";
import Profile from "./pages/Profile";
import EditTournament from "./pages/EditTournament";
import { AuthProvider } from "./hooks/AuthContext";

const App = () => {
  return (
    <AuthProvider>
      <>
        <Navigation />
        <div style={{ paddingTop: "90px" }}>
          <Routes>
            {/* PUBLIC ROUTES */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/signup" element={<SignUpInfo />} />

            {/* 404 route */}
            <Route path="*" element={<UnauthorizedPage />} />

            {/* ANY LOGGED-IN USER ROUTES (player, parent, coach) */}
            <Route
              path="/calendar"
              element={
                <ProtectedRoute >
                  <Calendar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute >
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tournament/:id"
              element={
                /* some thing wrong with requiresAuth, will look into */
                <ProtectedRoute >
                  <TournamentPage />
                </ProtectedRoute>
              }
            />

            {/* COACH-ONLY ROUTES */}
            <Route
              path="/coaches"
              element={
                <ProtectedRoute  requiresCoach>
                  <CoachesOnlyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-tournament"
              element={
                <ProtectedRoute  requiresCoach>
                  <EditTournament />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coaches/add-tournament"
              element={
                <ProtectedRoute requiresCoach>
                  <AddTournamentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coaches/make-teams"
              element={
                <ProtectedRoute requiresCoach>
                  <MakeTeamsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coaches/manage-tournaments"
              element={
                <ProtectedRoute requiresCoach>
                  <ManageTournamentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coaches/calendar"
              element={
                <ProtectedRoute requiresCoach>
                  <CoachesCalendarPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </>
    </AuthProvider>
  );
};

export default App;
