import { useEffect, useState } from "react";
import API from "../../api";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function errMsg(err, fallback) {
  return err?.response?.data?.message || fallback;
}

export default function ResidentBudgetTab() {
  const [msg, setMsg] = useState("");
  const [docs, setDocs] = useState([]);

  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);

  const load = async () => {
    setMsg("");
    try {
      const res = await API.get("/resident-admin/budget", { headers: authHeaders() });
      setDocs(res.data || []);
    } catch (e) {
      setMsg(errMsg(e, "Failed to load budget docs"));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const upload = async () => {
    setMsg("");
    if (!file) return setMsg("Select a file first.");
    try {
      const fd = new FormData();
      if (title) fd.append("title", title);
      fd.append("file", file);

      await API.post("/resident-admin/budget", fd, {
        headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
      });

      setTitle("");
      setFile(null);
      load();
    } catch (e) {
      setMsg(errMsg(e, "Upload failed"));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this budget document?")) return;
    try {
      await API.delete(`/resident-admin/budget/${id}`, { headers: authHeaders() });
      load();
    } catch (e) {
      setMsg(errMsg(e, "Delete failed"));
    }
  };

  return (
    <div className="ad-card">
      {msg && <div className="ad-msg">{msg}</div>}

      <div className="ad-grid">
        <input
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button className="ad-primary" onClick={upload}>
          Upload Budget File
        </button>
      </div>

      <div className="ad-tableWrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>File</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d._id}>
                <td>{d.title || "-"}</td>
                <td>{d.fileUrl ? "✅" : "-"}</td>
                <td>{d.createdAt ? new Date(d.createdAt).toLocaleString() : "-"}</td>
                <td>
                  <button className="danger" onClick={() => remove(d._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!docs.length && (
              <tr>
                <td colSpan={4} style={{ opacity: 0.7 }}>
                  No budget documents yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
