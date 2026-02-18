import React, { useState, useEffect, useRef } from "react";
import API from "../../api";
import "./RChat.css";

export default function RChat() {
  const [activeTab, setActiveTab] = useState("ward"); // ward | town | admin
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [user, setUser] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user"));
    setUser(u);
    loadMessages();
    const interval = setInterval(loadMessages, 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, [activeTab]);

  const loadMessages = async () => {
    try {
      // Endpoint logic: /resident/chat?room={activeTab}
      const res = await API.get(`/resident/chat?room=${activeTab}`);
      setMessages(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    try {
      await API.post("/resident/chat", {
        room: activeTab,
        message: input,
        type: "text", // or image if we add that later
      });
      setInput("");
      loadMessages();
    } catch (e) {
      alert("Failed to send message");
    }
  };

  return (
    <div className="rchat-container">
      {/* Sidebar / Tabs */}
      <div className="rchat-sidebar">
        <h2 className="rchat-title">💬 Messages</h2>
        <div className="rchat-tabs">
          <button
            className={activeTab === "ward" ? "active" : ""}
            onClick={() => setActiveTab("ward")}
          >
            🏡 Ward Chat
            <span>Neighbors</span>
          </button>
          <button
            className={activeTab === "town" ? "active" : ""}
            onClick={() => setActiveTab("town")}
          >
            🏙️ Town Chat
            <span>Public</span>
          </button>
          <button
            className={activeTab === "admin" ? "active" : ""}
            onClick={() => setActiveTab("admin")}
          >
            👮 Admin Support
            <span>Direct</span>
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="rchat-main">
        <header className="rchat-header">
          {activeTab === "ward" && <h3>🏡 Ward {user?.ward} Group</h3>}
          {activeTab === "town" && <h3>🏙️ {user?.townSlug?.toUpperCase()} Public Chat</h3>}
          {activeTab === "admin" && <h3>👮 Help Center (Admin)</h3>}
        </header>

        <div className="rchat-messages">
          {messages.length === 0 ? (
            <div className="rchat-empty">No messages yet. Say hello! 👋</div>
          ) : (
            messages.map((msg) => {
              const sender = msg.senderId || {};
              const isMine = sender._id === user?._id || sender === user?._id;
              const senderName = sender.name || "Unknown";

              return (
                <div
                  key={msg._id}
                  className={`rchat-msg ${isMine ? "mine" : "theirs"}`}
                >
                  {!isMine && <div className="rchat-sender">{senderName}</div>}
                  <div className="rchat-bubble">
                    {msg.type === "image" && msg.image ? (
                      <img
                        src={`http://localhost:8081${msg.image}`}
                        alt="attachment"
                        className="rchat-image"
                        onClick={() => window.open(`http://localhost:8081${msg.image}`, "_blank")}
                      />
                    ) : (
                      msg.text
                    )}
                  </div>
                  <div className="rchat-time">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div className="rchat-input-area">
          <input
            type="file"
            id="chat-upload"
            style={{ display: "none" }}
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              try {
                const fd = new FormData();
                fd.append("room", activeTab);
                fd.append("image", file);
                await API.post("/resident/chat", fd, {
                  headers: { "Content-Type": "multipart/form-data" },
                });
                loadMessages();
              } catch (err) {
                alert("Failed to send image");
              }
            }}
          />
          <button
            className="rchat-upload-btn"
            onClick={() => document.getElementById("chat-upload").click()}
            style={{ marginRight: 8, background: "#e2e8f0", color: "#64748b" }}
          >
            📷
          </button>
          <input
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button onClick={handleSend}>➤</button>
        </div>
      </div>
    </div>
  );
}
