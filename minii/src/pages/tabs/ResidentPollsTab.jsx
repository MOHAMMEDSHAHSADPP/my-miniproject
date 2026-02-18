import { useEffect, useState } from "react";
import API from "../../api";
import MiniBar from "./MiniBar";

export default function ResidentPollsTab() {
  const [msg, setMsg] = useState("");
  const [polls, setPolls] = useState([]);
  const [ward, setWard] = useState("");
  const [selected, setSelected] = useState(null);
  const [results, setResults] = useState(null);

  const [form, setForm] = useState({
    question: "",
    option1: "",
    option2: "",
    option3: "",
    option4: "",
    wardScope: "", // "" = whole town, else ward string
  });

  const auth = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const load = async () => {
    setMsg("");
    try {
      const res = await API.get("/resident-admin/polls", {
        ...auth(),
        params: { ward },
      });
      setPolls(res.data || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load polls");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  const pickPoll = async (p) => {
    setSelected(p);
    setResults(null);
    try {
      const res = await API.get(`/resident-admin/polls/${p._id}/results`, auth());
      setResults(res.data);
    } catch (e) {
      setMsg("Failed to load results");
    }
  };

  const createPoll = async () => {
    setMsg("");
    const options = [form.option1, form.option2, form.option3, form.option4]
      .map((s) => String(s || "").trim())
      .filter(Boolean);

    if (!form.question.trim()) return setMsg("Question required");
    if (options.length < 2) return setMsg("At least 2 options required");

    try {
      await API.post(
        "/resident-admin/polls",
        {
          question: form.question.trim(),
          options,
          wardScope: String(form.wardScope || "").trim(), // "" => town
        },
        auth()
      );

      setForm({
        question: "",
        option1: "",
        option2: "",
        option3: "",
        option4: "",
        wardScope: "",
      });
      setSelected(null);
      setResults(null);
      load();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Create poll failed");
    }
  };

  return (
    <div className="ad-card">
      <h3>Resident Polls / Voting</h3>
      {msg && <div className="ad-msg">{msg}</div>}

      <div className="ad-row">
        <input
          placeholder="Filter by ward (optional)"
          value={ward}
          onChange={(e) => setWard(e.target.value)}
        />
        <button className="ad-secondary" onClick={load}>
          Filter
        </button>
      </div>

      {/* CREATE POLL */}
      <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #eee" }}>
        <h4 style={{ margin: "0 0 8px" }}>Create Poll</h4>

        <div className="ad-grid">
          <input
            placeholder="Question"
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
          />
          <input
            placeholder="Ward scope (leave empty = whole town)"
            value={form.wardScope}
            onChange={(e) => setForm({ ...form, wardScope: e.target.value })}
          />

          <input
            placeholder="Option 1"
            value={form.option1}
            onChange={(e) => setForm({ ...form, option1: e.target.value })}
          />
          <input
            placeholder="Option 2"
            value={form.option2}
            onChange={(e) => setForm({ ...form, option2: e.target.value })}
          />
          <input
            placeholder="Option 3 (optional)"
            value={form.option3}
            onChange={(e) => setForm({ ...form, option3: e.target.value })}
          />
          <input
            placeholder="Option 4 (optional)"
            value={form.option4}
            onChange={(e) => setForm({ ...form, option4: e.target.value })}
          />

          <button className="ad-primary" onClick={createPoll}>
            Create Poll
          </button>
        </div>

        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
          ✅ Leave “Ward scope” empty for **Town poll**. Put ward number for **Ward-only poll**.
        </div>
      </div>

      {/* POLL LIST */}
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #eee" }}>
        <h4 style={{ margin: "0 0 10px" }}>Existing Polls</h4>

        <div className="ad-tableWrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Question</th>
                <th>Scope</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {polls.map((p) => (
                <tr key={p._id}>
                  <td style={{ maxWidth: 520, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.question}
                  </td>
                  <td>{p.wardScope ? `Ward ${p.wardScope}` : "Town"}</td>
                  <td>{p.createdAt ? new Date(p.createdAt).toLocaleString() : "-"}</td>
                  <td>
                    <button onClick={() => pickPoll(p)}>
                      Results
                    </button>
                  </td>
                </tr>
              ))}

              {!polls.length && (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", opacity: 0.6 }}>
                    No polls yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RESULTS */}
      {selected && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #eee" }}>
          <h4 style={{ margin: 0 }}>Results</h4>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {selected.question} • {selected.wardScope ? `Ward ${selected.wardScope}` : "Town"}
          </div>

          {!results ? (
            <div style={{ marginTop: 10, opacity: 0.7 }}>Loading results...</div>
          ) : (
            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              {(results.options || []).map((o, idx) => (
                <MiniBar
                  key={idx}
                  label={o.text}
                  value={o.count}
                  max={results.max || 1}
                />
              ))}
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                Total votes: {results.totalVotes || 0}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
