# 🧩 Backend-Controlled Portfolio System

A full-stack portfolio application where system features — authentication, caching, rate limiting, logging, and pagination — can be toggled in real time through a backend control panel.

> Built to simulate how production systems behave under different configurations. This isn't just a portfolio — it's a demonstration of backend architecture thinking.

**🔗 Live Demo:** [portofolio-beta-black-95.vercel.app](https://portofolio-beta-black-95.vercel.app) &nbsp;|&nbsp; **Backend:** https://portofolio-zsky.onrender.com/

---

## 🧠 What Makes This Different

Most portfolios are static pages. This one has a live control panel that changes how the backend behaves in real time. Toggle authentication off and protected routes open up. Toggle caching on and response times drop. The UI reflects every state change instantly.

---

## ⚙️ Features

**Authentication System**
- JWT-based login with token stored in Authorization headers
- Password hashing with bcrypt
- Auth middleware protecting all sensitive routes
- Toggle auth on/off from control panel — system responds immediately

**Dynamic Feature Control Panel**
- Toggle the following live:
  - 🗄️ Database connection
  - 🔐 Authentication
  - 📝 Request logging
  - 🛡️ Rate limiting
  - ⚡ In-memory caching
  - 📄 Pagination
- Each toggle changes actual backend middleware behavior — not just UI state

**Performance & Security**
- In-memory caching reduces redundant database queries
- Rate limiting middleware prevents API abuse
- Custom request logger tracks all incoming traffic
- Query-based pagination with configurable page size

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Tailwind CSS, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcrypt |
| Tools | Postman, dotenv, Git |

## 📁 Project Structure

```
portfolio-system/
├── backend/
│   ├── config/          # DB connection, feature toggle state
│   ├── controllers/     # Auth, projects, toggle logic
│   ├── middleware/      # JWT auth, rate limiter, logger, cache
│   ├── models/          # User, Project schemas
│   ├── routes/          # Auth, project, control panel routes
│   └── server.js
├── frontend/
│   ├── components/      # Navbar, TogglePanel, ProjectCard
│   ├── pages/           # Home, Login, Dashboard
│   └── App.jsx
```

## 🚀 Getting Started

**1. Clone the repo**
```bash
git clone https://github.com/SanamRai001/Portofolio.git
cd Portofolio
```

**2. Backend setup**
```bash
cd backend
npm install
```

Create `.env`:
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRETKEY=your_secret_key
```bash
npm run dev
```

**3. Frontend setup**
```bash
cd frontend
npm install
npm run dev
```

---

## 👨‍💻 Author

**Sanam Rai** — Kathmandu, Nepal

[GitHub](https://github.com/SanamRai001) · [LinkedIn](https://www.linkedin.com/in/sanam-rai-6b2149212)
