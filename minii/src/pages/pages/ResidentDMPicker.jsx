import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ResidentDMPicker() {
  const [userId, setUserId] = useState("");
  const nav = useNavigate();

  const go = () => {
    if (!userId.trim()) return alert("Enter userId");
    nav(`/resident/dm/${userId}`);
  };

  return (
    <div className="card">
      <h2 className="h1">Direct Message</h2>
      <p className="muted">
        For now paste the userId. (Later we can add “Town users list” endpoint and show names.)
      </p>

      <div className="card" style={{ marginTop: 12 }}>
        <input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Other user's MongoDB _id"
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 10,
            border: "1px solid var(--border)",
          }}
        />
        <button className="btn" style={{ marginTop: 12 }} onClick={go}>
          Open Chat
        </button>
      </div>
    </div>
  );
}
