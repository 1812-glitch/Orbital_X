# OrbitalX — Mid-2 Project Presentation Content

> **Format Reference**: Structured in exact alignment with `PlaceMe_Mid2_Presentation_V2.pptx`.  
> **Target Length**: 12 Presentation Slides (fits the 10–15 slide academic presentation standard).  
> **Audience**: Technical Evaluators, Project Guides, and Academic Mentors.

---

## SLIDE 1: TITLE SLIDE

**OrbitalX**  
**Autonomous Satellite Ground Segment & Mission Operations Control System**  
**Mid-2 Project Presentation**  

**Presented by:**  
- Harsh Rathod – [Enrollment / Roll No.]  
- [Team Member Name] – [Enrollment / Roll No.]  

**Guided By:**  
- Prof. Prashant B. Swadas  
- Dr. Udesang K. Jaliya  
- Dr. Hemant D. Vasava  

**4CP31 – Project 1 • Computer Engineering Department • Birla Vishvakarma Mahavidyalaya (BVM Engineering College)**  

---

## SLIDE 2: PROJECT OVERVIEW

**A complete satellite ground operations platform connecting flight directors, ground operators, and orbital assets**

### FOR FLIGHT OPERATORS
**1. Mission Control & Fleet Portal**  
▪ Real-time tracking of satellite constellations across LEO, MEO, and GEO orbits  
▪ Subsystem telemetry health matrix for EPS, ADCS, COMMS, TCS, and OBC  
▪ Interactive 3D Earth globe with live orbital tracks and ground station footprints  
▪ 1-click telecommand execution pipeline with strict role-based execution clearance  
▪ Real-time anomaly alerts with instant aerospace flight-rule resolution  

### AI & 3D SIMULATION
**2. Aerospace AI & 3D Studio**  
▪ Custom Gaussian Naive Bayes AI diagnostic service across 16 telemetry channels  
▪ Autonomous root-cause triage classifying space anomalies (radiation, tumble, brownout)  
▪ Automated aerospace recovery telecommand recommendations (NASA/ECSS flight rules)  
▪ Interactive 3D CubeSat CAD Studio for 1U–16U modular spacecraft design  
▪ Real-time physics budgeting (mass, volume, power balance, solar generation, BOM cost)  

### FOR GROUND STATIONS & ADMIN
**3. Ground Segment & Administration**  
▪ Global ground station tracking with automated pass countdowns (AOS to LOS)  
▪ Dynamic RF link budget calculation (UHF, S-Band, X-Band frequencies)  
▪ High-throughput data downlinks and payload flash memory buffer flushing  
▪ Immutable compliance audit ledger capturing operator ID, command opcode, and IP  
▪ Node health metrics, system diagnostics, and operator role management (RBAC)  

**Tech Stack**: React 19 + Three.js / WebGL + Vite (Frontend) • Node.js 20 + Express 5 (REST APIs) • MongoDB Atlas + In-Memory Fallback (Database) • Python 3 + Gaussian Naive Bayes Microservice (AI Service) • Docker & Nginx (DevOps)  
**Key Advantage**: Replaces fragmented satellite tools, offline telemetry scripts, and unverified commands with one unified, fail-safe mission operations platform.

---

## SLIDE 3: PHYSICS-BASED ORBITAL PROPAGATION & GROUND TRACKS

**Eliminating static mockups by calculating real Keplerian orbital mechanics and planetary dynamics**

### STEP 1: ORBITAL STATE CALCULATION
**1. True Keplerian Dynamics**  
▪ Background service computes continuous Keplerian motion on fixed orbital planes  
▪ Simulates genuine orbital altitude regimes: LEO (550 km), MEO (20,200 km), GEO (35,786 km)  
▪ Dynamically calculates orbital velocities (e.g., 7.6 km/s for LEO with ~95 min period)  
▪ Computes true satellite inclination, argument of latitude, and orbital phase angles  
▪ Background physics loop runs continuously at 10-second synchronized intervals  

