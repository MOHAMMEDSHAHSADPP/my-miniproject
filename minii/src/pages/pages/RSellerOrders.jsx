import { useEffect, useState } from "react";
import API from "../../api";

export default function RSellerOrders() {
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setMsg("");
    try {
      const res = await API.get("/resident/market/seller/orders");
      setItems(res.data || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load seller orders");
    }
  };

  useEffect(() => { load(); }, []);

  const act = async (id, action) => {
    try {
      await API.put(`/resident/market/seller/orders/${id}/${action}`);
      load();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Action failed");
    }
  };

  return (
    <div style={{ padding: 14 }}>
      <h2>Seller Orders</h2>
      {msg && <p>{msg}</p>}

      <div style={{ display: "grid", gap: 10 }}>
        {items.map((o) => (
          <div key={o._id} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
            <div style={{ fontWeight: 700 }}>{o.productTitle || o.product?.title || "Product"}</div>
            <div>Status: {o.status}</div>
            <div>Qty: {o.qty}</div>

            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <button onClick={() => act(o._id, "accept")}>Accept</button>
              <button onClick={() => act(o._id, "reject")}>Reject</button>
              <button onClick={() => act(o._id, "delivered")}>Delivered</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
