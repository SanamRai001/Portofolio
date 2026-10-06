import { IDENTITY } from '../data/identity.js'

export default function IdentityContent({ revealed, onReturn }) {
  return <section
    className={`IdentityContent${revealed ? ' is-revealed' : ''}`}
    aria-labelledby="identity-title"
    aria-hidden={!revealed}
    inert={!revealed}
  >
    <p className="GalaxyEyebrow">Identity / Working model</p>
    <h2 id="identity-title">{IDENTITY.title}</h2>
    <p className="IdentityLead">{IDENTITY.intro}</p>

    <div className="IdentityPrinciples" aria-label="Engineering principles">
      {IDENTITY.principles.map((principle, index) => <article key={principle.id}>
        <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        <h3>{principle.label}</h3>
        <p>{principle.text}</p>
      </article>)}
    </div>

    <div className="IdentityLearning">
      <h3>How I learn</h3>
      <p>{IDENTITY.learning}</p>
      <div className="IdentityLoop">
        <svg viewBox="0 0 360 140" preserveAspectRatio="none" aria-hidden="true">
          <path d="M60 36 H300 Q344 36 344 70 Q344 104 300 104 H60 Q16 104 16 70 Q16 36 60 36" />
          <path className="IdentityLoopArrows" d="M114 32 l6 4-6 4 M234 32 l6 4-6 4 M126 100 l-6 4 6 4 M246 100 l-6 4 6 4" />
        </svg>
        <ol aria-label="Learning cycle">
          {IDENTITY.learningStyle.map((step, index) => <li key={step}>
            <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <strong>{step}</strong>
          </li>)}
        </ol>
      </div>
    </div>

    <div className="IdentityDirections">
      <h3>Where I keep moving</h3>
      <dl>
        {IDENTITY.directions.map(direction => <div key={direction.label}>
          <dt>{direction.label}</dt>
          <dd>{direction.text}</dd>
        </div>)}
      </dl>
    </div>

    <button className="IdentityReturn" type="button" onClick={onReturn}>
      ← Return to system
    </button>
  </section>
}