### STEP 2: SIDEREAL EARTH ROTATION
**2. Planetary Ground Track Mapping**  
▪ Accounts for Earth's 24-hour sidereal rotation relative to inertial orbital planes  
▪ Calculates precise latitude, longitude, and sub-satellite nadir vectors  
▪ Traces sinusoidal ground tracks across 2D Mercator projections and 3D globe  
▪ Models day/night solar illumination cycles using custom GLSL terminator shaders  
▪ Detects orbital eclipse transitions where solar panel generation drops to zero  

### STEP 3: PERSISTENCE & SSoT
**3. Single Source of Truth for Fleet**  
▪ Persists sliding-window time-series telemetry records directly into MongoDB  
▪ Indexed lookups (`{ satelliteId: 1, timestamp: -1 }`) serve data in < 2ms  
▪ Eliminates client-side desynchronization: all operators see identical coordinates  
▪ Operates autonomously in the background even when no browser clients are logged in  
▪ Feeds real-time coordinates to ground antennas for automated tracking locks  

**What was in Mid-1**: In Mid-1, orbital positions were static placeholder coordinates stored in mock files without orbital mechanics.  
**What we built for Mid-2**: A live, continuous Keplerian orbital propagation engine and GLSL day/night terminator shader accurately modeling real spacecraft motion.

---

## SLIDE 4: AUTONOMOUS AI ANOMALY DIAGNOSTICS & FLIGHT RULES

**Protecting spacecraft from mission-ending failures using intelligent telemetry diagnostics and automated recovery**

### PART 1: 16-CHANNEL TELEMETRY INGEST
**1. Physical Telemetry Ingestion**  
▪ Continuously ingests 16 physical sensor channels from spacecraft buses  
▪ Monitors bus voltages, battery state-of-charge, solar array currents, and bus currents  
▪ Tracks 3-axis gyro body tumble rates, magnetorquer states, and reaction wheel RPM  
▪ Monitors radio RF output power, PA amplifier temperatures, and receiver SNR  
▪ Ingests external space environment indicators: solar particle flux and SAA radiation  

### PART 2: DUAL-ENGINE AI TRIAGE
**2. Custom Machine Learning & Rules**  
▪ Custom Gaussian Naive Bayes Classifier operating in the log-domain probability space  
▪ Fast inference microservice (Port 5050) classifies anomalies in < 15ms  
▪ Recognizes 5 mission-critical failure classes: Battery Brownout, Thermal Runaway, Loss of Detumble Control, RF Degradation, and Solar Array Degradation  
▪ Evaluates aerospace flight rules codified from NASA and ECSS operational standards  
▪ Generates anomaly confidence score, root-cause explanation, and severity ranking  

### PART 3: AUTONOMOUS MITIGATION
**3. 1-Click Telecommand Mitigation**  
▪ Formulates step-by-step actionable recovery procedures for ground operators  
▪ Example: "Throttle RF PA to 1W, enable B-dot detumble damping, shed non-essential payload"  
▪ Operator reviews AI diagnosis and executes recovery telecommands with 1 click  
▪ Telecommands mutate satellite subsystem states immediately via secure REST endpoints  
▪ Closes the operational loop: telemetry anomaly -> AI diagnosis -> validated recovery  

**Dual-Mode Benefit**: If the Python AI service is reachable, operators get deep probabilistic ML triage. If offline, our deterministic flight-rule engine continues zero-interruption diagnostics.  
**Benefit for Operations**: Reduces anomaly triage time from hours of manual telemetry inspection down to seconds, preventing permanent spacecraft loss.

---

## SLIDE 5: 3D CUBESAT DESIGN STUDIO & SIMULATION ENGINE

**Empowering satellite engineers to configure 1U–16U CubeSats and validate physical budgets before launch**

