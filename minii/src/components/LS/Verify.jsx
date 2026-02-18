import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Verify.css";
import VerifyImage from "../../assets/a.jpg";
import API from "../../api";

export default function Verify() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [houseNo, setHouseNo] = useState("");
  const [ward, setWard] = useState("");
  const [dob, setDob] = useState("");
  const [familyHeadName, setFamilyHeadName] = useState("");
  const [voterId, setVoterId] = useState("");
  const [townName, setTownName] = useState("");

  const [msg, setMsg] = useState("");

  const handleVerify = async () => {
    setMsg("");
    try {
      const res = await API.post("/auth/resident/verify", {
        fullName,
        houseNo,
        ward,
        dob,
        familyHeadName,
        voterId,
        townName,
      });

      if (res.data.ok) {
        // ✅ Verified in registry, not yet claimed → allow signup
        localStorage.setItem("verifyToken", res.data.verifyToken);
        setMsg("✅ Verified! Redirecting to signup...");
        setTimeout(() => navigate("/resident/signup"), 1500);
      } else {
        setMsg("❌ Verification failed. Contact your town admin.");
      }
    } catch (err) {
      const code = err?.response?.status;
      const message = err?.response?.data?.message || "";

      if (code === 409) {
        // Already claimed → redirect to login
        setMsg("⚠️ You already have an account. Redirecting to login...");
        setTimeout(() => navigate("/resident/login"), 1500);
      } else {
        setMsg(message || "❌ Verification failed. You are not in the database.");
      }
    }
  };

  return (
    <div className="container">
      <div className="left" style={{ overflowY: "auto", justifyContent: "flex-start" }}>
        <h2>Resident Verification</h2>
        <p className="subtitle">Verify your details to create an account.</p>

        {msg && <p className={`error-msg ${msg.includes("✅") ? "success" : ""}`}>{msg}</p>}

        <label>Full Name</label>
        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <div>
            <label>House No</label>
            <input
              type="text"
              placeholder="House No"
              value={houseNo}
              onChange={(e) => setHouseNo(e.target.value)}
            />
          </div>
          <div>
            <label>Ward</label>
            <input
              type="text"
              placeholder="Ward"
              value={ward}
              onChange={(e) => setWard(e.target.value)}
            />
          </div>
        </div>

        <label>Date of Birth</label>
        <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />

        <label>Family Head Name</label>
        <input
          type="text"
          placeholder="Family Head Name"
          value={familyHeadName}
          onChange={(e) => setFamilyHeadName(e.target.value)}
        />

        <label>Voter ID / Property ID</label>
        <input
          type="text"
          placeholder="Voter ID / Property ID"
          value={voterId}
          onChange={(e) => setVoterId(e.target.value)}
        />

        <label>Town Name</label>
        <input
          type="text"
          placeholder="Town Name"
          value={townName}
          onChange={(e) => setTownName(e.target.value)}
        />

        <button className="btn-black" onClick={handleVerify}>
          Verify & Continue
        </button>

        <div className="signup-text">
          <p>Already have an account?</p>
          <Link to="/resident/login" className="verify-link">Login Here &rarr;</Link>
        </div>
        <div className="signup-text" style={{ marginTop: 8 }}>
          <p>Already verified?</p>
          <Link to="/resident/signup" className="verify-link">Go to Sign Up &rarr;</Link>
        </div>
      </div>

      <div className="right">
        <div className="right-image" style={{ backgroundImage: `url(${VerifyImage})` }} />
      </div>
    </div>
  );
}