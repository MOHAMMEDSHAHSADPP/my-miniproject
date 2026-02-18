import { useEffect, useState } from "react";
import API from "../../api";

export default function ResidentAnalyticsTab() {
  const [summary, setSummary] = useState(null);
  const [complaintsWard, setComplaintsWard] = useState([]);
  const [serviceUsage, setServiceUsage] = useState([]);
  const [marketStats, setMarketStats] = useState(null);
  const [msg, setMsg] = useState("");

  const auth = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const load = async () => {
    setMsg("");
    try {
      const s = await API.get("/resident-admin/analytics/summary", auth());
      const c = await API.get("/resident-admin/analytics/complaints-per-ward", auth());
      const u = await API.get("/resident-admin/analytics/service-usage", auth());
      const m = await API.get("/resident-admin/analytics/market-stats", auth());

      setSummary(s.data);
      setComplaintsWard(c.data || []);
      setServiceUsage(u.data || []);
      setMarketStats(m.data);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Analytics load failed");
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="ad-card">
      {msg && <div className="ad-msg">{msg}</div>}

      <h3>Resident Analytics (Summary)</h3>

      {!summary ? (
        <p>Loading...</p>
      ) : (
        <div className="ad-grid">
          <div className="ad-box">
            <b>Total Users</b>
            <div>{summary.totalUsers}</div>
          </div>
          <div className="ad-box">
            <b>Complaints Open</b>
            <div>{summary.complaintsOpen}</div>
          </div>
          <div className="ad-box">
            <b>Complaints Resolved</b>
            <div>{summary.complaintsResolved}</div>
          </div>
          <div className="ad-box">
            <b>Total Orders</b>
            <div>{summary.totalOrders}</div>
          </div>
          <div className="ad-box">
            <b>Delivered</b>
            <div>{summary.ordersDelivered}</div>
          </div>
          <div className="ad-box">
            <b>Pending</b>
            <div>{summary.ordersPending}</div>
          </div>
        </div>
      )}

      <hr />

      <h3>Complaints per Ward</h3>
      <ul>
        {complaintsWard.map((w) => (
          <li key={w.ward}>
            Ward {w.ward} — {w.count}
          </li>
        ))}
      </ul>

      <hr />

      <h3>Service Usage</h3>
      <ul>
        {serviceUsage.map((s) => (
          <li key={s.type}>
            {s.type} — {s.count}
          </li>
        ))}
      </ul>

      <hr />

      <h3>Market Stats</h3>
      {!marketStats ? (
        <p>Loading...</p>
      ) : (
        <div className="ad-grid">
          <div className="ad-box">
            <b>Total Products</b>
            <div>{marketStats.totalProducts}</div>
          </div>
          <div className="ad-box">
            <b>Total Sellers</b>
            <div>{marketStats.totalSellers}</div>
          </div>
          <div className="ad-box">
            <b>Total Revenue (COD)</b>
            <div>₹{marketStats.totalRevenue}</div>
          </div>
        </div>
      )}
    </div>
  );
}
