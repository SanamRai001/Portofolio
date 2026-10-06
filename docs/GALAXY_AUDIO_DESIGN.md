# Galaxy adaptive sound design

## Current decision

Galaxy uses **original procedural Web Audio** rather than a downloaded soundtrack.

There is no third-party music file, licence dependency, streaming request, microphone access, audio package or extra animation loop. The sound is synthesized locally in the browser and is decorative only.

This avoids three problems at once:

1. no copyright/licensing ambiguity;
2. no large audio download on the portfolio route;
3. the sound can react to the actual Galaxy state instead of looping a generic track.

## Activation and autoplay

The page still creates **zero AudioContexts on initial load**.

A browser AudioContext is created/resumed only after the visitor performs a real Galaxy gesture: pointer interaction with the scene, keyboard world navigation, or the small Sound control in the header. This stays compatible with browser autoplay restrictions.

After the first Galaxy interaction the ambience starts automatically. The old bottom Sound/Pause/Still control cluster remains removed.

A single compact Sound control beside `Exit to portfolio` exists only so visitors can mute or re-enable the ambience. Re-enable reuses the existing AudioContext rather than creating another one.

If Web Audio is unavailable, Galaxy remains fully functional and silent.

## Sound character

The ambience is intentionally closer to a **deep cinematic spacecraft / observatory bed** than music.

The continuous graph has five original oscillator voices:

- a very low sub layer;
- a dark fundamental;
- a quiet fifth-like body tone;
- a distant high sine partial;
- an almost subliminal triangle shimmer.

Two low-pass stages keep it soft enough to sit behind the portfolio instead of becoming a song.

Overall gain is hard-bounded at `0.034`, with overview quieter than focused worlds. The sound fades to absolute silence at portal blackout before route handoff.

## Adaptive world tuning

Every destination retunes the **same sound bed** rather than starting a different track:

| World | Direction |
| --- | --- |
| Core | warmer / solar / stable |
| Identity | open and calm |
| Skills | cleaner and slightly brighter |
| Projects | lower and more industrial |
| Journey | broader and warmer |
| Lab | darker and less resolved |
| Black Hole | deepest and most filtered |

Hover can gently retune the bed but never triggers a discrete note.

Arrival at a deliberately selected world can emit one soft synthesized bloom. Under reduced motion, arrival blooms are suppressed while the quiet ambient bed remains available.

Black Hole is the strongest transition: its base tuning drops, the filter closes during approach, and the lowest layers descend further during plunge. Blackout is silent.

## Runtime/resource contract

- one AudioContext maximum per mounted Galaxy;
- five long-lived oscillator voices;
- two filters;
- one shared body bus and bounded master gain;
- no timers, workers, audio rAF, file decoding or network audio;
- navigation/portal subscriptions drive tuning and gain;
- hidden tabs suspend audio;
- renderer failure silences audio;
- unmount stops oscillators, disconnects nodes and closes the context;
- reopening after hidden-tab suspension reuses the same graph.

## Verification

`frontend/src/pages/Galaxy/sound.test.js` covers:

- no context before user interaction;
- five-voice/two-filter graph shape;
- one-context reuse;
- deterministic per-world tuning;
- Black Hole downward retuning during approach/plunge;
- bounded master volume;
- blackout/fallback/hidden silence;
- reduced-motion arrival-cue suppression;
- suspend/re-enable/disposal;
- unsupported-browser silence.

The Galaxy browser capture additionally verifies on desktop that:

- initial load creates zero AudioContexts;
- the first real world interaction creates exactly one;
- the compact Sound control reports active state;
- mute/re-enable reuses that same context.

## Subjective audio limit

Automated tests can prove graph construction, lifecycle, gain bounds and browser activation. They **cannot judge whether the mix sounds great on real laptop speakers/headphones**.

That final judgment is intentionally a live-site listening check, not something CI can honestly certify.
