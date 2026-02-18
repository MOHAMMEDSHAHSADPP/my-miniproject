import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../../../api";
import "./town.css";

export default function EmergencyPage() {
  const { townSlug } = useParams();
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      setMsg("");
      try {
        const res = await API.get(`/visitor/${townSlug}/emergency`);
        setItems(res.data || []);
      } catch (e) {
        setMsg(e?.response?.data?.message || "Failed to load emergency");
      }
    };
    load();
  }, [townSlug]);

  return (
    <div className="card">
      <h2 style={{margin:0, color:"#0f172a"}}>Emergency</h2>
      <p className="p" style={{marginTop:6}}>Quick numbers.</p>

      {msg && <div style={{marginTop:10, fontWeight:900, color:"#b45309"}}>{msg}</div>}

      <div className="cards">
        {items.map((n) => (
          <div key={n._id} className="item">
            <div className="item-body">
              <h3 className="item-title">{n.label}</h3>
              <div className="item-sub">{n.notes || "—"}</div>
              <div className="item-meta">
                <span>📞 {n.number}</span>
              </div>
              <a className="item-link" href={`tel:${n.number}`}>Call</a>
            </div>
          </div>
        ))}
      </div>

      {!items.length && !msg && <div style={{marginTop:12, color:"#64748b"}}>No emergency numbers yet.</div>}
    </div>
  );
}
