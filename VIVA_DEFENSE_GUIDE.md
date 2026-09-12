# 🎓 OrbitalX — College Viva & Architectural Defense Guide

This guide is designed for **technical viva examinations, project defense presentations, and engineering evaluations**. It provides technical explanations, architectural trade-offs, anticipated examiner questions, and exact code locations for demonstrations.

---

## 📌 1. 30-Second Elevator Pitch

> *"OrbitalX is a full-stack, aerospace-grade satellite teleoperation and mission control platform. It solves the fragmentation in smallsat operations by unifying real-time constellation telemetry monitoring, 3D WebGL orbital physics visualization, live telecommand dispatch, automated anomaly detection, and an interactive CAD-like 3D CubeSat Design Studio. Built with React 19, Three.js, Node.js/Express, and MongoDB, OrbitalX achieves sub-second UI responsiveness with a 98.9% optimized bundle size, zero GPU memory leakage, and automated security verification."*

---

## 🏛️ 2. Architectural Decisions & Trade-Offs (Why We Built It This Way)

### Q1: Why use Three.js / WebGL instead of pre-rendered 2D maps or video feeds?
- **Answer**: Satellites operate in three-dimensional non-Euclidean space where latitude/longitude alone fails to convey orbital altitude, eclipse shadow periods, and line-of-sight elevation angles to ground stations.
- **Implementation**: We implemented two distinct 3D pipelines:
  1. `Scene.jsx` (`react-globe.gl` + Three.js) for spherical Earth representation, dynamic Keplerian orbital rings, and parabolic ground station downlink arcs.
  2. `CubeSatCanvas.jsx` (Three.js WebGLRenderer) for hardware component visualization with metallic PBR shading, raycasting, and exploded assembly animations.
