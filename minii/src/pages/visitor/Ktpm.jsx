import React from "react";
import { useNavigate } from "react-router-dom";
import "./Ktpm.css";
import KTBM from "../../assets/ktpm.jpg"; // ✅ adjust if your path differs

export default function Ktpm() {
  const navigate = useNavigate();

  const enterTown = () => {
    // ✅ enter the town website
    navigate("/town/kuttippuram");
  };

  return (
    <div className="tp-wrap">
      <div
        className="tp-bg"
        style={{ backgroundImage: `url(${KTBM})` }}
        aria-hidden="true"
      />
      <div className="tp-overlay" />

      <button className="tp-welcome" onClick={enterTown}>
        Welcome →
      </button>

      <div className="tp-text">
        <h1 className="tp-title">Kuttippuram</h1>
        <p className="tp-desc">
          Kuttippuram is a lively town in Malappuram district known for its calm river-side
          vibe, strong local markets, great food spots, and easy travel connections.
          It’s a convenient hub between nearby towns and a comfortable place for visitors.
        </p>
      </div>
    </div>
  );
}
