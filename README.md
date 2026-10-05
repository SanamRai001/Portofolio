<p align="center">
  <img src="./assets/readme/project-cover.svg" width="100%" alt="Sanam Rai Portfolio Platform project cover"/>
</p>

# Sanam Rai — Portfolio Platform

A backend-focused full-stack portfolio built as an **interactive software system**, not only a static showcase.

The `/` homepage presents backend engineering, a live Express/MongoDB lab, a readable request lifecycle, and project case studies. The separate `/galaxy` route is an interactive Three.js solar-system portfolio with reference-grounded planetary rendering, camera travel, orbit motion, skill satellites, and a black-hole portal. Each route loads its own presentation code; the homepage does not load Three.js.

**Live:** https://sanam-rai.com.np

---

## What makes this portfolio different

### Live Backend Lab
The portfolio exposes runtime configuration for backend capabilities through the interface.

The frontend reads and updates the same system configuration used by the backend, including:

- authentication
- database access
- caching
- request logging
- pagination
- rate-limit configuration

The lab is designed to make backend architecture visible rather than presenting a fake dashboard.

> Rate limiting is currently represented as configuration state only; its middleware is not attached to the project route.

### Readable architecture and runtime state
The homepage uses semantic HTML/CSS for the request pipeline and the Backend Lab's live configuration map. There is no WebGL canvas, pinned scrolling, GSAP timeline, or cursor-following mascot on `/`. One shared IntersectionObserver adds a 460ms fade with 16px movement; content is visible by default and reduced motion disables the effect.

### Galaxy — interactive solar-system portfolio
`/galaxy` is a separately loaded Three.js route built around one authoritative scene clock and one planetary world-position model. It includes:

- **Core / Sun** — continuum-inspired photosphere and restrained corona
- **Identity / Earth** — NASA-derived day, night, cloud, water and terrain imagery
- **Skills / Mercury** — airless regolith shading plus ten interactive skill satellites
- **Projects / Mars** — photographic albedo, realistic terminator and thin daylight dust limb
- **Journey / Saturn** — structured translucent rings with projected ring/planet shadows
- **The Lab** and a selectable **Black Hole** with a cancellable portal handoff

The four primary planets rotate on their own axes and revolve around Core. Overview orbit tracks remain visible and are derived from the same `orbitPosition()` function as the simulation; focused views fade the world-scale tracks so portfolio copy stays readable. Pause, reduced motion, hidden/off-screen throttling, low-power rendering, keyboard/touch navigation and a static WebGL fallback are retained.

Planetary rendering is reference-informed rather than a claim of physical astronomical simulation. Image provenance is documented in `docs/GALAXY_EARTH_IMAGERY.md` and `docs/GALAXY_TEXTURE_CREDITS.md`.

### Editorial Project Storytelling
Selected work is presented as engineering case studies instead of a standard three-card grid.

The current featured projects include:

- **Krishi Bazar** — marketplace flows, JWT auth, cart state, dual checkout, persistence
- **Backend-Controlled Portfolio** — runtime configuration and API-system behavior
- **YakTalk** — authenticated Socket.IO connections, presence, and private realtime messaging

A separate **Core Projects** section remains API-driven to demonstrate the live backend data path.

---

## Architecture

```text
Browser
   │
   ▼
React + Vite
   │
   │ Axios / JWT
   ▼
Express API
   │
   ├── system configuration
   ├── authentication middleware
   ├── cache layer
   ├── request logging
   └── project controller
          │
          ▼
       MongoDB
```

The frontend and backend are intentionally separate applications inside one repository.

---

## Tech stack

### Frontend

- React 19
- Vite 7
- CSS + IntersectionObserver (homepage)
- Three.js (Galaxy only)
- Tailwind CSS 4
- Axios
- Lucide React
- React Icons

### Backend

- Node.js
- Express 5
- MongoDB
- Mongoose
- JSON Web Tokens
- Node Cache
- Morgan / Winston
- Express Rate Limit

