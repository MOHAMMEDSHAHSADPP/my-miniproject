import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function VisitorPanel() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the Visitor Selection page to avoid confusion
    // The user explicitly does NOT want this page to be an "Admin" or "Selector"
    // So the safest default is the main landing/select page.
    navigate("/visitor", { replace: true });
  }, [navigate]);

  return <div style={{ height: '100vh', background: '#0f172a' }}></div>;
}
