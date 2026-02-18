import React, { useEffect, useState } from "react";
import API from "../../api";
import { useNavigate } from "react-router-dom";
import "./residentEntry.css";

export default function ResidentEntry() {
  const nav = useNavigate();
  const [towns, setTowns] = useState([]);
  const [townSlug, setTownSlug] = useState("");

  useEffect(() => {
    // Use visitor towns list (existing) for dropdown
    API.get("/visitor/towns")
      .then((res) => setTowns(res.data || []))
      .catch(() => setTowns([]));
  }, []);

  return (
    <div className="re-wrap">
      <div className="re-card">
        <div className="re-badge">Resident</div>
        <h2>Where do you live?</h2>
        <p className="re-sub">Select your town. You will enter your town space.</p>

        <label className="re-label">Town</label>
        <select value={townSlug} onChange={(e) => setTownSlug(e.target.value)} className="re-select">
          <option value="">Choose town</option>
          {towns.map((t) => (
            <option key={t._id} value={t.townSlug}>
              {t.townName} ({t.district})
            </option>
          ))}
        </select>

        <button
          className="re-btn"
          onClick={() => {
            if (!townSlug) return alert("Select your town");
            localStorage.setItem("residentTownSlug", townSlug); // used as fallback
            nav(`/resident/${townSlug}`);
          }}
        >
          Continue
        </button>

        <p className="re-note">
          Note: real access is still controlled by your backend using JWT townSlug.
        </p>
      </div>
    </div>
  );
}
