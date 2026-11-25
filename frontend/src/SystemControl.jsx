import { useEffect, useMemo, useRef, useState } from 'react'
import { Gauge, ShieldCheck, Database, ScrollText, TimerReset, Boxes } from 'lucide-react'
import Toggle from './reusable/Toggle'
import BackendLabVisual from './BackendLabVisual'
import API from "./config/api";
import axios from 'axios';
import { acceptDemoSession, demoHeaders, getDemoSession } from './config/demoSession.js'

const toggleList = [
  { key: "db", head: "Database", sub: "Switch between persistent and non-persistent project data", icon: Database },
  { key: "auth", head: "Authentication", sub: "Require JWT-backed access for protected behavior", icon: ShieldCheck },
  { key: "rateLimit", head: "Rate Limit Flag", sub: "Stored configuration only; limiter middleware is not mounted on the project route", icon: TimerReset },
  { key: "logging", head: "Request Logging", sub: "Expose live request activity from the backend", icon: ScrollText },
  { key: "cache", head: "Caching", sub: "Serve eligible responses through the cache layer", icon: Boxes },
  { key: "pagination", head: "Pagination", sub: "Return project data through paginated responses", icon: Gauge }
];

// Mongoose responses can include document metadata; only six flags belong to the UI.
function readFlags(response) {
  const data = response?.data?.data
  if (response?.data?.success !== true || !data ||
      !toggleList.every(({ key }) => typeof data[key] === 'boolean')) {
    throw new Error('Invalid system configuration response')
  }
  return Object.fromEntries(toggleList.map(({ key }) => [key, data[key]]))
}

const SystemControl = ({ handleToggle: notifyToggle }) => {
  const [toggle, setToggle] = useState({
    auth: false,
    db: false,
    cache: false,
    logging: false,
    rateLimit: false,
    pagination: false
  });
  const [activeControl, setActiveControl] = useState("db");
  const [controls, setControls] = useState([]);
  const [syncState, setSyncState] = useState("Connecting...");
  const [syncing, setSyncing] = useState(false);
  const [configReady, setConfigReady] = useState(false);
  const syncInFlightRef = useRef(false);

  const selectedFromApi = controls.find((control) => control.key === activeControl);
  const selected = activeControl === "rateLimit"
    ? {
        title: "Rate Limit Flag",
        description: "Stores the request-throttling configuration flag for the architecture demo.",
        details: "The limiter implementation exists, but it is intentionally not mounted on the project route in the current portfolio build."
      }
    : selectedFromApi;
  const enabledCount = useMemo(() => Object.values(toggle).filter(Boolean).length, [toggle]);

  const handleToggle = async (key, value) => {
    if (!configReady || syncInFlightRef.current) return;

    syncInFlightRef.current = true;
    setSyncing(true);

    const previous = toggle;
    const next = { ...toggle, [key]: value };

    setToggle(next);
    // Only the UI is optimistic. Dependent API calls use acknowledged flags.
    setSyncState("Applying configuration...");

    try {
      const session = getDemoSession();
      if (!session) throw new Error("Isolated demo session unavailable");
      const res = await axios.post(API + "/api/system", { [key]: value }, { headers: demoHeaders() });
      const merged = readFlags(res);
      acceptDemoSession(res, session);
      setToggle(merged);
      notifyToggle(merged);
      setSyncState("Backend synced ✓");
    } catch (error) {
      console.error("System config sync failed:", error.message);
      setToggle(previous);
      notifyToggle(previous);
      if (error.response?.status === 409) setConfigReady(false);
      setSyncState("Sync failed — change reverted. Reload to reconnect.");
    } finally {
      syncInFlightRef.current = false;
      setSyncing(false);
    }
  }

  useEffect(() => {
    let active = true;
    const getData = async () => {
      try {
        const res = await axios.get(API + "/api/system", { headers: demoHeaders() });
        if (!active) return;
        const next = readFlags(res);
        acceptDemoSession(res);
        setToggle(next);
        notifyToggle(next);
        setConfigReady(true);
        setSyncState("Backend synced ✓");
      } catch (error) {
        if (!active) return;
        console.log("Error", error);
        setConfigReady(false);
        setSyncState("Isolated backend unavailable — reload to reconnect");
      }
    }

    const getControls = async () => {
      try {
        const res = await axios.get(API + "/api/controls");
        if (!active) return;
        if (res.data.success && Array.isArray(res.data.data)) {
          setControls(res.data.data);
        } else {
          console.log("No controls data fetched");
        }
      } catch (error) {
        console.log(error);
      }
    }

    getData();
    getControls();
    return () => { active = false };
  }, [notifyToggle]);

  const selectedFallback = toggleList.find((item) => item.key === activeControl);

  return (
    <section className="SystemControl" aria-labelledby="backend-lab-title">
      <div className="SectionShell">
        <div className="LabHeader">
          <div>
            <p className="SectionKicker">Live architecture demo</p>
            <h2 id="backend-lab-title">Backend Feature Control Panel</h2>
            <p className="LabLead">
              Toggle a capability and observe real API responses. Configuration is applied to your temporary server-side demo session.
            </p>
          </div>

          <div className="RuntimeCard" aria-live="polite">
            <span>runtime state</span>
            <strong>{configReady ? enabledCount + '/6 config flags enabled' : 'Configuration not yet confirmed'}</strong>
            <small>{syncState}</small>
          </div>
        </div>

        <div className="FeatureControlsHeader">
          <div>
            <p className="InspectorLabel">Feature switches</p>
            <h3>Control the running backend.</h3>
          </div>
          <p>Changes apply only to your demo session. Sessions expire after 30 minutes; reload to start a new session. Project data is public and read-only.</p>
        </div>

        <div className="Toggles">
          <div className="AllToggles">
            {toggleList.map((item) => {
              const Icon = item.icon;
              return (
                <Toggle
                  key={item.key}
                  headName={item.head + " " + (toggle[item.key] ? "ON" : "OFF")}
                  subName={item.sub}
                  toggleName={item.key}
                  value={toggle[item.key]}
                  sendData={handleToggle}
                  onHover={() => setActiveControl(item.key)}
                  onFocus={() => setActiveControl(item.key)}
                  icon={<Icon size={18} aria-hidden="true" />}
                  disabled={syncing || !configReady}
                />
              )
            })}
          </div>

          <aside className="ControlInfo" aria-live="polite">
            <div>
              <p className="InspectorLabel">Architecture inspector</p>
              <h3 className="ControlTitle">{selected?.title || selectedFallback?.head}</h3>
              <p className="ControlDes">
                {selected?.description || selectedFallback?.sub}
              </p>
              {selected?.details && <div className="ControlDetails">{selected.details}</div>}
            </div>

            <div className="InspectorState">
              <span>current state</span>
              <strong className={toggle[activeControl] ? "is-enabled" : ""}>
                {toggle[activeControl] ? "ENABLED" : "DISABLED"}
              </strong>
            </div>
          </aside>
        </div>

        <div className="ArchitecturePath" aria-label="Request architecture flow">
          <span>Browser</span><i aria-hidden="true">→</i>
          <span>Express API</span><i aria-hidden="true">→</i>
          <span>Middleware</span><i aria-hidden="true">→</i>
          <span>Data layer</span>
        </div>

        <BackendLabVisual systemState={toggle} />
      </div>
    </section>
  )
}

export default SystemControl
