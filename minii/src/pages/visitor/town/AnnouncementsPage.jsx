// AnnouncementsPage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../../../api";
import { Megaphone, Calendar, Info } from "lucide-react";
import "./town.css";

export default function AnnouncementsPage() {
  const { townSlug } = useParams();
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      setMsg("");
      try {
        const res = await API.get(`/visitor/${townSlug}/announcements`);
        setItems(res.data || []);
      } catch (e) {
        setMsg(e?.response?.data?.message || "Failed to load announcements");
      }
    };
    load();
  }, [townSlug]);

  return (
    <div className="tl-page">
      <div className="tl-container">

        <div className="tl-header">
          <div>
            <h1 className="tl-title">
              <span style={{ color: 'var(--th-primary)' }}>Town</span> Announcements
            </h1>
            <p className="tl-subtitle">Stay updated with the latest news, events, and notices.</p>
          </div>
        </div>

        {msg && <div className="tl-error">{msg}</div>}

        <div className="tl-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
          {items.map((a) => (
            <div key={a._id} className="pd-card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div className={`pd-badge`} style={{ background: a.priority === 'high' ? '#ef4444' : 'var(--th-primary)', marginBottom: 0 }}>
                  {a.priority || 'Normal'}
                </div>
                {a.date && <div style={{ fontSize: '0.85rem', color: '#888' }}>{new Date(a.date).toLocaleDateString()}</div>}
              </div>

              <h3 className="tl-card-title" style={{ fontSize: '1.4rem' }}>{a.title}</h3>
              <p className="pd-desc" style={{ flex: 1 }}>{a.description}</p>

              <div className="tl-card-footer">
                {a.startDate && (
                  <div className="tl-stats">
                    <Calendar size={14} />
                    {new Date(a.startDate).toLocaleDateString()}
                    {a.endDate ? ` - ${new Date(a.endDate).toLocaleDateString()}` : ''}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {items.length === 0 && !msg && (
          <div className="tl-empty">
            <Megaphone size={48} style={{ opacity: 0.3 }} />
            <p>No active announcements at the moment.</p>
          </div>
        )}

      </div>
    </div>
  );
}
