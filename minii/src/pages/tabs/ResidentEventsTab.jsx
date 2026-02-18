import { useEffect, useState } from "react";
import API from "../../api";
import "../admin.css";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
function errMsg(err, fallback) {
  return err?.response?.data?.message || fallback;
}

export default function ResidentEventsTab() {
  const [msg, setMsg] = useState("");
  const [items, setItems] = useState([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    startAt: "",
    endAt: "",
    location: "",
    scope: "town",
    ward: "",
    isActive: true,
  });

  const load = async () => {
    setMsg("");
    try {
      const res = await API.get("/resident-admin/events", {
        headers: authHeaders(),
      });
      setItems(res.data || []);
    } catch (e) {
      setMsg(errMsg(e, "Failed to load events"));
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  const create = async () => {
    setMsg("");
    if (!form.title.trim()) return setMsg("Title required");
    if (!form.startAt.trim()) return setMsg("Start date required");

    try {
      await API.post(
        "/resident-admin/events",
        {
          ...form,
          title: form.title.trim(),
          description: form.description.trim(),
          ward: form.scope === "ward" ? form.ward.trim() : "",
          isActive: !!form.isActive,
        },
        { headers: authHeaders() }
      );

      setForm({
        title: "",
        description: "",
        startAt: "",
        endAt: "",
        location: "",
        scope: "town",
        ward: "",
        isActive: true,
      });

      load();
    } catch (e) {
      setMsg(errMsg(e, "Create event failed"));
    }
  };

  const toggleActive = async (id, next) => {
    try {
      await API.patch(
        `/resident-admin/events/${id}`,
        { isActive: !!next },
        { headers: authHeaders() }
      );
      load();
    } catch (e) {
      setMsg(errMsg(e, "Update failed"));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await API.delete(`/resident-admin/events/${id}`, {
        headers: authHeaders(),
      });
      load();
    } catch (e) {
      setMsg(errMsg(e, "Delete failed"));
    }
  };

  return (
    <div className="ad-card">
      {msg && <div className="ad-msg">{msg}</div>}

      {/* Create */}
      <div className="ad-grid">
        <input placeholder="Event title" value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })} />

        <input placeholder="Description" value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })} />

        <input placeholder="Start date/time" value={form.startAt}
          onChange={(e) => setForm({ ...form, startAt: e.target.value })} />

        <input placeholder="End date/time" value={form.endAt}
          onChange={(e) => setForm({ ...form, endAt: e.target.value })} />

        <input placeholder="Location" value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })} />

        <select value={form.scope}
          onChange={(e) => setForm({ ...form, scope: e.target.value })}>
          <option value="town">Town</option>
          <option value="ward">Ward</option>
        </select>

        {form.scope === "ward" && (
          <input placeholder="Ward"
            value={form.ward}
            onChange={(e) => setForm({ ...form, ward: e.target.value })} />
        )}

        <label style={{ display: "flex", gap: 8 }}>
          <input type="checkbox" checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Active
        </label>

        <button className="ad-primary" onClick={create}>Create Event</button>
      </div>

      {/* List */}
      <div className="ad-tableWrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Active</th>
              <th>Scope</th>
              <th>Title</th>
              <th>Start</th>
              <th>End</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it._id}>
                <td className={it.isActive ? "ok" : "warn"}>
                  {it.isActive ? "YES" : "NO"}
                </td>
                <td>{it.scope}{it.ward ? ` (${it.ward})` : ""}</td>
                <td>{it.title}</td>
                <td>{it.startAt || "-"}</td>
                <td>{it.endAt || "-"}</td>
                <td>{it.location || "-"}</td>
                <td className="ad-actions">
                  <button className={it.isActive ? "danger" : "ad-pill ok"}
                    onClick={() => toggleActive(it._id, !it.isActive)}>
                    {it.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button className="danger" onClick={() => remove(it._id)}>Delete</button>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr><td colSpan="7" style={{ opacity: 0.6 }}>No events created</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
