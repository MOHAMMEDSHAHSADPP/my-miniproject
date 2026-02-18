import React, { useEffect, useState, useRef } from "react";
import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import API from "../../api";
import "./residentLayout.css";

export default function ResidentLayout() {
  const nav = useNavigate();
  const { townSlug } = useParams();
  const [unread, setUnread] = useState(0);
  const [welcome, setWelcome] = useState(null);
  const [loginBanner, setLoginBanner] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const profileRef = useRef(null);

  const load = async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("No user");
      const user = JSON.parse(userStr);

      if (user.townSlug && user.townSlug !== townSlug) {
        alert(`⚠️ Access Denied! You belong to ${user.townSlug}, not ${townSlug}.`);
        nav(`/resident/${user.townSlug}`, { replace: true });
        return;
      }

      const home = await API.get("/resident/home");
      setWelcome(home.data?.welcome || null);
      setUnread(home.data?.unreadCount || 0);
      setLoginBanner(home.data?.shownOnLogin || null);
    } catch (e) {
      localStorage.removeItem("token");
      nav("/", { replace: true });
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(async () => {
      try {
        const r = await API.get("/resident/notifications/unread-count");
        setUnread(r.data?.unread || 0);
      } catch { }
    }, 6000);
    return () => clearInterval(t);
  }, [townSlug]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const base = `/resident/${townSlug}`;

  return (
    <div className="rl-wrap">
      <header className="rl-top">
        {/* Brand */}
        {/* Brand */}
        <div className="rl-brand-area" onClick={() => nav("/")}>
          <div className="rl-brand-name">
            {townSlug?.charAt(0).toUpperCase() + townSlug?.slice(1)}
          </div>
          <div className="rl-brand-sub">Urban Connect · Resident</div>
        </div>

        {/* Hamburger for mobile */}
        <button className="rl-hamburger" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? "✕" : "☰"}
        </button>

        {/* Navigation */}
        <nav className={`rl-nav ${mobileOpen ? "open" : ""}`}>
          <NavLink to={base} end onClick={() => setMobileOpen(false)}>🏠 Home</NavLink>
          <NavLink to={`${base}/alerts-notices`} onClick={() => setMobileOpen(false)}>📢 Alerts</NavLink>
          <NavLink to={`${base}/events`} onClick={() => setMobileOpen(false)}>📅 Events</NavLink>
          <NavLink to={`${base}/chat`} onClick={() => setMobileOpen(false)}>💬 Chat</NavLink>
          <NavLink to={`${base}/services`} onClick={() => setMobileOpen(false)}>🛠️ Services</NavLink>
          <NavLink to={`${base}/market`} onClick={() => setMobileOpen(false)}>🛒 Market</NavLink>
          <NavLink to={`${base}/works`} onClick={() => setMobileOpen(false)}>🚧 Works</NavLink>
          <NavLink to={`${base}/directory`} onClick={() => setMobileOpen(false)}>📞 Directory</NavLink>
          <NavLink to={`${base}/budget`} onClick={() => setMobileOpen(false)}>💰 Budget</NavLink>

          {/* Profile Section */}
          <div className="rl-profile-section" ref={profileRef}>
            <button
              className="rl-profile-btn"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              <span className="rl-profile-avatar">
                {welcome?.name?.charAt(0)?.toUpperCase() || "👤"}
              </span>
              {unread > 0 && <span className="rl-notif-dot" />}
            </button>

            {profileOpen && (
              <div className="rl-profile-dropdown">
                <div className="rl-profile-header">
                  <div className="rl-profile-name">{welcome?.name || "Resident"}</div>
                  <div className="rl-profile-ward">
                    {welcome?.ward ? `Ward ${welcome.ward}` : townSlug?.toUpperCase()}
                  </div>
                </div>
                <div className="rl-dropdown-divider" />
                <button onClick={() => { nav(`${base}/profile`); setProfileOpen(false); setMobileOpen(false); }}>
                  👤 My Profile
                </button>
                <button onClick={() => { nav(`${base}/notifications`); setProfileOpen(false); setMobileOpen(false); }}>
                  🔔 Notifications {unread > 0 && <span className="rl-dropdown-badge">{unread}</span>}
                </button>
                {/* Budget removed from here */}
                <button onClick={() => { nav(`${base}/volunteers`); setProfileOpen(false); setMobileOpen(false); }}>
                  🤝 Volunteer
                </button>
                <div className="rl-dropdown-divider" />
                <button
                  className="rl-logout-btn"
                  onClick={() => {
                    localStorage.removeItem("token");
                    nav("/", { replace: true });
                  }}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </nav>
      </header>

      {loginBanner?.item && (
        <div className={`rl-banner ${loginBanner.type === "alert" ? "alert" : "notif"}`}>
          <b>{loginBanner.type === "alert" ? "🚨 URGENT:" : "📢 NOTICE:"}</b>{" "}
          {loginBanner.item.title || loginBanner.item.message || "Important update"}
        </div>
      )}

      <main className="rl-main">
        <Outlet context={{ townSlug }} />
      </main>
    </div>
  );
}
