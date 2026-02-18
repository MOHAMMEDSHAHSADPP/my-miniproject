import { useEffect, useState } from "react";
import API from "../../api"; // ✅ path: pages/admin/resident -> ../../../api
import "../admin.css"; // ✅ keeps same style as your admin dashboard

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
function errMsg(err, fallback) {
  return err?.response?.data?.message || fallback;
}

const PRIORITIES = ["low", "normal", "high", "critical"];
const TYPES = ["info", "warning", "emergency", "reminder"];

export default function ResidentAlertsTab() {
  const [msg, setMsg] = useState("");
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);

  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "info",
    priority: "normal",
    // targeting
    scope: "town", // "town" | "ward"
    ward: "",
    startAt: "",
    endAt: "",
    isActive: true,
  });

  const load = async () => {
    setMsg("");
    try {
      const res = await API.get("/resident-admin/alerts", {
        headers: authHeaders(),
        params: { q, active: onlyActive ? "true" : "" },
      });
      setItems(res.data || []);
    } catch (e) {
      setMsg(errMsg(e, "Failed to load alerts"));
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  const create = async () => {
    setMsg("");
    if (!form.title.trim()) return setMsg("Title required.");
    if (!form.message.trim()) return setMsg("Message required.");
    if (form.scope === "ward" && !String(form.ward || "").trim()) {
      return setMsg("Ward required when scope=ward.");
    }

    try {
      const payload = {
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
        priority: form.priority,
        scope: form.scope,
        ward: form.scope === "ward" ? String(form.ward).trim() : "",
        startAt: form.startAt || "",
        endAt: form.endAt || "",
        isActive: !!form.isActive,
      };

      await API.post("/resident-admin/alerts", payload, { headers: authHeaders() });

      setForm({
        title: "",
        message: "",
        type: "info",
        priority: "normal",
        scope: "town",
        ward: "",
        startAt: "",
        endAt: "",
        isActive: true,
      });

      load();
    } catch (e) {
      setMsg(errMsg(e, "Create alert failed"));
    }
  };

  const toggleActive = async (id, nextActive) => {
    setMsg("");
    try {
      await API.patch(
        `/resident-admin/alerts/${id}`,
        { isActive: !!nextActive },
        { headers: authHeaders() }
      );
      load();
    } catch (e) {
      setMsg(errMsg(e, "Update failed"));
    }
  };

  const edit = async (it) => {
    const title = prompt("Title:", it.title || "");
    if (title === null) return;
    const message = prompt("Message:", it.message || "");
    if (message === null) return;

    const type = prompt(`Type (${TYPES.join(", ")}):`, it.type || "info");
    if (type === null) return;
    const priority = prompt(
      `Priority (${PRIORITIES.join(", ")}):`,
      it.priority || "normal"
    );
    if (priority === null) return;

    const scope = prompt("Scope (town/ward):", it.scope || "town");
    if (scope === null) return;

    const ward = scope === "ward" ? prompt("Ward:", it.ward || "") : "";
    if (scope === "ward" && ward === null) return;

    const startAt = prompt("StartAt (optional ISO/string):", it.startAt || "");
    if (startAt === null) return;
    const endAt = prompt("EndAt (optional ISO/string):", it.endAt || "");
    if (endAt === null) return;

    setMsg("");
    try {
      await API.patch(
        `/resident-admin/alerts/${it._id}`,
        {
          title: String(title).trim(),
          message: String(message).trim(),
          type: String(type).trim(),
          priority: String(priority).trim(),
          scope: String(scope).trim(),
          ward: scope === "ward" ? String(ward || "").trim() : "",
          startAt: startAt || "",
          endAt: endAt || "",
        },
        { headers: authHeaders() }
      );
      load();
    } catch (e) {
      setMsg(errMsg(e, "Edit failed"));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this alert?")) return;
    setMsg("");
    try {
      await API.delete(`/resident-admin/alerts/${id}`, { headers: authHeaders() });
      load();
    } catch (e) {
      setMsg(errMsg(e, "Delete failed"));
    }
  };

  return (
    <div className="ad-card">
      {msg && <div className="ad-msg">{msg}</div>}

      {/* Filters */}
      <div className="ad-row">
        <input
          placeholder="Search title/message/ward..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={onlyActive}
            onChange={(e) => setOnlyActive(e.target.checked)}
          />
          Active only
        </label>
        <button className="ad-secondary" onClick={load}>
          Search
        </button>
      </div>

      {/* Create form */}
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
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          value={form.priority}
          onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <select
          value={form.scope}
          onChange={(e) => setForm((p) => ({ ...p, scope: e.target.value }))}
        >
          <option value="town">town (all residents)</option>
          <option value="ward">ward only</option>
        </select>

        {form.scope === "ward" && (
          <input
            placeholder="Ward (example: 3)"
            value={form.ward}
            onChange={(e) => setForm((p) => ({ ...p, ward: e.target.value }))}
          />
        )}

        <input
          placeholder="StartAt (optional)"
          value={form.startAt}
          onChange={(e) => setForm((p) => ({ ...p, startAt: e.target.value }))}
        />
        <input
          placeholder="EndAt (optional)"
          value={form.endAt}
          onChange={(e) => setForm((p) => ({ ...p, endAt: e.target.value }))}
        />

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
          />
          Active
        </label>

        <button className="ad-primary" onClick={create}>
          Create Alert
        </button>
      </div>

      {/* List */}
      <div className="ad-tableWrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Active</th>
              <th>Type</th>
              <th>Priority</th>
              <th>Scope</th>
              <th>Ward</th>
              <th>Title</th>
              <th>Message</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {items.map((it) => (
              <tr key={it._id}>
                <td className={it.isActive ? "ok" : "warn"}>
                  {it.isActive ? "YES" : "NO"}
                </td>
                <td>{it.type || "-"}</td>
                <td>{it.priority || "-"}</td>
                <td>{it.scope || "town"}</td>
                <td>{it.ward || "-"}</td>
                <td>{it.title}</td>
                <td style={{ maxWidth: 320, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {it.message}
                </td>
                <td>{it.createdAt ? new Date(it.createdAt).toLocaleString() : "-"}</td>
                <td className="ad-actions">
                  <button onClick={() => edit(it)}>Edit</button>
                  <button
                    className={it.isActive ? "danger" : "ad-pill ok"}
                    onClick={() => toggleActive(it._id, !it.isActive)}
                  >
                    {it.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button className="danger" onClick={() => remove(it._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {!items.length && (
              <tr>
                <td colSpan="9" style={{ opacity: 0.7 }}>
                  No alerts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