### FEATURE 1: MODULAR CAD STUDIO
**1. 3D Spacecraft Configurator**  
▪ Interactive Three.js WebGL CAD environment supporting 1U, 2U, 3U, 6U, 12U, and 16U  
▪ Comprehensive component library: Avionics/OBC, EPS, Solar Arrays, ADCS, RF Transceivers, and Payloads  
▪ Real-time component mounting, slot allocation, and structural collision detection  
▪ Exploded-view mode inspecting internal chassis stacks and avionics harnesses  
▪ Diagnostic validation laser scan verifying bus wiring and structural integrity  

### FEATURE 2: PHYSICAL BUDGET ENGINE
**2. Real-Time Aerospace Budgeting**  
▪ Live Mass Budget: Calculates total satellite mass against maximum launch vehicle limits  
▪ Live Volume Budget: Monitors internal chassis volume utilization percentage  
▪ Live Power Balance: Calculates solar generation vs subsystem power draw in Watts  
▪ Eclipse Battery Life: Computes battery endurance runtime during deep shadow passes  
▪ Bill of Materials (BOM): Computes total mission procurement cost and payload weight fraction  

### FEATURE 3: LIVE SIMULATION MODE
**3. Orbital Telemetry Simulation**  
▪ 1-click transition from CAD Design Studio into live orbital flight simulation  
▪ Deploys solar panels and UHF antennas in real-time 3D animation  
▪ Visualizes active power consumption and thermal heat dissipation dynamically  
▪ Real-time telecommand actuation: toggling beacon modes or attitude orientations reflects immediately on the 3D model  
▪ Exportable satellite hardware profiles saved directly to the fleet registry database  

**What was in Mid-1**: In Mid-1, satellite configuration was a conceptual idea with no interactive 3D visualization.  
**What we built for Mid-2**: A fully functional, browser-based 3D CubeSat CAD Studio and Real-Time Physics Budgeting Engine with Three.js and custom procedural meshes.

---

## SLIDE 6: GROUND STATION TRACKING & RF COMMUNICATIONS PIPELINE

**Automating satellite pass windows, directional antenna tracking, and scientific payload downlinks**

### STAGE 1: ACQUISITION OF SIGNAL (AOS)
**1. Pass Prediction & AOS**  
▪ System tracks global ground station antennas (Svalbard, Goldstone, Canberra, Madrid, Bangalore)  
▪ Calculates precise antenna look-angles: Azimuth (0°–360°) and Elevation (0°–90°)  
▪ Live countdown clock to next pass window based on orbital ephemeris  
▪ Automated Acquisition of Signal (AOS) trigger when satellite elevation exceeds 10°  

### STAGE 2: LINK BUDGET & RF LOCK
**2. Dynamic Link Budget Analysis**  
▪ Real-time RF signal strength calculation based on slant range and free-space path loss (FSPL)  
▪ Monitors carrier Signal-to-Noise Ratio (SNR) and Bit Error Rate (BER) across UHF/S/X bands  
▪ Automatic doppler frequency shift compensation during rapid satellite approach and departure  
▪ Ground station status visualization with active transmission cones on the 3D globe  

### STAGE 3: DOWNLINK EXECUTION
**3. High-Throughput Data Downlink**  
▪ Operator issues `START_DATA_DOWNLINK` to flush onboard flash memory buffer  
▪ Downlinks scientific payload data and multispectral imagery packets over X-Band  
▪ Live downlink progress monitor tracking packet count, transfer speed, and memory recovery  
▪ Subsystem telemetry captures nominal power amplifier thermal elevation (+5.2°C)  

### STAGE 4: LOSS OF SIGNAL (LOS)
**4. Pass Closure & Telemetry Archival**  
▪ Automated Loss of Signal (LOS) detection as satellite drops below minimum horizon elevation  
▪ Automatically archives pass duration, total bytes received, and communication quality score  
▪ Generates pass execution summary report and updates spacecraft memory buffer state  
▪ Ground station antenna resets to standby coordinates for the next scheduled pass  

**Safe Data Handling**: Strict role clearance (Flight Director clearance required for high-power transmitters and antenna relay switches). Telecommands verify satellite contact before dispatch.  
**Operator Experience**: Operators can monitor active ground tracks and communications links visually on an encrypted terminal interface with real-time pass timelines.

