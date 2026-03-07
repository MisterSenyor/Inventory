import { useState } from "react";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      await onLogin(username, password);
    } catch (err) {
      setError(err.message || "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="sidebar-brand" style={{ color: "#1666c5", marginBottom: 10 }}>
          BlueShelf
        </div>

        <h1 className="page-title" style={{ fontSize: 28, marginBottom: 8 }}>
          Admin Login
        </h1>

        <div className="page-subtitle" style={{ marginBottom: 20 }}>
          Sign in to manage inventory and lending.
        </div>

        {error && <div className="notice-error">{error}</div>}

        <form onSubmit={handleSubmit} className="form-grid">
          <div>
            <label className="label">Username</label>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}