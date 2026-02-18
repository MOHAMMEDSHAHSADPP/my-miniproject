import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Bus, Train, Map, Navigation, Car, AlertCircle } from "lucide-react";
import API from "../../../api";
import "./town.css";

export default function Travel() {
    const { townSlug } = useParams();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState("");

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                // Fetch travel data from backend
                const res = await API.get(`/visitor/${townSlug}/travel`);
                setItems(res.data || []);
            } catch (e) {
                console.error(e);
                // If 404, it might mean no data or endpoint, just show empty
                setMsg("No travel information available yet.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [townSlug]);

    const getIcon = (type) => {
        switch (type) {
            case "bus": return <Bus size={32} color="#3b82f6" />;
            case "train": return <Train size={32} color="#a855f7" />;
            case "taxi": return <Car size={32} color="#f97316" />;
            case "auto": return <Navigation size={32} color="#eab308" />;
            default: return <Map size={32} color="#64748b" />;
        }
    };

    const getBg = (type) => {
        switch (type) {
            case "bus": return "#eff6ff";
            case "train": return "#fdf4ff";
            case "taxi": return "#fff7ed";
            case "auto": return "#fefce8";
            default: return "#f1f5f9";
        }
    };

    return (
        <div className="tl-page" style={{ paddingTop: "20px" }}>
            <div className="tl-container">

                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                    <div className="pd-badge" style={{ marginBottom: "1rem" }}>Transport Hub</div>
                    <h1 className="hero-title" style={{ fontSize: "3rem", color: "var(--th-text)" }}>
                        Travel <span className="text-gradient">Guide</span>
                    </h1>
                    <p className="hero-description" style={{ color: "var(--th-text-muted)", maxWidth: "600px", margin: "0 auto" }}>
                        Find the best ways to reach and get around {townSlug}.
                    </p>
                </div>

                {/* Loading / Empty States */}
                {loading && <div className="tl-loading"><div className="spinner" /></div>}

                {!loading && items.length === 0 && (
                    <div className="tl-error">
                        <div style={{ textAlign: "center" }}>
                            <AlertCircle size={48} style={{ margin: "0 auto 20px" }} />
                            <p>No travel information added yet.</p>
                        </div>
                    </div>
                )}

                {/* Transport Modes Grid (Dynamic) */}
                <div className="tl-grid" style={{ marginBottom: "4rem" }}>
                    {items.map((item) => (
                        <div key={item._id} className="tl-card" style={{ padding: "30px", background: "white" }}>
                            <div style={{ background: getBg(item.type), width: "60px", height: "60px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                                {getIcon(item.type)}
                            </div>
                            <h3 className="tl-card-title" style={{ textTransform: 'capitalize' }}>{item.title}</h3>
                            <p className="tl-card-info">
                                {item.details}
                            </p>

                            {item.mapUrl && (
                                <a
                                    href={item.mapUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="pd-contact-btn secondary"
                                    style={{ width: "100%", justifyContent: "center", display: "flex", textAlign: "center", textDecoration: "none" }}
                                >
                                    View Location / Map
                                </a>
                            )}
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}
