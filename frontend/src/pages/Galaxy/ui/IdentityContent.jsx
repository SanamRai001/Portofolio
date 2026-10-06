import { IDENTITY } from '../data/identity.js'

export default function IdentityContent({ revealed, onReturn }) {
  return <section
    className={`IdentityContent${revealed ? ' is-revealed' : ''}`}
    aria-labelledby="identity-name"
    aria-hidden={!revealed}
    inert={!revealed}
  >
    <p className="GalaxyEyebrow">{IDENTITY.label} / Personal signal</p>

    <header className="IdentityHeading">
      <div>
        <h2 id="identity-name">{IDENTITY.name}</h2>
        <ul className="IdentityMetadata">
          {IDENTITY.metadata.map(item => <li key={item}>{item}</li>)}
        </ul>
      </div>

      <div className="IdentityCompass" aria-label={`${IDENTITY.compass.label}: ${IDENTITY.compass.path.join(', ')}`}>
        <span>{IDENTITY.compass.label}</span>
        <ol>
          {IDENTITY.compass.path.map((item, index) => <li key={item}>
            <strong>{item}</strong>
            {index < IDENTITY.compass.path.length - 1 && <span aria-hidden="true">→</span>}
          </li>)}
        </ol>
      </div>
    </header>

    <div className="IdentityThought">
      <h3>How I think</h3>
      <p>{IDENTITY.intro}</p>
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
            <span aria-hidden="true">0{index + 1}</span>
            <strong>{step}</strong>
          </li>)}
        </ol>
      </div>
    </div>

    <div className="IdentityCuriosity">
      <h3>What pulls me forward</h3>
      <p>{IDENTITY.curiosity}</p>
    </div>

    <dl className="IdentityTraits">
      {IDENTITY.traits.map(trait => <div key={trait.label}>
        <dt>{trait.label}</dt>
        <dd>{trait.text}</dd>
      </div>)}
    </dl>

    <button className="IdentityReturn" type="button" onClick={onReturn}>
      ← Return to system
    </button>
  </section>
}
