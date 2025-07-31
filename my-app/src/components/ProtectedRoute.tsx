import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode; requiresCoach?: boolean }> = ({
  children,
  requiresCoach = false,
}) => {
  const { isAuthenticated, user, isCoach, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div style={{ textAlign: "center", marginTop: 80 }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // COACH-ONLY routes
  if (requiresCoach && !isCoach) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Shared access routes: allow player, parent, or alumni
  const allowedRoles = ["player", "parent", "alumni", "assistant coach", "coach"];
  if (!requiresCoach && !allowedRoles.includes(user?.role || "")) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};


export default ProtectedRoute;

