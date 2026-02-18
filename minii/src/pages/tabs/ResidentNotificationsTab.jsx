import { useEffect, useState } from "react";
import API from "../../api";

export default function ResidentNotificationsTab() {
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "info", // info | warning | emergency | reminder
    priority: "normal", // low | normal | high | critical
    scope: "town", // town | ward
    ward: "",
  });

  const auth = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const load = async () => {
    setMsg("");
    try {
      const res = await API.get("/resident-admin/notifications", auth());
      setItems(res.data || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load notifications");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const send = async () => {
    setMsg("");
    if (!form.title || !form.message) return setMsg("Title and message required");
    if (form.scope === "ward" && !form.ward) return setMsg("Ward required for ward scope");

    try {
      await API.post("/resident-admin/notifications/broadcast", form, auth());
      setForm({
        title: "",
        message: "",
        type: "info",
        priority: "normal",
        scope: "town",
        ward: "",
      });
      setMsg("Notification broadcasted ✅");
      load();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Broadcast failed");
    }
  };

  const disable = async (id) => {
    if (!window.confirm("Disable this notification?")) return;
    try {
      await API.put(`/resident-admin/notifications/${id}/disable`, {}, auth());
      load();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Disable failed");
    }
  };

  return (
    <div className="ad-card">
      {msg && <div className="ad-msg">{msg}</div>}

      <h3>Broadcast In-App Notification</h3>

      <div className="ad-grid">
        <input
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
        />
        <input
          placeholder="Message"
          value={form.message}
          onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
        />

        <select
          value={form.type}
          onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
        >
          <option value="info">info</option>
          <option value="warning">warning</option>
          <option value="emergency">emergency</option>
          <option value="reminder">reminder</option>
        </select>

        <select
          value={form.priority}
          onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
        >
          <option value="low">low</option>
          <option value="normal">normal</option>
          <option value="high">high</option>
          <option value="critical">critical</option>
        </select>

        <select
          value={form.scope}
          onChange={(e) => setForm((p) => ({ ...p, scope: e.target.value }))}
        >
          <option value="town">town</option>
          <option value="ward">ward</option>
        </select>

        {form.scope === "ward" && (
          <input
            placeholder="Ward (e.g. 5)"
            value={form.ward}
            onChange={(e) => setForm((p) => ({ ...p, ward: e.target.value }))}
          />
        )}

        <button className="ad-primary" onClick={send}>
          Send
        </button>
      </div>

      <hr />

      <h3>Recent Broadcasts</h3>

      <div className="ad-tableWrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Priority</th>
              <th>Scope</th>
              <th>Ward</th>
              <th>Active</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((n) => (
              <tr key={n._id}>
                <td>{n.title}</td>
                <td>{n.type}</td>
                <td>{n.priority}</td>
                <td>{n.scope || "town"}</td>
                <td>{n.ward || "-"}</td>
                <td className={n.isActive ? "ok" : "warn"}>
                  {n.isActive ? "YES" : "NO"}
                </td>
                <td>
                  {n.isActive ? (
                    <button className="danger" onClick={() => disable(n._id)}>
                      Disable
                    </button>
                  ) : (
                    <span style={{ opacity: 0.7 }}>Disabled</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
