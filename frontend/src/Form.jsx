import { useState } from 'react'
import API from "./config/api";
import axios from 'axios';

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
      const token = response.data.token;
      localStorage.setItem("token", token);
      window.location.reload();
    } catch (requestError) {
      console.log("Error", requestError);
      setError(requestError.response?.data?.message || "Login failed. Check your credentials.");
      setLoading(false);
    }
  }

  if (!systemToggle.auth) return null;

  return (
    <div className="MainForm">
      <form className="AuthCard" onSubmit={handleSubmit}>
        <div className="AuthCardHead">
          <p className="SectionKicker">Protected backend mode</p>
          <h1>Authenticate to continue</h1>
          <p>Authentication is enabled in the live architecture lab. Use the demo viewer account to continue testing the system.</p>
        </div>

        <div className="DemoCredentials" aria-label="Demo viewer credentials">
          <span>Viewer account</span>
          <code>Viewer@gmail.com</code>
          <code>Viewer@123#</code>
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

        <label className="checkbox" htmlFor="remember-viewer">
          <input id="remember-viewer" type="checkbox" />
          <span>Remember me on this device</span>
        </label>

        {error && <p className="AuthError" role="alert">{error}</p>}

        <button type="submit" className="Button ButtonPrimary AuthSubmit" disabled={loading}>
          {loading ? "Logging in…" : "Login to backend lab"}
        </button>
      </form>
    </div>
  )
}

export default Form