---

## Repository structure

```text
Portofolio/
├── frontend/
│   ├── public/
│   │   ├── forge/
│   │   ├── galaxy/photoreal/
│   │   └── projects/
│   └── src/
│       ├── motion/
│       ├── pages/Galaxy/
│       ├── reusable/
│       ├── ArchitectureStory.jsx
│       ├── LivingForge.jsx
│       ├── ProjectStory.jsx
│       ├── SystemCore.jsx
│       └── SystemControl.jsx
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── server.js
├── docs/
│   └── PROJECT_STATE.md
└── assets/
    └── readme/
```

---

## Run locally

### 1. Clone

```bash
git clone https://github.com/SanamRai001/Portofolio.git
cd Portofolio
```

### 2. Backend

```bash
cd backend
npm install
```

Create a backend `.env` with:

```env
DB_URI=your_mongodb_connection_string
JWT_SECRETKEY=your_jwt_secret
PORT=5000
```

Run the backend:

```bash
npm run dev
```

Use `npm start` to run the backend without the development watcher.

### 3. Frontend

In another terminal:

```bash
cd frontend
npm install
```

Create a frontend `.env`:

```env
VITE_API_URL=http://localhost:5000
```

Then run:

```bash
npm run dev
```

> The current backend CORS configuration allows the production portfolio domains only. Add your local Vite origin during local full-stack development if needed.

---

## Accessibility and performance

The immersive layer is designed to degrade gracefully:

- `prefers-reduced-motion` support
- keyboard skip navigation
- focus isolation for the authentication modal
- mobile-specific linear layouts
- no scroll hijacking
- WebGL pause while hidden/off-screen
- lazy-loaded below-fold project imagery
- request cancellation for stale project fetches
- live-log polling pauses while the document is hidden

---

## Backend Lab scope

This repository is a portfolio and architecture demonstration.

The lab intentionally exposes implementation ideas so they can be observed from the interface. It should not be treated as a drop-in production authentication/security reference without additional hardening and testing.

Current known engineering debt is tracked in:

`docs/PROJECT_STATE.md`

---

## Development status

The backend-focused homepage and the current Galaxy solar-system route are deployed from `master`. Galaxy releases are gated by unit/integration checks, lint/build, desktop/laptop/phone browser captures, explicit local image-response verification and Vercel commit status. Physical-device GPU frame-time/touch checks are tracked separately because headless Chromium cannot prove them. See `docs/PROJECT_STATE.md` and `docs/GALAXY_NEXT_PHASES.md` for the verified state and remaining manual checks.

---

## Author

**Sanam Rai**  
Backend · Systems · Full Stack · AI

- Portfolio: https://sanam-rai.com.np
- GitHub: https://github.com/SanamRai001
- LinkedIn: https://www.linkedin.com/in/sanam-rai-6b2149212/


### Backend security checks

From `backend/`:

```bash
npm test
```

The backend test suite includes password hashing/migration and JWT middleware checks. A focused auth-only command is also available:

```bash
npm run test:auth
```


### Legacy password migration

Authentication accepts bcrypt hashes only. To inspect any legacy plaintext records requiring migration, run from the backend environment:

```bash
npm run migrate:passwords
```

This is a dry run and does not modify data. If the reported legacy count is expected, apply the migration explicitly:

```bash
npm run migrate:passwords:apply
```

The migration never prints passwords. Each write is conditional on the stored password still matching the value that was scanned, so concurrent changes are not overwritten.

### Frontend checks

From `frontend/`:

```bash
npm run test:auth-runtime
npm run test:galaxy
npm run test:homepage
npm run lint
npm run build
```

The build checks the emitted module graph to keep Galaxy/Three.js and removed cinematic code out of the homepage imports. DOM tests cover Lab synchronization/rollback, auth isolation, project requests, and reveal lifecycle; they do not replace browser visual verification.
