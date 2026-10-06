export const PROJECTS = Object.freeze({
  id: 'projects',
  label: 'Projects',
  title: 'Built systems, not just screenshots.',
  intro: 'A small set of projects that best represent how I think about systems, products, research, and interaction.',
  prompt: 'Select a project signal to see why it exists and what makes it technically interesting.',
})

export const PROJECTS_APPEARANCE = Object.freeze({
  // Visible Martian limb is a faint scattering edge, not a neon orange halo.
  dustColor: '#bc977e',
  dustScale: 1.019,
  dustStrength: .105,
})

const entries = [
  {
    id: 'reality-archive',
    label: 'Reality Archive',
    category: 'Research / 3D',
    summary: 'A web-first reality-capture and digital-heritage platform for turning real visual captures into faithful interactive reconstructions.',
    focus: ['Computer vision', '3D reconstruction', 'Web delivery', 'Experiment gates'],
    href: 'https://github.com/SanamRai001/Reality-Archive',
    caseStudy: {
      status: 'Experimental reconstruction platform',
      question: 'Can ordinary real-world captures become faithful, browser-explorable digital records without hiding where reconstruction or inference begins?',
      architecture: [
        'Capture validation and provenance come before reconstruction so source truth stays separate from generated or inferred structure.',
        'Reconstruction engines are treated as replaceable adapters rather than the product boundary.',
        'The first gate is a convincing browser POC before accounts, billing, or large platform infrastructure are justified.',
      ],
      lesson: 'The interesting problem is not only making a 3D result. It is deciding what evidence is trustworthy, what is measured, and when a proof is strong enough to justify the next layer of architecture.',
      current: 'The repository currently has CPU-only source-photo preflight and guarded COLMAP sparse camera-estimation orchestration. A real-photo camera solve and end-to-end reconstruction are still explicit proof gates.',
    },
  },
  {
    id: 'statescout',
    label: 'StateScout',
    category: 'Research / QA',
    summary: 'A semantic state-graph explorer for modern web applications using Playwright, accessibility semantics, screenshots, and graph search.',
    focus: ['Playwright', 'State graphs', 'Semantic crawling', 'Research design'],
    href: 'https://github.com/SanamRai001/StateScout',
    caseStudy: {
      status: 'Research foundation',
      question: 'Can a web application be explored as semantic user-visible states instead of only URLs or brittle DOM paths?',
      architecture: [
        'Playwright provides browser control while accessible roles, names, headings, forms, and dialogs become candidate semantic state signals.',
        'Exploration is framed as a graph problem with loop/duplicate detection rather than a linear crawler.',
        'Safety policy is part of the architecture so destructive actions and ambiguous controls are not treated like ordinary navigation.',
      ],
      lesson: 'The hardest part is not clicking every button. It is defining when two rendered screens should count as the same state and how to prove that the abstraction improves exploration.',
      current: 'The project is intentionally still in Phase 0 research and architecture foundation; the production crawler is not claimed as implemented yet.',
    },
  },
  {
    id: 'reposcout',
    label: 'RepoScout',
    category: 'Open source discovery',
    summary: 'A repository discovery and intelligence platform built around useful, explainable signals instead of popularity alone.',
    focus: ['PostgreSQL search', 'GitHub ingestion', 'Moderation', 'Repository intelligence'],
    href: 'https://github.com/SanamRai001/reposcout',
    caseStudy: {
      status: 'Working discovery platform',
      question: 'How can useful open-source repositories surface through explainable evidence instead of star count becoming the ranking system?',
      architecture: [
        'A TypeScript monorepo separates React discovery UI from the Express API and PostgreSQL-backed repository intelligence.',
        'GitHub ingestion normalizes repository metadata, README evidence, contribution evidence, snapshots, and ranking signals.',
        'Community submissions pass deterministic validation and moderation boundaries before publication into discovery.',
      ],
      lesson: 'Ranking becomes much more defensible when raw evidence, derived signals, moderation, historical snapshots, and public explanations are separate concerns.',
      current: 'Deterministic discovery, moderation, launch hardening, historical snapshots, Hidden Gems/Rising ranking, and contribution discovery are implemented. Semantic retrieval evaluation is the active frontier.',
    },
  },
  {
    id: 'eonborne',
    label: 'Eonborne',
    category: 'Simulation',
    summary: 'A deterministic civilization simulation where autonomous people create history and the player influences rather than commands them.',
    focus: ['Deterministic simulation', 'Web Workers', 'PixiJS', 'Emergent systems'],
    href: 'https://github.com/SanamRai001/Eonborne',
    caseStudy: {
      status: 'Living-world simulation',
      question: 'Can civilization emerge from individual lives and inherited knowledge while the player influences history without directly controlling people?',
      architecture: [
        'A deterministic fixed-step simulation core runs separately from presentation, with named seeded random streams for reproducibility.',
        'Simulation work moves through a Web Worker while PixiJS handles the large world presentation and React handles god-view interface layers.',
        'Genealogy, relationships, development, teaching, skills, and environmental visibility are modeled as systems that can create later civilization behavior.',
      ],
      lesson: 'Emergence only becomes debuggable when randomness, time, events, and simulation state are deterministic enough to reproduce a surprising outcome.',
      current: 'The current milestone is Living World Presentation around the first families; the next simulation direction is generational knowledge continuity rather than kingdoms or magic shortcuts.',
    },
  },
  {
    id: 'dear-future',
    label: 'Dear Future',
    category: 'Product / Privacy',
    summary: 'A deliberately small digital time-capsule product built around sealing a message now and letting it arrive later.',
    focus: ['Privacy boundaries', 'PostgreSQL', 'Encryption design', 'Delivery workflow'],
    href: 'https://github.com/SanamRai001/Dear-future',
    caseStudy: {
      status: 'Privacy-first delivery architecture',
      question: 'How do you build a product whose core promise depends on keeping a private message sealed for months and delivering it later without unsafe retry behavior?',
      architecture: [
        'PostgreSQL owns encrypted capsule records, delivery state, leases, quota reservations, and the long-lived 365-day scheduling horizon.',
        'Outbound delivery is provider-portable and pinned after the first attempt so changing providers cannot silently duplicate sends.',
        'Unknown provider outcomes move into explicit review/reconciliation instead of automatic retry, and production sending remains fail-closed until launch gates are satisfied.',
      ],
      lesson: 'A small product can require serious backend discipline when privacy, delayed execution, idempotency, provider ambiguity, and recovery all meet at the same boundary.',
      current: 'The repository has progressed through durable mock delivery, provider portability, quota guards, operator visibility, and controlled one-inbox staging preparation while keeping public production sending off by default.',
    },
  },
  {
    id: 'sajilo-business',
    label: 'Sajilo Business',
    category: 'UX / Business systems',
    summary: 'A simplicity-first business operating system focused on orders, stock visibility, and clear daily actions for small shops.',
    focus: ['UX architecture', 'Order lifecycle', 'Inventory', 'Progressive complexity'],
    href: 'https://github.com/SanamRai001/sajilo-business',
    caseStudy: {
      status: 'UX-first interactive prototype',
      question: 'Can a small-business operating system expose orders, stock, and daily attention without turning into an ERP-shaped dashboard?',
      architecture: [
        'The information hierarchy starts with Today → Orders → Stock → People, while money workflows support the order lifecycle instead of dominating it.',
        'The order model stays intentionally plain: New → Confirmed → Working → Ready → Delivered.',
        'Advanced accounting/CRM concepts are deferred until the core actions are understandable and fast on a phone.',
      ],
      lesson: 'Product architecture is also about what not to expose. Progressive complexity can be more valuable than adding every business feature early.',
      current: 'The current phase is a mock-data-driven UX foundation. Backend complexity is intentionally deferred until the interaction model proves simple enough for non-technical owners.',
    },
  },
]

