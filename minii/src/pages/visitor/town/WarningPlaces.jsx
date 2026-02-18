
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../../../api";
import { AlertTriangle } from "lucide-react";
import "./town.css";

export default function WarningPlaces() {
    const { townSlug } = useParams();
    const [items, setItems] = useState([]);
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setMsg("");
        setLoading(true);
        try {
            const res = await API.get(`/visitor/${townSlug}/warnings`); // endpoint is /api/visitor/:townSlug/warnings
            setItems(res.data || []);
        } catch (e) {
            setMsg(e?.response?.data?.message || "Failed to load warnings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [townSlug]);

    return (
        <div className="tl-page" style={{ background: "#fef2f2" }}>
            <div className="tl-container">

                <div className="tl-header">
                    <div>
                        <h1 className="tl-title" style={{ color: "#b91c1c" }}>Restricted <span style={{ color: "#ef4444" }}>Zones</span></h1>
                        <p className="tl-subtitle" style={{ color: "#991b1b" }}>Please avoid these areas for your safety. Authorities are monitoring these locations.</p>
                    </div>
                </div>

                {msg && <div className="tl-error">{msg}</div>}

                {loading && <div className="tl-loading"><div className="spinner" style={{ borderColor: "#ef4444", borderTopColor: "transparent" }}></div></div>}

                {!loading && items.length === 0 && !msg ? (
                    <div className="tl-empty">
                        <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: 10 }} />
                        <p style={{ color: "#b91c1c" }}>No warning places active at the moment. Stay safe!</p>
                    </div>
                ) : (
                    <div className="tl-grid">
                        {items.map((w) => (
                            <div key={w._id} className="tl-card" style={{ background: "white", border: "2px solid #fecaca" }}>
                                <div className="tl-card-img" style={{ backgroundImage: `url(http://localhost:8081${w.image})`, height: "250px" }}>
                                    <div className="tl-cat-tag" style={{ background: "#dc2626" }}>DANGER</div>
                                </div>
                                <div className="tl-card-body">
                                    <h3 className="tl-card-title" style={{ color: "#b91c1c" }}>{w.title}</h3>
                                    <p className="tl-card-info">{w.description}</p>

                                    {w.mapUrl && (
                                        <a
                                            href={w.mapUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="pd-contact-btn secondary"
                                            style={{ width: '100%', marginTop: 10, display: 'flex', justifyContent: 'center', textDecoration: 'none' }}
                                        >
                                            View on Map
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}