---

## SLIDE 7: MISSION CONTROL CENTER & FLEET DIRECTORY

**Providing complete situational awareness and command authority across active orbital constellations**

### FEATURE 1: FLEET HEALTH MATRIX
**1. Constellation Health Overview**  
▪ Centralized dashboard displaying all active satellites across orbital altitudes  
▪ Subsystem health indicators displaying real-time status (EPS, ADCS, COMMS, TCS, OBC)  
▪ Live battery voltage gauges, thermal indicators, solar array status, and tumbling state  
▪ Instant search and multi-parameter filtering by orbit regime (LEO/MEO/GEO), status, and mission  
▪ Quick-action drawer for immediate telecommand dispatch, orbit focus, or telemetry deep-dive  

### FEATURE 2: MISSION LIFECYCLE MANAGEMENT
**2. Mission Milestones & Phases**  
▪ Tracks mission lifecycle phases: Pre-Launch, LEOP, Commissioning, Routine Operations, Deorbit  
▪ Milestone progress bars tracking key mission objectives and primary science goals  
▪ Links registered satellites and primary ground stations to dedicated mission profiles  
▪ Real-time mission clock (MET - Mission Elapsed Time) and orbit revolution counter  
▪ Comprehensive mission logs preserving full operational history and operator shift notes  

### FEATURE 3: DUAL OPERATIONS VIEW
**3. Role-Tailored Mission Views**  
▪ Clean dual navigation separating Flight Operations from System Administration  
▪ High-contrast dark aerospace UI with cyber-instrumentation HUD styling  
▪ Dynamic floating ground station telemetry monitors that can be moved or minimized  
▪ Optimized for multi-monitor setups with zero-lag SVG/Canvas real-time telemetry gauges  
▪ Seamless switching between fleet aggregate view and single-spacecraft diagnostic view  

**Security**: Enforced through cryptographic JSON Web Tokens (JWT) and Role-Based Access Control (RBAC). Viewers and Analysts cannot transmit live telecommands.  
**Result**: Flight directors and mission controllers maintain complete 360-degree command and situational awareness inside a single browser environment.

---

## SLIDE 8: AUTOMATED ANOMALY ALERTS & INCIDENT ENGINE

**Real-time spacecraft protection through automated threshold detection, fault injection, and push notifications**

### STEP 1: FAULT DETECTION & INJECTION
**1. Trigger Event & Anomaly Ingestion**  
▪ Background telemetry engine continuously checks incoming data against aerospace safety thresholds  
▪ Detects critical breaches: battery brownout (< 30%), PA overheating (> 55°C), or uncontrolled spin (> 15°/s)  
▪ Built-in Fault Injection Suite for operator training: simulates 15+ space emergency scenarios  
▪ Immediately transitions affected satellite status into `DEGRADED` or `CRITICAL` state  

### STEP 2: IN-APP NOTIFICATION BELL
**2. Multi-Channel Alert Dispatch**  
▪ Instantaneous in-app push notification saved to the MongoDB notification ledger  
▪ Navigation header bell displays animated red badge with unread critical incident count  
▪ Audio alarm trigger alerts operators on the mission control floor to urgent incidents  
▪ Clicking any alert instantly focuses the camera on the affected satellite and opens diagnostics  

### STEP 3: FLIGHT-RULE TRIAGE MODAL
**3. Autonomous AI Solver Modal**  
▪ Launches the Autonomous AI Solver Modal displaying root cause and physical parameter analysis  
▪ Evaluates NASA/ECSS aerospace flight rules: highlights affected bus and safety margins  
▪ Formulates verified recovery telecommands (e.g., `CMD_COMMS_SWITCH_ANTENNA_B`, `POINT_NADIR`)  
▪ Prevents catastrophic operator errors by displaying expected subsystem telemetry impacts  

