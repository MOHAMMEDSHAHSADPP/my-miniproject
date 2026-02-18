import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import API from "../../api";
import "./RServices.css";

export default function RMap() {
  const { townSlug } = useOutletContext();
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    API.get(`/resident/map?town=${townSlug}`)
      .then(r => setMarkers(r.data || []))
      .catch(e => console.error(e));
  }, [townSlug]);

  return (
    <div className="rservices-container">
      <h2>📍 Town Map Locations</h2>
      <p style={{ marginBottom: 20, color: "#666" }}>Important landmarks and pinned locations in {townSlug}.</p>

      <div className="rservices-list">
        {markers.length === 0 ? <p className="empty-msg">No locations pinned yet.</p> : (
          markers.map((m) => (
            <div key={m._id} className="rservices-card">
              <div className="card-top">
                <h4>{m.title || m.label}</h4>
                <span className="status-badge" style={{ background: "#e2e8f0" }}>{m.category || "Place"}</span>
              </div>
              <p>{m.description}</p>
              {m.lat && m.lng && (
                <div style={{ marginTop: 10, fontSize: "0.85rem", color: "#718096" }}>
                  Coordinates: {m.lat}, {m.lng}
                </div>
              )}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${m.lat},${m.lng}`}
                target="_blank"
                rel="noreferrer"
                style={{ display: "inline-block", marginTop: 10, color: "#3182ce", textDecoration: "none", fontSize: "0.9rem" }}
              >
                🌏 View on Google Maps
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
