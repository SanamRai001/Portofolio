export const LAB_CONTENT = Object.freeze({
  id: 'lab',
  label: 'The Lab',
  hover: 'Research & experiments',
  title: 'Questions before products.',
  intro: 'This is where ideas stay unfinished on purpose. The goal is to test a question, measure what breaks, and learn whether the idea deserves to become a real system.',
  prompt: 'Select an experiment to inspect the question, current evidence, and what I am trying to learn.',
})

export const LAB_EXPERIMENTS = Object.freeze([
  Object.freeze({
    id: 'state-space',
    code: 'L-01',
    label: 'Interface State Exploration',
    status: 'Research foundation',
    question: 'Can a web application be explored as a semantic state graph instead of a list of URLs or brittle DOM paths?',
    evidence: 'StateScout',
    projectId: 'statescout',
    href: 'https://github.com/SanamRai001/StateScout',
    focus: Object.freeze(['Playwright', 'State abstraction', 'Graph exploration']),
    color: '#89a5c9',
  }),
  Object.freeze({
    id: 'reality-reconstruction',
    code: 'L-02',
    label: 'Reality Reconstruction',
    status: 'POC / measurement',
    question: 'How much faithful 3D structure can ordinary captures recover, and how cheaply can the result be delivered in a normal browser?',
    evidence: 'Reality Archive',
    projectId: 'reality-archive',
    href: 'https://github.com/SanamRai001/Reality-Archive',
    focus: Object.freeze(['Computer vision', '3D reconstruction', 'Web delivery']),
    color: '#9c92c8',
  }),
  Object.freeze({
    id: 'vector-reconstruction',
    code: 'L-03',
    label: 'Vector Reconstruction',
    status: 'Research framing',
    question: 'Can an image or sketch be understood as cleaner vector structure instead of being traced pixel-by-pixel?',
    evidence: 'ScanSketch',
    href: 'https://github.com/SanamRai001/ScanSketch',
    focus: Object.freeze(['Geometry', 'Image structure', 'Vectorization']),
    color: '#b38fc0',
  }),
  Object.freeze({
    id: 'expressive-small-models',
    code: 'L-04',
    label: 'Expressive Small Models',
    status: 'Adaptation experiment',
    question: 'Can a CPU-friendly speech model become more emotionally expressive without losing the lightweight behavior that makes it useful?',
    evidence: 'Pocket TTS fork',
    href: 'https://github.com/SanamRai001/pocket-tts',
    focus: Object.freeze(['TTS', 'Emotion control', 'CPU efficiency']),
    color: '#c695b0',
  }),
])

export const LAB_COMPOSITION = Object.freeze({
  breakpoint: 760,
  desktop: Object.freeze({ x: -.43, y: .02, heightFraction: .47 }),
  mobile: Object.freeze({ x: 0, y: -.22, heightFraction: .56, fov: 38 }),
})

export const LAB_APPEARANCE = Object.freeze({
  idleColor: '#897da4',
  ringOpacity: .48,
  focusedRingOpacity: .58,
  activeRingOpacity: .78,
  shellStrength: .35,
  focusedShellStrength: .43,
  activeShellStrength: .58,
})

export const labExperimentById = id => LAB_EXPERIMENTS.find(experiment => experiment.id === id)
