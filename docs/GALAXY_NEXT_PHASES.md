# Galaxy remaining implementation roadmap

Canonical next-phase checklist, reviewed 2026-10-04. docs/PROJECT_STATE.md is the chronological evidence log; docs/GALAXY_MOTION_AUDIT.md explains animation behaviour. Prior draft realism plans predate merged Earth/Sun/Saturn PRs.

## Merged production baseline (motion fix `42c3db1`, 2026-10-04)

- G1–G6 navigation, camera, content foundation, single render loop, user controls and black-hole portal.
- Earth / Identity NASA-imagery day, cloud, night and terrain treatment, desktop and mobile.
- Sun / Core photosphere, restrained corona and low-power branch, PR #8.
- Saturn / Journey Cassini-inspired optical rings, projected shadows and improved phone framing, PR #9.
- Motion/orbit readability: [PR #13](https://github.com/SanamRai001/Portofolio/pull/13) merged in `42c3db1`. Prior conflicting draft [PR #12](https://github.com/SanamRai001/Portofolio/pull/12) was closed as superseded; do not import its focus-freeze assertions.
- Existing credited 2K Mars and Mercury textures already load. Mars is implemented in two **unmerged, competing** draft branches ([PR #10](https://github.com/SanamRai001/Portofolio/pull/10), [PR #11](https://github.com/SanamRai001/Portofolio/pull/11)); it is not yet production-complete. Mercury's final realism pass remains pending.

## Ordered remaining work

| Order | Phase | How to implement | Acceptance |
| --- | --- | --- | --- |
| P0 | G2R.M1 rotation/revolution and orbit visibility (**MERGED / VERIFIED**: PR #13, `42c3db1`) | Completed: selected-body orbit now moves at 65%, hover at 82%, overview at 100%; focused Earth's spin is 82%. Four true LineLoop tracks have higher contrast. Existing one-clock camera tracking, pause and reduced-motion preserved. | Exact production-commit CI 37213862905 **passed**, Vercel status **success**; numerical root/yaw/path and desktop/phone 8s capture gates passed. |
| P1 | G2R.14 Mars / Projects (**INTEGRATED BRANCH, QA PENDING**) | Selected the restrained PR #11 implementation and ported Mars-only source/test/docs onto current motion-fixed `master` as `feat/galaxy-mars-after-motion`. Keep PR #10/#11 as historical alternatives; retain the 0/+8s motion capture and add Mars HTTP 200/JPEG alongside Earth/Saturn checks. Remove fictional night lights, retain low-power fallback, no added render loop. | Green integrated auth/Galaxy/homepage/lint/build, six Galaxy and four portal cases, desktop/phone Mars normal/reduced source-loaded screenshots and retained revolution proof. Merge ONLY the integrated PR after visual acceptance. |
| P2 | G2R.15 Mercury / Skills (PENDING) | Retain credited Mercury atlas, strengthen crater/regolith shading and dark-to-lit terminator without painting false metallic surfaces; keep skill satellite navigation separate from planet spin and revolution. | Surface and orbital motion tests, focus/hover/tap keyboard navigation, desktop/mobile quality-tier captures. |
| P3 | G2R.16 final visual system QA (PENDING) | Compare all planets in overview/focus at 1440x900, 1280x800, 390x844 normal and reduced; verify orbit contrast, relative scales, Sun/Earth exposure, Saturn heading clearance, stars, night-side lighting, asset lifecycle, exact textures. | No console/page errors or text overlap, controls usable, visual review plus integrated-GPU/phone checks where available. |
| P4 | G2R.17 release and cleanup (PENDING) | Restore any temporary CI branch trigger, check attribution/README/state, run all tests, lint/build, merge individually approved PRs, verify final master SHA and Vercel commit deployment. | Green exact merge SHA, traceable evidence, no source/CI drift. |
| Later | G3 and beyond (NOT STARTED here) | Extend planet content or navigation only under a separately approved phase; don't mix it with realism QA. | Independent scope/acceptance. |

## Execution contract

1. Fetch live master and any active branch SHA; inspect actual code instead of starting from old discussions.
2. Keep physics/readability, Mars, Mercury, content and release changes reviewable separately. One authoritative scene clock and one planetary world-position formula.
3. Never merge two branches that independently replace the same planetary renderer; select the better validated version and resolve conflicts with the motion branch before testing. Prefer existing source-attributed images and shader utilities before additional textures/geometry/packages. Respect desktop/mobile RAM/GPU budgets.
4. Each phase requires a deterministic unit/integration test, browser captures (desktop, laptop, phone; normal and reduced) and explicit asset HTTP verification rather than a silent fallback.
5. Inspect screenshots rather than inferring good visuals from CI success. Update PROJECT_STATE with branch, SHA, test run, artifact, known limits and the next phase. Keep PR draft until visual signoff.
6. On each approved merge, verify production master commit CI and Vercel status; do not claim physical-device performance from headless Chromium.

Stop scope expansion if changes harm interaction, accessibility, legibility or fallback performance.
