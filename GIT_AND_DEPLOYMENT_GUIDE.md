# 🚀 OrbitalX — Production Git Branching & Deployment Guide

This guide provides a step-by-step procedure to push the **OrbitalX** project to GitHub/GitLab with a professional multi-branch structure (`main` + `develop`), **zero merge conflicts**, and seamless production deployment.

---

## 🏗️ 1. Professional Git Branching Architecture

To avoid conflicts and deployment breaks, follow the industry-standard **Gitflow** branching model:

```
[ main ]          ---------------------------------● (v1.0.0 Production Release)
                     ^                           /
                     |                          /
[ develop ]       ---●--------------●----------● (Integration & Staging)
                       \           /
                        \         /
[ feature/* ]            ●-------● (Feature Development)
```

### The 3 Core Branches:
1. **`main` (Production Branch)**:
   - **Purpose**: Stable, production-ready code only.
   - **Deployment**: Any push/merge to `main` automatically deploys to live production (e.g. Vercel, AWS, Render).
   - **Rule**: Never commit directly to `main`. Only merge via Pull Request (PR) from `develop`.

2. **`develop` (Integration Branch)**:
   - **Purpose**: Central development branch where features are aggregated and verified.
   - **Deployment**: Automatically deploys to your staging/preview environment.

3. **`feature/<name>` (Working Feature Branches)**:
   - **Purpose**: Isolated branches created off `develop` for specific features or bug fixes (e.g., `feature/3d-cubesat-studio`, `feature/telemetry-sparkline`).
   - **Rule**: Once verified, submit a Pull Request to merge back into `develop`.

---

## 🛡️ 2. Critical Pre-Push Verification (Conflict & Leak Prevention)

We have already configured `.gitignore` at the workspace root, `OrbitalX/backend/`, and `OrbitalX/frontend/`.

Before pushing, verify that these 3 golden rules are honored:
1. **Never commit `node_modules`**: Excluded by `.gitignore`.
2. **Never commit `.env` files**: Secret keys and database credentials must stay local. Excluded by `.gitignore` (use `.env.example` as templates).
3. **Never commit `dist/` or build caches**: Build artifacts should be generated during deployment.

---

## 💻 3. Step-by-Step Terminal Commands (First Time Push)

Open **PowerShell** or **Terminal** in your project root (`c:\Users\RH364\OneDrive\Desktop\orbital desktop`):

### Step 1: Initialize Git Repository
```bash
git init
```

### Step 2: Stage All Clean Files
```bash
git add .
```

### Step 3: Check Git Status
```bash
git status
```
> **Verification Check**: Ensure you see code files, `.gitignore`, and documentation. Confirm `node_modules/` or `.env` files are **NOT** listed in green!

### Step 4: Create Initial Commit
```bash
git commit -m "feat: initial production release of OrbitalX Aerospace Platform v1.0.0"
```

### Step 5: Set Default Branch to `main`
```bash
git branch -M main
```

### Step 6: Create Your GitHub Repository
1. Go to [GitHub.com](https://github.com) -> Click **New Repository** (`+`).
2. Name it (e.g., `orbitalx` or `orbitalx-spacecraft-control`).
3. Set to **Public** or **Private**.
4. **IMPORTANT**: Do **NOT** check *"Initialize with README"*, *"Add .gitignore"*, or *"Add license"* (we already have all of them locally!).
5. Click **Create Repository**.

### Step 7: Link Your Local Repo to GitHub
Copy your remote URL from GitHub and run:
```bash
git remote add origin https://github.com/YOUR_USERNAME/orbitalx.git
```
*(Replace `YOUR_USERNAME` with your GitHub handle)*.

### Step 8: Push `main` to GitHub
```bash
git push -u origin main
```

### Step 9: Create and Push the `develop` Branch
```bash
git checkout -b develop
git push -u origin develop
```

🎉 **Congratulations!** Your repository is now live on GitHub with both `main` and `develop` branches set up!

---

## 🔄 4. Smooth Daily Workflow (How to Avoid Conflicts Forever)

When you or a teammate add a new feature, follow this 5-step loop:

### 1. Always start from the latest `develop`
```bash
git checkout develop
git pull origin develop
```

### 2. Create an isolated feature branch
```bash
git checkout -b feature/ground-station-relay
```

### 3. Make changes and commit regularly
```bash
git add .
git commit -m "feat: add antenna signal diagnostics filter"
```

### 4. Sync with `develop` before merging (Conflict-Proof Step)
Before opening a pull request, pull any new changes that were added to `develop`:
```bash
git checkout develop
git pull origin develop
git checkout feature/ground-station-relay
git merge develop
```
*(If there are any conflicts, resolve them locally in VS Code, then commit)*.

### 5. Push feature branch and open a Pull Request (PR)
```bash
git push -u origin feature/ground-station-relay
```
On GitHub, open a PR: `feature/ground-station-relay` ➔ `develop`.

---

## 🚀 5. Zero-Friction Deployment Guide

### Option A: Cloud Deployment (Vercel + Render / Railway)

#### Frontend Deployment on [Vercel](https://vercel.com/)
1. Sign in to Vercel and click **Add New Project** ➔ Import your `orbitalx` GitHub repo.
2. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click `Edit` and select `OrbitalX/frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Environment Variables:
   - Add `VITE_API_URL` = `https://your-backend-api.onrender.com/api`
4. Click **Deploy**. Vercel will build and assign you an SSL URL (e.g., `https://orbitalx.vercel.app`).

#### Backend Deployment on [Render](https://render.com/) or [Railway](https://railway.app/)
1. Create a **New Web Service** linked to your GitHub repo.
2. Configure settings:
   - **Root Directory**: `OrbitalX/backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
3. Environment Variables:
   - `PORT` = `5000`
   - `MONGODB_URI` = Your MongoDB Atlas connection string (`mongodb+srv://...`)
   - `JWT_SECRET` = Your secure production secret key
   - `CLIENT_URL` = `https://orbitalx.vercel.app` (your frontend domain)
4. Click **Deploy**.

---

### Option B: 1-Click Container Deployment (Docker / VPS / AWS EC2)

OrbitalX includes a production `docker-compose.yml` orchestrating MongoDB, Express Backend, and an Nginx-powered Frontend:

```bash
# Clone and enter directory
git clone https://github.com/YOUR_USERNAME/orbitalx.git
cd orbitalx

# Build and start all 3 services in background
docker-compose up --build -d
```

- **Frontend**: Available at `http://YOUR_SERVER_IP` (port 80)
- **Backend**: Available at `http://YOUR_SERVER_IP:5000`
- **MongoDB**: Encapsulated within the internal bridge network

To stop the containers:
```bash
docker-compose down
```

---

## 📋 6. Pre-Flight Deployment Checklist

Before triggering a deployment, run this quick 3-command checklist locally:

| Step | Command | Expected Output |
| :--- | :--- | :--- |
| **1. Frontend Build** | `npm --prefix OrbitalX/frontend run build` | `✓ built in ~1.3s` with 0 errors |
| **2. Security Audit** | `node OrbitalX/backend/tests/securityAudit.js` | `AUDIT RESULTS: 13 PASSED, 0 FAILED` |
| **3. Backend Health** | `curl http://localhost:5000/api/health` | `{"success": true, "message": "OrbitalX Backend is running"}` |
