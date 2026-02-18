import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./AdminLogin.css";
import API from "../../api";
import GoogleLogo from "../../assets/google.jpg";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleLogin = async () => {
    setMsg("");
    try {
      const res = await API.post("/auth/login", { email, password });

      if (!res.data.user?.isAdmin) {
        setMsg("Not an admin account.");
        return;
      }

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/admin/dashboard");
    } catch (err) {
      setMsg(err?.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="container">
      <div className="left">
        <h2>Welcome back?</h2>
        <p className="subtitle">Admin login to manage your town</p>

        {msg && <p className="signup-text">{msg}</p>}

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

        <div className="options">
          <label>
            <input type="checkbox" /> Remember me
          </label>

          <button className="forgot" type="button">
            Forgot Password
          </button>
        </div>

        <button className="btn-black" onClick={handleLogin}>
          Sign In
        </button>

        <button className="btn-google" type="button">
          <img src={GoogleLogo} alt="Google Logo" className="google-logo" />
          Sign in with Google
        </button>

        <p className="signup-text">
          Resident? <Link to="/resident/login">Go to Resident Login</Link>
        </p>
      </div>

      <div className="right">{/* keep blank or add image later */}</div>
    </div>
  );
}
