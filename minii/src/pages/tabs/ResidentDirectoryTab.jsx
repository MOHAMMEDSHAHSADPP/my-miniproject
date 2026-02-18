import { useEffect, useState } from "react";
import API from "../../api";
import "../admin/admin.css";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
function errMsg(err, fallback) {
  return err?.response?.data?.message || fallback;
}

const CATEGORIES = [
  "plumber",
  "electrician",
  "carpenter",
  "hospital",
  "police",
  "fire",
  "ambulance",
  "shop",
  "other",
];

export default function ResidentDirectoryTab() {
  const [msg, setMsg] = useState("");
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [form, setForm] = useState({
    name: "",
    category: "plumber",
    phone: "",
    address: "",
    tags: "",
    details: "",
    isActive: true,
  });

  const load = async () => {
    setMsg("");
    try {
      const res = await API.get("/resident-admin/directory", {
        headers: authHeaders(),
        params: { q, category: categoryFilter },
      });
      setItems(res.data || []);
    } catch (e) {
      setMsg(errMsg(e, "Failed to load directory"));
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  const create = async () => {
    setMsg("");
    if (!form.name.trim()) return setMsg("Name required");
    if (!form.phone.trim()) return setMsg("Phone required");

    try {
      await API.post(
        "/resident-admin/directory",
        {
          name: form.name.trim(),
          category: form.category,
          phone: form.phone.trim(),
          address: form.address.trim(),
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          details: form.details.trim(),
          isActive: !!form.isActive,
        },
        { headers: authHeaders() }
      );

      setForm({
        name: "",
        category: "plumber",
        phone: "",
        address: "",
        tags: "",
        details: "",
        isActive: true,
      });

      load();
    } catch (e) {
      setMsg(errMsg(e, "Create failed"));
    }
  };

  const toggleActive = async (id, next) => {
    try {
      await API.patch(
        `/resident-admin/directory/${id}`,
        { isActive: !!next },
        { headers: authHeaders() }
      );
      load();
    } catch (e) {
      setMsg(errMsg(e, "Update failed"));
    }
  };

  const edit = async (it) => {
    const name = prompt("Name:", it.name); if (name === null) return;
    const phone = prompt("Phone:", it.phone); if (phone === null) return;
    const address = prompt("Address:", it.address || ""); if (address === null) return;
    const tags = prompt("Tags (comma):", (it.tags || []).join(", ")); if (tags === null) return;
    const details = prompt("Details:", it.details || ""); if (details === null) return;

    try {
      await API.patch(
        `/resident-admin/directory/${it._id}`,
        {
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          details: details.trim(),
        },
        { headers: authHeaders() }
      );
      load();
    } catch (e) {
      setMsg(errMsg(e, "Edit failed"));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this directory entry?")) return;
    try {
      await API.delete(`/resident-admin/directory/${id}`, {
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

      {/* Search */}
      <div className="ad-row">
        <input placeholder="Search name / phone / tags" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="ad-secondary" onClick={load}>Search</button>
      </div>

      {/* Create */}
      <div className="ad-grid">
        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <input placeholder="Tags (comma)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
        <input placeholder="Details" value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />

        <label style={{ display: "flex", gap: 8 }}>
          <input type="checkbox" checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Active
        </label>

        <button className="ad-primary" onClick={create}>Add Directory Entry</button>
      </div>

      {/* List */}
      <div className="ad-tableWrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Active</th>
              <th>Category</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it._id}>
                <td className={it.isActive ? "ok" : "warn"}>{it.isActive ? "YES" : "NO"}</td>
                <td>{it.category}</td>
                <td>{it.name}</td>
                <td>{it.phone}</td>
                <td>{it.address || "-"}</td>
                <td className="ad-actions">
                  <button onClick={() => edit(it)}>Edit</button>
                  <button className={it.isActive ? "danger" : "ad-pill ok"}
                    onClick={() => toggleActive(it._id, !it.isActive)}>
                    {it.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button className="danger" onClick={() => remove(it._id)}>Delete</button>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr><td colSpan="6" style={{ opacity: 0.6 }}>No directory entries</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
