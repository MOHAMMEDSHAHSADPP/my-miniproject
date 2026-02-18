import { useEffect, useState } from "react";
import API from "../../../api";

export default function ResidentVolunteerWorksTab() {
  const [mode, setMode] = useState("volunteers"); // volunteers | works
  const [msg, setMsg] = useState("");

  // shared filter
  const [ward, setWard] = useState("");

  // volunteers
  const [volunteers, setVolunteers] = useState([]);
  const [requestMsg, setRequestMsg] = useState("");
  const [requestWardScope, setRequestWardScope] = useState(""); // "" = whole town
  const [requestSkills, setRequestSkills] = useState(""); // comma string

  // works
  const [works, setWorks] = useState([]);
  const [workForm, setWorkForm] = useState({
    title: "",
    category: "road",
    ward: "",
    status: "planned",
  });

  const auth = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const loadVolunteers = async () => {
    setMsg("");
    try {
      const res = await API.get("/resident-admin/volunteers", {
        ...auth(),
        params: { ward },
      });
      setVolunteers(res.data || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load volunteers");
    }
  };

  const loadWorks = async () => {
    setMsg("");
    try {
      const res = await API.get("/resident-admin/works", {
        ...auth(),
        params: { ward },
      });
      setWorks(res.data || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load works");
    }
  };

  useEffect(() => {
    if (mode === "volunteers") loadVolunteers();
    else loadWorks();
    // eslint-disable-next-line
  }, [mode]);

  const applyFilter = () => {
    if (mode === "volunteers") loadVolunteers();
    else loadWorks();
  };

  const updateVolunteerStatus = async (id, status) => {
    try {
      await API.put(`/resident-admin/volunteers/${id}/status`, { status }, auth());
      loadVolunteers();
    } catch {
      setMsg("Update failed");
    }
  };

  const sendHelpRequest = async () => {
    setMsg("");
    const skills = String(requestSkills || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!requestMsg.trim()) return setMsg("Request message required");

    try {
      await API.post(
        "/resident-admin/volunteers/request",
        {
          wardScope: String(requestWardScope || "").trim(), // "" => whole town
          message: requestMsg.trim(),
          skills,
        },
        auth()
      );

      setRequestMsg("");
      setRequestWardScope("");
      setRequestSkills("");
      setMsg("✅ Help request sent (in-app notification).");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Request failed");
    }
  };

  const addWork = async () => {
    setMsg("");
    if (!workForm.title.trim()) return setMsg("Title required");

    try {
      await API.post(
        "/resident-admin/works",
        {
          title: workForm.title.trim(),
          category: workForm.category,
          ward: String(workForm.ward || "").trim(),
          status: workForm.status,
        },
        auth()
      );

      setWorkForm({ title: "", category: "road", ward: "", status: "planned" });
      loadWorks();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Add work failed");
    }
  };

  const updateWorkStatus = async (id, status) => {
    try {
      await API.put(`/resident-admin/works/${id}/status`, { status }, auth());
      loadWorks();
    } catch {
      setMsg("Work status update failed");
    }
  };

  return (
    <div className="ad-card">
      <h3>Volunteers + Public Works</h3>
      {msg && <div className="ad-msg">{msg}</div>}

      {/* mode switch */}
      <div className="ad-row" style={{ gap: 8 }}>
        <button
          className={mode === "volunteers" ? "ad-primary" : "ad-secondary"}
          onClick={() => setMode("volunteers")}
        >
          Volunteers
        </button>
        <button
          className={mode === "works" ? "ad-primary" : "ad-secondary"}
          onClick={() => setMode("works")}
        >
          Public Works
        </button>

        <div style={{ flex: 1 }} />

        {/* shared filter */}
        <input
          placeholder="Ward filter (optional)"
          value={ward}
          onChange={(e) => setWard(e.target.value)}
          style={{ maxWidth: 220 }}
        />
        <button className="ad-secondary" onClick={applyFilter}>
          Apply
        </button>
      </div>

      {/* ================= VOLUNTEERS ================= */}
      {mode === "volunteers" && (
        <>
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #eee" }}>
            <h4 style={{ margin: "0 0 10px" }}>Request Help (Send to volunteers)</h4>

            <div className="ad-grid">
              <input
                placeholder="Ward scope (empty = whole town)"
                value={requestWardScope}
                onChange={(e) => setRequestWardScope(e.target.value)}
              />
              <input
                placeholder="Skills (comma optional) e.g. plumber, first-aid"
                value={requestSkills}
                onChange={(e) => setRequestSkills(e.target.value)}
              />
              <input
                placeholder="Message to volunteers"
                value={requestMsg}
                onChange={(e) => setRequestMsg(e.target.value)}
              />
              <button className="ad-primary" onClick={sendHelpRequest}>
                Send Request
              </button>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <h4 style={{ margin: "0 0 10px" }}>Volunteer List</h4>

            <div className="ad-tableWrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Name</th>
                    <th>Ward</th>
                    <th>Skills</th>
                    <th>Phone</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {volunteers.map((v) => (
                    <tr key={v._id}>
                      <td className={v.status === "approved" ? "ok" : "warn"}>{v.status}</td>
                      <td>{v.name || v.userName || "-"}</td>
                      <td>{v.ward || "-"}</td>
                      <td style={{ maxWidth: 280, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {(v.skills || []).join(", ") || "-"}
                      </td>
                      <td>{v.phone || "-"}</td>
                      <td className="ad-actions">
                        <button className="ad-pill ok" onClick={() => updateVolunteerStatus(v._id, "approved")}>
                          Approve
                        </button>
                        <button className="ad-pill danger" onClick={() => updateVolunteerStatus(v._id, "rejected")}>
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!volunteers.length && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", opacity: 0.6 }}>
                        No volunteers found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ================= WORKS ================= */}
      {mode === "works" && (
        <>
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #eee" }}>
            <h4 style={{ margin: "0 0 10px" }}>Add Work Item</h4>

            <div className="ad-grid">
              <input
                placeholder="Title (e.g. Road repair near temple)"
                value={workForm.title}
                onChange={(e) => setWorkForm({ ...workForm, title: e.target.value })}
              />

              <select
                value={workForm.category}
                onChange={(e) => setWorkForm({ ...workForm, category: e.target.value })}
              >
                <option value="road">road</option>
                <option value="drainage">drainage</option>
                <option value="streetlight">streetlight</option>
                <option value="water">water</option>
                <option value="other">other</option>
              </select>

              <input
                placeholder="Ward (optional)"
                value={workForm.ward}
                onChange={(e) => setWorkForm({ ...workForm, ward: e.target.value })}
              />

              <select
                value={workForm.status}
                onChange={(e) => setWorkForm({ ...workForm, status: e.target.value })}
              >
                <option value="planned">planned</option>
                <option value="ongoing">ongoing</option>
                <option value="completed">completed</option>
              </select>

              <button className="ad-primary" onClick={addWork}>
                Add Work
              </button>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <h4 style={{ margin: "0 0 10px" }}>Work Tracker</h4>

            <div className="ad-tableWrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Category</th>
                    <th>Title</th>
                    <th>Ward</th>
                    <th>Updated</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {works.map((w) => (
                    <tr key={w._id}>
                      <td className={w.status === "completed" ? "ok" : "warn"}>{w.status}</td>
                      <td>{w.category}</td>
                      <td style={{ maxWidth: 420, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {w.title}
                      </td>
                      <td>{w.ward || "-"}</td>
                      <td>{w.updatedAt ? new Date(w.updatedAt).toLocaleString() : "-"}</td>
                      <td className="ad-actions">
                        <button className="ad-pill ok" onClick={() => updateWorkStatus(w._id, "ongoing")}>
                          Ongoing
                        </button>
                        <button className="ad-pill ok" onClick={() => updateWorkStatus(w._id, "completed")}>
                          Completed
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!works.length && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", opacity: 0.6 }}>
                        No work items found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
