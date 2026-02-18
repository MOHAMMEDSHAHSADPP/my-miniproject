import React, { useState, useEffect } from "react";
import API from "../../api";
import "./RServices.css";

export default function RPolls() {
  const [polls, setPolls] = useState([]);

  const load = () => {
    API.get("/resident/polls").then(r => setPolls(r.data || [])).catch(() => { });
  };

  useEffect(() => { load(); }, []);

  const handleVote = async (pollId, optionIndex) => {
    try {
      await API.post(`/resident/polls/${pollId}/vote`, { optionIndex });
      alert("✅ Vote recorded!");
      load();
    } catch (e) {
      alert("Failed to vote (You might have already voted).");
    }
  };

  return (
    <div className="rservices-container">
      <h2>📊 Community Polls</h2>
      <div className="rservices-list">
        {polls.length === 0 ? <p className="empty-msg">No active polls.</p> : (
          polls.map((poll) => (
            <div key={poll._id} className="rservices-card">
              <h3>{poll.question}</h3>
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                {poll.options.map((opt, idx) => {
                  const totalVotes = poll.options.reduce((a, b) => a + (b.votes || 0), 0);
                  const count = opt.votes || 0;
                  const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;

                  return (
                    <div
                      key={idx}
                      onClick={() => handleVote(poll._id, idx)}
                      style={{
                        position: 'relative',
                        border: "1px solid #cbd5e0",
                        borderRadius: "8px",
                        background: "white",
                        cursor: "pointer",
                        overflow: 'hidden',
                        padding: "10px"
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: 0, left: 0, bottom: 0,
                          width: `${pct}%`,
                          background: 'rgba(76, 175, 80, 0.2)',
                          zIndex: 0,
                          transition: "width 0.3s ease"
                        }}
                      />
                      <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between' }}>
                        <span>{opt.text}</span>
                        <span>{pct}% ({count} votes)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 10, fontSize: "0.85rem", color: "#718096" }}>
                Total Votes: {poll.options.reduce((a, b) => a + b.votes, 0)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
