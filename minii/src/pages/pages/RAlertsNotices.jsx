import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import API from "../../api";

export default function RAlertsNotices() {
    const { townSlug } = useOutletContext();
    const [activeTab, setActiveTab] = useState("alerts");
    const [alerts, setAlerts] = useState([]);
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAll = async () => {
            setLoading(true);
            try {
                const [aRes, nRes] = await Promise.all([
                    API.get("/resident/alerts"),
                    API.get("/resident/gov-notices"),
                ]);
                setAlerts(aRes.data || []);
                setNotices(nRes.data || []);
            } catch (e) {
                console.error("Load alerts/notices error:", e);
            } finally {
                setLoading(false);
            }
        };
        loadAll();
    }, [townSlug]);

    const handleAcknowledge = async (id) => {
        try {
            await API.put(`/resident/gov-notices/${id}/done`);
            setNotices((prev) =>
                prev.map((n) => (n._id === id ? { ...n, acknowledged: true } : n))
            );
        } catch (e) {
            alert("Failed to acknowledge.");
        }
    };

    return (
        <div style={{ display: "grid", gap: 16 }}>
            {/* Tab Switcher */}
            <div style={{
                display: "flex",
                gap: 0,
                background: "#f0ecff",
                borderRadius: 14,
                padding: 4,
                width: "fit-content",
            }}>
                <button
                    onClick={() => setActiveTab("alerts")}
                    style={{
                        padding: "10px 24px",
                        border: "none",
                        borderRadius: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        background: activeTab === "alerts" ? "#4b34c8" : "transparent",
                        color: activeTab === "alerts" ? "#fff" : "#6b5aa6",
                        transition: "all 0.2s",
                    }}
                >
                    🚨 Alerts {alerts.length > 0 && <span style={{
                        background: activeTab === "alerts" ? "rgba(255,255,255,0.25)" : "#ff3b3b",
                        color: "#fff",
                        padding: "2px 8px",
                        borderRadius: 99,
                        fontSize: "0.75rem",
                        marginLeft: 6,
                    }}>{alerts.length}</span>}
                </button>
                <button
                    onClick={() => setActiveTab("notices")}
                    style={{
                        padding: "10px 24px",
                        border: "none",
                        borderRadius: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        background: activeTab === "notices" ? "#4b34c8" : "transparent",
                        color: activeTab === "notices" ? "#fff" : "#6b5aa6",
                        transition: "all 0.2s",
                    }}
                >
                    📋 Gov Notices {notices.filter(n => !n.acknowledged).length > 0 && <span style={{
                        background: activeTab === "notices" ? "rgba(255,255,255,0.25)" : "#f6a823",
                        color: "#fff",
                        padding: "2px 8px",
                        borderRadius: 99,
                        fontSize: "0.75rem",
                        marginLeft: 6,
                    }}>{notices.filter(n => !n.acknowledged).length}</span>}
                </button>
            </div>

            {loading && <p style={{ padding: 16, color: "#8b7bb8" }}>Loading...</p>}

            {/* ALERTS TAB */}
            {!loading && activeTab === "alerts" && (
                <div style={{ display: "grid", gap: 12 }}>
                    <h2 style={{ margin: 0, color: "#3a2b7a" }}>🚨 Town Alerts</h2>
                    {alerts.length === 0 ? (
                        <div style={{
                            padding: 32,
                            textAlign: "center",
                            background: "#fff",
                            borderRadius: 16,
                            border: "1px solid rgba(120,80,255,0.1)",
                            color: "#8b7bb8",
                        }}>
                            ✅ No active alerts — all is well!
                        </div>
                    ) : (
                        alerts.map((a) => (
                            <div key={a._id} style={{
                                padding: 16,
                                borderRadius: 14,
                                border: "1px solid rgba(255,60,60,0.2)",
                                background: "linear-gradient(135deg, #fff5f5, #fff)",
                                display: "grid",
                                gap: 6,
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <span style={{
                                        background: a.priority === "high" ? "#ff3b3b" : a.priority === "medium" ? "#f6a823" : "#4b34c8",
                                        color: "#fff",
                                        padding: "3px 10px",
                                        borderRadius: 8,
                                        fontSize: "0.72rem",
                                        fontWeight: 700,
                                        textTransform: "uppercase",
                                    }}>{a.priority || "Info"}</span>
                                    <b style={{ fontSize: "1.05rem", color: "#2d1b69" }}>{a.title || "Alert"}</b>
                                </div>
                                <div style={{ color: "#544a84", lineHeight: 1.5 }}>{a.message}</div>
                                <div style={{ fontSize: "0.78rem", color: "#8b7bb8" }}>
                                    {a.kind || a.type} • {new Date(a.createdAt).toLocaleString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* NOTICES TAB */}
            {!loading && activeTab === "notices" && (
                <div style={{ display: "grid", gap: 12 }}>
                    <h2 style={{ margin: 0, color: "#3a2b7a" }}>📋 Government Notices</h2>
                    {notices.length === 0 ? (
                        <div style={{
                            padding: 32,
                            textAlign: "center",
                            background: "#fff",
                            borderRadius: 16,
                            border: "1px solid rgba(120,80,255,0.1)",
                            color: "#8b7bb8",
                        }}>
                            No notices published yet.
                        </div>
                    ) : (
                        notices.map((n) => (
                            <div key={n._id} style={{
                                padding: 16,
                                borderRadius: 14,
                                border: `1px solid ${n.acknowledged ? "rgba(72,187,120,0.25)" : "rgba(120,80,255,0.15)"}`,
                                background: n.acknowledged
                                    ? "linear-gradient(135deg, #f0fff4, #fff)"
                                    : "linear-gradient(135deg, #faf9ff, #fff)",
                                display: "grid",
                                gap: 8,
                            }}>
                                <b style={{ fontSize: "1.05rem", color: "#2d1b69" }}>{n.title || "Notice"}</b>
                                <div style={{ color: "#544a84", lineHeight: 1.5 }}>{n.description}</div>
                                <div style={{ fontSize: "0.78rem", color: "#8b7bb8" }}>
                                    Deadline: {n.deadline ? new Date(n.deadline).toLocaleDateString() : "—"}
                                </div>
                                {n.acknowledged ? (
                                    <span style={{
                                        display: "inline-block",
                                        width: "fit-content",
                                        padding: "6px 14px",
                                        borderRadius: 10,
                                        background: "#e0ffe0",
                                        color: "#28a745",
                                        fontSize: "0.85rem",
                                        fontWeight: 700,
                                    }}>
                                        ✅ Acknowledged
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => handleAcknowledge(n._id)}
                                        style={{
                                            width: "fit-content",
                                            padding: "8px 18px",
                                            borderRadius: 10,
                                            border: "none",
                                            background: "linear-gradient(135deg, #4b34c8, #7a5cff)",
                                            color: "#fff",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                            fontSize: "0.85rem",
                                        }}
                                    >
                                        ✅ Mark as Read
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
