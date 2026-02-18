import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedVerify({ children }) {
  const verifyToken = localStorage.getItem("verifyToken");

  // ✅ if not verified, block access to signup
  if (!verifyToken) return <Navigate to="/resident/verify" replace />;

  return children;
}