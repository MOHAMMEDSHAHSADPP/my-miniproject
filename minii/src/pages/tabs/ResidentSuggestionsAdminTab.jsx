import { useEffect, useState } from "react";
import API from "../../api";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function errMsg(err, fallback) {
  return err?.response?.data?.message || fallback;
}

export default function ResidentSuggestionsAdminTab() {
  const [msg, setMsg] = useState("");
  const [items, setItems] = useState([]);

  const load = async () => {
    setMsg("");
    try {
      const res = await API.get("/resident-admin/suggestions", { headers: authHeaders() });
      setItems(res.data || []);
    } catch (e) {
      setMsg(errMsg(e, "Failed to load suggestions"));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (id, status) => {
    const adminNote = prompt("Admin note (optional):", "");
    try {
      await API.patch(
        `/resident-admin/suggestions/${id}/status`,
        { status, adminNote: adminNote || "" },
        { headers: authHeaders() }
      );
      load();
    } catch (e) {
      setMsg(errMsg(e, "Update failed"));
    }
  };

  return (
    <div className="ad-card">
      {msg && <div className="ad-msg">{msg}</div>}

      <div className="ad-tableWrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Ward</th>
              <th>From</th>
              <th>Message</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it._id}>
                <td className={it.status === "resolved" ? "ok" : "warn"}>
                  {it.status || "open"}
                </td>
                <td>{it.ward || "-"}</td>
                <td>{it.userId?.name || it.fromName || "-"}</td>
                <td style={{ maxWidth: 420, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {it.message}
                </td>
                <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="ad-pill" onClick={() => setStatus(it._id, "open")}>
                    Open
                  </button>
                  <button className="ad-pill ok" onClick={() => setStatus(it._id, "in_progress")}>
                    In Progress
                  </button>
                  <button className="ad-pill danger" onClick={() => setStatus(it._id, "resolved")}>
                    Resolved
                  </button>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan={5} style={{ opacity: 0.7 }}>
                  No suggestions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
