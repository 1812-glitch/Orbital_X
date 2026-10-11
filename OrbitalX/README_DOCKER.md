# 🚀 OrbitalX Docker Deployment Guide

OrbitalX is fully containerized with production-grade Docker and Docker Compose setups.

---

## 📦 Architecture Overview

The containerized stack consists of 3 isolated microservices communicating across an internal bridge network (`orbitalx-net`):

| Service | Technology | Port (Host:Container) | Description |
| :--- | :--- | :--- | :--- |
| **`frontend`** | Nginx 1.27 + React 19 (Vite) | `3000:80` | High-performance static asset server with SPA routing & reverse proxy to `/api` |
| **`backend`** | Node.js 20 Alpine + Express | `4000:4000` | REST API, telemetry engine, physics loop, AI recovery controller |
| **`mongodb`** | MongoDB 7.0 | `27017:27017` | Persistent telemetry and satellite database with volume `mongo-data` |

---

## 🛠️ Quick Start (Production)

### 1. Build and Run
From the `OrbitalX/` root directory, run:

```bash
docker compose up --build -d
```

### 2. Access the Application
- **Frontend Dashboard & 3D Studio**: [http://localhost:3000](http://localhost:3000)
- **Backend API & Health Check**: [http://localhost:4000/api/health](http://localhost:4000/api/health)
- **MongoDB**: `localhost:27017`

### 3. Stop the Containers
```bash
docker compose down
```
*(To remove all database volumes as well, run `docker compose down -v`)*

---

## 💻 Development Mode (Hot-Reloading)

If you are developing inside Docker with live file synchronization and hot reloading:

```bash
docker compose -f docker-compose.dev.yml up --build
```
- **Frontend (Vite Dev Server)**: [http://localhost:5173](http://localhost:5173)
- **Backend (Nodemon)**: [http://localhost:4000](http://localhost:4000)

---

## 🔍 Useful Commands

### View Live Logs
```bash
# All services
docker compose logs -f

# Backend only
docker compose logs -f backend

# Frontend Nginx logs
docker compose logs -f frontend
```

### Inspect Container Health
```bash
docker compose ps
```

### Run Security Audit Inside Container
```bash
docker compose exec backend node tests/securityAudit.js
```
