import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";
import "./admin.css";
import AdminChat from "./AdminChat";
import MapEditorPage from "./town/editor/MapEditorPage";

export default function AdminDashboard() {

  const [tab, setTab] = useState("registry");

  // dropdowns
  const [visitorOpen, setVisitorOpen] = useState(false);

  // ✅ NEW: Residents dropdown ONLY (added)
  const [residentOpen, setResidentOpen] = useState(false);

  // ✅ NEW: Town Selector for Super Admin
  const [allTowns, setAllTowns] = useState([]);
  const [selectedTown, setSelectedTown] = useState("");
  const [userRole, setUserRole] = useState("");

  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/admin/login");
  };

  // ✅ If token missing, go back to login. Fetch towns if super_admin
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!token || !user?.isAdmin) {
      navigate("/admin/login", { replace: true });
      return;
    }
    setUserRole(user.role);

    // If super_admin, fetch towns
    if (user.role === "super_admin") {
      console.log("Fetching towns for Super Admin...");
      API.get("/admin/visitor/towns") // API interceptor should handle token
        .then(res => {
          console.log("Towns fetched:", res.data);
          setAllTowns(res.data || []);
          if (res.data && res.data.length > 0) {
            // Default to first town if not selected
            // USE CORRECT FIELDS: townSlug, townName
            if (!selectedTown) setSelectedTown(res.data[0].townSlug);
          }
        })
        .catch(err => console.error("Failed to fetch towns", err));
    } else {
      // For town_admin/admin, use their assigned town
      const t = user.townSlug || user.adminTownSlug || "";
      console.log("Setting town for Admin:", t);
      setSelectedTown(t);
    }
  }, [navigate]);

  return (
    <div className="ad-wrap">
      <aside className="ad-side">
        <div className="ad-brand">Urban Connect</div>

        {/* ================= SUPER ADMIN TOWN SELECTOR ================= */}
        {userRole === "super_admin" && (
          <div style={{ padding: "0 10px 10px 10px" }}>
            <label style={{ color: "#aaa", fontSize: "0.8rem" }}>Managing Town:</label>
            <select
              className="ad-input"
              value={selectedTown}
              onChange={(e) => setSelectedTown(e.target.value)}
              style={{ width: "100%", marginTop: 5 }}
            >
              <option value="">-- Select Town --</option>
              {allTowns.map(t => (
                <option key={t._id} value={t.townSlug}>{t.townName}</option>
              ))}
            </select>
          </div>
        )}
        {/* ============================================================= */}

        {/* ================= OLD (KEEP) ================= */}
        <button
          className={tab === "registry" ? "ad-btn active" : "ad-btn"}
          onClick={() => setTab("registry")}
        >
          Resident DB
        </button>

        <button
          className={tab === "users" ? "ad-btn active" : "ad-btn"}
          onClick={() => setTab("users")}
        >
          Ban / Unban Users
        </button>
        {/* ============================================= */}

        {/* ================= NEW: VISITORS DROPDOWN (KEEP ALL) ================= */}
        <button
          className={tab.startsWith("visitor_") ? "ad-btn active" : "ad-btn"}
          onClick={() => setVisitorOpen((s) => !s)}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Visitors</span>
          <span style={{ opacity: 0.7 }}>{visitorOpen ? "▾" : "▸"}</span>
        </button>

        {visitorOpen && (
          <div style={{ paddingLeft: 10, display: "grid", gap: 6 }}>

            <button
              className={tab === "visitor_trending" ? "ad-btn active" : "ad-btn"}
              onClick={() => setTab("visitor_trending")}
            >
              Trending Banners
            </button>
            <button
              className={
                tab === "visitor_announcements" ? "ad-btn active" : "ad-btn"
              }
              onClick={() => setTab("visitor_announcements")}
            >
              Announcements
            </button>
            <button
              className={tab === "visitor_places" ? "ad-btn active" : "ad-btn"}
              onClick={() => setTab("visitor_places")}
            >
              Places (PLP/PDP)
            </button>
            <button
              className={
                tab === "visitor_emergency" ? "ad-btn active" : "ad-btn"
              }
              onClick={() => setTab("visitor_emergency")}
            >
              Emergency
            </button>
            <button
              className={tab === "visitor_services" ? "ad-btn active" : "ad-btn"}
              onClick={() => setTab("visitor_services")}
            >
              Services
            </button>
            <button
              className={tab === "visitor_travel" ? "ad-btn active" : "ad-btn"}
              onClick={() => setTab("visitor_travel")}
            >
              Travel
            </button>
            <button
              className={
                tab === "visitor_complaints" ? "ad-btn active" : "ad-btn"
              }
              onClick={() => setTab("visitor_complaints")}
            >
              Complaints
            </button>
            <button
              className={tab === "visitor_warnings" ? "ad-btn active" : "ad-btn"}
              onClick={() => setTab("visitor_warnings")}
            >
              Warning Places
            </button>
            <button
              className={tab === "visitor_info" ? "ad-btn active" : "ad-btn"}
              onClick={() => setTab("visitor_info")}
            >
              Town Info (Chatbot)
            </button>
            <button
              className={tab === "visitor_map" ? "ad-btn active" : "ad-btn"}
              onClick={() => setTab("visitor_map")}
            >
              3D Map Buildings
            </button>
            <button
              className={tab === "visitor_towns" ? "ad-btn active" : "ad-btn"}
              onClick={() => setTab("visitor_towns")}
            >
              Towns
            </button>
          </div>
        )}
        {/* ========================================================= */}

        {/* ================= ✅ NEW: RESIDENTS DROPDOWN (ONLY ADDITION) ================= */}
        <button
          className={tab.startsWith("resident_") ? "ad-btn active" : "ad-btn"}
          onClick={() => setResidentOpen((s) => !s)}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Residents</span>
          <span style={{ opacity: 0.7 }}>{residentOpen ? "▾" : "▸"}</span>
        </button>

        {residentOpen && (
          <div style={{ paddingLeft: 10, display: "grid", gap: 6 }}>
            <button
              className={
                tab === "resident_directory" ? "ad-btn active" : "ad-btn"
              }
              onClick={() => setTab("resident_directory")}
            >
              Directory
            </button>
            <button
              className={tab === "resident_notices" ? "ad-btn active" : "ad-btn"}
              onClick={() => setTab("resident_notices")}
            >
              Gov Notices
            </button>
            <button
              className={tab === "resident_events" ? "ad-btn active" : "ad-btn"}
              onClick={() => setTab("resident_events")}
            >
              Events
            </button>
            <button
              className={tab === "resident_polls" ? "ad-btn active" : "ad-btn"}
              onClick={() => setTab("resident_polls")}
            >
              Polls
            </button>
            <button
              className={tab === "resident_works" ? "ad-btn active" : "ad-btn"}
              onClick={() => setTab("resident_works")}
            >
              Public Works
            </button>
            <button
              className={tab === "resident_services" ? "ad-btn active" : "ad-btn"}
              onClick={() => setTab("resident_services")}
            >
              Service Requests
            </button>
            <button
              className={tab === "resident_tickets" ? "ad-btn active" : "ad-btn"}
              onClick={() => setTab("resident_tickets")}
            >
              Support Tickets
            </button>
            <button
              className={tab === "resident_complaints" ? "ad-btn active" : "ad-btn"}
              onClick={() => setTab("resident_complaints")}
            >
              Complaints
            </button>
            <button
              className={tab === "resident_budget" ? "ad-btn active" : "ad-btn"}
              onClick={() => setTab("resident_budget")}
            >
              Budget / Funds
            </button>
            <button
              className={tab === "resident_market" ? "ad-btn active" : "ad-btn"}
              onClick={() => setTab("resident_market")}
            >
              Market (Approve/Reject)
            </button>
            <button
              className={tab === "resident_markers" ? "ad-btn active" : "ad-btn"}
              onClick={() => setTab("resident_markers")}
            >
              Map Markers
            </button>
            <button
              className={
                tab === "resident_suggestions" ? "ad-btn active" : "ad-btn"
              }
              onClick={() => setTab("resident_suggestions")}
            >
              Suggestions
            </button>
            <button
              className={tab === "resident_chat" ? "ad-btn active" : "ad-btn"}
              onClick={() => setTab("resident_chat")}
            >
              Support Chat
            </button>
          </div>
        )}
        {/* =========================================================================== */}

        <div className="ad-spacer" />
        <button className="ad-btn danger" onClick={logout}>
          Logout
        </button>
      </aside>

      <main className="ad-main">
        <div className="ad-top">
          <h2>{titleFor(tab)}</h2>
          <p className="ad-sub">
            {tab.startsWith("visitor_")
              ? "Visitors admin • manage towns, trending, announcements, places, emergency, complaints"
              : tab.startsWith("resident_")
                ? "Residents admin • directory, funds, markers, suggestions"
                : "Clean dashboard • town-based verification enabled"}
          </p>
        </div>

        {/* ================= OLD (KEEP) ================= */}
        {tab === "registry" && <RegistryTab />}
        {tab === "users" && <UsersTab />}
        {/* ============================================= */}

        {/* ================= VISITOR TABS (KEEP ALL) ================= */}

        {tab === "visitor_trending" && <VisitorTrendingTab />}
        {tab === "visitor_announcements" && <VisitorAnnouncementsTab />}
        {tab === "visitor_places" && <VisitorPlacesTab />}
        {tab === "visitor_emergency" && <VisitorEmergencyTab />}
        {tab === "visitor_services" && <VisitorServicesTab />}
        {tab === "visitor_travel" && <VisitorTravelTab />}
        {tab === "visitor_complaints" && <VisitorComplaintsTab />}
        {tab === "visitor_warnings" && <VisitorWarningTab />}
        {tab === "visitor_info" && <VisitorInfoTab />}
        {tab === "visitor_map" && <VisitorMapBuildingsTab />}
        {tab === "visitor_towns" && <VisitorTownsTab />}
        {/* =========================================================== */}

        {/* ================= ✅ RESIDENT FEATURES ================= */}
        {tab === "resident_notices" && <ResidentNoticesTab townSlug={selectedTown} />}
        {tab === "resident_events" && <ResidentEventsTab townSlug={selectedTown} />}
        {tab === "resident_polls" && <ResidentPollsTab townSlug={selectedTown} />}
        {tab === "resident_works" && <ResidentWorksTab townSlug={selectedTown} />}
        {tab === "resident_services" && <ResidentServicesTab townSlug={selectedTown} />}
        {tab === "resident_tickets" && <ResidentTicketsTab townSlug={selectedTown} />}
        {tab === "resident_complaints" && <ResidentComplaintsTab townSlug={selectedTown} />}

        {tab === "resident_directory" && <ResidentDirectoryTab townSlug={selectedTown} />}
        {tab === "resident_budget" && <ResidentBudgetTab townSlug={selectedTown} />}
        {tab === "resident_market" && <ResidentMarketAdminTab townSlug={selectedTown} />}
        {tab === "resident_markers" && <ResidentMapMarkersTab townSlug={selectedTown} />}
        {tab === "resident_suggestions" && <ResidentSuggestionsAdminTab townSlug={selectedTown} />}
        {tab === "resident_chat" && <AdminChat townSlug={selectedTown} />}
        {/* =================================================================== */}
      </main>
    </div>
  );
}

