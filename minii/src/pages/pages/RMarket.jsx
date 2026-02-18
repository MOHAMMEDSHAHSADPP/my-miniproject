import React, { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import API from "../../api";
import "./RMarket.css";

export default function RMarket() {
  const { townSlug } = useOutletContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("browse"); // browse | sell | my-products
  const [products, setProducts] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Sell form
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    description: "",
    category: "",
    image: null,
  });

  useEffect(() => {
    if (activeTab === "browse") loadShop();
    else if (activeTab === "my-products") loadMyProducts();
  }, [activeTab, townSlug]);

  const loadShop = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/resident/market?town=${townSlug}`);
      setProducts(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadMyProducts = async () => {
    setLoading(true);
    try {
      const res = await API.get("/resident/market/my-products");
      setMyProducts(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSellSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("price", formData.price);
      data.append("description", formData.description);
      data.append("category", formData.category);
      data.append("townSlug", townSlug);
      if (formData.image) data.append("images", formData.image);

      await API.post("/resident/market", data);
      alert("✅ Product listed successfully!");
      setFormData({ title: "", price: "", description: "", category: "", image: null });
      setActiveTab("my-products");
    } catch (e) {
      alert("Failed to list product.");
    }
  };

  // Filter by search
  const filtered = products.filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase())
  );

  // Stats for my products
  const stats = {
    total: myProducts.length,
    pending: myProducts.filter(p => p.status === "pending").length,
    approved: myProducts.filter(p => p.status === "approved").length,
    rejected: myProducts.filter(p => p.status === "rejected").length,
  };

  return (
    <div className="rmarket-container">
      {/* Header + Tabs */}
      <div className="rmarket-header-top">
        <h2>🛒 {townSlug?.charAt(0).toUpperCase() + townSlug?.slice(1)} Marketplace</h2>
        <div className="rmarket-tabs">
          <button
            className={activeTab === "browse" ? "active" : ""}
            onClick={() => setActiveTab("browse")}
          >
            🛍️ Browse
          </button>
          <button
            className={activeTab === "sell" ? "active" : ""}
            onClick={() => setActiveTab("sell")}
          >
            ➕ List Item
          </button>
          <button
            className={activeTab === "my-products" ? "active" : ""}
            onClick={() => setActiveTab("my-products")}
          >
            📦 My Products
          </button>
        </div>
      </div>

      {loading && <div className="rmarket-loading">Loading...</div>}

      {/* ===== BROWSE VIEW ===== */}
      {!loading && activeTab === "browse" && (
        <div>
          {/* Search Bar */}
          <div className="rmarket-search">
            <input
              type="text"
              placeholder="🔍 Search by product name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="rmarket-grid">
            {filtered.length === 0 ? (
              <p className="rmarket-empty">
                {search ? `No results for "${search}"` : `No items for sale in ${townSlug} yet.`}
              </p>
            ) : (
              filtered.map((p) => (
                <div key={p._id} className="rmarket-card" onClick={() => navigate(`../product/${p._id}`)}>
                  <div className="rmarket-img" style={{
                    backgroundImage: `url(${(p.images && p.images[0]) || p.image || "https://placehold.co/300"})`,
                  }} />
                  <div className="rmarket-info">
                    <h4>{p.title}</h4>
                    {p.category && <span className="rmarket-category">{p.category}</span>}
                    <div className="rmarket-price">₹{p.price}</div>
                    <div className="rmarket-seller">By {p.sellerName || "Seller"}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ===== SELL VIEW ===== */}
      {!loading && activeTab === "sell" && (
        <div className="rmarket-sell-form">
          <h3>📦 List a Homemade / Local Item</h3>
          <form onSubmit={handleSellSubmit}>
            <label>Item Name</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Fresh Vegetables, Homemade Pickles"
            />

            <label>Category (your own)</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g. Vegetables, Snacks, Handicrafts"
            />

            <label>Price (₹)</label>
            <input
              type="number"
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="e.g. 100"
            />

            <label>Description</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your product..."
            />

            <label>Upload Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
            />

            <button type="submit" className="rmarket-btn-submit">List Item</button>
          </form>
        </div>
      )}

      {/* ===== MY PRODUCTS VIEW (Seller Dashboard) ===== */}
      {!loading && activeTab === "my-products" && (
        <div className="rmarket-my-dashboard">
          {/* Stats Cards */}
          <div className="rmarket-stats-grid">
            <div className="rmarket-stat-card">
              <span className="stat-number">{stats.total}</span>
              <span className="stat-label">Total Items</span>
            </div>
            <div className="rmarket-stat-card pending">
              <span className="stat-number">{stats.pending}</span>
              <span className="stat-label">Pending</span>
            </div>
            <div className="rmarket-stat-card approved">
              <span className="stat-number">₹{myProducts.reduce((acc, p) => acc + (p.status === "sold" ? (p.price || 0) : 0), 0)}</span>
              <span className="stat-label">Total Sales</span>
            </div>
            <div className="rmarket-stat-card rejected">
              <span className="stat-number">{stats.rejected}</span>
              <span className="stat-label">Rejected</span>
            </div>
          </div>

          <div style={{ marginTop: 20, padding: 15, background: "#f8f9fa", borderRadius: 8 }}>
            <h4>📊 Quick Analytics</h4>
            <p>Your top selling category: <strong>{myProducts.length > 0 ? myProducts[0].category || "N/A" : "No Data"}</strong></p>
            <p>Pending Approvals: <strong>{stats.pending}</strong></p>
          </div>

          {/* Product List */}
          <div className="rmarket-my-list" style={{ marginTop: 20 }}>
            <h3>Your Listings</h3>
            {myProducts.length === 0 ? (
              <p className="rmarket-empty">You haven't listed any items yet.</p>
            ) : (
              myProducts.map((p) => (
                <div key={p._id} className="rmarket-my-item">
                  <div className="my-item-info">
                    <b>{p.title}</b>
                    <span>₹{p.price}</span>
                    {p.category && <span className="rmarket-category-sm">{p.category}</span>}
                  </div>
                  <span className={`rmarket-status ${p.status || "pending"}`}>
                    {p.status || "pending"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
