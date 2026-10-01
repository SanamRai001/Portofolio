# G2R.9 — Galaxy sound and microinteraction provenance

## Decision

Ship optional, exceptionally quiet, **original procedural Web Audio**, rather than embed downloaded music, claim an unverified "royalty-free" soundtrack, or add a third-party audio library. No image/model/audio asset is imported for this phase. There is no licence, API key, network request or streaming dependency associated with the soundscape.

This follows MDN's guidance to instantiate/resume an AudioContext from a user gesture instead of relying on autoplay:
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices
- https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay
- https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/suspend

## Product contract

- Every new Galaxy page visit starts **Sound off** with **no AudioContext constructed**. No persistent auto-enable flag is used. The only activation is the explicitly labelled native Sound control in the existing Galaxy footer.
- The control uses `aria-pressed`, clear Sound off/Sound on labels and an active-state accent that does not depend on hearing. If Web Audio cannot start, show an unavailable state rather than claiming playback.
- Sound is composed from three original low-level continuous oscillator voices, one lowpass and one bounded master gain (max = 0.027). Only a brief soft focus-arrival cue is synthesized after user opt-in; hovering never emits discrete notes.
- The existing semantic navigation and portal states drive sound gain; there is **no audio rAF, setInterval, setTimeout, worker or second scene loop**. Presence grows subtly at an arrived body/black-hole focus and falls to absolute silence at blackout, before navigation.
- Sound switches OFF when the visitor clicks Pause motion or Still View, the page becomes hidden, a renderer failure triggers fallback, or the route unmounts. Returning to the tab or resuming ambient motion never automatically starts sound; visitors must explicitly enable it again.
- Reduced motion suppresses focus-arrival cues. Sound remains optional and independently controlled. The Sound control remains a native button of at least 44px height.
- `dispose()` stops all long-lived oscillator voices, disconnects nodes and closes the AudioContext. It is safe to re-create on strict-effect lifecycle cleanup; disable suspends hardware use.
- Subtle microinteraction: a restrained active dot for the Sound control and a short portal-enter arrow translation. Both transformations/transitions are disabled under `prefers-reduced-motion: reduce`; keyboard focus remains clearly visible.

## Acceptance / remaining constraints

- Dedicated `sound.test.js` uses a fake AudioContext and checks muted-by-default, deferred graph construction, non-duplicated context reuse, bounded gain, focus versus hover, reduced-motion cue suppression, pause/blackout silence, disable/suspend, and complete dispose/React re-entry.
- The existing Galaxy browser capture verifies the real native AudioContext is not constructed on initial load, enables only after the click, and remains off after pause/resume. All previous black-hole portal handoff proofs must stay green.
- This is not a music track or adaptive scored soundtrack. No waveform sampling, file download, server analytics or microphone access is needed.
- Physical laptop speaker/headphone loudness, iOS Safari interruption behavior and accessible audio perception still require real-device/manual assessment in G2R.10.

**Fallback rule:** if a browser has no working AudioContext, Galaxy remains fully functional and silent. Audio is decorative and is never a prerequisite to interacting with content, the system map or portal.
