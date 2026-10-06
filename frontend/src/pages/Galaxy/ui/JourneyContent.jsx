import { JOURNEY, JOURNEY_WAYPOINTS, journeyById } from '../data/journey.js'

export default function JourneyContent({ revealed, state, navigation, onReturn }) {
  const selected = journeyById(state.selectedJourneyId)

  return <section
    className={`JourneyContent${revealed ? ' is-revealed' : ''}`}
    aria-labelledby="journey-title"
    aria-hidden={!revealed}
    inert={!revealed}
  >
    <p className="GalaxyEyebrow">Journey / Progression path</p>
    <h2 id="journey-title">{JOURNEY.title}</h2>
    <p className="JourneyIntro">{JOURNEY.intro}</p>

    <ol className="JourneyPath" aria-label="Journey waypoints">
      {JOURNEY_WAYPOINTS.map((waypoint, index) => <li key={waypoint.id}>
        <button
          type="button"
          aria-pressed={state.selectedJourneyId === waypoint.id}
          aria-controls="journey-detail"
          onClick={() => navigation.selectJourney(waypoint.id)}
          onFocus={() => navigation.setJourneyHover(waypoint.id, 'keyboard')}
          onBlur={() => navigation.setJourneyHover(null, 'keyboard')}
          onPointerEnter={event => {
            if (event.pointerType !== 'touch') navigation.setJourneyHover(waypoint.id)
          }}
          onPointerLeave={() => navigation.setJourneyHover(null)}
          style={{ '--journey-color': waypoint.color }}
        >
          <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          <span>
            <strong>{waypoint.label}</strong>
            <small>{waypoint.period}</small>
          </span>
        </button>
      </li>)}
    </ol>

    <div className="JourneyDetail" id="journey-detail" aria-live="polite" aria-atomic="true">
      {selected ? <>
        <p className="GalaxyEyebrow">{selected.kind} / Selected waypoint</p>
        <h3>{selected.label}</h3>
        <p className="JourneyPeriod">{selected.period}</p>
        <p>{selected.summary}</p>
        <ul aria-label={`${selected.label} focus areas`}>
          {selected.focus.map(item => <li key={item}>{item}</li>)}
        </ul>
      </> : <>
        <p className="GalaxyEyebrow">Follow the path</p>
        <p>{JOURNEY.prompt}</p>
      </>}
    </div>

    <button className="IdentityReturn" type="button" onClick={onReturn}>
      ← Return to system
    </button>
  </section>
}
