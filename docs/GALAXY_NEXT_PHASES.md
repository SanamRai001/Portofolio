# Galaxy remaining implementation roadmap

Canonical next-phase checklist, reviewed 2026-10-04. docs/PROJECT_STATE.md is the chronological evidence log; docs/GALAXY_MOTION_AUDIT.md explains animation behaviour. Prior draft realism plans predate merged Earth/Sun/Saturn PRs.

## Already merged and in master at audit start (18fa02b)

- G1–G6 navigation, camera, content foundation, single render loop, user controls and black-hole portal.
- Earth / Identity NASA-imagery day, cloud, night and terrain treatment, desktop and mobile.
- Sun / Core photosphere, restrained corona and low-power branch, PR #8.
- Saturn / Journey Cassini-inspired optical rings, projected shadows and improved phone framing, PR #9.
- Existing credited 2K Mars and Mercury textures already load; their final realism passes are NOT complete.

## Ordered remaining work

| Order | Phase | How to implement | Acceptance |
| --- | --- | --- | --- |
| P0 | G2R.M1 rotation/revolution and orbit visibility (VERIFIED IN DRAFT PR #13; MERGE PENDING) | Fix zero selected orbital rate, retain camera-anchor tracking, brighten existing four real orbital LineLoops, preserve reduced motion and pause. Add numerical root/yaw/path tests plus 8s matched overview captures. | Green movement/freeze tests, desktop and phone before/after screenshot review, no orbit clipping. |
| P1 | G2R.14 Mars / Projects (PENDING) | Retain credited local Mars atlas, review authentic albedo and daylight terminator, remove fictional orange night-side settlement glow, keep subtle daylight dust rim and tightly bounded relief, preserve seam/pole safety and fallback. | Mars JPEG 200/JPEG, captured normal/reduced desktop and phone, source reference, no unwanted night emission, textures dispose. |
| P2 | G2R.15 Mercury / Skills (PENDING) | Retain credited Mercury atlas, strengthen crater/regolith shading and dark-to-lit terminator without painting false metallic surfaces; keep skill satellite navigation separate from planet spin and revolution. | Surface and orbital motion tests, focus/hover/tap keyboard navigation, desktop/mobile quality-tier captures. |
| P3 | G2R.16 final visual system QA (PENDING) | Compare all planets in overview/focus at 1440x900, 1280x800, 390x844 normal and reduced; verify orbit contrast, relative scales, Sun/Earth exposure, Saturn heading clearance, stars, night-side lighting, asset lifecycle, exact textures. | No console/page errors or text overlap, controls usable, visual review plus integrated-GPU/phone checks where available. |
| P4 | G2R.17 release and cleanup (PENDING) | Restore any temporary CI branch trigger, check attribution/README/state, run all tests, lint/build, merge individually approved PRs, verify final master SHA and Vercel commit deployment. | Green exact merge SHA, traceable evidence, no source/CI drift. |
| Later | G3 and beyond (NOT STARTED here) | Extend planet content or navigation only under a separately approved phase; don't mix it with realism QA. | Independent scope/acceptance. |

## Execution contract

1. Fetch live master and any active branch SHA; inspect actual code instead of starting from old discussions.
2. Keep physics/readability, Mars, Mercury, content and release changes reviewable separately. One authoritative scene clock and one planetary world-position formula.
3. Prefer existing source-attributed images and shader utilities before additional textures/geometry/packages. Respect desktop/mobile RAM/GPU budgets.
4. Each phase requires a deterministic unit/integration test, browser captures (desktop, laptop, phone; normal and reduced) and explicit asset HTTP verification rather than a silent fallback.
5. Inspect screenshots rather than inferring good visuals from CI success. Update PROJECT_STATE with branch, SHA, test run, artifact, known limits and the next phase. Keep PR draft until visual signoff.
6. On each approved merge, verify production master commit CI and Vercel status; do not claim physical-device performance from headless Chromium.

Stop scope expansion if changes harm interaction, accessibility, legibility or fallback performance.
