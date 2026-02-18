import React, { useEffect, useState } from "react";
import API from "../../api";

export default function RProfile() {
  const [form, setForm] = useState({ name:"", ward:"", phone:"", address:"" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/resident/profile").then((r) => {
      const u = r.data || {};
      setForm({
        name: u.name || "",
        ward: u.ward || "",
        phone: u.phone || "",
        address: u.address || "",
      });
      setLoading(false);
    });
  }, []);

  const save = async () => {
    await API.put("/resident/profile", form);
    alert("Saved");
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ background:"#fff", borderRadius:16, padding:16, border:"1px solid rgba(120,80,255,0.15)" }}>
      <h2 style={{ marginTop:0, color:"#3a2b7a" }}>Profile</h2>

      <div style={{ display:"grid", gap:10, maxWidth:520 }}>
        <input value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} placeholder="Name" style={inp}/>
        <input value={form.ward} onChange={(e)=>setForm({...form,ward:e.target.value})} placeholder="Ward" style={inp}/>
        <input value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} placeholder="Phone" style={inp}/>
        <input value={form.address} onChange={(e)=>setForm({...form,address:e.target.value})} placeholder="Address" style={inp}/>
        <button onClick={save} style={btn}>Save</button>
      </div>
    </div>
  );
}

const inp = {
  height: 44,
  borderRadius: 12,
  border: "1px solid rgba(120,80,255,0.25)",
  padding: "0 12px",
  outline: "none",
};

const btn = {
  height: 44,
  borderRadius: 999,
  border: "none",
  background: "linear-gradient(90deg, #7a5cff, #5b8dff)",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};
