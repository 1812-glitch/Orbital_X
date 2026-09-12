# OrbitalX - Phases Breakdown & Mini-Tasks

## Phase 1: Project Setup
- [x] Create `OrbitalX` root directory.
- [x] Create `OrbitalX/frontend/` using Vite (React + JavaScript).
- [x] Install and configure Tailwind CSS in the frontend.
- [x] Create `OrbitalX/backend/` and initialize npm.
- [x] Install Express, Mongoose, dotenv, cors, helmet in backend.
- [x] Set up basic Express server (`server.js`).
- [x] Add `.env` files for both frontend and backend.
- [x] Run both servers and verify connection.

## Phase 2: Database + Backend Foundation
- [x] Create MongoDB connection logic in backend.
- [x] Create Mongoose Models: User, Satellite, Mission, Telemetry, GroundStation, Alert, Command, Communication, Notification, AuditLog.
- [x] Set up Express route and controller folder structure.
- [x] Create reusable API utilities: `asyncHandler`, `ApiError`, `ApiResponse`.
- [x] Set up global error handler middleware.

## Phase 3: Authentication + Users
- [x] Implement backend `hashPassword`, `comparePassword`, `generateToken`.
- [x] Create auth routes (Register, Login, Logout, Profile).
- [x] Create auth middlewares (`requireAuth`, `requireRole`).
- [x] Implement frontend API client (Axios).
- [x] Build frontend pages: `/login`, `/register`, `/profile`.
- [x] Implement local state or React Context for user session.

## Phase 4: Satellite + Mission Management
- [x] Backend: Create CRUD routes and controllers for Satellites.
- [x] Backend: Create CRUD routes and controllers for Missions.
- [x] Frontend: Build `/satellites` list view and `/satellites/:id` detail view.
- [x] Frontend: Build `/missions` list and detail views.
- [x] Frontend: Add forms for creating/editing satellites and missions.

## Phase 5: Dashboard + Simulated Telemetry
- [x] Backend: Create basic telemetry generator function (mock values).
- [x] Frontend: Build the `/dashboard` layout (KPI cards, layout structure).
- [x] Frontend: Implement basic UI components (Cards, Tables, Badges).
- [x] Frontend: Display static/mocked telemetry values on dashboard.

## Phase 6: 3D Earth + Orbit
- [x] Frontend: Install Three.js, React Three Fiber, Drei.
- [x] Frontend: Create 3D Earth scene component.
- [x] Frontend: Add orbital lines and satellite meshes.
- [x] Frontend: Implement simplified orbital movement logic.
- [x] Frontend: Add camera controls and simulation speed toggles.

## Phase 7: Ground Stations + Connectivity
- [x] Backend: Create ground station seeds and CRUD endpoints.
- [x] Frontend: Build `/ground-stations` list and detail pages.
- [x] Frontend: Display ground stations on the 3D viewer.
- [x] Frontend: Add visual indicators for connectivity (Satellite -> Ground Station).

## Phase 8: Realtime Telemetry + Communication
- [x] Backend: Initialize Socket.IO server.
- [x] Backend: Setup telemetry interval simulation and emit `telemetry:update`.
- [x] Frontend: Connect Socket.IO client.
- [x] Frontend: Update dashboard/satellite details in real-time.
- [x] Frontend/Backend: Implement basic simulated message broadcasting.

## Phase 9: Mission Control + Commands
- [x] Backend: Create command processing endpoints and update DB.
- [x] Backend: Broadcast command status updates via Socket.IO.
- [x] Frontend: Build `/mission-control` view.
- [x] Frontend: Implement command sending UI (restrict to OPERATOR/ADMIN).
- [x] Frontend: Show live command status (SENT -> PROCESSING -> ACKNOWLEDGED).

## Phase 10: Telemetry History + Charts
- [x] Backend: Optimize historical telemetry fetching (pagination, time ranges).
- [x] Frontend: Install Recharts.
- [x] Frontend: Create reusable `TelemetryChart` component.
- [x] Frontend: Build `/telemetry` page with time range filters and charts.

## Phase 11: Alerts + Notifications
- [x] Backend: Implement threshold checking in simulation engine (e.g., Temp > 90).
- [x] Backend: Generate and emit alerts via Socket.IO.
- [x] Frontend: Build `/alerts` view (filtering, acknowledge/resolve actions).
- [x] Frontend: Create notifications dropdown in the top navbar.

## Phase 12: Analytics + Reports
- [x] Backend: Create aggregation endpoints for fleet health, averages, etc.
- [x] Frontend: Build `/analytics` dashboard with charts.
- [x] Frontend: Build simple `/reports` view for Mission and Satellite summaries.

## Phase 13: Admin Panel
- [x] Backend: Ensure admin-only routes are secured via `requireRole('ADMIN')`.
- [x] Frontend: Build `/admin` dashboard overview.
- [x] Frontend: Build user management table (`/admin/users`).
- [x] Frontend: Build simulation configuration controls (Speed, Interval).

## Phase 14: Profile + Settings + System Status
- [x] Frontend: Build `/settings` page (Preferences, Simulation defaults).
- [x] Frontend: Create system status indicators in the navbar (API, WS, DB).
- [x] Frontend: Wire up "Change Password" and profile edits.

## Phase 15: Activity Logs + Audit
- [x] Backend: Add logging middleware/hooks for key actions (login, CRUD, commands).
- [x] Frontend: Build dedicated `/admin/logs` view for detailed timeline.
- [x] Frontend: Create export capabilities for compliance reports.

## Phase 16: Integration + Complete User Flow
- [x] Test the complete user journey from Login to Mission Control.
- [x] Fix any visual or functional integration bugs.
- [x] Ensure realtime events map correctly across all open components.

## Phase 17: Testing + Security Review
- [x] Perform manual frontend and backend testing.
- [x] Verify role-based access control works properly.
- [x] Check MongoDB query safety and JWT validations.
- [x] Build and integrate 3D CubeSat Design Studio (3D DESIGN STUDIO.png & 3D Studio.png).

## Phase 18: Optimization + Cleanup
- [x] Remove unused components, dependencies, and duplicate code.
- [x] Optimize 3D performance (memoization, lower poly counts if needed).
- [x] Limit Socket.IO update frequencies and DB write rates.

## Phase 19: Final UI + Documentation + Deployment
- [x] Perform final visual polish against design specifications.
- [x] Write `README.md` and configuration instructions.
- [x] Document project architecture and college viva talking points.
