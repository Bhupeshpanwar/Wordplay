import { useState } from "react";
import { useNavigate } from "react-router-dom"; 

const API_URL = "http://localhost:3000/graphql";

export default function AuthForm() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState({ type: "idle", message: "" });

  const isLogin = mode === "login";

  async function handleSubmit(e) {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setStatus({ type: "error", message: "Enter a username and password." });
      return;
    }

    setStatus({ type: "loading", message: "" });

    const query = isLogin
      ? `mutation($u: String!, $p: String!) {
          login(username: $u, password: $p) {
            token
            user { id username }
          }
        }`
      : `mutation($u: String!, $p: String!) {
          register(username: $u, password: $p) {
            token
            user { id username }
          }
        }`;

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables: { u: username, p: password } }),
      });

      const { data, errors } = await res.json();

      if (errors && errors.length > 0) {
        setStatus({ type: "error", message: errors[0].message });
        return;
      }

      const payload = isLogin ? data.login : data.register;

      // Store the JWT and user info for later authenticated requests
      // (submitting scores, fetching "my scores", etc).
      localStorage.setItem("authToken", payload.token);
      localStorage.setItem("userId", payload.user.id);
      localStorage.setItem("username", payload.user.username);

       navigate("/game")
    } catch (err) {
      setStatus({
        type: "error",
        message: "Could not reach the server. Is it running on localhost:3000?",
      });
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setStatus({ type: "idle", message: "" });
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.tabRow}>
          <button
            type="button"
            onClick={() => switchMode("login")}
            style={{ ...styles.tab, ...(isLogin ? styles.tabActive : {}) }}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            style={{ ...styles.tab, ...(!isLogin ? styles.tabActive : {}) }}
          >
            Register
          </button>
        </div>

        <h1 style={styles.heading}>{isLogin ? "Welcome back" : "Create an account"}</h1>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              style={styles.input}
              autoComplete="username"
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              style={styles.input}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </label>

          <button type="submit" style={styles.submitBtn} disabled={status.type === "loading"}>
            {status.type === "loading" ? "Please wait..." : isLogin ? "Log in" : "Register"}
          </button>

          {status.type === "error" && <p style={styles.errorText}>{status.message}</p>}
          {status.type === "success" && <p style={styles.successText}>{status.message}</p>}
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f4f5f7",
    fontFamily: "system-ui, -apple-system, sans-serif",
    padding: "16px",
  },
  card: {
    width: "100%",
    maxWidth: "360px",
    background: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)",
    padding: "28px",
  },
  tabRow: {
    display: "flex",
    background: "#eef0f3",
    borderRadius: "8px",
    padding: "4px",
    marginBottom: "20px",
  },
  tab: {
    flex: 1,
    padding: "8px 0",
    border: "none",
    background: "transparent",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#6b7280",
    cursor: "pointer",
  },
  tabActive: {
    background: "#ffffff",
    color: "#111827",
    boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
  },
  heading: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#111827",
    margin: "0 0 20px 0",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    fontSize: "13px",
    fontWeight: 600,
    color: "#374151",
    gap: "6px",
  },
  input: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    outline: "none",
    fontWeight: 400,
  },
  submitBtn: {
    marginTop: "6px",
    padding: "10px 0",
    borderRadius: "8px",
    border: "none",
    background: "#111827",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  errorText: {
    color: "#dc2626",
    fontSize: "13px",
    margin: 0,
  },
  successText: {
    color: "#16a34a",
    fontSize: "13px",
    margin: 0,
  },
};