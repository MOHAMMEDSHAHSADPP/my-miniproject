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

const PRIORITIES = ["normal", "high", "critical"];

export default function ResidentGovNoticesTab() {
  const [msg, setMsg] = useState("");
  const [items, setItems] = useState([]);

  const [form, setForm] = useState({
    title: "",
    message: "",
    deadline: "", // YYYY-MM-DD
    priority: "high",
    scope: "town", // town | ward
    ward: "",
    isActive: true,
  });

  const load = async () => {
    setMsg("");
    try {
      const res = await API.get("/resident-admin/gov-notices", {
        headers: authHeaders(),
      });
      setItems(res.data || []);
    } catch (e) {
      setMsg(errMsg(e, "Failed to load gov notices"));
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  const create = async () => {
    setMsg("");
    if (!form.title.trim()) return setMsg("Title required.");
    if (!form.deadline.trim()) return setMsg("Deadline required (YYYY-MM-DD).");
    if (form.scope === "ward" && !String(form.ward || "").trim()) {
      return setMsg("Ward required when scope=ward.");
    }

    try {
      await API.post(
        "/resident-admin/gov-notices",
        {
          title: form.title.trim(),
          message: form.message.trim(),
          deadline: form.deadline.trim(),
          priority: form.priority,
          scope: form.scope,
          ward: form.scope === "ward" ? String(form.ward).trim() : "",
          isActive: !!form.isActive,
        },
        { headers: authHeaders() }
      );

      setForm({
        title: "",
        message: "",
        deadline: "",
        priority: "high",
        scope: "town",
        ward: "",
        isActive: true,
      });

      load();
    } catch (e) {
      setMsg(errMsg(e, "Create notice failed"));
    }
  };

  const toggleActive = async (id, nextActive) => {
    setMsg("");
    try {
      await API.patch(
        `/resident-admin/gov-notices/${id}`,
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
    const deadline = prompt("Deadline (YYYY-MM-DD):", it.deadline || "");
    if (deadline === null) return;
    const priority = prompt(
      `Priority (${PRIORITIES.join(", ")}):`,
      it.priority || "high"
    );
    if (priority === null) return;

    const scope = prompt("Scope (town/ward):", it.scope || "town");
    if (scope === null) return;

    const ward = scope === "ward" ? prompt("Ward:", it.ward || "") : "";
    if (scope === "ward" && ward === null) return;

    setMsg("");
    try {
      await API.patch(
        `/resident-admin/gov-notices/${it._id}`,
        {
          title: String(title).trim(),
          message: String(message).trim(),
          deadline: String(deadline).trim(),
          priority: String(priority).trim(),
          scope: String(scope).trim(),
          ward: scope === "ward" ? String(ward || "").trim() : "",
        },
        { headers: authHeaders() }
      );
      load();
    } catch (e) {
      setMsg(errMsg(e, "Edit failed"));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this gov notice?")) return;
    setMsg("");
    try {
      await API.delete(`/resident-admin/gov-notices/${id}`, { headers: authHeaders() });
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
        <input
          placeholder="Notice title"
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
        />
        <input
          placeholder="Message (what to do)"
          value={form.message}
          onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
        />

        <input
          placeholder="Deadline (YYYY-MM-DD)"
          value={form.deadline}
          onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))}
        />

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

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
          />
          Active
        </label>

        <button className="ad-primary" onClick={create}>
          Create Gov Notice
        </button>
      </div>

      {/* List */}
      <div className="ad-tableWrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Active</th>
              <th>Priority</th>
              <th>Scope</th>
              <th>Ward</th>
              <th>Title</th>
              <th>Deadline</th>
              <th>Message</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {items.map((it) => (
              <tr key={it._id}>
                <td className={it.isActive ? "ok" : "warn"}>
                  {it.isActive ? "YES" : "NO"}
                </td>
                <td>{it.priority || "high"}</td>
                <td>{it.scope || "town"}</td>
                <td>{it.ward || "-"}</td>
                <td>{it.title}</td>
                <td>{it.deadline || "-"}</td>
                <td style={{ maxWidth: 320, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {it.message || "-"}
                </td>
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
                <td colSpan="8" style={{ opacity: 0.7 }}>
                  No government notices yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
