import { useEffect, useMemo, useState } from 'react'
import { Gauge, ShieldCheck, Database, ScrollText, TimerReset, Boxes } from 'lucide-react'
import Toggle from './reusable/Toggle'
import SystemCore from './SystemCore'
import API from "./config/api";
import axios from 'axios';
import './BackendLabVisual.css'

const toggleList = [
  { key: "db", head: "Database", sub: "Switch between persistent and non-persistent project data", icon: Database },
  { key: "auth", head: "Authentication", sub: "Require JWT-backed access for protected behavior", icon: ShieldCheck },
  { key: "rateLimit", head: "Rate Limiting", sub: "Enable request throttling at the API layer", icon: TimerReset },
  { key: "logging", head: "Request Logging", sub: "Expose live request activity from the backend", icon: ScrollText },
  { key: "cache", head: "Caching", sub: "Serve eligible responses through the cache layer", icon: Boxes },
  { key: "pagination", head: "Pagination", sub: "Return project data through paginated responses", icon: Gauge }
];

const mappedControls = [
  { key: 'auth', label: 'AUTH', detail: 'trust boundary' },
  { key: 'cache', label: 'CACHE', detail: 'response path' },
  { key: 'db', label: 'DATABASE', detail: 'persistence' },
  { key: 'logging', label: 'RUNTIME', detail: 'observability' },
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

  const selected = controls.find((control) => control.key === activeControl);
  const enabledCount = useMemo(() => Object.values(toggle).filter(Boolean).length, [toggle]);

  const handleToggle = async (key, value) => {
    const previous = toggle;
    const next = { ...toggle, [key]: value };

    setToggle(next);
    notifyToggle(next);
    setSyncState("Applying configuration...");

    try {
      const res = await axios.post(API + "/api/system", next);
      const synced = res.data?.data || next;
      const merged = { ...next, ...synced };
      setToggle(merged);
      notifyToggle(merged);
      setSyncState("Backend synced ✓");
    } catch (error) {
      console.log("Error", error);
      setToggle(previous);
      notifyToggle(previous);
      setSyncState("Sync failed — change reverted");
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
            <strong>{enabledCount}/6 features enabled</strong>
            <small>{syncState}</small>
          </div>
        </div>

        <div className="ArchitecturePath" aria-label="Request architecture flow">
          <span>Browser</span><i aria-hidden="true">→</i>
          <span>Express API</span><i aria-hidden="true">→</i>
          <span>Middleware</span><i aria-hidden="true">→</i>
          <span>Data layer</span>
        </div>

        <div className="BackendLabVisual" aria-label="Live backend configuration visualization">
          <div className="BackendLabCore">
            <SystemCore variant="lab" systemState={toggle} />
          </div>

          <div className="BackendLabMap">
            <div>
              <p className="InspectorLabel">Live configuration map</p>
              <h3>Real state, visualized.</h3>
              <p>
                These four nodes are driven by the same synchronized state as the controls below. Failed backend updates revert both the switch and the visualization.
              </p>
            </div>

            <div className="BackendLabMappedStates">
              {mappedControls.map((item) => (
                <div className={'BackendLabMappedState' + (toggle[item.key] ? ' is-enabled' : '')} key={item.key}>
                  <span>{item.label}</span>
                  <small>{item.detail}</small>
                  <strong>{toggle[item.key] ? 'ON' : 'OFF'}</strong>
                </div>
              ))}
            </div>

            <div className="BackendLabConfigOnly">
              <span>CONFIG FLAGS</span>
              <code>rateLimit={String(toggle.rateLimit)}</code>
              <code>pagination={String(toggle.pagination)}</code>
            </div>

            <p className="BackendLabTruthNote">
              Rate limiting is shown as configuration only because its middleware is not currently attached to the project route. The visualization does not pretend otherwise.
            </p>
          </div>
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
      </div>
    </section>
  )
}

export default SystemControl
