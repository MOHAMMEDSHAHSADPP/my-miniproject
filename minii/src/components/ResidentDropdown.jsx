import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./ResidentDropdown.css";

export default function ResidentDropdown() {
  const [open, setOpen] = useState(false);

  return (
    <div className="dd">
      <button className="dd-btn" onClick={() => setOpen((s) => !s)}>
        Resident ▾
      </button>

      {open && (
        <div className="dd-menu" onMouseLeave={() => setOpen(false)}>
          <div className="dd-group">Chat</div>
          <Link to="/resident/chat/town" className="dd-item">Town Chat</Link>
          <Link to="/resident/chat/ward" className="dd-item">Ward Chat</Link>

          <div className="dd-group">Panchayat</div>
          <Link to="/resident/tickets" className="dd-item">Support Tickets</Link>
          <Link to="/resident/complaints" className="dd-item">Complaints</Link>

          <div className="dd-group">Town</div>
          <Link to="/resident/alerts" className="dd-item">Alerts</Link>
          <Link to="/resident/gov-notices" className="dd-item">Gov Notices</Link>
          <Link to="/resident/events" className="dd-item">Events</Link>

          <div className="dd-group">Services</div>
          <Link to="/resident/services" className="dd-item">Gas/Waste/Bills</Link>
          <Link to="/resident/works" className="dd-item">Works Tracker</Link>
          <Link to="/resident/volunteers" className="dd-item">Volunteer</Link>
          <Link to="/resident/map" className="dd-item">Issue Map</Link>

          <div className="dd-group">Market</div>
          <Link to="/resident/market" className="dd-item">Marketplace</Link>
          <Link to="/resident/market/my-orders" className="dd-item">My Orders</Link>
          <Link to="/resident/market/seller-orders" className="dd-item">Seller Orders</Link>

          <div className="dd-group">Me</div>
          <Link to="/resident/profile" className="dd-item">Profile</Link>
        </div>
      )}
    </div>
  );
}
