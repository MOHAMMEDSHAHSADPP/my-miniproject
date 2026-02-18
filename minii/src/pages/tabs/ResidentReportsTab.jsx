import { useEffect, useState } from "react";
import API from "../../api";

export default function ResidentReportsTab() {
  const [reports, setReports] = useState([]);
  const [msg, setMsg] = useState("");

  const auth = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const load = async () => {
    setMsg("");
    try {
      const res = await API.get("/resident-admin/reports", auth());
      setReports(res.data || []);
    } catch (e) {
      setMsg("Failed to load reports");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resolve = async (id) => {
    if (!window.confirm("Mark this report as resolved?")) return;
    await API.put(`/resident-admin/reports/${id}/resolve`, {}, auth());
    load();
  };

  return (
    <div className="ad-card">
      <h3>Reports & Abuse Monitoring</h3>
      {msg && <div className="ad-msg">{msg}</div>}

      <div className="ad-tableWrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Reported By</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r._id}>
                <td>{r.type}</td>
                <td>{r.reportedByName || "-"}</td>
                <td>{r.reason || "-"}</td>
                <td className={r.status === "open" ? "warn" : "ok"}>
                  {r.status}
                </td>
                <td>
                  {r.status === "open" ? (
                    <button className="ad-pill ok" onClick={() => resolve(r._id)}>
                      Resolve
                    </button>
                  ) : (
                    "Done"
                  )}
                </td>
              </tr>
            ))}
            {!reports.length && (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", opacity: 0.6 }}>
                  No reports
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
