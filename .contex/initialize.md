# OrbitalX Initialization Plan (Phase 1 Checklist)

*Note: Do not execute any of this until given permission to start Phase 1.*

1. **Folder Setup:** Create `OrbitalX/` directory. Inside, create `frontend/` and `backend/`.
2. **Frontend Init:** 
   - Run `npm create vite@latest frontend -- --template react` (JS only).
   - Install Tailwind CSS, setup `tailwind.config.js` and `index.css`.
3. **Backend Init:**
   - Initialize `npm init -y` inside `backend/`.
   - Install Express, Mongoose, dotenv, cors, morgan, helmet.
   - Setup basic Express server file (`src/index.js` or `server.js`).
4. **Environment Variables:**
   - Setup `.env` for backend (PORT, MONGODB_URI, JWT_SECRET, CLIENT_URL).
   - Setup `.env.local` for frontend (VITE_API_URL, VITE_SOCKET_URL).
5. **Config & Scripts:**
   - Add dev scripts (e.g., using `nodemon` for backend).
   - Configure ESLint (JavaScript).
6. **Verification:**
   - Run both servers to ensure they start without errors.
   - Stop and provide the Phase 1 completion report.
