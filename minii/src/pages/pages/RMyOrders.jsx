import { useEffect, useState } from "react";
import API from "../../api";

export default function RMyOrders() {
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setMsg("");
    try {
      // your route earlier: /market/orders/mine
      const res = await API.get("/resident/market/orders/mine");
      setItems(res.data || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load orders");
    }
  };

  useEffect(() => { load(); }, []);

  const cancel = async (id) => {
    if (!window.confirm("Cancel this order?")) return;
    try {
      await API.put(`/resident/market/orders/${id}/cancel`);
      load();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Cancel failed");
    }
  };

  return (
    <div style={{ padding: 14 }}>
      <h2>My Orders</h2>
      {msg && <p>{msg}</p>}

      <div style={{ display: "grid", gap: 10 }}>
        {items.map((o) => (
          <div key={o._id} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
            <div style={{ fontWeight: 700 }}>{o.productTitle || o.product?.title || "Product"}</div>
            <div>Status: {o.status}</div>
            <div>Qty: {o.qty}</div>
            <div>Total: ₹{o.totalAmount || o.total || "-"}</div>
            {o.status === "placed" && <button onClick={() => cancel(o._id)}>Cancel</button>}
          </div>
        ))}
      </div>
    </div>
  );
}