- **Code Reference**: [`OrbitalX/frontend/src/pages/studio/CubeSatCanvas.jsx`](file:///c:/Users/RH364/OneDrive/Desktop/orbital%20desktop/OrbitalX/frontend/src/pages/studio/CubeSatCanvas.jsx).

---

### Q2: How did you solve WebGL memory leaks and excessive GPU load?
- **Answer**: Standard Three.js canvases often keep geometries and textures retained in VRAM even after unmounting, causing tab crashes. Moreover, running continuous `requestAnimationFrame` loops when the user switches tabs wastes laptop battery and triggers fan spin.
- **Solution**:
  1. **Recursive Disposal on Unmount**: In `CubeSatCanvas.jsx` and `Scene.jsx`, we recursively traverse the scene tree on unmount and invoke `.geometry.dispose()` and `.material.dispose()`.
  2. **Page Visibility API Throttling**: We bind `document.addEventListener('visibilitychange')`. When `document.hidden` is true, the animation loop yields, dropping background GPU load to **0%**.
- **Code Reference**: [`CubeSatCanvas.jsx#L123-L165`](file:///c:/Users/RH364/OneDrive/Desktop/orbital%20desktop/OrbitalX/frontend/src/pages/studio/CubeSatCanvas.jsx).

---

### Q3: How did you achieve a 98.9% bundle size reduction?
- **Answer**: Monolithic SPAs bundle heavy libraries like Three.js, React-Globe, and Recharts into the main entrypoint (`index.js`), which initially measured **2,861 kB**.
- **Solution**:
  1. **Route-Level Dynamic Imports**: We converted all 18 routes to `React.lazy()` wrapped inside `<Suspense fallback={<PageLoader />}>`.
  2. **Rolldown Vendor Chunking**: In `vite.config.js`, we established a custom `manualChunks` function that segregates vendor libraries into dedicated chunks (`vendor-react`, `vendor-charts`, `vendor-icons`, `vendor-globe`).
  3. **Result**: The critical initial entrypoint dropped from **2.8 MB to 29.88 kB**, providing near-instant initial paint.
- **Code Reference**: [`OrbitalX/frontend/src/App.jsx#L12-L38`](file:///c:/Users/RH364/OneDrive/Desktop/orbital%20desktop/OrbitalX/frontend/src/App.jsx) and [`vite.config.js#L10-L34`](file:///c:/Users/RH364/OneDrive/Desktop/orbital%20desktop/OrbitalX/frontend/vite.config.js).

---

### Q4: How is database memory explosion prevented with high-frequency telemetry simulation?
- **Answer**: Simulated telemetry generated every 10 seconds for multiple satellites quickly amasses tens of thousands of records, leading to unbounded MongoDB memory consumption.
- **Solution**:
  - We implemented a **Sliding-Window Retention Policy** in `telemetrySimulator.js`. After inserting incoming records, the engine caps the historical record count to the **300 most recent records per satellite** and purges older records using `{ timestamp: 1 }` indexing.
- **Code Reference**: [`OrbitalX/backend/src/services/telemetrySimulator.js#L52-L65`](file:///c:/Users/RH364/OneDrive/Desktop/orbital%20desktop/OrbitalX/backend/src/services/telemetrySimulator.js).

---

### Q5: How is security enforced across roles (RBAC)?
- **Answer**: We use stateless JWT tokens with role verification middleware (`requireRole('ADMIN')` and `requireRole(['ADMIN', 'OPERATOR'])`).
- **Audit Logging**: Sensitive actions (logins, command dispatches, mission creation) generate immutable audit records in MongoDB via `AuditLog` schema.
- **Security Audit Verification**: An automated security test suite ([`backend/tests/securityAudit.js`](file:///c:/Users/RH364/OneDrive/Desktop/orbital%20desktop/OrbitalX/backend/tests/securityAudit.js)) executes 13 automated tests checking unauthenticated route rejection, invalid JWT handling, NoSQL injection resilience, and role restrictions. All 13 tests passed.

---

## 🎯 3. Demonstration Script (What to Show the Examiner)

1. **Step 1 — Dashboard Overview (`/dashboard`)**:
   - Show the real-time system clock, fleet health indicators, and 3D globe Earth preview.
   - Point out the `EMERGENCY OVERRIDE` safety action.
2. **Step 2 — 3D CubeSat Design Studio (`/studio`)**:
   - Change form factor from `1U` to `2U` to `3U`. Observe dynamic chassis height and rail expansion.
   - Mount components: add an OBC, two Solar Panels, a Battery, and a Reaction Wheel.
   - Show how Mass, Volume, Power, and Eclipse Battery gauges update dynamically.
   - Click **`ASSEMBLE`** to show smooth exploded mechanical animation.
   - Click **`VALIDATE`** to show the vertical cyan laser diagnostic scan.
   - Toggle to **`List`** mode to showcase the itemized Bill of Materials (BOM).
3. **Step 3 — 3D Orbital Viewer (`/orbit`)**:
   - Rotate the Earth globe. Show ground stations and communication uplink arcs to satellites.
   - Toggle night vision mode on/off to demonstrate atmospheric shader changes.
4. **Step 4 — Ground Stations Network (`/ground-stations`)**:
   - Highlight the 3D coverage globe and selected station card.
   - Click **`DIAGNOSTICS`** to trigger live antenna frequency sweep simulation.
   - Click rows in the Global Station Network table to focus different stations.
5. **Step 5 — Live Encrypted Communications (`/communications`)**:
   - Inspect active targets and metrics (`-62 dBm`, `124 ms`, `AES-256`).
   - Type a command (e.g. `DIAG_SWEEP -FORCE`) and click Send.
   - Show the instant telecommand dispatch and simulated satellite acknowledgment in the terminal and bottom event log.
6. **Step 6 — Alerts & Incidents (`/alerts`)**:
   - Show the 4 KPI badges top-right matching aerospace specs.
   - Highlight the embedded 30-minute telemetry anomaly sparkline chart.
   - Click **`ACKNOWLEDGE`** to transition the incident into acknowledged state.

---

## 📂 4. Key Files & Line Reference Cheat Sheet

| Feature Area | Source File | Key Functions / Elements |
| :--- | :--- | :--- |
| **3D CubeSat Canvas** | `OrbitalX/frontend/src/pages/studio/CubeSatCanvas.jsx` | Dynamic chassis geometry, PBR materials, assembly interpolation, scan laser |
| **CubeSat Logic & Budget** | `OrbitalX/frontend/src/pages/studio/CubeSatStudio.jsx` | Subsystem diagnostics, shadow battery calculation, BOM table |
| **3D Orbital Earth** | `OrbitalX/frontend/src/components/3d/Scene.jsx` | Spherical coordinate mapping, downlink arcs, auto-rotation |
| **Ground Stations** | `OrbitalX/frontend/src/pages/groundstations/GroundStations.jsx` | 3D coverage mini-globe, signal quality gauge, global table |
| **Live Communications** | `OrbitalX/frontend/src/pages/communications/Communications.jsx` | 3-pane console, encrypted terminal session, metric meters |
| **Alerts & Sparkline** | `OrbitalX/frontend/src/pages/alerts/AlertsIncidents.jsx` | 30m AreaChart anomaly sparklines, acknowledgment flow |
| **Telemetry Simulator** | `OrbitalX/backend/src/services/telemetrySimulator.js` | 300-record sliding window retention, thermal/power anomaly injection |
| **Security Audit** | `OrbitalX/backend/tests/securityAudit.js` | 13 automated tests covering auth, JWT, NoSQL injection, and RBAC |
| **Build Chunking** | `OrbitalX/frontend/vite.config.js` | Function-based manualChunks for Rolldown / Vite 8 |
