
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Shield, Home } from "lucide-react";
import "./Role.css";

const RoleCard = ({ label, description, icon: Icon, color, onClick }) => (
  <div
    className="role-card-2d"
    onClick={onClick}
    style={{ borderColor: color, boxShadow: `0 4px 15px ${color}40` }}
  >
    <div className="icon-wrapper" style={{ color: color, background: `${color}10` }}>
      <Icon size={48} />
    </div>
    <h3>{label}</h3>
    <p>{description}</p>
  </div>
);

export default function Role() {
  const navigate = useNavigate();

  const handleSelect = (role) => {
    if (role === "admin") navigate("/admin/login");
    else if (role === "citizen") navigate("/resident/login");
    else if (role === "visitor") navigate("/visitor");
  };

  return (
    <div className="role-page-container">
      <div className="header-section">
        <h1>Select Your Role</h1>
        <p>Explore the town by choosing your character</p>
      </div>

      <div className="cards-grid">
        <RoleCard
          label="ADMIN"
          description="Manage the town, users, and events."
          icon={Shield}
          color="#6200ea"
          onClick={() => handleSelect("admin")}
        />
        <RoleCard
          label="VISITOR"
          description="Explore public areas and places."
          icon={Users}
          color="#d500f9"
          onClick={() => handleSelect("visitor")}
        />
        <RoleCard
          label="CITIZEN"
          description="Live, work, and interact."
          icon={Home}
          color="#7c4dff"
          onClick={() => handleSelect("citizen")}
        />
      </div>
    </div>
  );
}