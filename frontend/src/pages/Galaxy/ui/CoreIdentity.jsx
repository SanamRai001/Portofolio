import { CORE } from '../data/core.js'

export default function CoreIdentity({ revealed }) {
  return <section className={`CoreIdentity${revealed ? ' is-revealed' : ''}`} aria-labelledby="core-name" aria-hidden={!revealed} inert={!revealed}>
    <p className="CoreKicker">{CORE.signal} <span aria-hidden="true">/ 00</span></p>
    <h2 id="core-name">{CORE.name}</h2>
    <p className="CoreRole">{CORE.role}</p>
    <p className="CoreStatement">{CORE.statement}</p>
    <p className="CoreDescription">{CORE.description}</p>
    <p className="CoreTagline">{CORE.tagline}</p>
    <ul className="CoreMetadata" aria-label="Background">{CORE.metadata.map(item => <li key={item}>{item}</li>)}</ul>
    <nav className="CoreLinks" aria-label="Explore Sanam’s work">{CORE.links.map(link => <a key={link.href} href={link.href}
      target={link.external ? '_blank' : undefined} rel={link.external ? 'noopener noreferrer' : undefined}>
      {link.label}<span aria-hidden="true">{link.external ? '↗' : '→'}</span>
      {link.external && <span className="GalaxySrOnly"> (opens in a new tab)</span>}
    </a>)}</nav>
  </section>
}
