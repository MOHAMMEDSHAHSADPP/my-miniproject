import React, { useState } from "react";
import "./Rlogin.css";
import GoogleLogo from "../../assets/google.jpg";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api";

export default function Rlogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleLogin = async () => {
    setMsg("");
    try {
      const res = await API.post("/auth/login", { email, password });

      // block admin using resident page
      if (res.data.user?.isAdmin) {
        setMsg("Use admin login page.");
        return;
      }

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // ✅ Redirect to town-specific resident dashboard
      const townSlug = res.data.user.townSlug || "default";
      navigate(`/resident/${townSlug}/home`);
    } catch (err) {
      setMsg(err?.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="container">
      <div className="left">
        <h2>Welcome back</h2>
        <p className="subtitle">Please login to your resident account.</p>

        {msg && <p className="error-msg">{msg}</p>}

        <label htmlFor="email">Email</label>
        <input id="email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />

        <label htmlFor="password">Password</label>
        <input id="password" type="password" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} />

        <div className="options">
          <label><input type="checkbox" /> Remember me</label>
          <button className="forgot" type="button">Forgot Password</button>
        </div>

        <button className="btn-black" onClick={handleLogin}>Sign In</button>

        <div className="divider">or</div>

        <button className="btn-google">
          <img src={GoogleLogo} alt="Google Logo" className="google-logo" />
          Sign in with Google
        </button>

        <div className="signup-text">
          <p>New to the town?</p>
          <Link to="/resident/verify" className="verify-link">Verify Resident Status &rarr;</Link>
        </div>
      </div>

      <div className="right">
        {/* Image maintained via CSS */}
      </div>
    </div>
  );
}
