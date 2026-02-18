import React, { useState, useEffect, useRef } from 'react';
import API from '../../api';
import './AdminChat.css';

export default function AdminChat({ townSlug }) {
    const [rooms, setRooms] = useState([]);
    const [activeRoom, setActiveRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const bottomRef = useRef(null);

    // Load list of "Admin Support" rooms
    const loadRooms = async () => {
        try {
            // Pass townSlug as query param, matching backend expectation
            const res = await API.get('/admin/chat/rooms', {
                params: townSlug ? { townSlug } : {}
            });
            setRooms(res.data || []);
        } catch (e) {
            console.error("Failed to load rooms", e);
        }
    };

    useEffect(() => {
        loadRooms();
        const interval = setInterval(loadRooms, 10000);
        return () => clearInterval(interval);
    }, [townSlug]);

    // Load messages for selected room
    const loadMessages = async (roomId) => {
        if (!roomId) return;
        try {
            const res = await API.get(`/admin/chat/messages/${roomId}`);
            setMessages(res.data || []);
            setTimeout(scrollToBottom, 100);
        } catch (e) {
            console.error(e);
        }
    };

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (activeRoom) {
            loadMessages(activeRoom._id);
            const interval = setInterval(() => loadMessages(activeRoom._id), 3000);
            return () => clearInterval(interval);
        }
    }, [activeRoom]);

    const handleSend = async () => {
        if (!input.trim() || !activeRoom) return;
        try {
            await API.post(`/admin/chat/messages`, {
                roomId: activeRoom._id,
                text: input,
                type: "text"
            });
            setInput("");
            loadMessages(activeRoom._id);
        } catch (e) {
            alert("Failed to send");
        }
    };

    const handleDelete = async (msgId) => {
        if (!window.confirm("Delete this message?")) return;
        try {
            await API.delete(`/admin/chat/messages/${msgId}`);
            loadMessages(activeRoom._id);
        } catch (e) {
            alert("Delete failed");
        }
    };

    // Helper to get display name (Resident Name)
    const getDisplayName = (r) => {
        // Backend now populates 'members'
        if (r.members && r.members.length > 0) {
            // Room name format: "AdminSupport:<userId>"
            const parts = r.name.split(':');
            if (parts.length > 1) {
                const userId = parts[1];
                const user = r.members.find(m => m._id === userId);
                if (user) return user.name;
            }
            // Fallback: join names
            return r.members.map(m => m.name).join(', ');
        }
        // Fallback if not populated
        return r.name.replace('AdminSupport:', 'User: ');
    };

    return (
        <div className="admin-chat-container">
            <div className="ac-sidebar">
                <h3>Support Chats</h3>
                <div className="ac-room-list">
                    {rooms.map(r => (
                        <div
                            key={r._id}
                            className={`ac-room ${activeRoom?._id === r._id ? 'active' : ''}`}
                            onClick={() => setActiveRoom(r)}
                        >
                            <div className="ac-room-name">{getDisplayName(r)}</div>
                            <div className="ac-room-meta">{new Date(r.updatedAt).toLocaleDateString()}</div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="ac-main">
                {activeRoom ? (
                    <>
                        <div className="ac-header">
                            <h4>Chat with: {getDisplayName(activeRoom)}</h4>
                        </div>
                        <div className="ac-messages">
                            {messages.map(msg => (
                                <div key={msg._id} className={`ac-msg ${msg.senderId?.role?.includes('admin') ? 'mine' : 'theirs'}`}>
                                    <div className="ac-bubble">
                                        <div className="ac-sender-name">{msg.senderId?.name}</div>
                                        {msg.text}
                                        {msg.type === 'image' && <img src={msg.image} alt="attachment" className="ac-img" />}
                                    </div>
                                    <div className="ac-meta">
                                        {new Date(msg.createdAt).toLocaleTimeString()}
                                        <span className="ac-del" onClick={() => handleDelete(msg._id)}>🗑️</span>
                                    </div>
                                </div>
                            ))}
                            <div ref={bottomRef} />
                        </div>
                        <div className="ac-input">
                            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Type a reply..." />
                            <button onClick={handleSend}>Send</button>
                        </div>
                    </>
                ) : (
                    <div className="ac-empty">Select a chat to start responding</div>
                )}
            </div>
        </div>
    );
}
