
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../../api";
import { ArrowLeft, MapPin, Eye, Heart, Phone, Map, Globe, Share2 } from "lucide-react";
import "./town.css";

export default function PlaceDetail() {
  const { townSlug, id } = useParams();
  const navigate = useNavigate();
  const [p, setP] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      setMsg("");
      try {
        const res = await API.get(`/visitor/places/${id}`);
        setP(res.data);
        // view count
        await API.post(`/visitor/places/${id}/view`, { userId: null });
      } catch (e) {
        setMsg(e?.response?.data?.message || "Failed to load detail");
      }
    };
    load();
  }, [id]);

  const like = async () => {
    try {
      const res = await API.post(`/visitor/places/${id}/like`);
      setP((prev) => ({ ...prev, likesCount: res.data.likesCount }));
    } catch { }
  };

  if (msg) return <div className="tl-page"><div className="tl-container tl-error">{msg}</div></div>;
  if (!p) return <div className="tl-page"><div className="tl-container tl-loading"><div className="spinner"></div></div></div>;

  const heroImg = p.images?.[0] ? `http://localhost:8081${p.images[0]}` : null;

  return (
    <div className="pd-page">
      {/* IMMERSIVE HERO */}
      <div className="pd-hero" style={heroImg ? { backgroundImage: `url(${heroImg})` } : {}}>
        <div className="pd-hero-overlay" />
        <div className="pd-hero-content">
          <button className="pd-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} style={{ marginRight: 6 }} /> Back
          </button>
          <div className="pd-hero-text">
            <span className="pd-badge">{p.category}</span>
            <h1 className="pd-title">{p.title}</h1>
            <div className="pd-meta">
              <span><MapPin size={18} /> {p.address || "No address provided"}</span>
              <span><Eye size={18} /> {p.viewsCount} views</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pd-container">
        <div className="pd-grid">
          {/* LEFT: MAIN INFO */}
          <div className="pd-main">
            <div className="pd-card">
              <h2 className="pd-h2">About</h2>
              <p className="pd-desc">{p.description || "No description available."}</p>

              {p.tags?.length > 0 && (
                <div className="pd-tags">
                  {p.tags.map((t, i) => <span key={i} className="pd-tag">#{t}</span>)}
                </div>
              )}
            </div>

            {/* DETAILS GRID */}
            {p.details && Object.keys(p.details).length > 0 && (
              <div className="pd-card">
                <h2 className="pd-h2">Amenities & Details</h2>
                <div className="pd-details-grid">
                  {Object.entries(p.details).map(([k, v]) => (
                    <div key={k} className="pd-detail-item">
                      <span className="pd-detail-label">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className="pd-detail-value">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GALLERIES */}
            {p.images?.length > 1 && (
              <div className="pd-card">
                <h2 className="pd-h2">Gallery</h2>
                <div className="pd-gallery">
                  {p.images.slice(1).map((img, i) => (
                    <img
                      key={i}
                      className="pd-gallery-img"
                      src={`http://localhost:8081${img}`}
                      alt={`Gallery ${i}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: ACTION SIDEBAR */}
          <div className="pd-sidebar">
            <div className="pd-action-card">
              <div className="pd-price-row">
                <span className="pd-like-count">♥ {p.likesCount} likes</span>
                <button className="pd-like-btn" onClick={like} style={{ marginBottom: 16 }}>
                  <Heart size={18} style={{ marginRight: 6 }} fill={p.likesCount > 0 ? "#ef4444" : "none"} /> Like
                </button>
              </div>

              <div className="pd-contact-list" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {p.phone && (
                  <a href={`tel:${p.phone}`} className="pd-contact-btn primary">
                    <Phone size={18} style={{ marginRight: 8, verticalAlign: "middle" }} /> Call {p.phone}
                  </a>
                )}
                {p.mapUrl && (
                  <a href={p.mapUrl} target="_blank" rel="noreferrer" className="pd-contact-btn primary">
                    <Map size={18} style={{ marginRight: 8, verticalAlign: "middle" }} /> Get Directions
                  </a>
                )}
                <button className="pd-contact-btn secondary" onClick={() => navigator.clipboard.writeText(window.location.href)}>
                  <Share2 size={18} style={{ marginRight: 8, verticalAlign: "middle" }} /> Share Place
                </button>
              </div>
            </div>

            <div className="pd-info-card">
              <h3 className="pd-h3" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Globe size={18} color="var(--th-primary)" /> Town Info
              </h3>
              <p style={{ color: 'var(--th-text-muted)', marginBottom: 10 }}>
                Located in <b>{townSlug.charAt(0).toUpperCase() + townSlug.slice(1)}</b>.
                Explore more trending spots and local updates.
              </p>
              <button
                className="pd-contact-btn secondary"
                style={{ width: "100%", fontSize: "0.9rem" }}
                onClick={() => navigate(`/town/${townSlug}`)}
              >
                Go to Town Home →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
