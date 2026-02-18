import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import API from "../../api";
import "./RServices.css";

export default function REvents() {
  const { townSlug } = useOutletContext();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    API.get(`/resident/events?town=${townSlug}`)
      .then(r => setEvents(r.data || []))
      .catch(e => console.error(e));
  }, [townSlug]);

  return (
    <div className="rservices-container">
      <h2>📅 Upcoming Events</h2>

      <div className="rservices-list">
        {events.length === 0 ? <p className="empty-msg">No upcoming events.</p> : (
          events.map((ev) => (
            <div key={ev._id} className="rservices-card">
              {ev.image && (
                <img
                  src={`http://localhost:8081${ev.image}`}
                  alt={ev.title}
                  style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 8, marginBottom: 12 }}
                />
              )}
              <div className="card-top">
                <h4>{ev.title}</h4>
                <div className="status-badge" style={{ background: "#e2e8f0", color: "#2d3748" }}>
                  {(() => {
                    const d = new Date(ev.eventDate || ev.date);
                    return isNaN(d.getTime()) ? "Invalid Date" : d.toLocaleDateString();
                  })()}
                </div>
              </div>
              <p>{ev.description}</p>
              <div style={{ marginTop: 10, fontSize: "0.9rem", color: "#4a5568" }}>
                📍 {ev.location || "To be decided"}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