### STEP 4: 1-CLICK MITIGATION & RESOLUTION
**4. Execution & Incident Closure**  
▪ Operator clicks "Execute Recovery Procedure" to transmit authorized telecommands  
▪ Telecommand state progresses through `SENT` -> `PROCESSING` -> `ACKNOWLEDGED`  
▪ System updates anomaly status to `RESOLVED` and logs recovery time into the incident ledger  
▪ Spacecraft returns to nominal operating limits with live telemetry confirmation  

**Problem Solved**: In conventional university projects, alerts are static text banners. OrbitalX provides a closed-loop incident management system combining real-time detection, AI triage, and live command mitigation.  
**Performance**: Asynchronous notification dispatch and non-blocking state updates ensure mission control dashboards remain butter-smooth even during high-frequency incident cascades.

---

## SLIDE 9: DUAL-ENGINE RESILIENT DATABASE ARCHITECTURE

**Guaranteeing zero-downtime mission operations through automated cloud-to-in-memory database failover**

### STEP 1: CLOUD ATLAS WITH DNS HARDENING
**1. Production MongoDB Atlas Cluster**  
▪ Connects to persistent MongoDB Atlas cloud database for multi-user mission persistence  
▪ DNS SRV Resolution Hardening: explicitly configures Google (`8.8.8.8`) and Cloudflare (`1.1.1.1`) upstream resolvers  
▪ Completely resolves Windows network stack DNS SRV lookup failures on university and corporate WiFi  
▪ Non-blocking connection timeout window capped at 5 seconds for rapid health determination  

### STEP 2: AUTOMATIC IN-MEMORY FALLBACK
**2. Zero-Dependency In-Memory Engine**  
▪ If MongoDB Atlas is unreachable or internet is down, system catches error automatically  
▪ Instantiates an internal, standalone `MongoMemoryServer` instance on the fly in < 2 seconds  
▪ Server never terminates or crashes due to database connection failures  
▪ Complete zero-configuration guarantee: runs seamlessly on any presentation laptop offline  
▪ Automated resource hygiene: purges orphaned `mongo-mem-*` temporary directories to prevent disk bloat  

### STEP 3: AUTOMATIC SEEDING & INDEXING
**3. Constellation Seeding & Fast Lookups**  
▪ Autonomous database bootstrapper automatically detects empty collections  
▪ Seeds initial satellite constellations, global ground stations, mission profiles, and admin accounts  
▪ Compound indexing across high-frequency collections:  
  - Telemetry: `{ satelliteId: 1, timestamp: -1 }`  
  - AuditLog: `{ timestamp: -1, role: 1 }`  
  - Alerts: `{ status: 1, severity: 1 }`  
▪ `bufferCommands: false` prevents silent event-loop blocking during temporary database transitions  

**Why This Matters**: Database connection dropouts during academic evaluations or live mentor demonstrations are completely eliminated. The project is 100% immune to network outages.  
**Quality Control**: The platform seamlessly switches between cloud and local modes while preserving identical Mongoose ODM schemas, validation hooks, and controller interfaces.

---

## SLIDE 10: SYSTEM SECURITY, RBAC & IMMUTABLE AUDIT LEDGER

**Enterprise-grade mission authorization, defense-in-depth, and tamper-proof telecommand accountability**

### PART 1: ROLE-BASED ACCESS CONTROL (RBAC)
**1. 4-Tier Role Hierarchy**  
▪ `ADMIN`: Full system authority, user provisioning, node health diagnostics, and system settings  
▪ `OPERATOR`: Spacecraft command authority, telecommand dispatch, pass scheduling, and alert triage  
▪ `ANALYST`: Telemetry exploration, orbital analytics, report generation, and data export  
▪ `VIEWER`: Read-only situational awareness for public dashboards and visitors  
▪ Express middleware (`requireAuth` & `requireRole`) guards all sensitive API endpoints  

