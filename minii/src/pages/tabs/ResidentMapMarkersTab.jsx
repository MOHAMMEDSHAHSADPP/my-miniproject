import { useEffect, useState } from "react";
import API from "../../api";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function errMsg(err, fallback) {
  return err?.response?.data?.message || fallback;
}

export default function ResidentMapMarkersTab() {
  const [msg, setMsg] = useState("");
  const [items, setItems] = useState([]);

  const [form, setForm] = useState({
    type: "danger", // danger | safe | issue | work
    title: "",
    description: "",
    lat: "",
    lng: "",
  });

  const load = async () => {
    setMsg("");
    try {
      const res = await API.get("/resident-admin/map/markers", { headers: authHeaders() });
      setItems(res.data || []);
    } catch (e) {
      setMsg(errMsg(e, "Failed to load markers"));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    setMsg("");
    if (!form.title || !form.lat || !form.lng) {
      return setMsg("title, lat, lng are required");
    }
    try {
      await API.post(
        "/resident-admin/map/markers",
        {
          type: form.type,
          title: form.title,
          description: form.description,
          lat: Number(form.lat),
          lng: Number(form.lng),
        },
        { headers: authHeaders() }
      );
      setForm({ type: "danger", title: "", description: "", lat: "", lng: "" });
      load();
    } catch (e) {
      setMsg(errMsg(e, "Add marker failed"));
    }
  };

  const edit = async (it) => {
    const type = prompt("Type (danger/safe/issue/work):", it.type || "danger");
    if (type === null) return;
    const title = prompt("Title:", it.title || "");
    if (title === null) return;
    const description = prompt("Description:", it.description || "");
    if (description === null) return;
    const lat = prompt("Lat:", String(it.lat ?? ""));
    if (lat === null) return;
    const lng = prompt("Lng:", String(it.lng ?? ""));
    if (lng === null) return;

    try {
      await API.patch(
        `/resident-admin/map/markers/${it._id}`,
        { type, title, description, lat: Number(lat), lng: Number(lng) },
        { headers: authHeaders() }
      );
      load();
    } catch (e) {
      setMsg(errMsg(e, "Update failed"));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this marker?")) return;
    try {
      await API.delete(`/resident-admin/map/markers/${id}`, { headers: authHeaders() });
      load();
    } catch (e) {
      setMsg(errMsg(e, "Delete failed"));
    }
  };

  return (
    <div className="ad-card">
      {msg && <div className="ad-msg">{msg}</div>}

      <div className="ad-grid">
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          <option value="danger">danger</option>
          <option value="safe">safe</option>
          <option value="issue">issue</option>
          <option value="work">work</option>
        </select>

        <input
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          placeholder="Description (optional)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <input
          placeholder="Lat"
          value={form.lat}
          onChange={(e) => setForm({ ...form, lat: e.target.value })}
        />
        <input
          placeholder="Lng"
          value={form.lng}
          onChange={(e) => setForm({ ...form, lng: e.target.value })}
        />
        <button className="ad-primary" onClick={add}>
          Add Marker
        </button>
      </div>

      <div className="ad-tableWrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Title</th>
              <th>Lat</th>
              <th>Lng</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it._id}>
                <td>{it.type}</td>
                <td>{it.title}</td>
                <td>{it.lat}</td>
                <td>{it.lng}</td>
                <td className="ad-actions">
                  <button onClick={() => edit(it)}>Edit</button>
                  <button className="danger" onClick={() => remove(it._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan={5} style={{ opacity: 0.7 }}>
                  No markers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
