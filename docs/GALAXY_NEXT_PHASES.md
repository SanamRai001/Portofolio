# Galaxy remaining implementation roadmap

Canonical next-phase checklist, reconciled 2026-10-05 after the final focused-orbit release. docs/PROJECT_STATE.md is the chronological evidence log; docs/GALAXY_MOTION_AUDIT.md explains animation behaviour. Prior draft realism plans predate merged Earth/Sun/Saturn PRs.

## Merged production baseline (G2R.17 `4ee1dc8`, 2026-10-05)

- G1–G6 navigation, camera, content foundation, single render loop, user controls and black-hole portal.
- Earth / Identity NASA-imagery day, cloud, night and terrain treatment, desktop and mobile.
- Sun / Core photosphere, restrained corona and low-power branch, PR #8.
- Saturn / Journey Cassini-inspired optical rings, projected shadows and improved phone framing, PR #9.
- Motion/orbit readability: [PR #13](https://github.com/SanamRai001/Portofolio/pull/13) merged in `42c3db1`. Prior conflicting draft [PR #12](https://github.com/SanamRai001/Portofolio/pull/12) was closed as superseded; do not import its focus-freeze assertions.
- Mars / Projects photographic day/night and no fictitious settlements: canonical [PR #15](https://github.com/SanamRai001/Portofolio/pull/15) **merged** as `0d0a92c3`; exact post-merge [CI 37216453383](https://github.com/SanamRai001/Portofolio/actions/runs/37216453383) and Vercel status succeeded. Mars retains orbit/axial motion improvements from #13. Conflicting standalone alternatives [#10](https://github.com/SanamRai001/Portofolio/pull/10) and [#11](https://github.com/SanamRai001/Portofolio/pull/11) have been closed unmerged. Mercury / Skills realism is merged in PR #17 (`6c710da9`) with its credited 2K atlas, nonmetallic regolith shading and preserved Skills interaction.
- Release/handoff documentation: [PR #19](https://github.com/SanamRai001/Portofolio/pull/19) merged as `4ee1dc8`; README, attribution, state log and remaining-check list are reconciled. This docs-only merge had successful Vercel status and correctly did not trigger the frontend Action because that workflow is path-filtered to `frontend/**`.
- Focused world-orbit/UI cleanup: [PR #18](https://github.com/SanamRai001/Portofolio/pull/18) merged as `69b6bedc`; exact post-merge [CI 37329770084](https://github.com/SanamRai001/Portofolio/actions/runs/37329770084) **passed** and Vercel status succeeded. Overview keeps four readable true orbit loci at .48 while focused views fade only WORLD-scale traces; Skills-local rings and 100/82/65 revolution behavior are unchanged.

## Ordered remaining work

| Order | Phase | How to implement | Acceptance |
| --- | --- | --- | --- |
| P0 | G2R.M1 rotation/revolution and orbit visibility (**MERGED / VERIFIED**: PR #13, `42c3db1`) | Completed: selected-body orbit now moves at 65%, hover at 82%, overview at 100%; focused Earth's spin is 82%. Four true LineLoop tracks have higher contrast. Existing one-clock camera tracking, pause and reduced-motion preserved. | Exact production-commit CI 37213862905 **passed**, Vercel status **success**; numerical root/yaw/path and desktop/phone 8s capture gates passed. |
| P1 | G2R.14 Mars / Projects (**MERGED / VERIFIED**: PR #15, `0d0a92c`) | Integrated the restrained photographic Mars shader on the merged motion fix, removed fictional orange night lights, retained local fallback, desktop-only thin dust limb and a single-mesh mobile tier. Closed the two previous alternative PRs unmerged. | Mars image HTTP 200/JPEG in five browser contexts; [visual run 37214671548](https://github.com/SanamRai001/Portofolio/actions/runs/37214671548) and four portal cases passed, motion regression tests preserved. [Exact merge SHA CI 37216453383](https://github.com/SanamRai001/Portofolio/actions/runs/37216453383) and Vercel status **passed**. Optional full ~140s seam sweep and physical-device FPS remain unverified. |
| P2 | G2R.15 Mercury / Skills (**MERGED / VERIFIED**: PR #17, `6c710da9`) | Retained credited Mercury atlas, strengthened regolith shading and airless terminator without false metallic response; skill satellite navigation stays separate from globe spin/revolution. | Exact merge CI 37327445720 **passed**, Vercel **success**; browser artifact 11309456482 verified Mercury JPEG and desktop/laptop/phone normal/reduced focus. |
| P3 | G2R.16 final visual system QA (**MERGED / VERIFIED**: PR #18, `69b6bedc`) | Four true world-orbit tracks stay readable in overview (.48); focused WORLD-scale tracks fade to desktop .18/.055 and phone .06/.012. Skills-local rings remain .20; revolution stays 100/82/65. | Visual run 37328241293 / artifact 11353685738 passed six Galaxy records + four portal scenarios; exact merge CI 37329770084 and Vercel status **passed**. |
| P4 | G2R.17 release and cleanup (**MERGED / VERIFIED**: PR #19, `4ee1dc8`) | Reconciled README, Earth-vs-other-world attribution, PROJECT_STATE and this roadmap against production. No renderer/workflow behavior changed. | Vercel commit status succeeded. Frontend Actions are path-filtered to `frontend/**`, so the docs-only merge correctly produced no redundant frontend CI run. Original visual workflow remains unchanged; only physical-device FPS/touch and optional long Mars seam proof remain manual. |
| Later | G3 and beyond (NOT STARTED here) | Extend planet content or navigation only under a separately approved phase; don't mix it with realism QA. | Independent scope/acceptance. |

## Current handoff checkpoint

- Verified merged Mars baseline: `0d0a92c3d1788f9af2bc28266217dce37a7501d6` (PR #15), retaining motion/orbit fix #13, the four brighter orbital tracks and the original Earth/Sun/Saturn renderers. Full production CI 37216453383 and Vercel commit status succeeded.
- Production Mercury checkpoint: PR #17 merged at `6c710da9`; [CI 37327445720](https://github.com/SanamRai001/Portofolio/actions/runs/37327445720) passed and Vercel deployment status succeeded. Browser [run 37218653139](https://github.com/SanamRai001/Portofolio/actions/runs/37218653139), artifact `11309456482`, proved the real Mercury JPEG and Skills interaction across desktop/laptop/phone. Motion/orbit improvements from PR #13 remain intact.
- Production G2R.16 checkpoint: PR #18 merged at `69b6bedc`; [CI 37329770084](https://github.com/SanamRai001/Portofolio/actions/runs/37329770084) passed and Vercel commit status succeeded. Browser run 37328241293 / artifact 11353685738 is green and visually inspected: focused phone Skills no longer competes with world tracks while overview retains all four paths.
- Motion behavior: overview orbit 100%, hovered 82%, selected 65%; Earth surface spin on focus 82%. Planets are deliberately slow to give a cinematic rather than astronomical scale; selected camera tracks the moving target so apparent screen-space revolution can be subtle. Orbit lines represent *stationary* loci, not rotating decorations. Explicit Pause, reduced motion, page hidden/offscreen and still-mode stop ambient movement by design.
- G2R.17 handoff is merged as PR #19 / `4ee1dc8`; Vercel commit status succeeded. The frontend Action intentionally did not run because the merge changed docs only and the workflow is path-filtered to `frontend/**`. Runtime work is complete. Manual/non-headless checks that remain are real integrated-GPU/phone FPS + touch behavior and the optional ~140-second Mars full-turn seam proof.

## How to verify spin, revolution and the orbit paths

- Run `cd frontend && npm ci && npm run test:galaxy && npm run lint && npm run build`. These include authored axial-yaw and planet-root revolution checks, orbit geometry matching `orbitPosition()`, pause/reduced mode, root/anchor tracking, and quality budgets.
- View `/galaxy` in normal motion with **Pause motion off** and OS `prefers-reduced-motion` disabled. In overview watch the actual planets change position over ~8 seconds while each of the four cool-grey tracks remains stationary. Tracks show where planets *travel*, not a decorative line that should spin.
- Focus Earth or Mars for 8 seconds: surface features should change longitude. A focused planet is followed by the camera and therefore tends to stay screen-centred **even when its world-space orbit is advancing at 65%**; return to overview or use tested root coordinates to judge revolution.
- With explicit Pause motion on, or with OS reduced motion, both root position and globe spin must stop; unpause should resume without a large time jump. Browser tab hiding and offscreen pausing are deliberate resource controls.
- Compare desktop 1440×900, laptop 1280×800 and phone 390×844 normal/reduced views. World-orbit colour is `#9cacbf`: alpha .48 in overview; focused desktop selected/other .18/.055; focused phone .06/.012. Skills-local satellite rings remain .20. `depthTest: true` means a globe correctly hides an orbital segment behind it.
- Real browser baselines: [37211514211](https://github.com/SanamRai001/Portofolio/actions/runs/37211514211) (motion/orbit fix), [37214671548](https://github.com/SanamRai001/Portofolio/actions/runs/37214671548) (Mars integration), [37218653139](https://github.com/SanamRai001/Portofolio/actions/runs/37218653139) (Mercury) and [37328241293](https://github.com/SanamRai001/Portofolio/actions/runs/37328241293) (focused-orbit cleanup). Hardware-specific FPS/touch remains a separate manual release check.

## Execution contract

1. Fetch live master and any active branch SHA; inspect actual code instead of starting from old discussions.
2. Keep physics/readability, Mars, Mercury, content and release changes reviewable separately. One authoritative scene clock and one planetary world-position formula.
3. Never merge two branches that independently replace the same planetary renderer; select the better validated version and resolve conflicts with the motion branch before testing. Prefer existing source-attributed images and shader utilities before additional textures/geometry/packages. Respect desktop/mobile RAM/GPU budgets.
4. Each phase requires a deterministic unit/integration test, browser captures (desktop, laptop, phone; normal and reduced) and explicit asset HTTP verification rather than a silent fallback.
5. Inspect screenshots rather than inferring good visuals from CI success. Update PROJECT_STATE with branch, SHA, test run, artifact, known limits and the next phase. Keep PR draft until visual signoff.
6. On each approved merge, verify production master commit CI and Vercel status; do not claim physical-device performance from headless Chromium.

Stop scope expansion if changes harm interaction, accessibility, legibility or fallback performance.
