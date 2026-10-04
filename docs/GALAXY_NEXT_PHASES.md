# Galaxy remaining implementation roadmap

Canonical next-phase checklist, reviewed 2026-10-04. docs/PROJECT_STATE.md is the chronological evidence log; docs/GALAXY_MOTION_AUDIT.md explains animation behaviour. Prior draft realism plans predate merged Earth/Sun/Saturn PRs.

## Merged production baseline (Mars `0d0a92c`, 2026-10-04)

- G1–G6 navigation, camera, content foundation, single render loop, user controls and black-hole portal.
- Earth / Identity NASA-imagery day, cloud, night and terrain treatment, desktop and mobile.
- Sun / Core photosphere, restrained corona and low-power branch, PR #8.
- Saturn / Journey Cassini-inspired optical rings, projected shadows and improved phone framing, PR #9.
- Motion/orbit readability: [PR #13](https://github.com/SanamRai001/Portofolio/pull/13) merged in `42c3db1`. Prior conflicting draft [PR #12](https://github.com/SanamRai001/Portofolio/pull/12) was closed as superseded; do not import its focus-freeze assertions.
- Mars / Projects photographic day/night and no fictitious settlements: canonical [PR #15](https://github.com/SanamRai001/Portofolio/pull/15) **merged** as `0d0a92c3`; exact post-merge [CI 37216453383](https://github.com/SanamRai001/Portofolio/actions/runs/37216453383) and Vercel status succeeded. Mars retains orbit/axial motion improvements from #13. Conflicting standalone alternatives [#10](https://github.com/SanamRai001/Portofolio/pull/10) and [#11](https://github.com/SanamRai001/Portofolio/pull/11) have been closed unmerged. Mercury's already credited 2K texture loads; final realism pass remains pending.

## Ordered remaining work

| Order | Phase | How to implement | Acceptance |
| --- | --- | --- | --- |
| P0 | G2R.M1 rotation/revolution and orbit visibility (**MERGED / VERIFIED**: PR #13, `42c3db1`) | Completed: selected-body orbit now moves at 65%, hover at 82%, overview at 100%; focused Earth's spin is 82%. Four true LineLoop tracks have higher contrast. Existing one-clock camera tracking, pause and reduced-motion preserved. | Exact production-commit CI 37213862905 **passed**, Vercel status **success**; numerical root/yaw/path and desktop/phone 8s capture gates passed. |
| P1 | G2R.14 Mars / Projects (**MERGED / VERIFIED**: PR #15, `0d0a92c`) | Integrated the restrained photographic Mars shader on the merged motion fix, removed fictional orange night lights, retained local fallback, desktop-only thin dust limb and a single-mesh mobile tier. Closed the two previous alternative PRs unmerged. | Mars image HTTP 200/JPEG in five browser contexts; [visual run 37214671548](https://github.com/SanamRai001/Portofolio/actions/runs/37214671548) and four portal cases passed, motion regression tests preserved. [Exact merge SHA CI 37216453383](https://github.com/SanamRai001/Portofolio/actions/runs/37216453383) and Vercel status **passed**. Optional full ~140s seam sweep and physical-device FPS remain unverified. |
| P2 | G2R.15 Mercury / Skills (IN PROGRESS — separate draft PR) | Retain credited Mercury atlas, strengthen crater/regolith shading and dark-to-lit terminator without painting false metallic surfaces; keep skill satellite navigation separate from planet spin and revolution. | Surface and orbital motion tests, focus/hover/tap keyboard navigation, desktop/mobile quality-tier captures. |
| P3 | G2R.16 final visual system QA (PENDING) | Compare all planets in overview/focus at 1440x900, 1280x800, 390x844 normal and reduced; verify orbit contrast, relative scales, Sun/Earth exposure, Saturn heading clearance, stars, night-side lighting, asset lifecycle, exact textures. | No console/page errors or text overlap, controls usable, visual review plus integrated-GPU/phone checks where available. |
| P4 | G2R.17 release and cleanup (PENDING) | Restore any temporary CI branch trigger, check attribution/README/state, run all tests, lint/build, merge individually approved PRs, verify final master SHA and Vercel commit deployment. | Green exact merge SHA, traceable evidence, no source/CI drift. |
| Later | G3 and beyond (NOT STARTED here) | Extend planet content or navigation only under a separately approved phase; don't mix it with realism QA. | Independent scope/acceptance. |

## Current handoff checkpoint

- Verified merged Mars baseline: `0d0a92c3d1788f9af2bc28266217dce37a7501d6` (PR #15), retaining motion/orbit fix #13, the four brighter orbital tracks and the original Earth/Sun/Saturn renderers. Full production CI 37216453383 and Vercel commit status succeeded.
- Current coding phase: **G2R.15 Mercury / Skills** on `feat/galaxy-mercury-skills-realism`, based on fresh `db615cff` master; references and acceptance in `docs/GALAXY_MERCURY_REALISM.md`. The pre-existing 10 skill satellites and merged motion/orbit improvements must be preserved. Keep the Skills node/satellite interaction usable while the globe rotates/revolves.
- Motion behavior: overview orbit 100%, hovered 82%, selected 65%; Earth surface spin on focus 82%. Planets are deliberately slow to give a cinematic rather than astronomical scale; selected camera tracks the moving target so apparent screen-space revolution can be subtle. Orbit lines represent *stationary* loci, not rotating decorations. Explicit Pause, reduced motion, page hidden/offscreen and still-mode stop ambient movement by design.
- Remaining in order: G2R.15 Mercury realism, G2R.16 multi-device visual/performance/accessibility QA, G2R.17 release and attribution checks. See the table above for implementation and acceptance criteria.

## How to verify spin, revolution and the orbit paths

- Run `cd frontend && npm ci && npm run test:galaxy && npm run lint && npm run build`. These include authored axial-yaw and planet-root revolution checks, orbit geometry matching `orbitPosition()`, pause/reduced mode, root/anchor tracking, and quality budgets.
- View `/galaxy` in normal motion with **Pause motion off** and OS `prefers-reduced-motion` disabled. In overview watch the actual planets change position over ~8 seconds while each of the four cool-grey tracks remains stationary. Tracks show where planets *travel*, not a decorative line that should spin.
- Focus Earth or Mars for 8 seconds: surface features should change longitude. A focused planet is followed by the camera and therefore tends to stay screen-centred **even when its world-space orbit is advancing at 65%**; return to overview or use tested root coordinates to judge revolution.
- With explicit Pause motion on, or with OS reduced motion, both root position and globe spin must stop; unpause should resume without a large time jump. Browser tab hiding and offscreen pausing are deliberate resource controls.
- Compare desktop 1440×900, laptop 1280×800 and phone 390×844 normal/reduced views. The orbit colours are `#9cacbf`: alpha .48 overview, .68 for the focused planet, .24 for unrelated paths; `depthTest: true` means a globe correctly hides an orbital segment behind it.
- Real browser baseline: [capture 37211514211](https://github.com/SanamRai001/Portofolio/actions/runs/37211514211) (motion/orbit fix), plus merged Mars integration [capture 37214671548](https://github.com/SanamRai001/Portofolio/actions/runs/37214671548). Hardware-specific FPS/touch is still a separate manual G2R.16 gate.

## Execution contract

1. Fetch live master and any active branch SHA; inspect actual code instead of starting from old discussions.
2. Keep physics/readability, Mars, Mercury, content and release changes reviewable separately. One authoritative scene clock and one planetary world-position formula.
3. Never merge two branches that independently replace the same planetary renderer; select the better validated version and resolve conflicts with the motion branch before testing. Prefer existing source-attributed images and shader utilities before additional textures/geometry/packages. Respect desktop/mobile RAM/GPU budgets.
4. Each phase requires a deterministic unit/integration test, browser captures (desktop, laptop, phone; normal and reduced) and explicit asset HTTP verification rather than a silent fallback.
5. Inspect screenshots rather than inferring good visuals from CI success. Update PROJECT_STATE with branch, SHA, test run, artifact, known limits and the next phase. Keep PR draft until visual signoff.
6. On each approved merge, verify production master commit CI and Vercel status; do not claim physical-device performance from headless Chromium.

Stop scope expansion if changes harm interaction, accessibility, legibility or fallback performance.
