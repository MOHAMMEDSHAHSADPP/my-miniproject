import { useEffect, useState } from "react";
import API from "../../api";

export default function RFeed() {
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("");
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);

  const load = async () => {
    setMsg("");
    try {
      const res = await API.get("/resident/feed");
      setItems(res.data || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load feed");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    setMsg("");
    if (!text.trim()) return setMsg("Write something first");
    try {
      const fd = new FormData();
      fd.append("text", text);
      if (image) fd.append("image", image);

      // your route: POST /resident/feed/submit
      await API.post("/resident/feed/submit", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setText("");
      setImage(null);
      setMsg("✅ Submitted for approval");
      load();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Submit failed");
    }
  };

  return (
    <div style={{ padding: 14 }}>
      <h2>Town Feed</h2>
      {msg && <p>{msg}</p>}

      <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
        <textarea
          rows={3}
          placeholder="Write a post..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} />
        <button onClick={submit}>Submit</button>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {items.map((it) => (
          <div key={it._id} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 13, opacity: 0.7 }}>
              {it.authorName || "Resident"} • {it.createdAt ? new Date(it.createdAt).toLocaleString() : ""}
            </div>
            <div style={{ marginTop: 6 }}>{it.text || it.caption || it.content}</div>
            {it.image && (
              <img
                alt=""
                src={it.image.startsWith("http") ? it.image : `http://localhost:8080/${it.image}`}
                style={{ width: "100%", marginTop: 8, borderRadius: 10 }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
