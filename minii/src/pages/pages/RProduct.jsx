import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api";

export default function RProduct() {
  const { id } = useParams();
  const nav = useNavigate();
  const [p, setP] = useState(null);
  const [msg, setMsg] = useState("");
  const [qty, setQty] = useState(1);
  const [address, setAddress] = useState("");

  const load = async () => {
    setMsg("");
    try {
      const res = await API.get(`/resident/market/products/${id}`);
      setP(res.data);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load product");
    }
  };

  useEffect(() => { load(); }, [id]);

  const order = async () => {
    setMsg("");
    if (!address.trim()) return setMsg("Address required");
    try {
      await API.post("/resident/market/orders", { productId: id, qty: Number(qty), address });
      setMsg("✅ Order placed (COD)");
      nav("/resident/my-orders");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Order failed");
    }
  };

  if (!p) return <div style={{ padding: 14 }}>Loading...</div>;

  const img = Array.isArray(p.images) ? p.images[0] : p.image;
  const imgUrl = img ? (img.startsWith("http") ? img : `http://localhost:8080/${img}`) : null;

  return (
    <div style={{ padding: 14 }}>
      <button onClick={() => nav(-1)}>← Back</button>
      <h2 style={{ marginTop: 10 }}>{p.title || p.name}</h2>
      {msg && <p>{msg}</p>}
      {imgUrl && <img alt="" src={imgUrl} style={{ width: "100%", borderRadius: 12, marginBottom: 10 }} />}

      <div style={{ fontSize: 18, fontWeight: 700 }}>₹{p.price}</div>
      <div style={{ marginTop: 8 }}>{p.description}</div>

      <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
        <input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} />
        <textarea rows={2} placeholder="Delivery address..." value={address} onChange={(e) => setAddress(e.target.value)} />
        <button onClick={order}>Place Order (COD)</button>
      </div>
    </div>
  );
}
