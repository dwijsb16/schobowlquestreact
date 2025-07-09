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
import SignUpInfo from "./pages/SignUpInfo"; // Ensure the casing matches the actual file name
import Profile from "./pages/Profile";
import { AuthProvider } from "./hooks/AuthContext"; // Adjust the import path as needed

const App = () => {
  return (
    <AuthProvider>

    <>
      <Navigation />
      {/* Add padding below the navbar */}
      <div style={{ paddingTop: "90px" }}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/signup" element={<SignUpInfo />} />


          {/* Catch-all route for 404 */}
          <Route path="*" element={<UnauthorizedPage />} />
          {/* player/parent only routes*/}
          {/*<Route path="/calendar" element={<Calendar />} />*/}

          <Route path="/calendar"
            element={
              <ProtectedRoute requiresCoach={true}>
                <Calendar />
              </ProtectedRoute>
            }/>
          <Route path="/profile"
            element={
              <ProtectedRoute requiresCoach={true}>
                <Profile />
              </ProtectedRoute>
            }/>
          {/*<Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/tournament" element={<TournamentPage />} /> */}

<Route
  path="/tournament/:id"
  element={
    <ProtectedRoute requiresCoach={true}>
      <TournamentPage />
    </ProtectedRoute>
  }
/>

          {/* Coaches-only routes */}
          {/*<Route path="/coaches" element={<CoachesOnlyPage />} />
          <Route path="/coaches/add-tournament" element={<AddTournamentPage />} />
          <Route path="/coaches/make-teams" element={<MakeTeamsPage />} />
          <Route path="/coaches/manage-tournaments" element={<ManageTournamentsPage />} />
          <Route path="/coaches/calendar" element={<CoachesCalendarPage />} />*/}

          <Route path="/coaches"
            element={
              <ProtectedRoute requiresCoach={true}>
                <CoachesOnlyPage />
              </ProtectedRoute>
            }/>
            <Route path="/coaches/add-tournament"
            element={
              <ProtectedRoute requiresCoach={true}>
                <AddTournamentPage />
              </ProtectedRoute>
            }/>
            <Route path="/coaches/make-teams"
            element={
              <ProtectedRoute requiresCoach={true}>
                <MakeTeamsPage />
              </ProtectedRoute>
            }/>
            <Route path="/coaches/manage-tournaments"
            element={
              <ProtectedRoute requiresCoach={true}>
                <ManageTournamentsPage />
              </ProtectedRoute>
            }/>
            <Route path="/coaches/calendar"
            element={
              <ProtectedRoute requiresCoach={true}>
                <CoachesCalendarPage />
              </ProtectedRoute>
            }/>
        </Routes>
      </div>
    </>
    </AuthProvider>
  );
};

export default App;