import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext'; // Adjust path as needed

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresCoach?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiresCoach = false,
}) => {
  // ✅ Hooks ONLY called inside component body
  const { isAuthenticated, isCoach, user } = useAuth();
  const location = useLocation();

  // Debug logging
  console.debug('[ProtectedRoute] Auth State:', {
    isAuthenticated,
    isCoach,
    user,
    requiresCoach,
    currentPath: location.pathname,
    timestamp: new Date().toISOString(),
  });

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiresCoach && !isCoach) {
    return <Navigate to="/unauthorized" replace />;
  }

  console.debug('[ProtectedRoute] Access granted:', {
    path: location.pathname,
    userRole: user?.role,
  });

  return <>{children}</>;
};

export default ProtectedRoute;