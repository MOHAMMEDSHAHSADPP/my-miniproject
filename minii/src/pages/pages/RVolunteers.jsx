import { useEffect, useState } from "react";
import API from "../../api";

export default function RVolunteers() {
  const [me, setMe] = useState(null);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    skills: "",
    age: "",
    availability: "",
    description: "",
  });

  const load = async () => {
    setMsg("");
    try {
      const res = await API.get("/resident/volunteers/me");
      setMe(res.data || null);
    } catch {
      setMe(null);
    }
  };

  useEffect(() => { load(); }, []);

  const register = async () => {
    if (!form.skills || !form.age || !form.availability) {
      return setMsg("Please fill in all required fields.");
    }
    setMsg("");
    try {
      await API.post("/resident/volunteers/register", form);
      setMsg("✅ Registered as volunteer successfully!");
      setForm({ skills: "", age: "", availability: "", description: "" });
      load();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Register failed");
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", display: "grid", gap: 20 }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #4b34c8, #7a5cff)",
        padding: "24px",
        borderRadius: "16px",
        color: "#fff",
        boxShadow: "0 4px 15px rgba(75, 52, 200, 0.2)"
      }}>
        <h2 style={{ margin: "0 0 8px 0" }}>🤝 Community Volunteers</h2>
        <p style={{ margin: 0, opacity: 0.9 }}>
          Join hands to help your neighbors. Register as a volunteer to assist with events, emergencies, or daily tasks.
        </p>
      </div>

      {msg && <div style={{
        padding: "12px 16px",
        background: msg.includes("failed") ? "#fff5f5" : "#f0fff4",
        color: msg.includes("failed") ? "#c53030" : "#2f855a",
        borderRadius: "10px",
        border: `1px solid ${msg.includes("failed") ? "rgba(255,0,0,0.1)" : "rgba(0,128,0,0.1)"}`
      }}>
        {msg}
      </div>}

      {/* Content */}
      <div style={{
        background: "#fff",
        padding: "24px",
        borderRadius: "16px",
        border: "1px solid rgba(120, 80, 255, 0.15)"
      }}>
        {me ? (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 50, height: 50, borderRadius: "50%",
                background: "#efeaff", color: "#4b34c8",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.5rem", fontWeight: "bold"
              }}>
                ✓
              </div>
              <div>
                <h3 style={{ margin: 0, color: "#2d1b69" }}>You are a Registered Volunteer</h3>
                <span style={{ color: "#38a169", fontSize: "0.9rem", fontWeight: "600" }}>Active & Verified</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 8 }}>
              <div style={infoBoxStyle}>
                <label>Skills</label>
                <div>{Array.isArray(me.skills) ? me.skills.join(", ") : me.skills}</div>
              </div>
              <div style={infoBoxStyle}>
                <label>Availability</label>
                <div>{me.availability || "Not specified"}</div>
              </div>
              <div style={infoBoxStyle}>
                <label>Age</label>
                <div>{me.age || "N/A"}</div>
              </div>
              <div style={infoBoxStyle}>
                <label>Notes</label>
                <div>{me.description || "None"}</div>
              </div>
            </div>

            <button
              onClick={() => setMe(null)}
              style={{
                marginTop: 10,
                background: "transparent",
                border: "1px solid #ddd",
                padding: "8px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                width: "fit-content",
                color: "#666"
              }}
            >
              Edit Profile
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            <h3 style={{ margin: 0, color: "#2d1b69" }}>Register Now</h3>

            <div style={fieldGroupStyle}>
              <label>What skills can you offer?</label>
              <input
                placeholder="e.g. First aid, Electrical, Teaching, Driving"
                value={form.skills}
                onChange={(e) => setForm({ ...form, skills: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={fieldGroupStyle}>
                <label>Age</label>
                <input
                  type="number"
                  placeholder="e.g. 25"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={fieldGroupStyle}>
                <label>Availability</label>
                <select
                  value={form.availability}
                  onChange={(e) => setForm({ ...form, availability: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">Select...</option>
                  <option value="Weekends">Weekends Only</option>
                  <option value="Weekdays">Weekdays</option>
                  <option value="Anytime">Anytime / Emergency</option>
                  <option value="Evenings">Evenings</option>
                </select>
              </div>
            </div>

            <div style={fieldGroupStyle}>
              <label>Description / Notes (Optional)</label>
              <textarea
                placeholder="Tell us more about how you can help..."
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                style={inputStyle}
              />
            </div>

            <button onClick={register} style={btnStyle}>Register as Volunteer</button>
          </div>
        )}
      </div>
    </div>
  );
}

const fieldGroupStyle = {
  display: "grid",
  gap: 6
};

const inputStyle = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid #ddd",
  fontSize: "0.95rem",
  outline: "none",
  transition: "border-color 0.2s"
};

const btnStyle = {
  marginTop: 8,
  padding: "12px",
  border: "none",
  background: "linear-gradient(135deg, #4b34c8, #7a5cff)",
  color: "#fff",
  fontWeight: "700",
  borderRadius: "10px",
  cursor: "pointer",
  fontSize: "1rem"
};

const infoBoxStyle = {
  background: "#f8f7ff",
  padding: "10px 14px",
  borderRadius: "10px",
  display: "flex",
  flexDirection: "column",
  gap: 4
};

// Add <style> tag inline for label styling scope
const labelStyle = `
   label { font-weight: 600; color: #544a84; font-size: 0.9rem; }
`;
