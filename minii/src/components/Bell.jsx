import React from "react";
import { Link } from "react-router-dom";
import "./Bell.css";

export default function Bell({ unread = 0 }) {
  return (
    <Link to="/resident/notifications" className="bell">
      <span className="bell-icon">🔔</span>
      {unread > 0 && <span className="bell-badge">{unread}</span>}
    </Link>
  );
}
