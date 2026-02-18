
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import API from "../../../api";
import { Search, MapPin, Eye, Heart, Inbox, Filter } from "lucide-react";
import "./town.css";

export default function PlacesList() {
  const { townSlug } = useParams();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("popular");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setMsg("");
    setLoading(true);
    try {
      const res = await API.get(`/visitor/${townSlug}/places`, {
        params: { q, category, sort },
      });
      setItems(res.data || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load places");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [townSlug]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(load, 400);
    return () => clearTimeout(t);
  }, [q, category, sort]);

  return (
    <div className="tl-page">
      <div className="tl-container">

        {/* HEADER & FILTERS */}
        <div className="tl-header">
          <div>
            <h1 className="tl-title">Explore <span style={{ color: 'var(--th-primary)' }}>Places</span></h1>
            <p className="tl-subtitle">Find the best hotels, hospitals, shops, and more in {townSlug}.</p>
          </div>

          <div className="tl-filters">
            <div className="tl-search-box">
              <Search size={18} color="var(--th-text-muted)" />
              <input
                placeholder="Search places..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <select className="tl-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              <option value="hotel">Hotel</option>
              <option value="hospital">Hospital</option>
              <option value="shop">Shop</option>
              <option value="restaurant">Restaurant</option>
              <option value="tourist_spot">Tourist Spot</option>
              <option value="cultural_spot">Cultural Spot</option>
              <option value="bank">Bank</option>
              <option value="danger_spot">Danger Spot</option>
              <option value="barber">Barber</option>
              <option value="other">Other</option>
            </select>

            <select className="tl-select" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="popular">Popularity</option>
              <option value="recent">Recently Updated</option>
              <option value="new">Newest First</option>
            </select>
          </div>
        </div>

        {/* ERROR MSG */}
        {msg && <div className="tl-error">{msg}</div>}

        {/* LOADING */}
        {loading && items.length === 0 && (
          <div className="tl-loading">
            <div className="spinner"></div>
          </div>
        )}

        {/* GRID */}
        {!loading && items.length === 0 && !msg ? (
          <div className="tl-empty">
            <Inbox size={48} style={{ opacity: 0.3, marginBottom: 10 }} />
            <p>No places found matching your criteria.</p>
          </div>
        ) : (
          <div className="tl-grid">
            {items.map((p) => (
              <PlaceCard key={p._id} p={p} townSlug={townSlug} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PlaceCard({ p, townSlug }) {
  const img = p.images?.[0] ? `http://localhost:8081${p.images[0]}` : null;
  return (
    <Link className="tl-card" to={`/town/${townSlug}/place/${p._id}`}>
      <div className="tl-card-img" style={img ? { backgroundImage: `url(${img})` } : {}}>
        {!img && <span className="tl-no-img">No Image</span>}
        <div className="tl-cat-tag">{p.category}</div>
      </div>

      <div className="tl-card-body">
        <h3 className="tl-card-title">{p.title}</h3>
        <div className="tl-card-info">
          <MapPin size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom' }} />
          {p.address || "No address"}
        </div>

        <div className="tl-card-footer">
          <div className="tl-stats">
            <span><Eye size={14} style={{ display: 'inline', marginRight: 4 }} /> {p.viewsCount}</span>
            <span><Heart size={14} style={{ display: 'inline', marginRight: 4 }} /> {p.likesCount}</span>
          </div>
          <span className="tl-btn-text">Details →</span>
        </div>
      </div>
    </Link>
  );
}
