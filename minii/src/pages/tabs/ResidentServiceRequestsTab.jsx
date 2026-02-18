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

const STATUS = ["open", "in_progress", "resolved", "rejected"];

export default function ResidentServiceRequestsTab() {
  const [msg, setMsg] = useState("");
  const [items, setItems] = useState([]);

  const [filters, setFilters] = useState({
    q: "",
    type: "",
    ward: "",
    status: "",
  });

  const load = async () => {
    setMsg("");
    try {
      const res = await API.get("/resident-admin/services/requests", {
        headers: authHeaders(),
        params: filters,
      });
      setItems(res.data || []);
    } catch (e) {
      setMsg(errMsg(e, "Failed to load requests"));
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  const changeStatus = async (r) => {
    const status = prompt(`Status (${STATUS.join(", ")}):`, r.status || "open");
    if (status === null) return;
    if (!STATUS.includes(status)) return setMsg("Invalid status");

    const adminNote = prompt("Admin note (optional):", r.adminNote || "");
    if (adminNote === null) return;

    try {
      await API.patch(
        `/resident-admin/services/requests/${r._id}`,
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

      <div className="ad-row">
        <input
          placeholder="Search (name / message / address)"
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
        />

        <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
          <option value="">All types</option>
          <option value="gas">Gas</option>
          <option value="waste">Waste pickup</option>
          <option value="water">Water issue</option>
          <option value="electricity">Electricity issue</option>
        </select>

        <input
          placeholder="Ward filter (optional)"
          value={filters.ward}
          onChange={(e) => setFilters({ ...filters, ward: e.target.value })}
        />

        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All status</option>
          {STATUS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <button className="ad-secondary" onClick={load}>
          Search
        </button>
      </div>

      <div className="ad-tableWrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Type</th>
              <th>Resident</th>
              <th>Ward</th>
              <th>Details</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {items.map((r) => (
              <tr key={r._id}>
                <td className={r.status === "resolved" ? "ok" : r.status === "rejected" ? "danger" : "warn"}>
                  {r.status}
                </td>
                <td>{r.type}</td>
                <td>{r.userName || r.userEmail || "-"}</td>
                <td>{r.ward || "-"}</td>

                <td style={{ maxWidth: 420, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {r.message || r.description || "-"}
                  {r.address ? ` | ${r.address}` : ""}
                </td>

                <td>{r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}</td>

                <td className="ad-actions">
                  <button onClick={() => changeStatus(r)}>Update</button>
                </td>
              </tr>
            ))}

            {!items.length && (
              <tr>
                <td colSpan="7" style={{ opacity: 0.6 }}>
                  No requests
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
