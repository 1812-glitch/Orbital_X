====================================================================================================
ORBITAL_X PROJECT — COMPLETE TECHNICAL ARCHITECTURE & COMPONENT GUIDE
MASTER DOCUMENTATION INDEX
====================================================================================================

This documentation suite provides an exhaustive, component-by-component, and file-by-file
breakdown of the entire Orbital_X aerospace platform.

The documentation is organized into three comprehensive text volumes:

----------------------------------------------------------------------------------------------------
VOLUME 1: PART_1_SYSTEM_ARCHITECTURE_AI_AND_ROOT.txt
----------------------------------------------------------------------------------------------------
Location: CODE_DOCUMENTATION/PART_1_SYSTEM_ARCHITECTURE_AI_AND_ROOT.txt

Topics Covered:
  - System Architecture & Multi-Tier Topology (AI Microservice, Backend REST, React 19 WebGL)
  - Root Orchestration Scripts & Configs:
    * start.bat (Multi-terminal aerospace launcher)
    * stop.bat (Graceful process termination)
    * package.json (Root workspace scripts)
    * docker-compose.yml (Containerized deployment)
    * .gitignore (Conflict & secret leak prevention)
  - AI Microservice & Satellite Anomaly Diagnostic Engine (AI/):
    * Mathematical theory of the custom Gaussian Naive Bayes Classifier (Log-domain probability)
    * ai_inference_service.py (HTTP microservice on Port 5050, JSON endpoint, auto-training)
    * train_classifier.py (Model training from CSV dataset to satellite_classifier_model.pkl)
    * test_ai_diagnosis.py (5/5 aerospace emergency validation scenarios)
    * generate_dataset.py (Physical telemetry simulation, solar flux & SAA radiation physics)
    * fine_tune_llm.py (JSONL dataset preparation for LLM fine-tuning)
    * generate_pdf_guide.py & generate_beginner_pdf.py (Automated PDF reports)
    * Dataset schema & 16 physical feature channels

----------------------------------------------------------------------------------------------------
VOLUME 2: PART_2_BACKEND_COMPONENTS_AND_CODE.txt
----------------------------------------------------------------------------------------------------
Location: CODE_DOCUMENTATION/PART_2_BACKEND_COMPONENTS_AND_CODE.txt

Topics Covered:
  - Core Server & Config:
    * server.js (Express 5 setup, middleware, telemetry loop, in-memory DB fallback)
    * src/config/db.js (Dual-mode resilient database connection)
    * .env (Configuration variables)
  - Data Models (Mongoose Schemas):
    * User.js (RBAC roles: ADMIN, OPERATOR, ANALYST, VIEWER)
    * Satellite.js (Orbital parameters & 6 subsystem health objects)
    * Mission.js (Lifecycle, launch site & assigned satellite links)
    * GroundStation.js (Geographic lat/lng, dish diameter & frequency bands)
    * Telemetry.js (Sliding-window high-frequency time series)
    * Alert.js (Incident tracking, root cause & mitigation status)
    * AuditLog.js (Immutable security ledger)
    * Notification.js, Command.js, Communication.js
  - API Controllers (All 13 Controllers):
    * authController, satelliteController, telemetryController, alertController, aiController,
      missionController, groundStationController, communicationController, cubesatCommandController,
      adminController, userController, auditController, analyticsController
  - Middleware & Security:
    * middleware/auth.js (JWT cryptographic verification & RBAC authorization guards)
    * middleware/errorHandler.js (Normalized JSON error handling)
  - Background Services:
    * services/telemetrySimulator.js (10-second orbital mechanics & solar eclipse physics loop)
    * services/auditService.js
  - Utilities, Seed Data & Security Tests:
    * utils/seedData.js (Automatic constellation & admin user initialization)
    * tests/securityAudit.js (13-stage security test suite: RBAC, NoSQL injection, JWT verification)

----------------------------------------------------------------------------------------------------
VOLUME 3: PART_3_FRONTEND_COMPONENTS_AND_CODE.txt
----------------------------------------------------------------------------------------------------
Location: CODE_DOCUMENTATION/PART_3_FRONTEND_COMPONENTS_AND_CODE.txt

Topics Covered:
  - Entry Point & State Shell:
    * index.html, main.jsx, App.jsx (React 19, React Router v7, lazy loading)
    * Styling: index.css, App.css, Tailwind CSS v4, cyber-aerospace tokens
    * State Contexts: AuthContext, SatelliteContext, ThemeContext
  - Services Layer:
    * apiClient.js (Axios instance, Bearer token interceptor)
    * All 12 specialized service modules
  - Layout & Navigation:
    * DashboardLayout, DashboardSidebar, DashboardHeader, ProtectedRoute, ErrorBoundary
  - 3D Orbital Viewer & Shaders:
    * Earth.jsx, Scene.jsx, earthShaders.js (Dynamic night/day GLSL shaders)
    * OrbitalViewer.jsx (Keplerian orbits, ground stations, communication arcs)
    * utils/orbitalMath.js (Keplerian physics & coordinate transformation math)
  - 3D CubeSat Design Studio & Simulation:
    * CubeSatStudio.jsx & CubeSatCanvas.jsx (CAD assembly mode, exploded view, validation laser)
    * cubesatComponents.js (Avionics, Power, Comms, ADCS, Payload catalog)
    * Procedural 3D Mesh Builders (buildChassisFrame.js, buildComponentMesh.js, etc.)
    * Real-Time Physics Budgeting Engine (Mass, Volume, Power W, Eclipse Runtime, BOM cost)
    * CubeSatSimulator.jsx & CubeSatSimulationCanvas.jsx (Real-time orbital flight mode)
  - Operational Mission Control Pages:
    * Dashboard.jsx, SatelliteFleet.jsx, SatelliteDetail.jsx, MissionFleet.jsx, MissionDetail.jsx
    * Communications.jsx (Encrypted terminal, signal strength gauge, SNR)
    * GroundStations.jsx (Antenna coverage, frequency sweeps, pass countdown)
    * TelemetryAnalytics.jsx, FleetAnalytics.jsx, Reports.jsx (Recharts analytics)
  - Incident Management & AI Copilot:
    * AlertsIncidents.jsx, AnomalyInjectorDrawer.jsx (15+ aerospace failure mode injector)
    * AutonomousAiSolverModal.jsx & AiDiagnosisCard.jsx (Root-cause analysis & 1-click telecommand)
    * data/satelliteAnomalyCatalog.js
    * NotificationCenter.jsx
  - Admin Hub & System Settings:
    * AdminDashboard.jsx, UserManagement.jsx (RBAC privilege elevation)
    * Profile.jsx, Preferences.jsx, Diagnostics.jsx (MongoDB & WebSocket latency metrics)
