import React, { useState } from "react";
import API from "../../api";
import { useNavigate } from "react-router-dom";

export default function ResidentSellerAddProduct() {
  const nav = useNavigate();

  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    quantity: "",
    description: "",
  });

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    if (!form.name || !form.category || !form.price) {
      return alert("Name, category, price required");
    }

    try {
      setLoading(true);

      const fd = new FormData();
      Object.keys(form).forEach((k) => fd.append(k, form[k]));
      for (let i = 0; i < images.length; i++) fd.append("images", images[i]);

      await API.post("/resident/market/products", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Product submitted ✅ (Town-only market)");
      nav("/resident/market");
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="h1">Sell Product</h2>
      <p className="muted">Only your town users can see & order (COD).</p>

      <div className="card" style={{ marginTop: 12 }}>
        <input
          name="name"
          value={form.name}
          onChange={onChange}
          placeholder="Product name"
          style={inp}
        />
        <input
          name="category"
          value={form.category}
          onChange={onChange}
          placeholder="Category (veg/eggs/food etc)"
          style={{ ...inp, marginTop: 10 }}
        />
        <input
          name="price"
          value={form.price}
          onChange={onChange}
          placeholder="Price"
          type="number"
          style={{ ...inp, marginTop: 10 }}
        />
        <input
          name="quantity"
          value={form.quantity}
          onChange={onChange}
          placeholder="Quantity"
          type="number"
          style={{ ...inp, marginTop: 10 }}
        />
        <textarea
          name="description"
          value={form.description}
          onChange={onChange}
          placeholder="Description"
          style={{ ...inp, marginTop: 10, height: 100 }}
        />

        <div style={{ marginTop: 10 }}>
          <div className="muted" style={{ marginBottom: 6 }}>Images (max 5)</div>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setImages(Array.from(e.target.files || []).slice(0, 5))}
          />
        </div>

        <button className="btn" style={{ marginTop: 12 }} onClick={submit} disabled={loading}>
          {loading ? "Uploading..." : "Submit"}
        </button>
      </div>
    </div>
  );
}

const inp = {
  width: "100%",
  padding: 10,
  borderRadius: 10,
  border: "1px solid var(--border)",
};
