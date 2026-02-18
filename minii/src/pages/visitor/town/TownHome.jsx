// TownHome.jsx
import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import API from "../../../api";
import {
  MapPin, TrendingUp, Building2, Megaphone, ArrowRight,
  Activity, Users, ThumbsUp, Calendar
} from "lucide-react";
import "./town.css"; // Uses the new styles added
import TrendingCarousel from "./TrendingCarousel";

export default function TownHome() {
  const { townSlug } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [msg, setMsg] = useState("");
  const [showComplaintModal, setShowComplaintModal] = useState(false);

  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const formProps = Object.fromEntries(fd);

    // Map frontend fields to backend expectation
    const payload = {
      fromName: formProps.name || "",
      fromEmail: formProps.contact || "", // user might enter email here
      fromPhone: formProps.contact || "", // or phone number
      message: `[${formProps.subject}] ${formProps.description}`,
      type: "complaint"
    };

    try {
      await API.post(`/visitor/${townSlug}/complaints`, payload);
      alert("Complaint submitted successfully!");
      setShowComplaintModal(false);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to submit complaint. Please try again.");
    }
  };

  useEffect(() => {
    const load = async () => {
      setMsg("");
      try {
        const res = await API.get(`/visitor/${townSlug}/home`);
        setData(res.data);
      } catch (err) {
        setMsg(err?.response?.data?.message || "Failed to load town");
      }
    };
    load();
  }, [townSlug]);

  if (msg) return <div className="tl-error">{msg}</div>;
  if (!data) return <div className="tl-loading"><div className="spinner"></div></div>;

  const { town, trending, announcements, popularPlaces, warningPlaces } = data;
  const hero = town?.heroImage ? `http://localhost:8081${town.heroImage}` : "";

  return (
    <div className="tw-shell">
      {/* 1. DYNAMIC BACKGROUND */}
      <div
        className="fixed-bg"
        style={{ backgroundImage: hero ? `url(${hero})` : 'none', backgroundColor: '#0f172a' }}
      />
      <div className="bg-overlay" />

      {/* 2. HERO SECTION */}
      <div className="hero-section" style={{ paddingBottom: "6rem" }}>
        <div style={{ textAlign: 'center', maxWidth: '900px', margin: '0 auto' }}>
          <div className="location-badge">
            <MapPin size={14} style={{ display: 'inline', marginRight: 6 }} />
            {town?.townName} Network
          </div>

          <div className="hero-title glitch-effect">
            <span>Empowering</span> <span className="text-gradient play-font">{town?.townName}</span>
          </div>

          <p className="hero-description">
            {town?.about || "The future of urban living is here. Connect with municipal services, report issues instantly, and shape your community's destiny."}
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 20 }}>
            <button className="pd-contact-btn primary" onClick={() => navigate(`/town/${townSlug}/places`)} style={{ minWidth: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Explore Services <ArrowRight size={20} style={{ marginLeft: 8 }} />
            </button>
            <button className="pd-contact-btn secondary" onClick={() => navigate("/visitor")} style={{ minWidth: '200px' }}>
              Change Location
            </button>
          </div>
        </div>
      </div>

      {/* 3. GLASS STATS SECTION */}


      {/* 4. TRENDING (GRID REVERT - NO ROTATION) */}
      <section className="trending-section" style={{ padding: "4rem 20px" }}>
        <div className="tl-container">
          <h2 className="hero-title" style={{ fontSize: "2.5rem", color: "var(--th-text)", textAlign: "center", marginBottom: "3rem" }}>
            Trending <span className="text-gradient">Now</span>
          </h2>

          <div className="tl-grid">
            {trending?.length > 0 ? (
              trending.map((t) => (
                <div key={t._id} className="tl-card" style={{ background: "white" }}>
                  <div className="tl-card-img" style={{ backgroundImage: t.image ? `url(http://localhost:8081${t.image})` : 'none', height: "250px" }}>
                    <div className="tl-cat-tag">Trending</div>
                  </div>
                  <div className="tl-card-body">
                    <h3 className="tl-card-title">{t.title}</h3>
                    <p className="tl-card-info">{t.subtitle}</p>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#64748b", padding: "40px" }}>
                Faster, smoother, better — new trends coming soon.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4.5 WARNING PLACES SECTION (NEW) */}
      {warningPlaces?.length > 0 && (
        <section className="warning-section" style={{ padding: "4rem 20px", background: "#fef2f2" }}>
          <div className="tl-container">
            <h2 className="hero-title" style={{ fontSize: "2.5rem", color: "#dc2626", textAlign: "center", marginBottom: "3rem" }}>
              Restricted / <span style={{ color: "#ef4444" }}>Warning Areas</span>
            </h2>
            <div className="tl-grid">
              {warningPlaces.map((w) => (
                <div key={w._id} className="tl-card" style={{ background: "white", border: "2px solid #fecaca" }}>
                  <div className="tl-card-img" style={{ backgroundImage: `url(http://localhost:8081${w.image})`, height: "200px" }}>
                    <div className="tl-cat-tag" style={{ background: "#dc2626" }}>DANGER</div>
                  </div>
                  <div className="tl-card-body">
                    <h3 className="tl-card-title" style={{ color: "#b91c1c" }}>{w.title}</h3>
                    <p className="tl-card-info">{w.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button className="pd-contact-btn secondary" style={{ borderColor: '#dc2626', color: '#dc2626' }} onClick={() => navigate(`/town/${townSlug}/warnings`)}>
                View All Warnings
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 5. UPDATES / ANNOUNCEMENTS SECTION */}
      {announcements?.length > 0 && (
        <div className="updates-section">
          <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '3rem', color: 'white', fontWeight: 700 }}>
            {town?.townName} <span className="text-gradient">Announcements & News</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
            {announcements.map(update => (
              <div key={update._id} className="update-card" style={{ background: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#1f2937', fontWeight: 700 }}>{update.title}</h3>
                  {update.date && (
                    <span style={{
                      fontSize: '0.8rem',
                      color: 'var(--th-primary)',
                      background: 'rgba(139, 92, 246, 0.1)',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '20px',
                      fontWeight: 600
                    }}>
                      {new Date(update.date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p style={{ color: '#4b5563', fontSize: '1rem', lineHeight: '1.6' }}>{update.description}</p>
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '10px' }}>
                  {update.priority === 'high' && <span style={{ fontSize: '0.75rem', background: '#fee2e2', color: '#ef4444', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>CRITICAL</span>}
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link to={`/town/${townSlug}/announcements`} className="pd-contact-btn secondary" style={{ fontSize: '1.1rem', textDecoration: 'none', display: 'inline-block' }}>
              View All Announcements →
            </Link>
          </div>
        </div>
      )}

      {/* 6. POPULAR PLACES SNEAK PEEK */}
      {popularPlaces?.length > 0 && (
        <div className="updates-section" style={{ marginBottom: '80px' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '3rem', color: 'white', fontWeight: 700 }}>
            Explore <span className="text-gradient">Places</span>
          </h2>
          <div className="tl-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {popularPlaces.slice(0, 3).map((p) => (
              <div key={p._id} className="tl-card" onClick={() => navigate(`/town/${townSlug}/place/${p._id}`)} style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.9)' }}>
                <div className="tl-card-img" style={{ backgroundImage: p.images?.[0] ? `url(http://localhost:8081${p.images[0]})` : undefined }}>
                  <div className="tl-cat-tag">{p.category}</div>
                </div>
                <div className="tl-card-body">
                  <h3 className="tl-card-title">{p.title}</h3>
                  <div className="tl-card-info" style={{ marginBottom: 0 }}>
                    <MapPin size={14} style={{ display: 'inline', marginRight: 4 }} />
                    {p.address}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button className="pd-contact-btn secondary" onClick={() => navigate(`/town/${townSlug}/places`)} style={{ background: 'white', color: 'black' }}>
              View Directory
            </button>
          </div>
        </div>
      )}

      {/* COMPLAINT / EMERGENCY SECTION */}
      <section style={{ background: "var(--th-card-bg)", padding: "4rem 20px", marginTop: "4rem", borderTop: "var(--th-glass-border)" }}>
        <div className="tl-container" style={{ maxWidth: "800px", textAlign: "center" }}>
          <h2 className="hero-title" style={{ fontSize: "2.5rem", color: "var(--th-text)", marginBottom: "1rem" }}>
            Need <span className="text-gradient">Help?</span>
          </h2>
          <p className="hero-description" style={{ color: "var(--th-text-muted)", margin: "0 auto 2rem" }}>
            Reach out to emergency services or file a complaint directly to the town administration.
          </p>

          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center" }}>
            <Link to={`/town/${townSlug}/emergency`} className="pd-contact-btn primary" style={{ textDecoration: "none", fontSize: "1.1rem", padding: "14px 32px" }}>
              Emergency Contacts
            </Link>
            <button
              onClick={() => setShowComplaintModal(true)}
              className="pd-contact-btn secondary"
              style={{ fontSize: "1.1rem", padding: "14px 32px" }}
            >
              File a Complaint
            </button>
          </div>
          <p style={{ fontSize: "0.85rem", color: "#9ca3af", marginTop: "1rem" }}>
            *Complaints filed here are visible to town admins.
          </p>
        </div>
      </section>

      {/* COMPLAINT MODAL */}
      {showComplaintModal && (
        <div className="tl-modal-overlay">
          <div className="tl-modal">
            <button
              onClick={() => setShowComplaintModal(false)}
              className="tl-modal-close"
            >
              ×
            </button>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "8px", color: "#1e293b" }}>File a Complaint</h2>
            <p style={{ marginBottom: "24px", color: "#64748b" }}>We value your feedback. Submit your concerns below.</p>

            <form onSubmit={handleComplaintSubmit}>
              <input
                placeholder="Your Name"
                required
                className="tl-input"
                name="name"
              />
              <input
                placeholder="Contact Number / Email"
                required
                className="tl-input"
                name="contact"
              />
              <input
                placeholder="Subject"
                required
                className="tl-input"
                name="subject"
              />
              <textarea
                placeholder="Describe your issue..."
                required
                rows={4}
                className="tl-input"
                style={{ resize: "vertical", minHeight: "100px" }}
                name="description"
              />
              <button type="submit" className="pd-contact-btn primary" style={{ width: "100%", marginTop: "10px", padding: "16px" }}>
                Submit Complaint
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
