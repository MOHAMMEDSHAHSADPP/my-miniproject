import React from "react";
import { useParams } from "react-router-dom";
import { Phone, Ambulance, ShieldAlert, HeartPulse, Flame } from "lucide-react";
import "./town.css";

export default function Emergency() {
    const { townSlug } = useParams();

    const emergencyContacts = [
        { title: "Police Control", number: "100", icon: <ShieldAlert size={28} color="#ef4444" />, bg: "#fef2f2" },
        { title: "Ambulance", number: "108", icon: <Ambulance size={28} color="#f97316" />, bg: "#fff7ed" },
        { title: "Fire Station", number: "101", icon: <Flame size={28} color="#ef4444" />, bg: "#fef2f2" },
        { title: "Women Helpline", number: "1091", icon: <Phone size={28} color="#ec4899" />, bg: "#fdf2f8" },
        { title: "Child Helpline", number: "1098", icon: <HeartPulse size={28} color="#14b8a6" />, bg: "#f0fdfa" },
    ];

    return (
        <div className="tl-page" style={{ paddingTop: "20px" }}>
            <div className="tl-container" style={{ maxWidth: "900px" }}>

                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                    <div className="pd-badge" style={{ background: "#ef4444", marginBottom: "1rem" }}>URGENT HELP</div>
                    <h1 className="hero-title" style={{ fontSize: "3rem", color: "var(--th-text)" }}>
                        Emergency <span className="text-gradient" style={{ background: "linear-gradient(135deg, #ef4444, #f87171)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Contacts</span>
                    </h1>
                    <p className="hero-description" style={{ color: "var(--th-text-muted)" }}>
                        Quick access to essential services in {townSlug}. Tap to call immediately.
                    </p>
                </div>

                {/* Contacts Grid */}
                <div className="tl-grid" style={{ gap: "20px", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
                    {emergencyContacts.map((contact, index) => (
                        <a
                            key={index}
                            href={`tel:${contact.number}`}
                            className="tl-card"
                            style={{
                                padding: "24px",
                                background: "white",
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "center",
                                gap: "20px",
                                textDecoration: "none",
                                border: "1px solid rgba(0,0,0,0.05)"
                            }}
                        >
                            <div style={{
                                background: contact.bg,
                                width: "60px", height: "60px",
                                borderRadius: "50%",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0
                            }}>
                                {contact.icon}
                            </div>
                            <div>
                                <h3 style={{ margin: "0 0 5px", fontSize: "1.1rem", color: "#1f2937", fontWeight: 700 }}>{contact.title}</h3>
                                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--th-primary)" }}>{contact.number}</div>
                            </div>
                        </a>
                    ))}
                </div>

                {/* Nearest Hospital Map Placeholder */}
                <div className="pd-card" style={{ marginTop: "3rem", overflow: "hidden", background: "white" }}>
                    <h2 className="pd-h2">Nearest Hospitals</h2>
                    <div style={{ height: "300px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontWeight: 600 }}>
                        Hospital Map Integration Coming Soon
                    </div>
                </div>

            </div>
        </div>
    );
}
