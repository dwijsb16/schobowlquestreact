import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode; requiresCoach?: boolean }> = ({
  children,
  requiresCoach = false,
}) => {
  const { isAuthenticated, isCoach, loading } = useAuth();
  const location = useLocation();

  // Wait for AuthContext to load
  if (loading) {
    // You can return a spinner here!
    return <div style={{ textAlign: "center", marginTop: 80 }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (requiresCoach && !isCoach) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

