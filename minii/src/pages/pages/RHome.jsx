import React, { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import API from "../../api";
import "./RHome.css";

export default function RHome() {
  const { townSlug } = useOutletContext();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [polls, setPolls] = useState([]);
  const [events, setEvents] = useState([]);
  const [budgets, setBudgets] = useState([]);

  useEffect(() => {
    API.get(`/resident/home?town=${townSlug}`).then((r) => setData(r.data)).catch(() => { });
    loadPolls();
    loadEvents();
    loadBudget();
  }, [townSlug]);

  const loadPolls = async () => {
    try {
      const res = await API.get("/resident/polls");
      setPolls(res.data || []);
    } catch (e) {
      console.error("Polls error", e);
    }
  };

  const loadEvents = async () => {
    try {
      const res = await API.get(`/resident/events?town=${townSlug}`);
      setEvents(res.data || []);
    } catch (e) {
      console.error("Events error", e);
    }
  };

  const loadBudget = async () => {
    try {
      const res = await API.get("/resident/budget");
      setBudgets(res.data || []);
    } catch (e) {
      console.error("Budget error", e);
    }
  };

  const handleVote = async (pollId, optionIndex) => {
    try {
      await API.post(`/resident/polls/${pollId}/vote`, { optionIndex });
      loadPolls();
    } catch (e) {
      alert(e.response?.data?.message || "Vote failed");
    }
  };

  const base = `/resident/${townSlug}`;
  const userId = (() => { try { return JSON.parse(localStorage.getItem("user"))?._id; } catch { return null; } })();

  // Budget totals
  const totalAllocated = budgets.reduce((s, b) => s + (b.allocated || 0), 0);
  const totalSpent = budgets.reduce((s, b) => s + (b.spent || 0), 0);

  return (
    <div className="rh-container">
      {/* WELCOME SECTION */}
      <div className="rh-welcome-card">
        <div className="rh-welcome-text">
          <h1>Hello, {data?.welcome?.name || "Resident"}! 👋</h1>
          <p>Welcome to your <b>{townSlug?.charAt(0).toUpperCase() + townSlug?.slice(1)}</b> dashboard.</p>
        </div>
      </div>

      {/* ALERTS BANNER */}
      {data?.shownOnLogin && (
        <div className={`rh-alert-banner ${data.shownOnLogin.type}`}>
          <div className="rh-alert-icon">
            {data.shownOnLogin.type === "alert" ? "🚨" : "📢"}
          </div>
          <div className="rh-alert-content">
            <h3>{data.shownOnLogin.item.title || "Important Update"}</h3>
            <p>{data.shownOnLogin.item.message || data.shownOnLogin.item.description}</p>
          </div>
        </div>
      )}

      {/* WIDGETS GRID */}
      <div className="rh-grid">

        {/* ===== EVENTS WIDGET ===== */}
        <div className="rh-card">
          <div className="rh-card-header">
            <h3>📅 Upcoming Events</h3>
            <button onClick={() => navigate(`${base}/events`)}>View All</button>
          </div>
          <div className="rh-card-body">
            {events.length > 0 ? (
              <div className="rh-events-list">
                {events.slice(0, 3).map((ev) => (
                  <div key={ev._id} className="rh-event-item" style={{ display: "flex", gap: 10 }}>
                    {ev.image && (
                      <img
                        src={`http://localhost:8081${ev.image}`}
                        alt="Event"
                        style={{ width: 50, height: 50, borderRadius: 8, objectFit: "cover" }}
                      />
                    )}
                    <div>
                      <div className="rh-event-date">
                        <span className="rh-event-day">
                          {(() => {
                            const d = new Date(ev.eventDate || ev.date || Date.now()); // Fallback to now if missing to prevent crash, or handle empty
                            return isNaN(d.getTime()) ? "--" : d.getDate();
                          })()}
                        </span>
                        <span className="rh-event-month">
                          {(() => {
                            const d = new Date(ev.eventDate || ev.date || Date.now());
                            return isNaN(d.getTime()) ? "TBD" : d.toLocaleString("default", { month: "short" });
                          })()}
                        </span>
                      </div>
                      <div className="rh-event-info">
                        <b>{ev.title}</b>
                        <span>📍 {ev.location || "TBD"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rh-empty">No upcoming events.</p>
            )}
          </div>
        </div>

        {/* ===== GOVERNMENT NOTICES ===== */}
        <div className="rh-card">
          <div className="rh-card-header">
            <h3>🏛️ Notices & Alerts</h3>
            <button onClick={() => navigate(`${base}/alerts-notices`)}>View All</button>
          </div>
          <div className="rh-card-body">
            {data?.notices?.length > 0 ? (
              <ul className="rh-list">
                {data.notices.map((n) => (
                  <li key={n._id} className="rh-list-item">
                    <span className="rh-tag">Notice</span>
                    <span>{n.title}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rh-empty">No public notices at the moment.</p>
            )}
          </div>
        </div>

        {/* ===== BUDGET OVERVIEW ===== */}
        <div className="rh-card">
          <div className="rh-card-header">
            <h3>💰 Budget Overview</h3>
            <button onClick={() => navigate(`${base}/budget`)}>Details</button>
          </div>
          <div className="rh-card-body">
            {budgets.length > 0 ? (
              <div className="rh-budget-overview">
                <div className="rh-budget-stat">
                  <span className="rh-budget-label">Allocated</span>
                  <span className="rh-budget-value allocated">₹{totalAllocated.toLocaleString()}</span>
                </div>
                <div className="rh-budget-stat">
                  <span className="rh-budget-label">Spent</span>
                  <span className="rh-budget-value spent">₹{totalSpent.toLocaleString()}</span>
                </div>
                <div className="rh-budget-stat">
                  <span className="rh-budget-label">Remaining</span>
                  <span className="rh-budget-value remaining">₹{(totalAllocated - totalSpent).toLocaleString()}</span>
                </div>
                <div className="rh-budget-bar">
                  <div
                    className="rh-budget-fill"
                    style={{ width: `${totalAllocated > 0 ? (totalSpent / totalAllocated * 100) : 0}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="rh-empty">No budget data published yet.</p>
            )}
          </div>
        </div>

        {/* ===== VOLUNTEERS ===== */}
        <div className="rh-card">
          <div className="rh-card-header">
            <h3>🤝 Active Volunteers</h3>
            <button onClick={() => navigate(`${base}/volunteers`)}>Find Help</button>
          </div>
          <div className="rh-card-body">
            {data?.volunteers?.length > 0 ? (
              <div className="rh-avatars">
                {data.volunteers.slice(0, 5).map((v) => (
                  <div key={v._id} className="rh-avatar" title={v.name}>
                    {v.name.charAt(0)}
                  </div>
                ))}
                {data.volunteers.length > 5 && <div className="rh-more">+{data.volunteers.length - 5}</div>}
              </div>
            ) : (
              <p className="rh-empty">No active volunteers nearby.</p>
            )}
          </div>
        </div>

        {/* ===== QUICK SERVICES ===== */}
        <div className="rh-card">
          <div className="rh-card-header">
            <h3>⚡ Quick Services</h3>
          </div>
          <div className="rh-services-grid">
            <button onClick={() => navigate(`${base}/complaints`)}>⚠️ Report Issue</button>
            <button onClick={() => navigate(`${base}/market`)}>🛒 Market</button>
            <button onClick={() => navigate(`${base}/tickets`)}>🎫 Tickets</button>
            <button onClick={() => navigate(`${base}/services`)}>🛠️ Services</button>
          </div>
        </div>

        {/* ===== WARD CHAT ===== */}
        <div className="rh-card highlight">
          <div className="rh-card-header">
            <h3>💬 Ward Chat</h3>
          </div>
          <div className="rh-card-body">
            <p>Connect with neighbors in Ward {data?.welcome?.ward || "?"}.</p>
            <button className="rh-btn-primary" onClick={() => navigate(`${base}/chat`)}>
              Open Chat
            </button>
          </div>
        </div>

        {/* ===== POLLS WIDGET ===== */}
        <div className="rh-card rh-card-wide">
          <div className="rh-card-header">
            <h3>📊 Community Polls</h3>
          </div>
          <div className="rh-card-body">
            {polls.length > 0 ? (
              <div className="rh-polls-list">
                {polls.slice(0, 3).map((poll) => {
                  const hasVoted = poll.votedUsers?.includes(userId) ||
                    poll.votes?.some(v => v.userId === userId);
                  const totalVotes = poll.votes?.length || 0;

                  return (
                    <div key={poll._id} className="rh-poll-item">
                      <h4>{poll.question}</h4>
                      <div className="rh-poll-options">
                        {poll.options.map((opt, idx) => {
                          const count = poll.votes?.filter(v => v.optionIndex === idx).length || 0;
                          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;

                          return (
                            <div
                              key={idx}
                              className={`rh-poll-opt ${hasVoted ? 'voted' : ''}`}
                              onClick={() => !hasVoted && handleVote(poll._id, idx)}
                              style={{ position: 'relative', overflow: 'hidden' }}
                            >
                              <div
                                className="rh-poll-bar"
                                style={{
                                  position: 'absolute',
                                  top: 0, left: 0, bottom: 0,
                                  width: `${pct}%`,
                                  background: 'rgba(76, 175, 80, 0.2)',
                                  zIndex: 0,
                                  transition: "width 0.3s ease"
                                }}
                              />
                              <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                <span className="rh-poll-text">{opt.text}</span>
                                <span className="rh-poll-pct">{pct}% ({count})</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {hasVoted && <p className="rh-voted-msg" style={{ color: "green", marginTop: 4, fontSize: "0.85rem" }}>✅ You voted</p>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="rh-empty">No active polls.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
