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

export default function ResidentMarketAdminTab() {
  const [msg, setMsg] = useState("");

  const [tab, setTab] = useState("products"); // products | orders
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [q, setQ] = useState("");

  const loadProducts = async () => {
    setMsg("");
    try {
      const res = await API.get("/resident-admin/market/products", {
        headers: authHeaders(),
        params: { q },
      });
      setProducts(res.data || []);
    } catch (e) {
      setMsg(errMsg(e, "Failed to load products"));
    }
  };

  const loadOrders = async () => {
    setMsg("");
    try {
      const res = await API.get("/resident-admin/market/orders", {
        headers: authHeaders(),
        params: { q },
      });
      setOrders(res.data || []);
    } catch (e) {
      setMsg(errMsg(e, "Failed to load orders"));
    }
  };

  useEffect(() => {
    if (tab === "products") loadProducts();
    if (tab === "orders") loadOrders();
    // eslint-disable-next-line
  }, [tab]);

  const approveProduct = async (id) => {
    try {
      await API.patch(`/resident-admin/market/products/${id}`, { moderationStatus: "approved" }, { headers: authHeaders() });
      loadProducts();
    } catch (e) {
      setMsg(errMsg(e, "Approve failed"));
    }
  };

  const rejectProduct = async (id) => {
    const reason = prompt("Reject reason (optional):", "");
    if (reason === null) return;
    try {
      await API.patch(
        `/resident-admin/market/products/${id}`,
        { moderationStatus: "rejected", adminNote: reason || "" },
        { headers: authHeaders() }
      );
      loadProducts();
    } catch (e) {
      setMsg(errMsg(e, "Reject failed"));
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete product?")) return;
    try {
      await API.delete(`/resident-admin/market/products/${id}`, { headers: authHeaders() });
      loadProducts();
    } catch (e) {
      setMsg(errMsg(e, "Delete failed"));
    }
  };

  const setOrderStatus = async (orderId) => {
    const status = prompt(
      "Status (pending/accepted/rejected/delivered/cancelled):",
      "pending"
    );
    if (status === null) return;

    try {
      await API.patch(`/resident-admin/market/orders/${orderId}`, { status }, { headers: authHeaders() });
      loadOrders();
    } catch (e) {
      setMsg(errMsg(e, "Update failed"));
    }
  };

  return (
    <div className="ad-card">
      {msg && <div className="ad-msg">{msg}</div>}

      <div className="ad-row" style={{ gap: 10 }}>
        <button className={tab === "products" ? "ad-btn active" : "ad-btn"} onClick={() => setTab("products")}>
          Products
        </button>
        <button className={tab === "orders" ? "ad-btn active" : "ad-btn"} onClick={() => setTab("orders")}>
          Orders (COD)
        </button>

        <div style={{ flex: 1 }} />

        <input placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="ad-secondary" onClick={() => (tab === "products" ? loadProducts() : loadOrders())}>
          Search
        </button>
      </div>

      {tab === "products" && (
        <div className="ad-tableWrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Title</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Seller</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td className={p.moderationStatus === "approved" ? "ok" : p.moderationStatus === "rejected" ? "danger" : "warn"}>
                    {p.moderationStatus || "pending"}
                  </td>
                  <td>{p.name}</td>
                  <td>₹{p.price}</td>
                  <td>{p.quantity}</td>
                  <td>{p.sellerName || p.sellerEmail || "-"}</td>

                  <td className="ad-actions">
                    <button className="ad-pill ok" onClick={() => approveProduct(p._id)}>
                      Approve
                    </button>
                    <button className="ad-pill danger" onClick={() => rejectProduct(p._id)}>
                      Reject
                    </button>
                    <button className="danger" onClick={() => deleteProduct(p._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {!products.length && (
                <tr>
                  <td colSpan="6" style={{ opacity: 0.6 }}>
                    No products
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "orders" && (
        <div className="ad-tableWrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Buyer</th>
                <th>Seller</th>
                <th>Address</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td className={o.status === "delivered" ? "ok" : o.status === "rejected" ? "danger" : "warn"}>
                    {o.status}
                  </td>
                  <td>{o.productName || "-"}</td>
                  <td>{o.qty}</td>
                  <td>{o.buyerName || o.buyerEmail || "-"}</td>
                  <td>{o.sellerName || o.sellerEmail || "-"}</td>
                  <td style={{ maxWidth: 320, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {o.deliveryAddress || "-"}
                  </td>
                  <td className="ad-actions">
                    <button onClick={() => setOrderStatus(o._id)}>Update</button>
                  </td>
                </tr>
              ))}

              {!orders.length && (
                <tr>
                  <td colSpan="7" style={{ opacity: 0.6 }}>
                    No orders
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