function titleFor(tab) {
  if (tab === "registry") return "Resident Database";
  if (tab === "users") return "Users Management";
  if (tab === "visitor_towns") return "Visitor • Towns";
  if (tab === "visitor_trending") return "Visitor • Trending";
  if (tab === "visitor_announcements") return "Visitor • Announcements";
  if (tab === "visitor_places") return "Visitor • Places";
  if (tab === "visitor_emergency") return "Visitor • Emergency";
  if (tab === "visitor_travel") return "Visitor • Travel";
  if (tab === "visitor_complaints") return "Visitor • Complaints";
  if (tab === "visitor_warnings") return "Visitor • Warning Places";
  if (tab === "visitor_info") return "Visitor • Town Info (Chatbot)";
  if (tab === "visitor_map") return "Visitor • 3D Map Buildings";

  // ✅ NEW titles
  if (tab === "resident_notices") return "Resident • Government Notices";
  if (tab === "resident_events") return "Resident • Events";
  if (tab === "resident_polls") return "Resident • Polls";
  if (tab === "resident_works") return "Resident • Public Works";
  if (tab === "resident_services") return "Resident • Service Requests";
  if (tab === "resident_tickets") return "Resident • Support Tickets";
  if (tab === "resident_complaints") return "Resident • Complaints";

  if (tab === "resident_directory") return "Residents • Directory";
  if (tab === "resident_budget") return "Residents • Budget / Funds";
  if (tab === "resident_market") return "Residents • Market Approval";
  if (tab === "resident_markers") return "Residents • Map Markers";
  if (tab === "resident_suggestions") return "Residents • Suggestions";

  return "Admin Dashboard";
}

/* ================= SHARED HELPERS ================= */

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function errMsg(err, fallback) {
  return err?.response?.data?.message || fallback;
}

/* =========================
   ✅ YOUR OLD TABS (UNCHANGED)
   ========================= */

