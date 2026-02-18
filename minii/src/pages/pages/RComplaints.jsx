import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import API from "../../api";
import "./RServices.css"; // Reuse styling

export default function RComplaints() {
  const { townSlug } = useOutletContext();
  const [complaints, setComplaints] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "General", // General | Sanitation | Roads | Water | Electricity
  });

  useEffect(() => {
    loadComplaints();
  }, [townSlug]);

  const loadComplaints = async () => {
    try {
      const res = await API.get("/resident/complaints");
      setComplaints(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/resident/complaints", { ...formData, townSlug });
      alert("✅ Complaint registered!");
      setShowForm(false);
      setFormData({ title: "", description: "", category: "General" });
      loadComplaints();
    } catch (e) {
      alert("Failed to register complaint.");
    }
  };

  return (
    <div className="rservices-container">
      <div className="rservices-header">
        <h2>⚠️ Complaints & Grievances</h2>
        <button className="btn-new" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Close" : "➕ File Complaint"}
        </button>
      </div>

      {showForm && (
        <div className="rservices-form-card">
          <h3>Register New Complaint</h3>
          <form onSubmit={handleSubmit}>
            <label>Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="General">General</option>
              <option value="Sanitation">Sanitation / Waste</option>
              <option value="Roads">Roads & Infrastructure</option>
              <option value="Water">Water Supply</option>
              <option value="Electricity">Street Lights / Power</option>
              <option value="Stray Animals">Stray Animals</option>
            </select>

            <label>Title / Subject</label>
            <input
              type="text"
              required
              placeholder="Brief title of the issue"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />

            <label>Description</label>
            <textarea
              required
              placeholder="Describe the issue in detail..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <button type="submit" className="btn-submit">Submit Complaint</button>
          </form>
        </div>
      )}

      <div className="rservices-list">
        {complaints.length === 0 ? <p className="empty-msg">No complaints registered.</p> : (
          complaints.map((c) => (
            <div key={c._id} className={`rservices-card ${c.status?.toLowerCase() || 'pending'}`}>
              <div className="card-top">
                <h4>{c.title}</h4>
                <span className={`status-badge ${c.status || 'Pending'}`}>{c.status || 'Pending'}</span>
              </div>
              <p>{c.description}</p>
              <small>Category: {c.category} • {new Date(c.createdAt).toLocaleDateString()}</small>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
