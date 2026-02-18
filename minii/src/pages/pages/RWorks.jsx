import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import API from "../../api";
import "./RServices.css";

export default function RWorks() {
  const { townSlug } = useOutletContext();
  const [works, setWorks] = useState([]);

  useEffect(() => {
    API.get(`/resident/works?town=${townSlug}`)
      .then(r => setWorks(r.data || []))
      .catch(e => console.error(e));
  }, [townSlug]);

  return (
    <div className="rservices-container">
      <h2>🚧 Public Works & Development</h2>
      <div className="rservices-list">
        {works.length === 0 ? <p className="empty-msg">No ongoing works reported.</p> : (
          works.map((w) => (
            <div key={w._id} className="rservices-card">
              <div className="card-top">
                <h4>{w.title}</h4>
                <div className={`status-badge ${w.status || 'Planned'}`}>{w.status || 'Planned'}</div>
              </div>
              {w.image && (
                <img
                  src={w.image}
                  alt={w.title}
                  style={{ width: "100%", height: "180px", objectFit: "cover", borderRadius: "10px", marginBottom: "10px" }}
                />
              )}
              <p>{w.description}</p>
              <div style={{ marginTop: 10, fontSize: "0.9rem", color: "#4a5568", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
                <span>💰 Budget: ₹{w.budget?.toLocaleString() || "N/A"}</span>
                <span>📅 Deadline: {w.deadline ? new Date(w.deadline).toLocaleDateString() : "TBD"}</span>
                {w.mapLink && (
                  <a
                    href={w.mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#4b34c8", fontWeight: "600", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    📍 View on Map
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
