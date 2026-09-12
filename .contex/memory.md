# OrbitalX Core Memory & Context

- **Project Nature:** Final-year college project. Educational web-based satellite mission-control and orbital simulation.
- **Goal:** Clean, impressive, understandable, easy to explain during a viva, minimal unnecessary complexity.
- **Source of Truth:** The backend controls simulation calculations (telemetry, position, health, alerts, commands). The frontend handles visual rendering.
- **Realtime Updates:** Socket.IO with a reasonable update interval (2-5 seconds). Do not overwhelm the browser or server.
- **Data Logging:** Only store meaningful telemetry samples in the database (e.g., every few seconds), use pagination and indexes.
- **User Roles:**
  - **VIEWER:** Read-only access.
  - **OPERATOR:** Can send commands, use communications, acknowledge alerts.
  - **ADMIN:** Manage users, satellites, missions, simulation config.
- **3D Optimization:** Use low/medium poly models, memoization, and limited particles/lights. Only optimize if performance is actually degraded.
- **Project Structure Target:**
  ```
  OrbitalX/
  ├── frontend/
  └── backend/
  ```
- **Language Update:** The master prompt requested TypeScript, but user specifically mandated "do not use typscript only JavaScript" and "use npm only with create vite app" in the final constraints. All future steps must use pure JavaScript.