function RegistryTab() {
  const [records, setRecords] = useState([]);
  const [msg, setMsg] = useState("");
  const [q, setQ] = useState("");
  const [claimed, setClaimed] = useState("");
  const [townNameFilter, setTownNameFilter] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    houseNo: "",
    ward: "",
    dob: "",
    familyHeadName: "",
    voterId: "",
    townName: "",
  });

  const fetchRecords = async () => {
    setMsg("");
    try {
      const res = await API.get("/admin/registry", {
        headers: authHeaders(),
        params: { q, claimed, townName: townNameFilter },
      });
      setRecords(res.data);
    } catch (err) {
      setMsg(errMsg(err, "Failed to load records"));
    }
  };

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line
  }, []);

  const addRecord = async () => {
    setMsg("");
    try {
      await API.post("/admin/registry", form, { headers: authHeaders() });
      setForm({
        fullName: "",
        houseNo: "",
        ward: "",
        dob: "",
        familyHeadName: "",
        voterId: "",
        townName: "",
      });
      fetchRecords();
    } catch (err) {
      setMsg(errMsg(err, "Add failed"));
    }
  };

  const editRecord = async (r) => {
    const fullName = prompt("Full Name:", r.fullName);
    if (fullName === null) return;
    const houseNo = prompt("House No:", r.houseNo);
    if (houseNo === null) return;
    const ward = prompt("Ward:", r.ward);
    if (ward === null) return;
    const dob = prompt("DOB (YYYY-MM-DD):", r.dob);
    if (dob === null) return;
    const familyHeadName = prompt("Family Head Name:", r.familyHeadName);
    if (familyHeadName === null) return;
    const voterId = prompt("Voter ID / Property ID:", r.voterId);
    if (voterId === null) return;
    const townName = prompt("Town Name:", r.townName);
    if (townName === null) return;

    try {
      await API.patch(
        `/admin/registry/${r._id}`,
        { fullName, houseNo, ward, dob, familyHeadName, voterId, townName },
        { headers: authHeaders() }
      );
      fetchRecords();
    } catch (err) {
      setMsg(errMsg(err, "Update failed"));
    }
  };

  const deleteRecord = async (id) => {
    if (!window.confirm("Delete this record?")) return;
    try {
      await API.delete(`/admin/registry/${id}`, { headers: authHeaders() });
      fetchRecords();
    } catch (err) {
      setMsg(errMsg(err, "Delete failed"));
    }
  };

  return (
    <div className="ad-card">
      {msg && <div className="ad-msg">{msg}</div>}

      <div className="ad-grid">
        <input
          placeholder="Full Name"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
        />
        <input
          placeholder="House No"
          value={form.houseNo}
          onChange={(e) => setForm({ ...form, houseNo: e.target.value })}
        />
        <input
          placeholder="Ward"
          value={form.ward}
          onChange={(e) => setForm({ ...form, ward: e.target.value })}
        />
        <input
          placeholder="DOB YYYY-MM-DD"
          value={form.dob}
          onChange={(e) => setForm({ ...form, dob: e.target.value })}
        />
        <input
          placeholder="Family Head Name"
          value={form.familyHeadName}
          onChange={(e) =>
            setForm({ ...form, familyHeadName: e.target.value })
          }
        />
        <input
          placeholder="Voter ID / Property ID"
          value={form.voterId}
          onChange={(e) => setForm({ ...form, voterId: e.target.value })}
        />
        <input
          placeholder="Town Name"
          value={form.townName}
          onChange={(e) => setForm({ ...form, townName: e.target.value })}
        />
        <button className="ad-primary" onClick={addRecord}>
          Add Resident
        </button>
      </div>

      <div className="ad-row">
        <input
          placeholder="Search name/house/ward/voterId"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <input
          placeholder="Filter Town Name (optional)"
          value={townNameFilter}
          onChange={(e) => setTownNameFilter(e.target.value)}
        />
        <select value={claimed} onChange={(e) => setClaimed(e.target.value)}>
          <option value="">All</option>
          <option value="false">Not Claimed</option>
          <option value="true">Claimed</option>
        </select>
        <button className="ad-secondary" onClick={fetchRecords}>
          Search
        </button>
      </div>

      <div className="ad-tableWrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>House</th>
              <th>Ward</th>
              <th>DOB</th>
              <th>Town</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r._id}>
                <td>{r.fullName}</td>
                <td>{r.houseNo}</td>
                <td>{r.ward}</td>
                <td>{r.dob}</td>
                <td>{r.townName}</td>
                <td className={r.isClaimed ? "ok" : "warn"}>
                  {r.isClaimed ? "Claimed" : "Not Claimed"}
                </td>
                <td className="ad-actions">
                  <button onClick={() => editRecord(r)}>Edit</button>
                  <button className="danger" onClick={() => deleteRecord(r._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [msg, setMsg] = useState("");

  const fetchUsers = async () => {
    setMsg("");
    try {
      const res = await API.get("/admin/users", { headers: authHeaders() });
      setUsers(res.data.filter((u) => !u.isAdmin));
    } catch (err) {
      setMsg(errMsg(err, "Failed to load users"));
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  const ban = async (id) => {
    if (!window.confirm("Ban this user?")) return;
    try {
      await API.patch(`/admin/users/${id}/ban`, null, {
        headers: authHeaders(),
      });
      fetchUsers();
    } catch (err) {
      setMsg(errMsg(err, "Ban failed"));
    }
  };

  const unban = async (id) => {
    try {
      await API.patch(`/admin/users/${id}/unban`, null, {
        headers: authHeaders(),
      });
      fetchUsers();
    } catch (err) {
      setMsg(errMsg(err, "Unban failed"));
    }
  };

  return (
    <div className="ad-card">
      {msg && <div className="ad-msg">{msg}</div>}

      <div className="ad-tableWrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Town</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.townName || "-"}</td>
                <td className={u.isBanned ? "warn" : "ok"}>
                  {u.isBanned ? "BANNED" : "ACTIVE"}
                </td>
                <td>
                  {u.isBanned ? (
                    <button className="ad-pill ok" onClick={() => unban(u._id)}>
                      Unban
                    </button>
                  ) : (
                    <button
                      className="ad-pill danger"
                      onClick={() => ban(u._id)}
                    >
                      Ban
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* =========================
   ✅ VISITOR ADMIN TABS (FULL)
   ========================= */

// NOTE: VisitorTownsTab is now at the end of file with enhanced 3D map features

function TownPicker({ towns, townSlug, setTownSlug, label = "Town" }) {
  return (
    <div className="ad-row">
      <label style={{ fontSize: 12, opacity: 0.8 }}>{label}</label>
      <select value={townSlug} onChange={(e) => setTownSlug(e.target.value)}>
        <option value="">Select town</option>
        {towns.map((t) => (
          <option key={t._id} value={t.townSlug}>
            {t.district} — {t.townName}
          </option>
        ))}
      </select>
    </div>
  );
}

function useTowns() {
  const [towns, setTowns] = useState([]);
  const load = async () => {
    const res = await API.get("/admin/visitor/towns", { headers: authHeaders() });
    setTowns(res.data || []);
  };
  useEffect(() => {
    load();
  }, []);
  return { towns, reloadTowns: load };
}

function VisitorServicesTab() {
  const [msg, setMsg] = useState("");
  const [townSlug, setTownSlug] = useState("");
  const [items, setItems] = useState([]);
  const { towns } = useTowns();

  const [form, setForm] = useState({
    name: "",
    category: "on_demand",
    link: "",
    description: "",
    icon: null,
  });

  const load = async () => {
    if (!townSlug) return;
    setMsg("");
    try {
      const res = await API.get(`/admin/visitor/${townSlug}/services`, {
        headers: authHeaders(),
      });
      setItems(res.data || []);
    } catch (e) {
      setMsg(errMsg(e, "Failed to load services"));
    }
  };

  useEffect(() => { load(); }, [townSlug]);

  const add = async () => {
    if (!townSlug) return setMsg("Select a town first.");
    if (!form.name || !form.category) return setMsg("Name and Category required.");
    if (!form.icon) return setMsg("Icon is required.");

    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("category", form.category);
      fd.append("link", form.link);
      fd.append("description", form.description || "");
      fd.append("icon", form.icon);

      await API.post(`/admin/visitor/${townSlug}/services`, fd, {
        headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
      });

      setForm({ name: "", category: "on_demand", link: "", description: "", icon: null });
      load();
    } catch (e) {
      setMsg(errMsg(e, "Add service failed"));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete service?")) return;
    try {
      await API.delete(`/admin/visitor/services/${id}`, { headers: authHeaders() });
      load();
    } catch (e) {
      setMsg(errMsg(e, "Delete failed"));
    }
  };

  return (
    <div className="ad-card">
      {msg && <div className="ad-msg">{msg}</div>}
      <TownPicker towns={towns} townSlug={townSlug} setTownSlug={setTownSlug} label="Town for Services" />

      <div className="ad-grid">
        <input placeholder="Service Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
          <option value="on_demand">On-Demand</option>
          <option value="govt">Government</option>
          <option value="emergency">Emergency</option>
        </select>
        <div style={{ display: 'flex', gap: 10 }}>
          <input placeholder="Ex. Link" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} style={{ flex: 1 }} />
        </div>
        <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        <input type="file" accept="image/*" onChange={e => setForm({ ...form, icon: e.target.files?.[0] || null })} />
        <button className="ad-primary" onClick={add}>Add Service</button>
      </div>

      <div className="ad-tableWrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Icon</th>
              <th>Name</th>
              <th>Category</th>
              <th>Details</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map(it => (
              <tr key={it._id}>
                <td>
                  {it.icon && <img src={`http://localhost:8081${it.icon}`} style={{ width: 30, height: 30, objectFit: 'contain' }} />}
                </td>
                <td>{it.name}</td>
                <td>{it.category}</td>
                <td>
                  {it.link && <a href={it.link} target="_blank">Link</a>}
                </td>
                <td><button className="danger" onClick={() => remove(it._id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VisitorTrendingTab() {
  const [msg, setMsg] = useState("");
  const [townSlug, setTownSlug] = useState("");
  const [items, setItems] = useState([]);
  const { towns } = useTowns();

  const [form, setForm] = useState({ title: "", subtitle: "", image: null });

  const load = async () => {
    if (!townSlug) return;
    setMsg("");
    try {
      const res = await API.get(`/admin/visitor/${townSlug}/trending`, {
        headers: authHeaders(),
      });
      setItems(res.data || []);
    } catch (e) {
      setMsg(errMsg(e, "Failed to load trending"));
    }
  };

  useEffect(() => {
    load();
  }, [townSlug]);

  const add = async () => {
    if (!townSlug) return setMsg("Select a town first.");
    if (!form.title) return setMsg("Title required.");
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("subtitle", form.subtitle);
      if (form.image) fd.append("image", form.image);

      await API.post(`/admin/visitor/${townSlug}/trending`, fd, {
        headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
      });

      setForm({ title: "", subtitle: "", image: null });
      load();
    } catch (e) {
      setMsg(errMsg(e, "Add trending failed"));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete banner?")) return;
    try {
      await API.delete(`/admin/visitor/trending/${id}`, {
        headers: authHeaders(),
      });
      load();
    } catch (e) {
      setMsg(errMsg(e, "Delete failed"));
    }
  };

  return (
    <div className="ad-card">
      {msg && <div className="ad-msg">{msg}</div>}

      <TownPicker
        towns={towns}
        townSlug={townSlug}
        setTownSlug={setTownSlug}
        label="Town for Trending"
      />

      <div className="ad-grid">
        <input
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          placeholder="Subtitle (optional)"
          value={form.subtitle}
          onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setForm({ ...form, image: e.target.files?.[0] || null })}
        />
        <button className="ad-primary" onClick={add}>
          Add Banner
        </button>
      </div>

      <div className="ad-tableWrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Subtitle</th>
              <th>Active</th>
              <th>Image</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it._id}>
                <td>{it.title}</td>
                <td>{it.subtitle || "-"}</td>
                <td>{String(it.isActive)}</td>
                <td>{it.image ? "✅" : "-"}</td>
                <td>
                  <button className="danger" onClick={() => remove(it._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VisitorAnnouncementsTab() {
  const [msg, setMsg] = useState("");
  const [townSlug, setTownSlug] = useState("");
  const [items, setItems] = useState([]);
  const { towns } = useTowns();

  const [form, setForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    priority: "normal",
  });

  const load = async () => {
    if (!townSlug) return;
    setMsg("");
    try {
      const res = await API.get(`/admin/visitor/${townSlug}/announcements`, {
        headers: authHeaders(),
      });
      setItems(res.data || []);
    } catch (e) {
      setMsg(errMsg(e, "Failed to load announcements"));
    }
  };

  useEffect(() => {
    load();
  }, [townSlug]);

  const add = async () => {
    if (!townSlug) return setMsg("Select a town first.");
    if (!form.title) return setMsg("Title required.");
    try {
      await API.post(`/admin/visitor/${townSlug}/announcements`, form, {
        headers: authHeaders(),
      });
      setForm({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        priority: "normal",
      });
      load();
    } catch (e) {
      setMsg(errMsg(e, "Add announcement failed"));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete announcement?")) return;
    try {
      await API.delete(`/admin/visitor/announcements/${id}`, {
        headers: authHeaders(),
      });
      load();
    } catch (e) {
      setMsg(errMsg(e, "Delete failed"));
    }
  };

  return (
    <div className="ad-card">
      {msg && <div className="ad-msg">{msg}</div>}

      <TownPicker
        towns={towns}
        townSlug={townSlug}
        setTownSlug={setTownSlug}
        label="Town for Announcements"
      />

      <div className="ad-grid">
        <input
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <input
          placeholder="Start Date (YYYY-MM-DD)"
          value={form.startDate}
          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
        />
        <input
          placeholder="End Date (YYYY-MM-DD)"
          value={form.endDate}
          onChange={(e) => setForm({ ...form, endDate: e.target.value })}
        />
        <select
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value })}
        >
          <option value="low">low</option>
          <option value="normal">normal</option>
          <option value="high">high</option>
        </select>
        <button className="ad-primary" onClick={add}>
          Add Announcement
        </button>
      </div>

      <div className="ad-tableWrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Priority</th>
              <th>Start</th>
              <th>End</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it._id}>
                <td>{it.title}</td>
                <td>{it.priority || "normal"}</td>
                <td>{it.startDate || "-"}</td>
                <td>{it.endDate || "-"}</td>
                <td>
                  <button className="danger" onClick={() => remove(it._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ========== PLACES TAB (category-based extra fields) ========== */

const CATEGORIES = [
  { value: "hotel", label: "Hotel" },
  { value: "lodge", label: "Lodge" },
  { value: "hospital", label: "Hospital" },
  { value: "restaurant", label: "Restaurant" },
  { value: "shop", label: "Shop" },
  { value: "toilet", label: "Public Toilet" },
  { value: "tourist_spot", label: "Tourist Spot" },
  { value: "govt", label: "Government Office" },
  { value: "service", label: "Service (plumber/electrician/barber)" },
  { value: "danger", label: "Danger Spot (warning)" },
  { value: "culture", label: "Cultural Place" },
  { value: "bank", label: "Bank" },
];

function detailsTemplate(category) {
  if (category === "hospital") {
    return { doctors: "", departments: "", visitingHours: "", ambulance: "" };
  }
  if (category === "hotel" || category === "lodge") {
    return { checkIn: "", checkOut: "", priceRange: "", facilities: "" };
  }
  if (category === "restaurant") {
    return { cuisine: "", timings: "", mustTry: "" };
  }
  if (category === "service") {
    return { serviceType: "", timings: "", chargesHint: "" };
  }
  if (category === "tourist_spot" || category === "culture") {
    return { bestTime: "", entryFee: "", notes: "" };
  }
  if (category === "danger") {
    return { warning: "", safeTips: "" };
  }
  if (category === "bank") {
    return { timings: "", ifscCode: "", branchName: "", atmAvailable: "", services: "" };
  }
  return { extra: "" };
}

function VisitorPlacesTab() {
  const [msg, setMsg] = useState("");
  const [townSlug, setTownSlug] = useState("");
  const [items, setItems] = useState([]);
  const { towns } = useTowns();

  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [form, setForm] = useState({
    category: "hotel",
    title: "",
    description: "",
    address: "",
    phone: "",
    tags: "",
    mapUrl: "",
    lat: "",
    lng: "",
    details: detailsTemplate("hotel"),
    images: [],
  });

  const load = async () => {
    if (!townSlug) return;
    setMsg("");
    try {
      const res = await API.get(`/admin/visitor/${townSlug}/places`, {
        headers: authHeaders(),
        params: { q, category: categoryFilter },
      });
      setItems(res.data || []);
    } catch (e) {
      setMsg(errMsg(e, "Failed to load places"));
    }
  };

  useEffect(() => {
    load();
  }, [townSlug]);

  const add = async () => {
    if (!townSlug) return setMsg("Select a town first.");
    if (!form.title) return setMsg("Title required.");

    try {
      const fd = new FormData();
      fd.append("category", form.category);
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("address", form.address);
      fd.append("phone", form.phone);
      fd.append("tags", form.tags);
      fd.append("mapUrl", form.mapUrl);
      fd.append("lat", form.lat);
      fd.append("lng", form.lng);
      fd.append("details", JSON.stringify(form.details));

      (form.images || []).forEach((f) => fd.append("images", f));

      await API.post(`/admin/visitor/${townSlug}/places`, fd, {
        headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
      });

      setForm({
        category: "hotel",
        title: "",
        description: "",
        address: "",
        phone: "",
        tags: "",
        mapUrl: "",
        lat: "",
        lng: "",
        details: detailsTemplate("hotel"),
        images: [],
      });

      load();
    } catch (e) {
      setMsg(errMsg(e, "Add place failed"));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete place?")) return;
    try {
      await API.delete(`/admin/visitor/places/${id}`, { headers: authHeaders() });
      load();
    } catch (e) {
      setMsg(errMsg(e, "Delete failed"));
    }
  };

  const setCategory = (cat) => {
    setForm((p) => ({ ...p, category: cat, details: detailsTemplate(cat) }));
  };

  const updateDetailsField = (key, value) => {
    setForm((p) => ({ ...p, details: { ...p.details, [key]: value } }));
  };

  const detailsKeys = useMemo(
    () => Object.keys(form.details || {}),
    [form.details]
  );

  return (
    <div className="ad-card">
      {msg && <div className="ad-msg">{msg}</div>}

      <TownPicker
        towns={towns}
        townSlug={townSlug}
        setTownSlug={setTownSlug}
        label="Town for Places"
      />

      <div className="ad-row">
        <input
          placeholder="Search..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <button className="ad-secondary" onClick={load}>
          Search
        </button>
      </div>

      <div className="ad-grid">
        <select value={form.category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <input
          placeholder="Title / Name"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <input
          placeholder="Address"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <input
          placeholder="Tags (comma)"
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
        />

        <input
          placeholder="Map URL (Google Maps link)"
          value={form.mapUrl}
          onChange={(e) => setForm({ ...form, mapUrl: e.target.value })}
        />
        <input
          placeholder="Lat (optional)"
          value={form.lat}
          onChange={(e) => setForm({ ...form, lat: e.target.value })}
        />
        <input
          placeholder="Lng (optional)"
          value={form.lng}
          onChange={(e) => setForm({ ...form, lng: e.target.value })}
        />

        {detailsKeys.map((k) => (
          <input
            key={k}
            placeholder={`Details • ${k}`}
            value={String(form.details?.[k] ?? "")}
            onChange={(e) => updateDetailsField(k, e.target.value)}
          />
        ))}

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) =>
            setForm({ ...form, images: Array.from(e.target.files || []) })
          }
        />

        <button className="ad-primary" onClick={add}>
          Add Place
        </button>
      </div>

      <div className="ad-tableWrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Title</th>
              <th>Phone</th>
              <th>Views</th>
              <th>Likes</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it._id}>
                <td>{it.category}</td>
                <td>{it.title}</td>
                <td>{it.phone || "-"}</td>
                <td>{it.viewsCount ?? 0}</td>
                <td>{it.likesCount ?? 0}</td>
                <td>
                  <button className="danger" onClick={() => remove(it._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VisitorEmergencyTab() {
  const [msg, setMsg] = useState("");
  const [townSlug, setTownSlug] = useState("");
  const [items, setItems] = useState([]);
  const { towns } = useTowns();

  const [form, setForm] = useState({ label: "", number: "", notes: "" });

  const load = async () => {
    if (!townSlug) return;
    setMsg("");
    try {
      const res = await API.get(`/admin/visitor/${townSlug}/emergency`, {
        headers: authHeaders(),
      });
      setItems(res.data || []);
    } catch (e) {
      setMsg(errMsg(e, "Failed to load emergency"));
    }
  };

  useEffect(() => {
    load();
  }, [townSlug]);

  const add = async () => {
    if (!townSlug) return setMsg("Select a town first.");
    if (!form.label || !form.number) return setMsg("Label & Number required.");
    try {
      await API.post(`/admin/visitor/${townSlug}/emergency`, form, {
        headers: authHeaders(),
      });
      setForm({ label: "", number: "", notes: "" });
      load();
    } catch (e) {
      setMsg(errMsg(e, "Add emergency failed"));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete?")) return;
    await API.delete(`/admin/visitor/emergency/${id}`, { headers: authHeaders() });
    load();
  };

  return (
    <div className="ad-card">
      {msg && <div className="ad-msg">{msg}</div>}
      <TownPicker
        towns={towns}
        townSlug={townSlug}
        setTownSlug={setTownSlug}
        label="Town for Emergency"
      />

      <div className="ad-grid">
        <input
          placeholder="Label (Police/Fire/etc)"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
        />
        <input
          placeholder="Number"
          value={form.number}
          onChange={(e) => setForm({ ...form, number: e.target.value })}
        />
        <input
          placeholder="Notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
        <button className="ad-primary" onClick={add}>
          Add
        </button>
      </div>

      <div className="ad-tableWrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Label</th>
              <th>Number</th>
              <th>Notes</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it._id}>
                <td>{it.label}</td>
                <td>{it.number}</td>
                <td>{it.notes || "-"}</td>
                <td>
                  <button className="danger" onClick={() => remove(it._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VisitorTravelTab() {
  const [msg, setMsg] = useState("");
  const [townSlug, setTownSlug] = useState("");
  const [items, setItems] = useState([]);
  const { towns } = useTowns();

  const [form, setForm] = useState({
    type: "other",
    title: "",
    details: "",
    mapUrl: "",
  });

  const load = async () => {
    if (!townSlug) return;
    setMsg("");
    try {
      const res = await API.get(`/admin/visitor/${townSlug}/travel`, {
        headers: authHeaders(),
      });
      setItems(res.data || []);
    } catch (e) {
      setMsg(errMsg(e, "Failed to load travel"));
    }
  };

  useEffect(() => {
    load();
  }, [townSlug]);

  const add = async () => {
    if (!townSlug) return setMsg("Select a town first.");
    if (!form.title) return setMsg("Title required.");
    try {
      await API.post(`/admin/visitor/${townSlug}/travel`, form, {
        headers: authHeaders(),
      });
      setForm({ type: "other", title: "", details: "", mapUrl: "" });
      load();
    } catch (e) {
      setMsg(errMsg(e, "Add travel failed"));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete?")) return;
    await API.delete(`/admin/visitor/travel/${id}`, { headers: authHeaders() });
    load();
  };

  return (
    <div className="ad-card">
      {msg && <div className="ad-msg">{msg}</div>}
      <TownPicker
        towns={towns}
        townSlug={townSlug}
        setTownSlug={setTownSlug}
        label="Town for Travel"
      />

      <div className="ad-grid">
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          <option value="bus">bus</option>
          <option value="train">train</option>
          <option value="taxi">taxi</option>
          <option value="auto">auto</option>
          <option value="other">other</option>
        </select>
        <input
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          placeholder="Details"
          value={form.details}
          onChange={(e) => setForm({ ...form, details: e.target.value })}
        />
        <input
          placeholder="Map URL (optional)"
          value={form.mapUrl}
          onChange={(e) => setForm({ ...form, mapUrl: e.target.value })}
        />
        <button className="ad-primary" onClick={add}>
          Add
        </button>
      </div>

      <div className="ad-tableWrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Title</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it._id}>
                <td>{it.type}</td>
                <td>{it.title}</td>
                <td>
                  <button className="danger" onClick={() => remove(it._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VisitorComplaintsTab() {
  const [msg, setMsg] = useState("");
  const [townSlug, setTownSlug] = useState("");
  const [items, setItems] = useState([]);
  const { towns } = useTowns();

  const load = async () => {
    if (!townSlug) return;
    setMsg("");
    try {
      const res = await API.get(`/admin/visitor/${townSlug}/complaints`, {
        headers: authHeaders(),
      });
      setItems(res.data || []);
    } catch (e) {
      setMsg(errMsg(e, "Failed to load complaints"));
    }
  };

  useEffect(() => {
    load();
  }, [townSlug]);

  const resolve = async (id) => {
    const adminNote = prompt("Admin note (optional):", "");
    try {
      await API.patch(
        `/admin/visitor/complaints/${id}/resolve`,
        { adminNote: adminNote || "" },
        { headers: authHeaders() }
      );
      load();
    } catch (e) {
      setMsg(errMsg(e, "Resolve failed"));
    }
  };

  return (
    <div className="ad-card">
      {msg && <div className="ad-msg">{msg}</div>}
      <TownPicker
        towns={towns}
        townSlug={townSlug}
        setTownSlug={setTownSlug}
        label="Town for Complaints"
      />

      <div className="ad-tableWrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Type</th>
              <th>From</th>
              <th>Message</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it._id}>
                <td className={it.status === "resolved" ? "ok" : "warn"}>
                  {it.status}
                </td>
                <td>{it.type || "complaint"}</td>
                <td>
                  {it.fromName || "-"}{" "}
                  {it.fromEmail ? `(${it.fromEmail})` : ""}
                </td>
                <td
                  style={{
                    maxWidth: 420,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {it.message}
                </td>
                <td>
                  {it.status === "resolved" ? (
                    <span className="ok">Done</span>
                  ) : (
                    <button className="ad-pill ok" onClick={() => resolve(it._id)}>
                      Resolve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* =========================
   ✅ NEW VISITOR TABS (WARNINGS, INFO)
   ========================= */

function VisitorWarningTab() {
  const [msg, setMsg] = useState("");
  const [townSlug, setTownSlug] = useState("");
  const [items, setItems] = useState([]);
  const { towns } = useTowns();

  const [form, setForm] = useState({ title: "", description: "", mapUrl: "", image: null });

  const load = async () => {
    if (!townSlug) return;
    setMsg("");
    try {
      const res = await API.get(`/admin/visitor/${townSlug}/warnings`, { headers: authHeaders() });
      setItems(res.data || []);
    } catch (e) {
      setMsg(errMsg(e, "Failed to load warnings"));
    }
  };

  useEffect(() => { load(); }, [townSlug]);

  const add = async () => {
    if (!townSlug) return setMsg("Select town first");
    if (!form.title || !form.description || !form.image) return setMsg("All fields + image required");
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("mapUrl", form.mapUrl || "");
      fd.append("image", form.image);
      await API.post(`/admin/visitor/${townSlug}/warnings`, fd, {
        headers: { ...authHeaders(), "Content-Type": "multipart/form-data" }
      });
      setForm({ title: "", description: "", mapUrl: "", image: null });
      load();
    } catch (e) {
      setMsg(errMsg(e, "Add warning failed"));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete warning?")) return;
    try {
      await API.delete(`/admin/visitor/warnings/${id}`, { headers: authHeaders() });
      load();
    } catch (e) {
      setMsg(errMsg(e, "Delete failed"));
    }
  };

  return (
    <div className="ad-card">
      {msg && <div className="ad-msg">{msg}</div>}
      <TownPicker towns={towns} townSlug={townSlug} setTownSlug={setTownSlug} label="Town for Warnings" />
      <div className="ad-grid">
        <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        <input placeholder="Map URL (optional)" value={form.mapUrl} onChange={e => setForm({ ...form, mapUrl: e.target.value })} />
        <input type="file" accept="image/*" onChange={e => setForm({ ...form, image: e.target.files?.[0] || null })} />
        <button className="ad-primary" onClick={add}>Add Warning</button>
      </div>
      <div className="ad-tableWrap">
        <table className="ad-table">
          <thead><tr><th>Title</th><th>Description</th><th>Image</th><th>Action</th></tr></thead>
          <tbody>
            {items.map(it => (
              <tr key={it._id}>
                <td>{it.title}</td>
                <td>{it.description}</td>
                <td>{it.image ? "✅" : "-"}</td>
                <td><button className="danger" onClick={() => remove(it._id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VisitorInfoTab() {
  const [msg, setMsg] = useState("");
  const [townSlug, setTownSlug] = useState("");
  const [items, setItems] = useState([]);
  const { towns } = useTowns();

  const [form, setForm] = useState({ keyword: "", content: "", category: "general" });

  const load = async () => {
    if (!townSlug) return;
    setMsg("");
    try {
      const res = await API.get(`/admin/visitor/${townSlug}/info`, { headers: authHeaders() });
      setItems(res.data || []);
    } catch (e) {
      setMsg(errMsg(e, "Failed to load info"));
    }
  };

  useEffect(() => { load(); }, [townSlug]);

  const add = async () => {
    if (!townSlug) return setMsg("Select town first");
    if (!form.keyword || !form.content) return setMsg("Keyword & Content required");
    try {
      await API.post(`/admin/visitor/${townSlug}/info`, form, { headers: authHeaders() });
      setForm({ keyword: "", content: "", category: "general" });
      load();
    } catch (e) {
      setMsg(errMsg(e, "Add info failed"));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete info?")) return;
    try {
      await API.delete(`/admin/visitor/info/${id}`, { headers: authHeaders() });
      load();
    } catch (e) {
      setMsg(errMsg(e, "Delete failed"));
    }
  };

  return (
    <div className="ad-card">
      {msg && <div className="ad-msg">{msg}</div>}
      <TownPicker towns={towns} townSlug={townSlug} setTownSlug={setTownSlug} label="Town for Chatbot Info" />
      <div className="ad-grid">
        <input placeholder="Keyword (e.g. plumber, population)" value={form.keyword} onChange={e => setForm({ ...form, keyword: e.target.value })} />
        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
          <option value="general">General</option>
          <option value="service">Service</option>
          <option value="contact">Contact</option>
        </select>
        <textarea style={{ minHeight: 60, padding: 8 }} placeholder="Bot Response Content" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
        <button className="ad-primary" onClick={add}>Add Fact</button>
      </div>
      <div className="ad-tableWrap">
        <table className="ad-table">
          <thead><tr><th>Keyword</th><th>Category</th><th>Content</th><th>Action</th></tr></thead>
          <tbody>
            {items.map(it => (
              <tr key={it._id}>
                <td>{it.keyword}</td>
                <td>{it.category}</td>
                <td>{it.content}</td>
                <td><button className="danger" onClick={() => remove(it._id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ========== VISITOR MAP BUILDINGS TAB ==========
function VisitorMapBuildingsTab() {
  const [msg, setMsg] = useState("");
  const [townSlug, setTownSlug] = useState("");
  const [townId, setTownId] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const { towns } = useTowns();
  const [filteredTowns, setFilteredTowns] = useState([]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isSuper = user.adminRole === 'super_admin' || user.isAdmin === true;
  const myTownSlug = user.adminTownSlug;

  // Filter towns based on permissions
  useEffect(() => {
    if (isSuper) {
      setFilteredTowns(towns);
    } else if (user.adminRole === 'town_admin' && myTownSlug) {
      const allowed = towns.filter(t => t.townSlug === myTownSlug);
      setFilteredTowns(allowed);
      if (!townSlug) setTownSlug(myTownSlug);
    } else {
      setFilteredTowns([]);
    }
  }, [towns, isSuper, myTownSlug, user.adminRole]);

  // Find townId when slug changes
  useEffect(() => {
    if (townSlug && towns.length) {
      const t = towns.find(x => x.townSlug === townSlug);
      if (t) setTownId(t._id);
    }
  }, [townSlug, towns]);

  // Permission Guard: Show big error if they try to bypass
  const isDenied = !isSuper && townSlug && townSlug !== myTownSlug;

  if (showBuilder && townId) {
    return <MapEditorPage townId={townId} townSlug={townSlug} onBack={() => setShowBuilder(false)} />;
  }

  return (
    <div className="ad-card">
      <TownPicker towns={filteredTowns} townSlug={townSlug} setTownSlug={setTownSlug} label="Town for 3D Map" />

      <div style={{ padding: "40px", textAlign: "center", background: "#f9fafb", borderRadius: "8px", marginTop: "20px" }}>
        <h3>Custom Map Builder</h3>
        <p style={{ maxWidth: "600px", margin: "10px auto", color: "#666" }}>
          Design the town layout manually. Place roads, buildings, and parks on a grid.
          This replaces the real-world map data.
        </p>

        {townSlug ? (
          <button
            className="ad-primary"
            style={{ padding: "12px 24px", fontSize: "16px", marginTop: "20px" }}
            onClick={() => setShowBuilder(true)}
          >
            Launch Map Builder 🏗️
          </button>
        ) : (
          <p style={{ color: "#ef4444", fontWeight: "bold" }}>Select a town to start building.</p>
        )}
      </div>

    </div>
  );
}


/* =======================================================================
   ✅✅✅ NEW RESIDENT FEATURES (ONLY ADDITION)
   - These are inside SAME FILE (so you don’t create new files)
   - Uses SAME ad-card/ad-grid/ad-table CSS (no new css)
   - If backend not ready, it still won’t break your visitors/admin
   ======================================================================= */

function ResidentDirectoryTab({ townSlug }) {
  const [msg, setMsg] = useState("");
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");

  const [form, setForm] = useState({
    name: "",
    houseNo: "",
    ward: "",
    phone: "",
    email: "",
  });

  const load = async () => {
    if (!townSlug) return;
    setMsg("");
    try {
      // ✅ you can change endpoint later in backend, UI same
      const res = await API.get("/admin/directory", {
        headers: authHeaders(),
        params: { q, townSlug },
      });
      setItems(res.data || []);
    } catch (e) {
      setMsg(errMsg(e, "Failed to load resident directory"));
    }
  };

  useEffect(() => {
    load();
  }, [townSlug]);

  const add = async () => {
    if (!townSlug) return setMsg("Select town first");
    setMsg("");
    try {
      await API.post("/admin/directory", { ...form, townSlug }, { headers: authHeaders() });
      setForm({ name: "", houseNo: "", ward: "", phone: "", email: "" });
      load();
    } catch (e) {
      setMsg(errMsg(e, "Add failed"));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete resident entry?")) return;
    try {
      await API.delete(`/admin/directory/${id}`, { headers: authHeaders() });
      load();
    } catch (e) {
      setMsg(errMsg(e, "Delete failed"));
    }
  };

  return (
    <div className="ad-card">
      {msg && <div className="ad-msg">{msg}</div>}

      <div className="ad-grid">
        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="House No" value={form.houseNo} onChange={(e) => setForm({ ...form, houseNo: e.target.value })} />
        <input placeholder="Ward" value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value })} />
        <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <button className="ad-primary" onClick={add}>Add</button>
      </div>

      <div className="ad-row">
        <input placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="ad-secondary" onClick={load}>Search</button>
      </div>

      <div className="ad-tableWrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Name</th><th>House</th><th>Ward</th><th>Phone</th><th>Email</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it._id}>
                <td>{it.name}</td>
                <td>{it.houseNo}</td>
                <td>{it.ward}</td>
                <td>{it.phone || "-"}</td>
                <td>{it.email || "-"}</td>
                <td><button className="danger" onClick={() => remove(it._id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

function ResidentBudgetTab({ townSlug }) {
  const [msg, setMsg] = useState("");
  const [rows, setRows] = useState([]);

  const [form, setForm] = useState({
    title: "",
    amount: "",
    type: "expense", // income/expense
    date: "",
    note: "",
  });

  const load = async () => {
    if (!townSlug) return;
    setMsg("");
    try {
      const res = await API.get("/admin/budget", {
        headers: authHeaders(),
        params: { townSlug }
      });
      setRows(res.data || []);
    } catch (e) {
      setMsg(errMsg(e, "Failed to load budget"));
    }
  };

  useEffect(() => { load(); }, [townSlug]);

  const add = async () => {
    if (!townSlug) return setMsg("Please select a town first");
    if (!form.title || !form.amount) return setMsg("Title & amount required");
    setMsg("");
    try {
      await API.post("/admin/budget", { ...form, townSlug }, { headers: authHeaders() });
      setForm({ title: "", amount: "", type: "expense", date: "", note: "" });
      load();
    } catch (e) {
      setMsg(errMsg(e, "Add failed"));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete record?")) return;
    try {
      await API.delete(`/admin/budget/${id}`, { headers: authHeaders() });
      load();
    } catch (e) {
      setMsg(errMsg(e, "Delete failed"));
    }
  };

  return (
    <div className="ad-card">
      {msg && <div className="ad-msg">{msg}</div>}

      <div className="ad-grid">
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="income">income</option>
          <option value="expense">expense</option>
        </select>
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        <input placeholder="Date (YYYY-MM-DD)" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <input placeholder="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        <button className="ad-primary" onClick={add}>Add</button>
      </div>

      <div className="ad-tableWrap">
        <table className="ad-table">
          <thead>
            <tr><th>Type</th><th>Title</th><th>Amount</th><th>Date</th><th>Note</th><th>Action</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id}>
                <td className={r.type === "income" ? "ok" : "warn"}>{r.type}</td>
                <td>{r.title}</td>
                <td>{r.amount}</td>
                <td>{r.date || "-"}</td>
                <td>{r.note || "-"}</td>
                <td><button className="danger" onClick={() => remove(r._id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

function ResidentMapMarkersTab({ townSlug }) {
  const [msg, setMsg] = useState("");
  const [markers, setMarkers] = useState([]);

  const [form, setForm] = useState({
    title: "",
    category: "water",
    lat: "",
    lng: "",
    note: "",
  });

  const load = async () => {
    if (!townSlug) return;
    setMsg("");
    try {
      const res = await API.get("/admin/map/markers", {
        headers: authHeaders(),
        params: { townSlug }
      });
      setMarkers(res.data || []);
    } catch (e) {
      setMsg(errMsg(e, "Failed to load markers"));
    }
  };

  useEffect(() => { load(); }, [townSlug]);

  const add = async () => {
    if (!townSlug) return setMsg("Please select a town first");
    if (!form.title || !form.lat || !form.lng) return setMsg("Title, lat, lng required.");
    setMsg("");
    try {
      await API.post("/admin/map/markers", { ...form, townSlug }, { headers: authHeaders() });
      setForm({ title: "", category: "water", lat: "", lng: "", note: "" });
      load();
    } catch (e) {
      setMsg(errMsg(e, "Add failed"));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete marker?")) return;
    try {
      await API.delete(`/admin/map/markers/${id}`, { headers: authHeaders() });
      load();
    } catch (e) {
      setMsg(errMsg(e, "Delete failed"));
    }
  };

  return (
    <div className="ad-card">
      {msg && <div className="ad-msg">{msg}</div>}

      <div className="ad-grid">
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          <option value="water">water</option>
          <option value="road">road</option>
          <option value="light">street light</option>
          <option value="danger">danger</option>
          <option value="other">other</option>
        </select>
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input placeholder="Lat" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
        <input placeholder="Lng" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
        <input placeholder="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        <button className="ad-primary" onClick={add}>Add</button>
      </div>

      <div className="ad-tableWrap">
        <table className="ad-table">
          <thead>
            <tr><th>Category</th><th>Title</th><th>Lat</th><th>Lng</th><th>Note</th><th>Action</th></tr>
          </thead>
          <tbody>
            {markers.map((m) => (
              <tr key={m._id}>
                <td>{m.category}</td>
                <td>{m.title}</td>
                <td>{m.lat}</td>
                <td>{m.lng}</td>
                <td>{m.note || "-"}</td>
                <td><button className="danger" onClick={() => remove(m._id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

function ResidentSuggestionsAdminTab({ townSlug }) {
  const [msg, setMsg] = useState("");
  const [items, setItems] = useState([]);

  const load = async () => {
    if (!townSlug) return;
    setMsg("");
    try {
      const res = await API.get("/admin/suggestions", {
        headers: authHeaders(),
        params: { townSlug }
      });
      setItems(res.data || []);
    } catch (e) {
      setMsg(errMsg(e, "Failed to load suggestions"));
    }
  };

  useEffect(() => { load(); }, [townSlug]);

  const approve = async (id) => {
    try {
      await API.patch(`/admin/suggestions/${id}/status`, { status: "approved" }, { headers: authHeaders() });
      load();
    } catch (e) {
      setMsg(errMsg(e, "Approve failed"));
    }
  };

  const reject = async (id) => {
    const note = prompt("Reject note (optional):", "");
    try {
      await API.patch(`/admin/suggestions/${id}/status`, { status: "rejected", note: note || "" }, { headers: authHeaders() });
      load();
    } catch (e) {
      setMsg(errMsg(e, "Reject failed"));
    }
  };

  return (
    <div className="ad-card">
      {msg && <div className="ad-msg">{msg}</div>}

      <div className="ad-tableWrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Status</th><th>From</th><th>Title</th><th>Message</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it._id}>
                <td className={it.status === "approved" ? "ok" : it.status === "rejected" ? "warn" : ""}>
                  {it.status || "pending"}
                </td>
                <td>{it.fromName || "-"}</td>
                <td>{it.title || "-"}</td>
                <td style={{ maxWidth: 420, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {it.message}
                </td>
                <td style={{ display: "flex", gap: 8 }}>
                  <button className="ad-pill ok" onClick={() => approve(it._id)}>Approve</button>
                  <button className="ad-pill danger" onClick={() => reject(it._id)}>Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

/* =======================================================================
   ✅✅✅ NEW MISSING RESIDENT TABS
   ======================================================================= */

function ResidentNoticesTab({ townSlug }) {
  const [msg, setMsg] = useState("");
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", priority: "normal", deadline: "" });

  const load = async () => {
    if (!townSlug) return;
    setMsg("");
    try {
      const res = await API.get("/admin/notices", {
        headers: authHeaders(),
        params: { townSlug }
      });
      setItems(res.data || []);
    } catch (e) { setMsg(errMsg(e, "Load failed")); }
  };
  useEffect(() => { load(); }, [townSlug]);

  const add = async () => {
    if (!townSlug) return setMsg("Please select a town first");
    if (!form.title) return setMsg("Title required");
    setMsg("");
    try {
      await API.post("/admin/notices", { ...form, townSlug }, { headers: authHeaders() });
      setForm({ title: "", description: "", priority: "normal", deadline: "" });
      load();
    } catch (e) { setMsg(errMsg(e, "Add failed")); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete?")) return;
    try { await API.delete(`/admin/notices/${id}`, { headers: authHeaders() }); load(); }
    catch (e) { setMsg(errMsg(e, "Delete failed")); }
  };

  const remind = async (id) => {
    if (!window.confirm("Send reminder to all unacknowledged residents?")) return;
    try {
      const res = await API.post(`/admin/notices/${id}/remind`, {}, { headers: authHeaders() });
      alert(res.data.message);
    } catch (e) {
      alert(errMsg(e, "Remind failed"));
    }
  };

  // Safe deadline renderer
  const renderDeadline = (deadline) => {
    if (!deadline) return "-";
    try {
      return new Date(deadline).toLocaleDateString();
    } catch {
      return deadline;
    }
  };

  return (
    <div className="ad-card">
      {msg && <div className="ad-msg">{msg}</div>}
      <div className="ad-grid">
        <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
          <option value="normal">normal</option><option value="high">high</option><option value="critical">critical</option>
        </select>
        <input placeholder="Deadline (YYYY-MM-DD)" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
        <button className="ad-primary" onClick={add}>Publish Notice</button>
      </div>
      <div className="ad-tableWrap"><table className="ad-table"><thead><tr><th>Title</th><th>Priority</th><th>Deadline</th><th>Acknowledged</th><th>Action</th></tr></thead><tbody>
        {items.map(i => (
          <tr key={i._id}>
            <td>{i.title}</td>
            <td>{i.priority}</td>
            <td>{renderDeadline(i.deadline)}</td>
            <td>{i.acknowledgedBy ? i.acknowledgedBy.length : 0} Residents</td>
            <td>
              <button className="ad-pill" onClick={() => remind(i._id)}>Remind Pending</button>
              <button className="danger" onClick={() => remove(i._id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody></table></div>
    </div>
  );
}

function ResidentEventsTab({ townSlug }) {
  const [msg, setMsg] = useState("");
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    dateOnly: "",
    timeOnly: "",
    ward: "",
    image: null,
  });

  const load = async () => {
    if (!townSlug) return;
    try {
      const res = await API.get("/admin/events", {
        headers: authHeaders(),
        params: { townSlug }
      });
      setItems(res.data || []);
    } catch (e) { setMsg(errMsg(e, "Load failed")); }
  };
  useEffect(() => { load(); }, [townSlug]);

  const add = async () => {
    if (!townSlug) return setMsg("Please select a town first");
    if (!form.title || !form.dateOnly || !form.timeOnly) return setMsg("Title, date, and time required");
    try {
      const fd = new FormData();
      // Combine date and time
      const combinedDate = new Date(`${form.dateOnly}T${form.timeOnly}`);
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('eventDate', combinedDate.toISOString());
      fd.append('ward', form.ward);
      fd.append('townSlug', townSlug);
      if (form.image) fd.append('image', form.image);

      await API.post("/admin/events", fd, { headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' } });
      setForm({ title: "", description: "", dateOnly: "", timeOnly: "", ward: "", image: null });
      load();
    } catch (e) {
      setMsg(errMsg(e, "Add event failed"));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete?")) return;
    try { await API.delete(`/admin/events/${id}`, { headers: authHeaders() }); load(); }
    catch (e) { setMsg(errMsg(e, "Delete failed")); }
  };

  return (
    <div className="ad-card">
      {msg && <div className="ad-msg">{msg}</div>}
      <div className="ad-grid">
        <input placeholder="Event Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        <div style={{ display: 'flex', gap: 10 }}>
          <input type="date" value={form.dateOnly || ""} onChange={e => setForm({ ...form, dateOnly: e.target.value })} />
          <input type="time" value={form.timeOnly || ""} onChange={e => setForm({ ...form, timeOnly: e.target.value })} />
        </div>
        <input placeholder="Ward (optional)" value={form.ward} onChange={e => setForm({ ...form, ward: e.target.value })} />
        <input type="file" onChange={e => setForm({ ...form, image: e.target.files?.[0] || null })} />
        <button className="ad-primary" onClick={add}>Create Event</button>
      </div>
      <div className="ad-tableWrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Title</th>
              <th>Date</th>
              <th>Ward</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map(i => (
              <tr key={i._id}>
                <td>
                  {i.image ? (
                    <img src={`http://localhost:5000${i.image}`} alt="" style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 4 }} />
                  ) : (
                    <span style={{ fontSize: "0.8rem", color: "#ccc" }}>No IMG</span>
                  )}
                </td>
                <td>{i.title}</td>
                <td>{new Date(i.eventDate).toLocaleString()}</td>
                <td>{i.ward || "All"}</td>
                <td><button className="danger" onClick={() => remove(i._id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================= POLLS ================= */
function ResidentPollsTab({ townSlug }) {
  const [msg, setMsg] = useState("");
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    question: "",
    options: ["", ""],
    expiresAt: "",
  });

  const load = async () => {
    if (!townSlug) return;
    setMsg("");
    try {
      const res = await API.get("/admin/polls", {
        headers: authHeaders(),
        params: { townSlug }
      });
      setItems(res.data || []);
    } catch (e) { setMsg(errMsg(e, "Load failed")); }
  };
  useEffect(() => { load(); }, [townSlug]);

  const add = async () => {
    if (!townSlug) return setMsg("Please select a town first");
    const filteredOptions = form.options.map(s => s.trim()).filter(Boolean);
    if (!form.question || filteredOptions.length < 2) return setMsg("Question and at least 2 options required");
    setMsg("");
    try {
      await API.post("/admin/polls", { ...form, options: filteredOptions, townSlug }, { headers: authHeaders() });
      setForm({ question: "", options: ["", ""], expiresAt: "" });
      load();
    } catch (e) { setMsg(errMsg(e, "Add failed")); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete?")) return;
    try { await API.delete(`/admin/polls/${id}`, { headers: authHeaders() }); load(); }
    catch (e) { setMsg(errMsg(e, "Delete failed")); }
  };

  // Helper to calculate percentages
  const renderPollStats = (poll) => {
    const totalVotes = poll.options.reduce((acc, o) => acc + (o.votes || 0), 0);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {poll.options.map((opt, idx) => {
          const votes = opt.votes || 0;
          const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
          return (
            <div key={idx} style={{ position: 'relative', border: '1px solid #eee', borderRadius: 4, overflow: 'hidden', padding: "4px 8px" }}>
              <div
                style={{
                  position: 'absolute',
                  top: 0, left: 0, bottom: 0,
                  width: `${pct}%`,
                  background: 'rgba(76, 175, 80, 0.2)', // Green background
                  zIndex: 0
                }}
              />
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span>{opt.text || opt}</span>
                <span style={{ fontWeight: "bold" }}>{pct}% ({votes})</span>
              </div>
            </div>
          );
        })}
        <div style={{ fontSize: "0.75rem", color: "#666", marginTop: 2 }}>Total Votes: {totalVotes}</div>
      </div>
    );
  };

  return (
    <div className="ad-card">
      {msg && <div className="ad-msg">{msg}</div>}
      <div className="ad-grid">
        <input placeholder="Question" value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} />
        <input placeholder="Options (comma separated)" value={form.options.join(", ")} onChange={e => setForm({ ...form, options: e.target.value.split(",").map(s => s.trim()) })} />
        <input placeholder="Expires (YYYY-MM-DD)" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} />
        <button className="ad-primary" onClick={add}>Create Poll</button>
      </div>
      <div className="ad-tableWrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th style={{ width: "40%" }}>Question</th>
              <th>Results</th>
              <th>Expires</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map(i => (
              <tr key={i._id}>
                <td>{i.question}</td>
                <td>{renderPollStats(i)}</td>
                <td>{i.expiresAt ? new Date(i.expiresAt).toLocaleDateString() : "-"}</td>
                <td><button className="danger" onClick={() => remove(i._id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResidentWorksTab({ townSlug }) {
  const [msg, setMsg] = useState("");
  const [items, setItems] = useState([]);

  const [form, setForm] = useState({
    title: "", category: "road", status: "planned", description: "",
    startDate: "", deadline: "", budget: "", mapLink: "", image: null
  });

  const load = async () => {
    if (!townSlug) return;
    try {
      const res = await API.get("/admin/works", { headers: authHeaders(), params: { townSlug } });
      setItems(res.data || []);
    } catch (e) { setMsg(errMsg(e, "Load failed")); }
  };
  useEffect(() => { load(); }, [townSlug]);

  const add = async () => {
    if (!townSlug) return setMsg("Please select a town first");
    if (!form.title) return setMsg("Title required");
    try {
      const fd = new FormData();
      Object.keys(form).forEach(k => { if (k !== 'image') fd.append(k, form[k]); });
      fd.append('townSlug', townSlug);
      if (form.image) fd.append('image', form.image);

      await API.post("/admin/works", fd, { headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' } });
      setForm({ title: "", category: "road", status: "planned", description: "", budget: "", deadline: "", mapLink: "", image: null });
      load();
    } catch (e) { setMsg(errMsg(e, "Add failed")); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete?")) return;
    try { await API.delete(`/admin/works/${id}`, { headers: authHeaders() }); load(); }
    catch (e) { setMsg(errMsg(e, "Delete failed")); }
  };

  return (
    <div className="ad-card">
      {msg && <div className="ad-msg">{msg}</div>}

      <div className="ad-grid">
        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
          <option value="road">Road</option><option value="water">Water</option><option value="drainage">Drainage</option>
          <option value="streetlight">Streetlight</option><option value="other">Other</option>
        </select>
        <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
          <option value="planned">Planned</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option>
        </select>
        <input placeholder="Budget (₹)" type="number" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} />
        <input placeholder="Start Date (YYYY-MM-DD)" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
        <input placeholder="Deadline (YYYY-MM-DD)" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
      </div>
      <div className="ad-grid" style={{ marginTop: 8 }}>
        <input placeholder="Map Link (Google Maps URL)" value={form.mapLink} onChange={e => setForm({ ...form, mapLink: e.target.value })} style={{ gridColumn: "span 2" }} />
        <input type="file" onChange={e => setForm({ ...form, image: e.target.files?.[0] || null })} />
        <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ gridColumn: "span 3" }} />
        <button className="ad-primary" onClick={add}>Add Work</button>
      </div>

      <div className="ad-tableWrap"><table className="ad-table"><thead><tr><th>Title</th><th>Category</th><th>Status</th><th>Budget</th><th>Action</th></tr></thead><tbody>
        {items.map(i => (
          <tr key={i._id}>
            <td>
              {i.title}
              {i.image && <div style={{ fontSize: "0.7rem", color: "blue" }}>📷 Has Image</div>}
            </td>
            <td>{i.category}</td>
            <td>{i.status}</td>
            <td>₹{i.budget}</td>
            <td><button className="danger" onClick={() => remove(i._id)}>Delete</button></td>
          </tr>
        ))}
      </tbody></table></div>
    </div>
  );
}

function ResidentServicesTab({ townSlug }) {
  const [items, setItems] = useState([]);
  const [filterType, setFilterType] = useState("All");

  const load = async () => {
    if (!townSlug) return;
    try {
      const res = await API.get("/admin/services/requests", {
        headers: authHeaders(),
        params: { townSlug }
      });
      setItems(res.data || []);
    } catch (e) { }
  };
  useEffect(() => { load(); }, [townSlug]);

  const update = async (id, status) => {
    try { await API.patch(`/admin/services/requests/${id}/status`, { status, note: "Updated by admin" }, { headers: authHeaders() }); load(); } catch (e) { }
  };

  const filtered = filterType === "All" ? items : items.filter(i => i.type === filterType || i.serviceType === filterType);

  return (
    <div className="ad-card">
      <div className="ad-flex-between">
        <h3>Service Requests</h3>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: 6, borderRadius: 4 }}>
          <option value="All">All Types</option>
          <option value="Gas Booking">Gas Booking</option>
          <option value="Water Bill">Water Bill</option>
          <option value="Waste Pickup">Waste Pickup</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div className="ad-tableWrap">
        <table className="ad-table">
          <thead><tr><th>Type</th><th>User</th><th>Details/Note</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
          <tbody>
            {filtered.map(i => (
              <tr key={i._id}>
                <td>{i.type || i.serviceType}</td>
                <td>{i.user?.name}</td>
                <td><small>{i.details || i.description || "—"}</small></td>
                <td><span className={`ad-pill ${i.status === "completed" ? "ok" : i.status === "rejected" ? "danger" : "warn"}`}>{i.status}</span></td>
                <td>{new Date(i.createdAt || i.date).toLocaleDateString()}</td>
                <td>
                  {i.status === "pending" && (
                    <div className="ad-actions">
                      <button className="ok" onClick={() => update(i._id, "approved")}>Approve</button>
                      <button className="danger" onClick={() => update(i._id, "rejected")}>Reject</button>
                    </div>
                  )}
                  {i.status === "approved" && (
                    <button className="ok" onClick={() => update(i._id, "completed")}>Mark Done</button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan="6" style={{ textAlign: "center", color: "#999" }}>No requests found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}




function ResidentTicketsTab({ townSlug }) {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);
  const [replyMsg, setReplyMsg] = useState("");

  const load = async () => {
    if (!townSlug) return;
    try {
      const res = await API.get("/admin/tickets", { headers: authHeaders(), params: { townSlug } });
      setItems(res.data || []);
      if (active) {
        const updated = (res.data || []).find(t => t._id === active._id);
        if (updated) setActive(updated);
      }
    } catch (e) { }
  };
  useEffect(() => { load(); }, [townSlug]);

  const updateStatus = async (id, status) => {
    try { await API.patch(`/admin/tickets/${id}/status`, { status }, { headers: authHeaders() }); load(); } catch (e) { }
  };

  const sendReply = async (id) => {
    if (!replyMsg.trim()) return;
    try {
      await API.post(`/admin/tickets/${id}/reply`, { message: replyMsg }, { headers: authHeaders() });
      setReplyMsg("");
      load();
    } catch (e) { alert("Reply failed"); }
  };

  const getStatusColor = (s) => {
    switch (s) {
      case "closed": return "ok";
      case "resolved": return "ok";
      case "on_hold": return "warn";
      case "viewing": return "info"; // Need to ensure css has 'info' or just use inline style/mock class
      case "in_progress": return "primary"; // If exists, or fallback
      default: return "";
    }
  };

  return (
    <div className="ad-card" style={{ display: "grid", gridTemplateColumns: active ? "1fr 1fr" : "1fr", gap: 20 }}>
      <div>
        <h3>Support Tickets</h3>
        <div className="ad-tableWrap"><table className="ad-table"><thead><tr><th>User</th><th>Subject</th><th>Status</th><th>Date</th><th>Action</th></tr></thead><tbody>
          {items.map(i => (
            <tr key={i._id} style={{ background: active?._id === i._id ? "#f0f0f0" : "transparent", cursor: "pointer" }} onClick={() => setActive(i)}>
              <td>{i.user?.name}</td><td>{i.subject}</td>
              <td><span className={`ad-pill ${getStatusColor(i.status)}`}>{i.status}</span></td>
              <td>{new Date(i.createdAt).toLocaleDateString()}</td>
              <td>
                <select onClick={e => e.stopPropagation()} value={i.status} onChange={e => updateStatus(i._id, e.target.value)} style={{ padding: 4, borderRadius: 4 }}>
                  <option value="open">Open</option>
                  <option value="viewing">Viewing</option>
                  <option value="in_progress">In Progress</option>
                  <option value="on_hold">On Hold</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody></table></div>
      </div>

      {active && (
        <div style={{ borderLeft: "1px solid #ddd", paddingLeft: 20 }}>
          <h3>{active.subject}</h3>
          <p style={{ color: "#666" }}>{active.description}</p>
          <div style={{ height: 300, overflowY: "auto", background: "#f9f9f9", padding: 10, borderRadius: 8, marginBottom: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            {active.messages?.map((m, idx) => (
              <div key={idx} style={{
                alignSelf: m.sender === "admin" ? "flex-end" : "flex-start",
                background: m.sender === "admin" ? "#dbeafe" : "#ffffff",
                padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", maxWidth: "80%"
              }}>
                <div style={{ fontSize: "0.75rem", fontWeight: "bold", marginBottom: 4, color: "#555" }}>
                  {m.sender === "admin" ? "Staff" : active.user?.name || "User"} • {new Date(m.createdAt).toLocaleString()}
                </div>
                <div>{m.message}</div>
              </div>
            ))}
            {(!active.messages || active.messages.length === 0) && <div style={{ color: "#999", fontStyle: "italic" }}>No messages yet.</div>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={replyMsg} onChange={e => setReplyMsg(e.target.value)} placeholder="Type reply..." style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #ccc" }} />
            <button className="ad-primary" onClick={() => sendReply(active._id)}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ResidentComplaintsTab({ townSlug }) {
  const [items, setItems] = useState([]);
  const load = async () => {
    if (!townSlug) return;
    try {
      const res = await API.get("/admin/complaints", {
        headers: authHeaders(),
        params: { townSlug }
      });
      setItems(res.data || []);
    } catch (e) { }
  };
  useEffect(() => { load(); }, [townSlug]);
  const update = async (id, status) => { try { await API.patch(`/admin/complaints/${id}/status`, { status }, { headers: authHeaders() }); load(); } catch (e) { } };

  return (
    <div className="ad-card">
      <h3>Complaints</h3>
      <div className="ad-tableWrap"><table className="ad-table"><thead><tr><th>Type</th><th>User</th><th>Message</th><th>Status</th><th>Action</th></tr></thead><tbody>
        {items.map(i => <tr key={i._id}><td>{i.complaintType}</td><td>{i.user?.name || "Anon"}</td><td>{i.message}</td><td>{i.status}</td><td>
          <select value={i.status} onChange={e => update(i._id, e.target.value)}>
            <option value="open">Open</option><option value="resolved">Resolved</option><option value="rejected">Rejected</option>
          </select>
        </td></tr>)}
      </tbody></table></div>
    </div>
  );
}





function VisitorTownsTab() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    townName: "",
    district: "",
    centerLat: "",
    centerLon: "",
    radiusKm: 2,
    active: true,
    about: ""
  });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await API.get("/admin/towns");
      setItems(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const add = async () => {
    try {
      if (!form.townName) {
        alert("Town name is required");
        return;
      }

      if (editId) {
        // Update existing
        await API.put(`/admin/towns/${editId}`, form);
        alert("Town updated");
      } else {
        // Create new
        await API.post("/admin/towns", form);
        alert("Town created");
      }

      setForm({
        townName: "",
        district: "",
        centerLat: "",
        centerLon: "",
        radiusKm: 2,
        active: true,
        about: ""
      });
      setEditId(null);
      load();
    } catch (e) {
      alert("Error: " + (e.response?.data?.message || e.message));
    }
  };

  const edit = (town) => {
    setForm({
      townName: town.townName,
      district: town.district || "",
      centerLat: town.centerLat,
      centerLon: town.centerLon,
      radiusKm: town.radiusKm,
      active: town.active,
      about: town.about || ""
    });
    setEditId(town._id);
  };

  const remove = async (id) => {
    if (!window.confirm("Deactivate this town?")) return;
    try {
      await API.delete(`/admin/towns/${id}`);
      alert("Town deactivated");
      load();
    } catch (e) {
      alert("Error: " + (e.response?.data?.message || e.message));
    }
  };

  const cancelEdit = () => {
    setForm({
      townName: "",
      district: "",
      centerLat: "",
      centerLon: "",
      radiusKm: 2,
      active: true,
      about: ""
    });
    setEditId(null);
  };

  return (
    <div className="ad-card">
      <h3>{editId ? "Edit Town" : "Add Town"}</h3>
      <div className="ad-grid">
        <input
          placeholder="Town Name *"
          value={form.townName}
          onChange={(e) => setForm({ ...form, townName: e.target.value })}
        />
        <input
          placeholder="District"
          value={form.district}
          onChange={(e) => setForm({ ...form, district: e.target.value })}
        />
        <input
          type="number"
          step="0.000001"
          placeholder="Center Latitude (Optional)"
          value={form.centerLat}
          onChange={(e) => setForm({ ...form, centerLat: parseFloat(e.target.value) || "" })}
        />
        <input
          type="number"
          step="0.000001"
          placeholder="Center Longitude (Optional)"
          value={form.centerLon}
          onChange={(e) => setForm({ ...form, centerLon: parseFloat(e.target.value) || "" })}
        />
        <div>
          <label style={{ display: "block", marginBottom: "5px", fontSize: "12px" }}>
            Radius (km): {form.radiusKm}
          </label>
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.5"
            value={form.radiusKm}
            onChange={(e) => setForm({ ...form, radiusKm: parseFloat(e.target.value) })}
            style={{ width: "100%" }}
          />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          Active
        </label>
      </div>
      <textarea
        placeholder="About (optional)"
        value={form.about}
        onChange={(e) => setForm({ ...form, about: e.target.value })}
        rows={3}
        style={{ width: "100%", marginTop: "10px", padding: "8px" }}
      />
      <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
        <button className="ad-primary" onClick={add}>
          {editId ? "Update Town" : "Add Town"}
        </button>
        {editId && (
          <button className="ad-secondary" onClick={cancelEdit}>
            Cancel Edit
          </button>
        )}
      </div>

      <h3 style={{ marginTop: "30px" }}>Towns List</h3>
      <div className="ad-tableWrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>District</th>
              <th>Center (Lat, Lon)</th>
              <th>Radius (km)</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((town) => (
              <tr key={town._id}>
                <td>{town.townName}</td>
                <td><code>{town.townSlug}</code></td>
                <td>{town.district || <em>—</em>}</td>
                <td>
                  {town.centerLat?.toFixed(4)}, {town.centerLon?.toFixed(4)}
                </td>
                <td>{town.radiusKm}</td>
                <td>
                  <span className={town.active ? "ok" : "warn"}>
                    {town.active ? "✓" : "✗"}
                  </span>
                </td>
                <td>
                  <button className="ad-secondary" onClick={() => edit(town)}>
                    Edit
                  </button>
                  <button className="danger" onClick={() => remove(town._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function ResidentMarketAdminTab({ townSlug }) {
  const [products, setProducts] = useState([]);
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const res = await API.get('/admin/market/products', {
        headers: authHeaders(),
        params: { townSlug }
      });
      setProducts(res.data);
    } catch (e) {
      setMsg(errMsg(e, "Failed to load products"));
    }
  };

  useEffect(() => { load(); }, [townSlug]);

  const approve = async (id) => {
    try {
      await API.patch(`/admin/market/products/${id}/approve`, {}, { headers: authHeaders() });
      load();
    } catch (e) { alert("Approve failed"); }
  };

  const reject = async (id) => {
    if (!window.confirm("Reject this product?")) return;
    try {
      await API.patch(`/admin/market/products/${id}/reject`, {}, { headers: authHeaders() });
      load();
    } catch (e) { alert("Reject failed"); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await API.delete(`/admin/market/products/${id}`, { headers: authHeaders() });
      load();
    } catch (e) { alert("Delete failed"); }
  };

  return (
    <div className="ad-card">
      {msg && <div className="ad-msg">{msg}</div>}
      <h3>Market Products Approval</h3>
      <div className="ad-tableWrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Price</th>
              <th>Seller</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p._id}>
                <td>
                  {p.images && p.images[0] && (
                    <img src={p.images[0]} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }} />
                  )}
                </td>
                <td>{p.title}</td>
                <td>₹{p.price}</td>
                <td>{p.sellerId?.name || "Unknown"}</td>
                <td>
                  <span className={`ad-pill ${p.isApproved ? "ok" : "warn"}`}>
                    {p.isApproved ? "Approved" : "Pending/Rejected"}
                  </span>
                </td>
                <td className="ad-actions">
                  {!p.isApproved && (
                    <button className="ok" onClick={() => approve(p._id)}>Approve</button>
                  )}
                  {p.isApproved && (
                    <button className="warn" onClick={() => reject(p._id)}>Reject</button>
                  )}
                  <button className="danger" onClick={() => remove(p._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
