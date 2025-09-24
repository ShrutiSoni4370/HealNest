import React from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../context/userContext";

const ProtectedRoute = ({ children }) => {
  const { userData, loading } = useUser(); // get loading state too

  if (loading) {
    // While restoring session, show loading or spinner
    return <div>Loading...</div>;
  }

  if (!userData) {
    // Not logged in → redirect to login
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
