import { useState } from "react";
import { useAuth } from "../AuthContext";
import "./auth.css";

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login"); // "login" or "register"
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isLogin = mode === "login";

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const switchMode = () => {
    setMode(isLogin ? "register" : "login");
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (isLogin) await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
      // on success the route guard redirects to the dashboard
    } catch (err) {
      setError(err.response?.data?.message || "Cannot reach the server");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">G</div>
          <div className="auth-title">GasQueue</div>
        </div>
        <p className="auth-sub">
          {isLogin ? "Log in to your distributor account" : "Create your distributor account"}
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={submit}>
          {!isLogin && (
            <>
              <label htmlFor="name">Name</label>
              <input id="name" name="name" value={form.name} onChange={update} required />
            </>
          )}

          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" value={form.email} onChange={update} required />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            minLength={6}
            value={form.password}
            onChange={update}
            required
          />

          <button className="auth-btn" disabled={busy}>
            {busy ? "Please wait..." : isLogin ? "Log in" : "Create account"}
          </button>
        </form>

        <div className="auth-switch">
          {isLogin ? "New here? " : "Already have an account? "}
          <button type="button" onClick={switchMode}>
            {isLogin ? "Create an account" : "Log in"}
          </button>
        </div>
        <div className="auth-hint">Demo: demo@gasqueue.app / demo1234 (after npm run seed)</div>
      </div>
    </div>
  );
}