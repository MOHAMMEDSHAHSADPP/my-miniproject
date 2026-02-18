import { useEffect, useState } from "react";
import API from "../../api";
import TicketDetailModal from "../resident/TicketDetailModal";

export default function ResidentTicketsAdminTab() {
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("");

  const [ward, setWard] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");

  const [openTicket, setOpenTicket] = useState(null);

  const auth = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const load = async () => {
    setMsg("");
    try {
      const res = await API.get("/resident-admin/tickets", {
        ...auth(),
        params: { ward, status, q },
      });
      setItems(res.data || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load tickets");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  const openDetails = async (id) => {
    setMsg("");
    try {
      const res = await API.get(`/resident-admin/tickets/${id}`, auth());
      setOpenTicket(res.data);
    } catch (e) {
      setMsg("Failed to open ticket");
    }
  };

  const changeStatus = async (id, newStatus) => {
    try {
      await API.put(`/resident-admin/tickets/${id}/status`, { status: newStatus }, auth());
      load();
      if (openTicket?._id === id) {
        const res = await API.get(`/resident-admin/tickets/${id}`, auth());
        setOpenTicket(res.data);
      }
    } catch (e) {
      setMsg("Status update failed");
    }
  };

  return (
    <div className="ad-card">
      <h3>Resident Support Tickets</h3>
      {msg && <div className="ad-msg">{msg}</div>}

      <div className="ad-row">
        <input
          placeholder="Search (name / subject / message)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <input
          placeholder="Ward (e.g. 1 / 2 / A)"
          value={ward}
          onChange={(e) => setWard(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="open">open</option>
          <option value="in_progress">in_progress</option>
          <option value="closed">closed</option>
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
              <th>Subject</th>
              <th>Updated</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {items.map((t) => (
              <tr key={t._id}>
                <td className={t.status === "closed" ? "ok" : "warn"}>{t.status}</td>
                <td>{t.userName || "-"}</td>
                <td>{t.ward || "-"}</td>
                <td style={{ maxWidth: 320, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {t.subject || "(no subject)"}
                </td>
                <td>{t.updatedAt ? new Date(t.updatedAt).toLocaleString() : "-"}</td>
                <td className="ad-actions">
                  <button onClick={() => openDetails(t._id)}>Open</button>

                  {t.status !== "closed" && (
                    <button className="ad-pill ok" onClick={() => changeStatus(t._id, "in_progress")}>
                      In Progress
                    </button>
                  )}

                  {t.status !== "closed" && (
                    <button className="ad-pill danger" onClick={() => changeStatus(t._id, "closed")}>
                      Close
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {!items.length && (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", opacity: 0.6 }}>
                  No tickets found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {openTicket && (
        <TicketDetailModal
          ticket={openTicket}
          onClose={() => setOpenTicket(null)}
          onReload={async () => {
            const res = await API.get(`/resident-admin/tickets/${openTicket._id}`, auth());
            setOpenTicket(res.data);
            load();
          }}
        />
      )}
    </div>
  );
}
