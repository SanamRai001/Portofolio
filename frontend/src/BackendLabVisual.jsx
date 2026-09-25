import './BackendLabVisual.css'

const nodes = [
  { key: 'auth', label: 'Authentication', detail: 'JWT boundary' },
  { key: 'cache', label: 'Cache', detail: 'Response fast path' },
  { key: 'db', label: 'Database', detail: 'MongoDB persistence' },
  { key: 'logging', label: 'Logging', detail: 'Safe request records' },
]

export default function BackendLabVisual({ systemState }) {
  return (
    <div className="BackendLabVisual" aria-label="Live backend configuration map">
      <div className="BackendLabCore">
        <p className="InspectorLabel">Configuration / live</p>
        <h3>One API. Explicit boundaries.</h3>
        <p>The map follows the same state as the switches. Failed updates revert both views.</p>
        <code>GET /api/projects</code>
      </div>
      <div className="BackendLabMap">
        <dl className="BackendLabMappedStates">
          {nodes.map(({ key, label, detail }) => (
            <div className={'BackendLabMappedState' + (systemState[key] ? ' is-enabled' : '')} key={key}>
              <dt>{label}<small>{detail}</small></dt>
              <dd>{systemState[key] ? 'ON' : 'OFF'}</dd>
            </div>
          ))}
        </dl>
        <div className="BackendLabConfigOnly"><span>CONFIG FLAGS</span><code>rateLimit={String(systemState.rateLimit)}</code><code>pagination={String(systemState.pagination)}</code></div>
        <p className="BackendLabTruthNote">The Rate Limit Flag is stored configuration. Its middleware is not mounted on the project route.</p>
      </div>
    </div>
  )
}