export const PROJECT_ORBITS = Object.freeze([
  Object.freeze({ radius: 1.95, speed: .050, inclination: .22 }),
  Object.freeze({ radius: 2.65, speed: -.032, inclination: -.16 }),
])

export const PROJECT_NODES = Object.freeze(entries.map((entry, index) => {
  const ring = index < 3 ? 0 : 1
  const slot = index % 3
  return Object.freeze({
    ...entry,
    focus: Object.freeze(entry.focus),
    caseStudy: Object.freeze({
      ...entry.caseStudy,
      architecture: Object.freeze(entry.caseStudy.architecture),
    }),
    ring,
    radius: ring === 0 ? .17 : .15,
    color: ring === 0 ? '#d7a17d' : '#a9b7c7',
    orbit: Object.freeze({
      ...PROJECT_ORBITS[ring],
      phase: slot / 3 * Math.PI * 2 + (ring === 0 ? .35 : 1.15),
    }),
  })
}))

export const PROJECTS_FRAME_RADIUS = 2.95

export const PROJECTS_COMPOSITION = Object.freeze({
  breakpoint: 760,
  desktop: Object.freeze({ x: -.46, y: -.03, heightFraction: .62 }),
  mobile: Object.freeze({ x: 0, y: -.25, heightFraction: .78 }),
})

export const projectById = id => PROJECT_NODES.find(project => project.id === id)
