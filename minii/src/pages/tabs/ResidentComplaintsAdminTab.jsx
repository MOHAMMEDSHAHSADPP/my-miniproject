import { useEffect, useState } from "react";
import API from "../../api";

export default function ResidentComplaintsAdminTab() {
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("");

  const [ward, setWard] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");

  const auth = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const load = async () => {
    setMsg("");
    try {
      const res = await API.get("/resident-admin/complaints", {
        ...auth(),
        params: { ward, status, q },
      });
      setItems(res.data || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load complaints");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  const updateStatus = async (id, nextStatus) => {
    const adminNote = prompt("Admin note (optional):", "");
    try {
      await API.put(
        `/resident-admin/complaints/${id}/status`,
        { status: nextStatus, adminNote: adminNote || "" },
        auth()
      );
      load();
    } catch (e) {
      setMsg("Update failed");
    }
  };

  return (
    <div className="ad-card">
      <h3>Resident Complaints</h3>
      {msg && <div className="ad-msg">{msg}</div>}

      <div className="ad-row">
        <input
          placeholder="Search (type/message/user)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <input
          placeholder="Ward"
          value={ward}
          onChange={(e) => setWard(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="open">open</option>
          <option value="in_progress">in_progress</option>
          <option value="resolved">resolved</option>
        </select>
        <button className="ad-secondary" onClick={load}>
          Filter
        </button>
      </div>

      <div className="ad-tableWrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>User</th>
              <th>Ward</th>
              <th>Type</th>
              <th>Message</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {items.map((c) => (
              <tr key={c._id}>
                <td className={c.status === "resolved" ? "ok" : "warn"}>{c.status}</td>
                <td>{c.userName || "-"}</td>
                <td>{c.ward || "-"}</td>
                <td>{c.type || "complaint"}</td>
                <td style={{ maxWidth: 420, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {c.message || "-"}
                </td>
                <td className="ad-actions">
                  {c.status !== "resolved" && (
                    <>
                      <button className="ad-pill ok" onClick={() => updateStatus(c._id, "in_progress")}>
                        In Progress
                      </button>
                      <button className="ad-pill danger" onClick={() => updateStatus(c._id, "resolved")}>
                        Resolve
                      </button>
                    </>
                  )}
                  {c.status === "resolved" && <span className="ok">Done</span>}
                </td>
              </tr>
            ))}

            {!items.length && (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", opacity: 0.6 }}>
                  No complaints found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
