import React, { useEffect, useState } from "react";
import API from "../../api";
import "./RServices.css"; // Reuse card styles

export default function RBudget() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/resident/budget")
      .then(res => setDocs(res.data || []))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  // Calculate totals
  const totalAllocated = docs.reduce((sum, d) => sum + (d.allocated || 0), 0);
  const totalSpent = docs.reduce((sum, d) => sum + (d.spent || 0), 0);
  const totalRemaining = totalAllocated - totalSpent;
  const pct = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", display: "grid", gap: 24 }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #2b6cb0, #4299e1)",
        padding: "24px",
        borderRadius: "16px",
        color: "#fff",
        boxShadow: "0 4px 15px rgba(43, 108, 176, 0.2)"
      }}>
        <h2 style={{ margin: "0 0 8px 0" }}>💰 Town Budget & Spending</h2>
        <p style={{ margin: 0, opacity: 0.9 }}>
          Transparent financial reports for your town. See where funds are allocated and spent.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: 20, textAlign: "center", color: "#718096" }}>Loading budget data...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <div style={statCardStyle}>
              <div style={{ fontSize: "0.9rem", color: "#718096", fontWeight: 600 }}>Total Allocated</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#2b6cb0" }}>₹{totalAllocated.toLocaleString()}</div>
            </div>
            <div style={statCardStyle}>
              <div style={{ fontSize: "0.9rem", color: "#718096", fontWeight: 600 }}>Total Spent</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#e53e3e" }}>₹{totalSpent.toLocaleString()}</div>
            </div>
            <div style={statCardStyle}>
              <div style={{ fontSize: "0.9rem", color: "#718096", fontWeight: 600 }}>Remaining</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#38a169" }}>₹{totalRemaining.toLocaleString()}</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ background: "#fff", padding: 20, borderRadius: 16, border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: "0.9rem", fontWeight: 600, color: "#4a5568" }}>
              <span>Spending Progress</span>
              <span>{Math.round(pct)}% Used</span>
            </div>
            <div style={{ height: 12, background: "#edf2f7", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #4299e1, #2b6cb0)", transition: "width 0.5s ease" }} />
            </div>
          </div>

          {/* Budget Documents List */}
          <div style={{ background: "#fff", padding: 24, borderRadius: 16, border: "1px solid #e2e8f0", display: "grid", gap: 16 }}>
            <h3 style={{ margin: 0, color: "#2d3748" }}>📑 Detailed Reports</h3>
            {docs.length === 0 ? (
              <p style={{ color: "#718096", margin: 0 }}>No budget documents published yet.</p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {docs.map(doc => (
                  <div key={doc._id} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "16px", borderRadius: "12px", background: "#f7fafc", border: "1px solid #edf2f7"
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, color: "#2d3748" }}>{doc.title}</div>
                      <div style={{ fontSize: "0.85rem", color: "#718096", marginTop: 4 }}>
                        {doc.fiscalYear || "FY 2024-25"} • Allocated: ₹{doc.allocated?.toLocaleString()} • Spent: ₹{doc.spent?.toLocaleString()}
                      </div>
                    </div>
                    {doc.fileUrl && (
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                        style={{
                          padding: "8px 16px", background: "#fff", border: "1px solid #cbd5e0",
                          borderRadius: "8px", textDecoration: "none", color: "#4a5568", fontWeight: 600, fontSize: "0.9rem"
                        }}>
                        Download PDF
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const statCardStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "16px",
  border: "1px solid #e2e8f0",
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  gap: 4
};