import './ArchitectureStory.css'

const steps = [
  ['01', 'Request', 'GET /api/projects', 'The client sends a request to a stable API contract.'],
  ['02', 'Configuration', 'systemMiddleware', 'Read the runtime flags that govern this request.'],
  ['03', 'Identity', 'authenticate', 'Verify the JWT when authentication is enabled.'],
  ['04', 'Observability', 'loggingMiddleware', 'Record the route safely when logging is enabled.'],
  ['05', 'Data contract', 'getProjects', 'Validate pagination and check database availability.'],
]

export default function ArchitectureStory() {
  return (
    <section className="ArchitectureStory" id="architecture-story" aria-labelledby="architecture-story-title">
      <div className="SectionShell">
        <div className="SectionHeading SectionHeadingSplit">
          <div><p className="SectionKicker">Request lifecycle</p><h2 id="architecture-story-title">One request. Clear responsibilities.</h2></div>
          <p>The actual project API in this portfolio: configuration, identity, safe logging, and a deliberate data path.</p>
        </div>
        <ol className="RequestPipeline" aria-label="Project request middleware order">
          {steps.map(([number, title, code, description]) => (
            <li key={number}><span className="PipelineNumber">{number}</span><h3>{title}</h3><code>{code}</code><p>{description}</p></li>
          ))}
        </ol>
        <div className="RequestOutcomes">
          <div className="RequestOutcomesIntro"><span className="InspectorLabel">Data resolution</span><h3>Fast path. Source of truth. Explicit failure.</h3></div>
          <dl>
            <div><dt>Cache hit</dt><dd>Use cached projects; apply pagination when enabled.</dd></div>
            <div><dt>Cache miss / off</dt><dd>Query MongoDB; fill the cache when enabled, then paginate.</dd></div>
            <div><dt>Failure</dt><dd>400 invalid pagination · 401 failed auth · 503 database disabled · 500 query failure.</dd></div>
          </dl>
        </div>
        <p className="ArchitectureNote">Rate limiting is a configuration flag in this demo. The project route does not enforce throttling.</p>
      </div>
    </section>
  )
}
