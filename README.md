# 🦇 Batman Auth — Gotham Secure Portal

A full-stack Batman-themed authentication application with JWT-based login/register flow.

---

## 📁 Project Structure

```
Game_theory-2/
├── client/          # React (Vite) frontend
├── server/          # Express backend
└── package.json     # Root convenience scripts
```

---

## ⚙️ Prerequisites

- Node.js ≥ 18
- MongoDB running locally (default: `mongodb://localhost:27017`)

---

## 🚀 Setup & Run

### 1. Backend

```bash
cd server
# Edit .env if needed (MONGO_URI, JWT_SECRET, PORT)
npm run dev      # nodemon auto-reload
# or
npm start        # plain node
```

Server runs at: `http://localhost:5000`

### 2. Frontend

```bash
cd client
npm run dev
```

App runs at: `http://localhost:5173`

---

## 🌐 API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/health` | Server health check |

### Register payload
```json
{ "email": "user@example.com", "password": "yourpassword" }
```

### Login response
```json
{
  "token": "<jwt>",
  "user": { "id": "...", "email": "...", "isAdmin": false }
}
```

---

## 🔐 Special Admin Account

Registering with `dushyanth520@gmail.com` automatically sets `isAdmin: true` via Mongoose pre-save hook.

---

## 🎨 Theme

| Token | Value |
|-------|-------|
| Background | `#050505` |
| Card / Glass | `#121212` |
| Accent / Yellow | `#FFD700` |
| Font Heading | Bebas Neue |
| Font Body | Inter |

---

## 📦 Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 18, Vite 5, Tailwind CSS 3, Framer Motion 11, Lucide React |
| Backend | Node.js, Express 4, Mongoose 8 |
| Auth | bcryptjs, jsonwebtoken (7d expiry) |
| Database | MongoDB |

---

## 🔑 Environment Variables

### `server/.env`
```
MONGO_URI=mongodb://localhost:27017/batman_auth
JWT_SECRET=batman_dark_knight_secret_key_2024
PORT=5000
```

### `client/.env`
```
VITE_API_URL=http://localhost:5000
```