### PART 2: DEFENSE-IN-DEPTH SECURITY
**2. Cryptographic API Protection**  
▪ Stateless JSON Web Tokens (JWT) signed with HMAC-SHA256, verified on every HTTP transaction  
▪ Bcrypt password hashing (salt rounds: 10) safeguarding all stored operator credentials  
▪ HTTP Security Headers via **Helmet**: CSP policies, HSTS enforcement, and X-Frame-Options clickjacking protection  
▪ Payload Compression (Gzip/Brotli) reducing network payload sizes by up to 70%  
▪ Automated Penetration Test Suite (`tests/securityAudit.js`): 13-stage test validating auth guards, injection defense, and role boundaries  

### PART 3: IMMUTABLE AUDIT LEDGER
**3. Tamper-Proof Command Accountability**  
▪ Every privileged telecommand writes an immutable ledger entry into `AuditLog.js`  
▪ Records exact Operator User ID, target Satellite ID, command opcode, timestamp, and client IP  
▪ Sequence Counter Validation: ensures commands are executed strictly in order, preventing replay attacks  
▪ Audit log query endpoint allowing Flight Directors to inspect chronological operations history  
▪ Non-repudiation: provides complete transparency into who sent which telecommand and when  

**Compliance & Aerospace Standards**: Designed to mirror real-world CCSDS (Consultative Committee for Space Data Systems) telecommand verification standards.  
**Result**: Zero risk of unauthorized commands or unverified operators transmitting commands to simulated orbital assets.

---

## SLIDE 11: PROJECT PROGRESS: MID-1 VS MID-2

**Transitioning from conceptual UML models in Mid-1 to a fully functional, containerized mission operations platform in Mid-2**

### MID-1 MILESTONE (What We Showed in Mid-1)
▪ Existing System Survey & Gap Analysis (NASA Open MCT, GMAT, STK, FreeFlyer, Onshape, SatNOGS)  
▪ Problem statement & 4 planned modules (Mission Mgmt, Satellite Design, Simulation, Mission Ops)  
▪ Complete UML Modeling & System Workflow (Use Case Diagram, Class Diagram, Sequence Diagram)  
▪ Early UI/UX Prototypes & Wireframes (Login UI, Registration UI, and Admin Dashboard UI)  
▪ Initial Database Schemas & Skeleton Models (Draft Mongoose schemas for User, Telemetry & Communication)  

### MID-2 COMPLETED (What We Built for Mid-2 — NEW)
▪ **Physics-Based Keplerian Orbital Engine**: Continuous motion, sidereal rotation & eclipse tracking  
▪ **Custom AI Anomaly Diagnostic Microservice**: Gaussian Naive Bayes + NASA/ECSS flight rules  
▪ **Interactive 3D CubeSat CAD Studio**: 1U–16U chassis, component assembly & real-time budgets  
▪ **Global Ground Station Network**: Azimuth/Elevation tracking, link budgets, and automated passes  
▪ **13 REST API Domain Controllers**: Express 5 architecture with unified `ApiResponse` & `ApiError`  
▪ **Dual-Engine Resilient Database**: Cloud Atlas SRV hardening + zero-config In-Memory fallback  
▪ **Closed-Loop Alert & Telecommand Engine**: Fault injector, push notifications & 1-click mitigation  
▪ **Full Dockerization**: Production multi-container deployment (`docker-compose.yml`) with Nginx  

**Summary**: 100% of the planned theoretical modules from our Mid-1 presentation are now fully implemented, integrated, containerized, and operational.  
**Operational Readiness**: The system is fully capable of running a simulated end-to-end satellite mission from CubeSat CAD configuration to orbital tracking and autonomous anomaly resolution.

---

## SLIDE 12: THANK YOU & DISCUSSION

**OrbitalX**  
**Autonomous Satellite Ground Segment & Mission Operations Control System**  

### Questions & Technical Discussion

**Presented by:**  
- Harsh Rathod – [Enrollment / Roll No.]  
- [Team Member Name] – [Enrollment / Roll No.]  

**Guided By:**  
- Prof. Prashant B. Swadas  
- Dr. Udesang K. Jaliya  
- Dr. Hemant D. Vasava  

**Computer Engineering Department • Birla Vishvakarma Mahavidyalaya (BVM Engineering College)**  

---
