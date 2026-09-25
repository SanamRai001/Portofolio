import { useEffect, useMemo, useRef, useState } from 'react'
import { Gauge, ShieldCheck, Database, ScrollText, TimerReset, Boxes } from 'lucide-react'
import Toggle from './reusable/Toggle'
import BackendLabVisual from './BackendLabVisual'
import API from "./config/api";
import axios from 'axios';

const toggleList = [
  { key: "db", head: "Database", sub: "Switch between persistent and non-persistent project data", icon: Database },
  { key: "auth", head: "Authentication", sub: "Require JWT-backed access for protected behavior", icon: ShieldCheck },
  { key: "rateLimit", head: "Rate Limit Flag", sub: "Stored configuration only; limiter middleware is not mounted on the project route", icon: TimerReset },
  { key: "logging", head: "Request Logging", sub: "Expose live request activity from the backend", icon: ScrollText },
  { key: "cache", head: "Caching", sub: "Serve eligible responses through the cache layer", icon: Boxes },
  { key: "pagination", head: "Pagination", sub: "Return project data through paginated responses", icon: Gauge }
];

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
    if (syncInFlightRef.current) return;

    syncInFlightRef.current = true;
    setSyncing(true);

    const previous = toggle;
    const next = { ...toggle, [key]: value };

    setToggle(next);
    notifyToggle(next);
    setSyncState("Applying configuration...");

    try {
      const res = await axios.post(API + "/api/system", { [key]: value });
      const synced = res.data?.data || {};
      const merged = { ...next, ...synced };
      setToggle(merged);
      notifyToggle(merged);
      setSyncState("Backend synced ✓");
    } catch (error) {
      console.error("System config sync failed:", error.message);
      setToggle(previous);
      notifyToggle(previous);
      setSyncState("Sync failed — change reverted");
    } finally {
      syncInFlightRef.current = false;
      setSyncing(false);
    }
  }

  useEffect(() => {
    const getData = async () => {
      try {
        const res = await axios.get(API + "/api/system");
        const next = res.data.data || {};
        setToggle((previous) => {
          const merged = { ...previous, ...next };
          notifyToggle(merged);
          return merged;
        });
        setSyncState("Backend synced ✓");
      } catch (error) {
        console.log("Error", error);
        setSyncState("Backend unavailable");
      }
    }

    const getControls = async () => {
      try {
        const res = await axios.get(API + "/api/controls");
        if (res.data.success) {
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
              Toggle a backend capability, then use the portfolio and observe the response. The controls write to the running system configuration instead of changing local presentation state only.
            </p>
          </div>

          <div className="RuntimeCard" aria-live="polite">
            <span>runtime state</span>
            <strong>{enabledCount}/6 config flags enabled</strong>
            <small>{syncState}</small>
          </div>
        </div>

        <div className="FeatureControlsHeader">
          <div>
            <p className="InspectorLabel">Feature switches</p>
            <h3>Control the running backend.</h3>
          </div>
          <p>Switch a capability on or off first, then use the visualization below to see how that state maps into the system.</p>
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
                  disabled={syncing}
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
