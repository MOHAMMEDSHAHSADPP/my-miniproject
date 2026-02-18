import React from "react";
import { NavLink, Outlet, useParams } from "react-router-dom";
import "./town.css";
import ChatbotWidget from "./ChatbotWidget";

export default function TownLayout() {
  const { townSlug } = useParams();

  return (
    <div className="tw-shell">
      <header className="tw-top">
        <div className="tw-brand">
          <div className="tw-name">{townSlug?.toUpperCase()} CONNECT</div>
        </div>

        <nav className="tw-nav">
          <NavLink end to={`/town/${townSlug}`}>Home</NavLink>
          <NavLink to={`/town/${townSlug}/places`}>Places</NavLink>
          <NavLink to={`/town/${townSlug}/services`}>Services</NavLink>
          <NavLink to={`/town/${townSlug}/announcements`}>Announcements</NavLink>
          <NavLink to={`/town/${townSlug}/travel`}>Travel</NavLink>
          <NavLink to={`/town/${townSlug}/complaints`}>Complaints</NavLink>
          <NavLink to={`/town/${townSlug}/map`} style={{ color: '#00ff00' }}>🗺️ Map</NavLink>
          <NavLink to={`/town/${townSlug}/emergency`}>Emergency</NavLink>
          <NavLink to={`/town/${townSlug}/warnings`} style={{ color: '#ef4444' }}>Warning Places</NavLink>
        </nav>
      </header>

      <main className="tw-main">
        <Outlet />
      </main>

      <ChatbotWidget />
    </div>
  );
}
