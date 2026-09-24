import { useState } from 'react'
import API from "./config/api";
import axios from 'axios';
import { isUsableToken } from './authRuntime';

const Form = ({ systemToggle }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = { email, password };
      const response = await axios.post(API + "/api/auth/login", user);
      const token = response.data?.token;

      if (!isUsableToken(token)) {
        setError("Login succeeded without a valid session token. Please try again.");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", token.trim());
      window.location.reload();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Login failed. Check your credentials.");
      setLoading(false);
    }
  }

  if (!systemToggle.auth) return null;

  return (
    <div className="MainForm">
      <form className="AuthCard" onSubmit={handleSubmit} aria-busy={loading}>
        <div className="AuthCardHead">
          <p className="SectionKicker">Protected backend mode</p>
          <h1 id="auth-dialog-title">Authenticate to continue</h1>
          <p id="auth-dialog-description">Authentication is enabled in the live architecture lab. Use the demo viewer account to continue testing the system.</p>
        </div>

        <div className="DemoCredentials" aria-label="Demo viewer credentials">
          <span>Viewer account</span>
          <code>viewer@portfolio.dev</code>
          <code>viewer123</code>
        </div>

        <div className="Field">
          <label htmlFor="viewer-email">Email</label>
          <input
            id="viewer-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            onChange={(event) => setEmail(event.target.value)}
            value={email}
            autoFocus
            required
          />
        </div>

        <div className="Field">
          <label htmlFor="viewer-password">Password</label>
          <input
            id="viewer-password"
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            onChange={(event) => setPassword(event.target.value)}
            value={password}
            required
          />
        </div>

        {error && <p className="AuthError" role="alert">{error}</p>}

        <button type="submit" className="Button ButtonPrimary AuthSubmit" disabled={loading}>
          {loading ? "Logging in…" : "Login to backend lab"}
        </button>
      </form>
    </div>
  )
}

export default Form
