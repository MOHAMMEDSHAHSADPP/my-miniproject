import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Rsign.css";
import API from "../../api";

export default function Rsign() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("verifyToken");
    if (!token) {
      alert("⚠️ Restricted Access! You must verify your resident status first.");
      navigate("/resident/verify");
    }
  }, [navigate]);

  const handleSignup = async () => {
    setMsg("");

    const verifyToken = localStorage.getItem("verifyToken");
    if (!verifyToken) {
      setMsg("Please verify first.");
      navigate("/resident/verify");
      return;
    }

    if (!name || !email || !password) {
      setMsg("Please fill all fields.");
      return;
    }

    try {
      const res = await API.post("/auth/resident/signup", {
        verifyToken,
        name,
        email,
        password,
      });

      // ✅ Auto-login after signup
      localStorage.removeItem("verifyToken");
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setMsg("✅ Signup success! Redirecting...");

      const townSlug = res.data.user?.townSlug || "default";
      setTimeout(() => navigate(`/resident/${townSlug}/home`), 1000);
    } catch (err) {
      setMsg(err?.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="container">
      <div className="left">
        <h2>Create Account</h2>
        <p className="subtitle">Sign up to get started with Urban Connect.</p>

        {msg && <p className="error-msg">{msg}</p>}

        <label htmlFor="name">Full Name</label>
        <input
          id="name"
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          placeholder="********"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="btn-black" onClick={handleSignup}>
          Sign Up
        </button>

        <div className="signup-text">
          <p>Already have an account?</p>
          <Link to="/resident/login" className="verify-link">Login Here &rarr;</Link>
        </div>
      </div>

      <div className="right">
        {/* Image maintained via CSS */}
      </div>
    </div>
  );
}