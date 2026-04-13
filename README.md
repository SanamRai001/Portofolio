# 🚀 Backend-Controlled Portfolio System

A dynamic full-stack portfolio application where core system features can be toggled in real time through a backend-driven control panel.

---

## 🧠 Overview

This project is not just a portfolio — it simulates how real-world systems behave under different configurations.

Users can enable/disable features like authentication, database access, logging, caching, and more — and instantly observe how the system responds.

---

## ⚙️ Key Features

* 🔐 **Authentication System (JWT-based)**

  * Login required when auth is enabled
  * Token-based access control

* 🧩 **Dynamic System Control Panel**

  * Toggle features like:

    * Database
    * Authentication
    * Logging
    * Rate Limiting
    * Caching
    * Pagination
  * Real-time backend behavior changes

* 📊 **Project Management**

  * Fetch projects from backend
  * Conditional rendering based on system state

* 🧠 **Interactive UI Behavior**

  * Auth overlay lock screen
  * Feature-based UI rendering
  * Hover-based system explanations

* 🛡️ **Security Awareness**

  * JWT authentication
  * Planned bcrypt password hashing
  * Understanding of SQL Injection (via labs)

---

## 🏗️ Tech Stack

### Frontend

* React.js
* Tailwind CSS
* Axios

### Backend

* Node.js
* Express.js

### Database

* MongoDB
* Mongoose

### Other Tools

* JWT (Authentication)
* dotenv
* Postman (API testing)

---

## 🔄 How It Works

1. User toggles features in the control panel
2. State is sent to backend via API
3. Backend updates system configuration
4. APIs behave differently based on toggles
5. UI updates dynamically to reflect system state

---

## 🔐 Authentication Flow

* User logs in via form
* Server generates JWT token
* Token stored in localStorage
* Token sent in Authorization headers
* Protected routes validate token via middleware

---

## 📁 Project Structure (Simplified)

```
frontend/
  ├── components/
  ├── pages/
  ├── App.jsx

backend/
  ├── controllers/
  ├── models/
  ├── routes/
  ├── middleware/
  ├── config/
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/your-repo-name.git
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:

```
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRETKEY=your_secret_key
```

Run server:

```bash
npm run dev
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 📌 Future Improvements

* 🔒 Add bcrypt password hashing
* 📄 Add pagination UI
* 📊 Add real-time logs panel
* 📱 Improve mobile responsiveness
* 🎨 UI/UX enhancements

---

## 💡 Inspiration

Built to simulate real backend systems and demonstrate how feature flags and system configurations affect application behavior.

---

## 👨‍💻 Author

**Sanam Rai**
📍 Kathmandu, Nepal

* GitHub: https://github.com/SanamRai001
* LinkedIn: https://www.linkedin.com/in/sanam-rai-6b2149212

---

## ⭐ Final Note

This project focuses on **understanding systems**, not just building UI — making it closer to real-world backend engineering practices.
