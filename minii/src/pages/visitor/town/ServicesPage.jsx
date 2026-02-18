
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../../../api";
import { ExternalLink } from "lucide-react";
import "./town.css";

export default function ServicesPage() {
    const { townSlug } = useParams();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState("");

    const load = async () => {
        setLoading(true);
        setMsg("");
        try {
            const res = await API.get(`/visitor/${townSlug}/services`);
            setItems(res.data);
        } catch (e) {
            console.error(e);
            setMsg("Failed to load services");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [townSlug]);

    const onDemand = items.filter((i) => i.category === "on_demand");
    const govt = items.filter((i) => i.category === "govt");
    const emergency = items.filter((i) => i.category === "emergency");

    return (
        <div className="tl-page">
            <div className="tl-container">
                <h1 className="tl-title">
                    Essential <span style={{ color: "var(--th-primary)" }}>Services</span>
                </h1>
                <p className="tl-subtitle" style={{ marginBottom: "3rem" }}>
                    Quick access to government, private, and emergency services in {townSlug}.
                </p>

                {loading && <div className="tl-loading"><div className="spinner"></div></div>}
                {msg && <div className="tl-error">{msg}</div>}

                {!loading && !msg && items.length === 0 && (
                    <div className="tl-error">No services listed yet.</div>
                )}

                {!loading && (
                    <>
                        <Section title="On-Demand Services" items={onDemand} />
                        <Section title="Government Services" items={govt} />
                        <Section title="Emergency Services" items={emergency} />
                    </>
                )}
            </div>
        </div>
    );
}

function Section({ title, items }) {
    if (!items || items.length === 0) return null;
    return (
        <div className="sv-section">
            <h2 className="sv-section-title">{title}</h2>
            <div className="sv-grid">
                {items.map((item) => (
                    <ServiceCard key={item._id} item={item} />
                ))}
            </div>
        </div>
    );
}

function ServiceCard({ item }) {
    const iconUrl = `http://localhost:8081${item.icon}`;

    const handleClick = () => {
        if (item.link) {
            window.open(item.link, "_blank");
        }
    };

    return (
        <div className="sv-card" onClick={handleClick} title={item.description || item.name}>
            <img src={iconUrl} alt={item.name} className="sv-icon" />
            <span className="sv-name">{item.name}</span>

            {item.link && <ExternalLink className="sv-action-icon" />}
        </div>
    );
}
