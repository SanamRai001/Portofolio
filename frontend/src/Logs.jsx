import { useEffect, useState } from 'react'
import axios from 'axios'
import API from "./config/api";

const Logs = ({ systemToggle }) => {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!systemToggle.logging) return;

    const fetchLogs = async () => {
      try {
        const res = await axios.get(API + "/api/logs");
        if (res.data.success === true) {
          setLogs(res.data.data);
          setError("");
        }
      } catch (requestError) {
        console.log(requestError);
        setError("Unable to read the live log stream.");
      }
    }

    fetchLogs();
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, [systemToggle.logging]);

  if (!systemToggle.logging) return null;

  return (
    <section className="LogsSection" aria-labelledby="live-logs-title">
      <div className="SectionShell">
        <div className="LogConsole">
          <div className="LogConsoleHead">
            <div>
              <p className="SectionKicker">Observability</p>
              <h2 id="live-logs-title">Live Request Log</h2>
            </div>

            <div className="LogPolling">
              <span aria-hidden="true" />
              polling every 2s
            </div>
          </div>

          <div className="LogConsoleBody" role="log" aria-live="polite">
            {error ? (
              <p className="LogError">{error}</p>
            ) : logs.length === 0 ? (
              <p className="LogEmpty">Waiting for requests… interact with the portfolio to generate activity.</p>
            ) : (
              logs.map((log, index) => (
                <p key={String(log) + index}>
                  <span aria-hidden="true">$</span>{log}
                </p>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Logs
