import { useEffect, useState } from "react";
import API from "../../api";

export default function ResidentFeedModerationTab() {
  const [posts, setPosts] = useState([]);
  const [msg, setMsg] = useState("");

  const auth = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const load = async () => {
    setMsg("");
    try {
      const res = await API.get("/resident-admin/feed/pending", auth());
      setPosts(res.data || []);
    } catch (e) {
      setMsg("Failed to load feed posts");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (id) => {
    await API.put(`/resident-admin/feed/${id}/approve`, {}, auth());
    load();
  };

  const reject = async (id) => {
    const reason = prompt("Reason for rejection (optional):", "");
    await API.put(
      `/resident-admin/feed/${id}/reject`,
      { reason },
      auth()
    );
    load();
  };

  return (
    <div className="ad-card">
      <h3>Resident Feed Moderation</h3>
      {msg && <div className="ad-msg">{msg}</div>}

      <div className="ad-tableWrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Content</th>
              <th>Ward</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p._id}>
                <td>{p.userName || "-"}</td>
                <td style={{ maxWidth: 400 }}>
                  {p.message || "(image post)"}
                </td>
                <td>{p.ward || "-"}</td>
                <td>
                  <button className="ad-pill ok" onClick={() => approve(p._id)}>
                    Approve
                  </button>
                  <button
                    className="ad-pill danger"
                    onClick={() => reject(p._id)}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
            {!posts.length && (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", opacity: 0.6 }}>
                  No pending posts
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
