import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../../../api";
import "./town.css";

export default function PlaceDetail() {
  const { townSlug, id } = useParams();
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
    } catch {}
  };

  if (msg) return <div className="card">{msg}</div>;
  if (!p) return <div className="card">Loading…</div>;

  return (
    <div className="card">
      <div className="grid-2">
        <div>
          <h1 className="h1" style={{fontSize:32}}>{p.title}</h1>
          <p className="p">{p.description || "No description"}</p>

          <div className="chips">
            <span className="chip">{p.category}</span>
            {p.tags?.slice(0, 6).map((t, i) => <span className="chip" key={i}>{t}</span>)}
          </div>

          <div style={{marginTop:14, display:"flex", gap:10, flexWrap:"wrap"}}>
            <button className="btn" onClick={like}>
              <i className="ri-heart-2-line" /> Like ({p.likesCount || 0})
            </button>

            {p.mapUrl && (
              <a className="qbtn" href={p.mapUrl} target="_blank" rel="noreferrer">
                Open Map →
              </a>
            )}
          </div>

          <div style={{marginTop:14, color:"#334155", fontWeight:800}}>
            {p.phone ? <div>📞 {p.phone}</div> : null}
            {p.address ? <div>📍 {p.address}</div> : null}
            <div style={{marginTop:8, color:"#64748b"}}>
              Views: {p.viewsCount || 0}
            </div>
          </div>

          {/* ✅ category-specific details (admin fills this) */}
          {p.details && Object.keys(p.details).length > 0 && (
            <div style={{marginTop:18}}>
              <h3 style={{margin:"0 0 8px", color:"#0f172a"}}>More Details</h3>
              <div style={{display:"grid", gap:10}}>
                {Object.entries(p.details).map(([k, v]) => (
                  <div key={k} style={{
                    padding:"10px 12px",
                    borderRadius:12,
                    border:"1px solid rgba(15,23,42,0.08)",
                    background:"#f8fafc",
                    fontWeight:800,
                    color:"#0f172a"
                  }}>
                    {k}: <span style={{color:"#334155", fontWeight:700}}>{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          {p.images?.[0] ? (
            <img className="heroImg" src={`http://localhost:8081${p.images[0]}`} alt={p.title} />
          ) : (
            <div className="heroImg placeholder">No image</div>
          )}

          {p.images?.length > 1 && (
            <div style={{marginTop:10, display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10}}>
              {p.images.slice(1, 7).map((img, i) => (
                <img
                  key={i}
                  src={`http://localhost:8081${img}`}
                  alt="more"
                  style={{
                    width:"100%", height:90, objectFit:"cover",
                    borderRadius:12, border:"1px solid rgba(15,23,42,0.08)"
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{marginTop:14, color:"#64748b", fontWeight:800}}>
        Town: {townSlug}
      </div>
    </div>
  );
}
