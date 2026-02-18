import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import API from "../../api";
import "./RServices.css";

export default function RServices() {
  const { townSlug } = useOutletContext();
  const [activeTab, setActiveTab] = useState("all"); // all | gas | water | other
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  // New Request Form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    serviceType: "Gas Booking", // Gas Booking | Water Bill | Electrician | Plumber | Other
    description: "",
    preferredDate: "",
  });

  useEffect(() => {
    loadRequests();
  }, [townSlug]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await API.get("/resident/services/requests");
      setRequests(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Format details based on type
      let specificDetails = "";
      if (formData.serviceType === "Gas Booking") {
        specificDetails = `Consumer ID: ${formData.consumerId || "N/A"}`;
      } else if (formData.serviceType === "Water Bill") {
        specificDetails = `Bill Amount: ₹${formData.amount || "0"}, Bill ID: ${formData.billId || "N/A"}`;
      } else if (formData.serviceType === "Waste Pickup") {
        specificDetails = `Status: ${formData.wasteStatus || "Ready"}, Type: ${formData.wasteType || "Mixed"}`;
      }

      // Combine with user description
      const finalDetails = `${specificDetails ? specificDetails + ". " : ""}${formData.description}`;

      await API.post("/resident/services/requests", {
        townSlug,
        type: formData.serviceType,
        details: finalDetails,
        preferredDate: formData.preferredDate
      });
      alert("✅ Service requested successfully!");
      setShowForm(false);
      setFormData({ serviceType: "Gas Booking", description: "", preferredDate: "" }); // Reset basic
      loadRequests();
    } catch (e) {
      alert("Failed to submit request.");
    }
  };

  const filteredRequests = activeTab === "all"
    ? requests
    : requests.filter(r => r.serviceType.toLowerCase().includes(activeTab));

  return (
    <div className="rservices-container">
      <div className="rservices-header">
        <h2>🛠️ Services & Utilities</h2>
        <button className="btn-new" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Close Form" : "➕ New Request"}
        </button>
      </div>

      {showForm && (
        <div className="rservices-form-card">
          <h3>Request a Service</h3>
          <form onSubmit={handleSubmit}>
            <label>Service Type</label>
            <select
              value={formData.serviceType}
              onChange={(e) => setFormData({ ...formData, serviceType: e.target.value, description: "" })}
            >
              <option value="Gas Booking">🔥 Gas Cylinder Booking</option>
              <option value="Water Bill">💧 Water Bill Payment</option>
              <option value="Waste Pickup">🗑️ Waste Pickup</option>
              <option value="Other">Other</option>
            </select>

            {/* Dynamic Fields based on Type */}
            {formData.serviceType === "Gas Booking" && (
              <>
                <label>Consumer Number / Connection ID</label>
                <input
                  placeholder="e.g. 123456789"
                  required
                  value={formData.consumerId || ""}
                  onChange={e => setFormData({ ...formData, consumerId: e.target.value })}
                />
                <div className="form-note">Book a refill for your registered connection.</div>
              </>
            )}

            {formData.serviceType === "Water Bill" && (
              <>
                <label>Bill Amount (₹)</label>
                <input
                  type="number"
                  placeholder="Amount to pay"
                  required
                  value={formData.amount || ""}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                />
                <label>Bill Number / Account ID</label>
                <input
                  placeholder="e.g. WB-998877"
                  required
                  value={formData.billId || ""}
                  onChange={e => setFormData({ ...formData, billId: e.target.value })}
                />
                <div className="form-note">Payment for monthly water usage.</div>
              </>
            )}

            {formData.serviceType === "Waste Pickup" && (
              <>
                <label>Waste Status</label>
                <select
                  value={formData.wasteStatus || "Ready"}
                  onChange={e => setFormData({ ...formData, wasteStatus: e.target.value })}
                >
                  <option value="Ready">Ready for Pickup</option>
                  <option value="Not Ready">Not Ready (Cancel/Reschedule)</option>
                </select>
                <label>Waste Type</label>
                <select
                  value={formData.wasteType || "Mixed"}
                  onChange={e => setFormData({ ...formData, wasteType: e.target.value })}
                >
                  <option value="Mixed">Mixed Household</option>
                  <option value="Dry">Dry / Recyclable</option>
                  <option value="Wet">Wet / Organic</option>
                  <option value="E-Waste">E-Waste</option>
                  <option value="Bulky">Bulky Item (Furniture/etc)</option>
                </select>
              </>
            )}

            <label>Description / Additional Notes</label>
            <textarea
              required={formData.serviceType === "Other"}
              placeholder={formData.serviceType === "Other" ? "Describe your request..." : "Any specific instructions..."}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <label>Preferred Date</label>
            <input
              type="date"
              required
              value={formData.preferredDate}
              onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
            />

            <button type="submit" className="btn-submit">Submit Request</button>
          </form>
        </div>
      )}

      {/* Tabs Removed - showing all */}
      <div className="rservices-list">
        {loading ? <p>Loading...</p> : filteredRequests.length === 0 ? (
          <p className="empty-msg">No service requests found.</p>
        ) : (
          filteredRequests.map((req) => (
            <div key={req._id} className={`rservices-card ${req.status.toLowerCase()}`}>
              <div className="card-top">
                <h4>{req.serviceType}</h4>
                <span className={`status-badge ${req.status}`}>{req.status}</span>
              </div>
              <p>{req.description}</p>
              <small>📅 Preferred: {new Date(req.preferredDate).toLocaleDateString()}</small>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
