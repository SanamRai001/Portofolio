# Galaxy remaining implementation roadmap

Canonical next-phase checklist, reviewed 2026-10-04. docs/PROJECT_STATE.md is the chronological evidence log; docs/GALAXY_MOTION_AUDIT.md explains animation behaviour. Prior draft realism plans predate merged Earth/Sun/Saturn PRs.

## Merged production baseline (motion fix `42c3db1`, 2026-10-04)

- G1–G6 navigation, camera, content foundation, single render loop, user controls and black-hole portal.
- Earth / Identity NASA-imagery day, cloud, night and terrain treatment, desktop and mobile.
- Sun / Core photosphere, restrained corona and low-power branch, PR #8.
- Saturn / Journey Cassini-inspired optical rings, projected shadows and improved phone framing, PR #9.
- Motion/orbit readability: [PR #13](https://github.com/SanamRai001/Portofolio/pull/13) merged in `42c3db1`. Prior conflicting draft [PR #12](https://github.com/SanamRai001/Portofolio/pull/12) was closed as superseded; do not import its focus-freeze assertions.
- Existing credited 2K Mars and Mercury textures already load. Mars has one **verified but unmerged canonical integration**: [PR #15](https://github.com/SanamRai001/Portofolio/pull/15) built from motion-fixed master. Earlier Mars alternatives [#10](https://github.com/SanamRai001/Portofolio/pull/10) and [#11](https://github.com/SanamRai001/Portofolio/pull/11) must not be merged; their validation predates the motion fix. Production Mars realism is pending only PR #15 review/merge. Mercury's final realism pass remains pending.

## Ordered remaining work

| Order | Phase | How to implement | Acceptance |
| --- | --- | --- | --- |
| P0 | G2R.M1 rotation/revolution and orbit visibility (**MERGED / VERIFIED**: PR #13, `42c3db1`) | Completed: selected-body orbit now moves at 65%, hover at 82%, overview at 100%; focused Earth's spin is 82%. Four true LineLoop tracks have higher contrast. Existing one-clock camera tracking, pause and reduced-motion preserved. | Exact production-commit CI 37213862905 **passed**, Vercel status **success**; numerical root/yaw/path and desktop/phone 8s capture gates passed. |
| P1 | G2R.14 Mars / Projects (**VERIFIED IN DRAFT INTEGRATION PR #15; MERGE PENDING**) | Ported restrained Mars source from PR #11 onto motion-fixed master as `feat/galaxy-mars-after-motion`; old PRs #10/#11 are superseded alternatives. Removed fictional night lights, retained fallback and motion proof. | CI 37214674812 and Galaxy/portal capture 37214671548 **passed**; source Mars JPEG 200 in five actual browser contexts. Matched desktop/phone before-after inspected. Temporary visual workflow trigger already restored (no workflow diff). Final code CI and Vercel preview green; owner reviews the matched capture, then merge only PR #15 and verify exact production commit. |
| P2 | G2R.15 Mercury / Skills (PENDING) | Retain credited Mercury atlas, strengthen crater/regolith shading and dark-to-lit terminator without painting false metallic surfaces; keep skill satellite navigation separate from planet spin and revolution. | Surface and orbital motion tests, focus/hover/tap keyboard navigation, desktop/mobile quality-tier captures. |
| P3 | G2R.16 final visual system QA (PENDING) | Compare all planets in overview/focus at 1440x900, 1280x800, 390x844 normal and reduced; verify orbit contrast, relative scales, Sun/Earth exposure, Saturn heading clearance, stars, night-side lighting, asset lifecycle, exact textures. | No console/page errors or text overlap, controls usable, visual review plus integrated-GPU/phone checks where available. |
| P4 | G2R.17 release and cleanup (PENDING) | Restore any temporary CI branch trigger, check attribution/README/state, run all tests, lint/build, merge individually approved PRs, verify final master SHA and Vercel commit deployment. | Green exact merge SHA, traceable evidence, no source/CI drift. |
| Later | G3 and beyond (NOT STARTED here) | Extend planet content or navigation only under a separately approved phase; don't mix it with realism QA. | Independent scope/acceptance. |

## Current handoff checkpoint

- Current production master: `cdc0eda0045d8eac0f07713c9742029b31f3194f`, including the verified orbit/axial-motion fix and improved four true orbital tracks.
- Authoritative next reviewed PR: [Mars #15](https://github.com/SanamRai001/Portofolio/pull/15), visual code `43c81c3e`, docs/cleanup head `c5b979b5`; [visual capture](https://github.com/SanamRai001/Portofolio/actions/runs/37214671548) success (artifact `11307344998`), [final CI](https://github.com/SanamRai001/Portofolio/actions/runs/37215182887) success, Vercel preview success. Do not apply the original Saturn-based drafts #10/#11 as another Mars branch.
- Motion behavior: overview orbit 100%, hovered 82%, selected 65%; Earth surface spin on focus 82%. Planets are deliberately slow to give a cinematic rather than astronomical scale; selected camera tracks the moving target so apparent screen-space revolution can be subtle. Orbit lines represent *stationary* loci, not rotating decorations. Explicit Pause, reduced motion, page hidden/offscreen and still-mode stop ambient movement by design.
- After approved Mars merge: G2R.15 Mercury realism, G2R.16 multi-device visual/performance/accessibility QA, G2R.17 release and attribution checks. See the table above for implementation and acceptance criteria.

## Execution contract

1. Fetch live master and any active branch SHA; inspect actual code instead of starting from old discussions.
2. Keep physics/readability, Mars, Mercury, content and release changes reviewable separately. One authoritative scene clock and one planetary world-position formula.
3. Never merge two branches that independently replace the same planetary renderer; select the better validated version and resolve conflicts with the motion branch before testing. Prefer existing source-attributed images and shader utilities before additional textures/geometry/packages. Respect desktop/mobile RAM/GPU budgets.
4. Each phase requires a deterministic unit/integration test, browser captures (desktop, laptop, phone; normal and reduced) and explicit asset HTTP verification rather than a silent fallback.
5. Inspect screenshots rather than inferring good visuals from CI success. Update PROJECT_STATE with branch, SHA, test run, artifact, known limits and the next phase. Keep PR draft until visual signoff.
6. On each approved merge, verify production master commit CI and Vercel status; do not claim physical-device performance from headless Chromium.

Stop scope expansion if changes harm interaction, accessibility, legibility or fallback performance.
