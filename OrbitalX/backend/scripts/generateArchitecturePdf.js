const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>OrbitalX - Full Backend Architecture Specification & Mentor Defense Dossier</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

    @page {
      size: A4 portrait;
      margin: 18mm 16mm 18mm 16mm;
      @bottom-right {
        content: "Page " counter(page);
        font-family: 'Inter', sans-serif;
        font-size: 8pt;
        color: #64748B;
      }
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0F172A;
      background-color: #FFFFFF;
      line-height: 1.55;
      font-size: 9.5pt;
      margin: 0;
      padding: 0;
    }

    /* Cover Page */
    .cover-page {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
      padding: 40px 20px 20px 20px;
    }

    .cover-header {
      border-bottom: 2px solid #0284C7;
      padding-bottom: 20px;
    }

    .brand-tag {
      display: inline-block;
      background: linear-gradient(135deg, #0F172A, #1E3E62);
      color: #38BDF8;
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      padding: 5px 12px;
      border-radius: 4px;
      margin-bottom: 16px;
    }

    .cover-title {
      font-size: 28pt;
      font-weight: 800;
      color: #0F172A;
      line-height: 1.15;
      margin: 0 0 10px 0;
      letter-spacing: -0.5px;
    }

    .cover-subtitle {
      font-size: 13pt;
      font-weight: 500;
      color: #475569;
      margin: 0;
      line-height: 1.4;
    }

    .cover-hero-card {
      background: linear-gradient(135deg, #0B192C 0%, #1E3E62 100%);
      color: #FFFFFF;
      padding: 28px;
      border-radius: 12px;
      margin: 30px 0;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.25);
    }

    .cover-hero-card h3 {
      margin: 0 0 12px 0;
      color: #38BDF8;
      font-size: 14pt;
      font-weight: 700;
    }

    .cover-hero-card p {
      margin: 0 0 16px 0;
      color: #E2E8F0;
      font-size: 10pt;
      line-height: 1.6;
    }

    .badge-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.12);
      color: #F8FAFC;
      border: 1px solid rgba(255, 255, 255, 0.2);
      font-size: 8pt;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 999px;
    }

    .badge-accent {
      background: #0284C7;
      color: #FFFFFF;
      border: none;
    }

    .cover-metadata {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      padding-top: 24px;
      border-top: 1px solid #E2E8F0;
    }

    .meta-item {
      font-size: 8.5pt;
    }

    .meta-label {
      color: #64748B;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
      font-size: 7.5pt;
    }

    .meta-value {
      color: #0F172A;
      font-weight: 700;
      font-size: 9.5pt;
    }

    /* Headings & Sections */
    .section-title {
      font-size: 16pt;
      font-weight: 800;
      color: #0F172A;
      margin: 28px 0 14px 0;
      border-bottom: 2px solid #E2E8F0;
      padding-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .section-num {
      background: #0284C7;
      color: #FFFFFF;
      font-size: 10pt;
      font-weight: 800;
      width: 24px;
      height: 24px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
    }

    h2 {
      font-size: 13pt;
      font-weight: 700;
      color: #1E293B;
      margin: 18px 0 8px 0;
    }

    h3 {
      font-size: 10.5pt;
      font-weight: 700;
      color: #334155;
      margin: 12px 0 6px 0;
    }

    p {
      margin: 0 0 10px 0;
      color: #334155;
    }

    /* Callout & Cards */
    .callout {
      background: #F8FAFC;
      border-left: 4px solid #0284C7;
      padding: 12px 16px;
      border-radius: 0 8px 8px 0;
      margin: 14px 0;
      font-size: 9pt;
    }

    .callout-title {
      font-weight: 700;
      color: #0369A1;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .callout-success {
      background: #F0FDF4;
      border-left-color: #16A34A;
    }

    .callout-success .callout-title {
      color: #15803D;
    }

    .callout-warning {
      background: #FFFBEB;
      border-left-color: #D97706;
    }

    .callout-warning .callout-title {
      color: #B45309;
    }

    /* Grid & Flex */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin: 12px 0;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin: 12px 0;
    }

    .feature-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 12px;
      page-break-inside: avoid;
    }

    .feature-card-header {
      font-weight: 700;
      font-size: 9.5pt;
      color: #0F172A;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .feature-card p {
      font-size: 8.5pt;
      color: #475569;
      margin: 0;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 8.5pt;
      page-break-inside: avoid;
    }

    th {
      background: #0F172A;
      color: #FFFFFF;
      font-weight: 600;
      text-align: left;
      padding: 7px 10px;
      font-size: 8pt;
      letter-spacing: 0.3px;
    }

    th:first-child {
      border-top-left-radius: 6px;
    }

    th:last-child {
      border-top-right-radius: 6px;
    }

    td {
      padding: 7px 10px;
      border-bottom: 1px solid #E2E8F0;
      color: #334155;
    }

    tr:nth-child(even) td {
      background-color: #F8FAFC;
    }

    tr:last-child td {
      border-bottom: 2px solid #CBD5E1;
    }

    /* Code Blocks */
    pre, code {
      font-family: 'JetBrains Mono', 'Consolas', monospace;
    }

    code {
      background: #F1F5F9;
      color: #0F172A;
      padding: 2px 5px;
      border-radius: 4px;
      font-size: 8pt;
      font-weight: 500;
    }

    pre {
      background: #0B132B;
      color: #E2E8F0;
      padding: 12px 14px;
      border-radius: 8px;
      font-size: 8pt;
      line-height: 1.45;
      overflow-x: auto;
      margin: 10px 0;
      page-break-inside: avoid;
    }

    .code-tree {
      background: #0B132B;
      color: #38BDF8;
      padding: 14px 16px;
      border-radius: 8px;
      font-size: 7.5pt;
      line-height: 1.35;
      page-break-inside: avoid;
    }

    .tree-folder {
      color: #FBBF24;
      font-weight: 700;
    }

    .tree-file {
      color: #E2E8F0;
    }

    .tree-comment {
      color: #64748B;
      font-style: italic;
    }

    /* Script & Speech Prompts */
    .speech-box {
      background: #FAF5FF;
      border-left: 4px solid #9333EA;
      padding: 12px 16px;
      border-radius: 0 8px 8px 0;
      margin: 14px 0;
      page-break-inside: avoid;
    }

    .speech-box .speech-label {
      font-weight: 700;
      color: #7E22CE;
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }

    .speech-box blockquote {
      margin: 0;
      font-style: italic;
      color: #3B0764;
      font-size: 9pt;
      line-height: 1.6;
    }

    .qa-card {
      background: #FFFFFF;
      border: 1px solid #CBD5E1;
      border-radius: 8px;
      padding: 12px 16px;
      margin: 12px 0;
      page-break-inside: avoid;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .qa-question {
      font-weight: 700;
      color: #0F172A;
      font-size: 9.5pt;
      margin-bottom: 6px;
      display: flex;
      align-items: baseline;
      gap: 8px;
    }

    .qa-badge {
      background: #DC2626;
      color: #FFFFFF;
      font-size: 7pt;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .qa-answer {
      font-size: 8.5pt;
      color: #334155;
      line-height: 1.55;
    }

    .qa-highlight {
      color: #0284C7;
      font-weight: 600;
    }

    /* Page Breaks */
    .page-break {
      page-break-after: always;
    }

    .no-break {
      page-break-inside: avoid;
    }

    ul, ol {
      margin: 0 0 10px 0;
      padding-left: 20px;
    }

    li {
      margin-bottom: 4px;
      color: #334155;
    }
  </style>
</head>
<body>

  <!-- ==================== COVER PAGE ==================== -->
  <div class="cover-page">
    <div class="cover-header">
      <div class="brand-tag">Aerospace Software Architecture</div>
      <h1 class="cover-title">ORBITALX BACKEND</h1>
      <p class="cover-subtitle">Full Architectural Directory Specification & Mentor Defense Strategy Dossier</p>
    </div>

    <div class="cover-hero-card">
      <h3>Mission Operations & Telemetry Control System</h3>
      <p>
        OrbitalX is an enterprise-grade satellite ground segment and mission control backend developed with Node.js and Express 5.
        Designed around a decoupled 4-Tier Layered Architecture, it orchestrates continuous Keplerian orbital dynamics, real-time subsystem telemetry,
        secure CubeSat telecommands, and aerospace flight-rule AI anomaly diagnostics with resilient dual-engine database failover.
      </p>
      <div class="badge-row">
        <span class="badge badge-accent">Node.js 20+</span>
        <span class="badge">Express 5.2</span>
        <span class="badge">MongoDB Atlas / In-Memory Fallback</span>
        <span class="badge">Keplerian Orbital Engine</span>
        <span class="badge">JWT & RBAC Security</span>
        <span class="badge">Aerospace AI Diagnostics</span>
        <span class="badge">CubeSat 1U-16U Pipeline</span>
      </div>
    </div>

    <div class="cover-metadata">
      <div class="meta-item">
        <div class="meta-label">Project</div>
        <div class="meta-value">OrbitalX Space Operations</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Architecture Pattern</div>
        <div class="meta-value">4-Tier Layered MVC / Service</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Target Audience</div>
        <div class="meta-value">Technical Mentors & Evaluators</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Environment</div>
        <div class="meta-value">Production & Zero-Config Dev</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Compliance & Security</div>
        <div class="meta-value">Helmet, RBAC, Audit Logging</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Document Version</div>
        <div class="meta-value">v2.4.0 (Enterprise Release)</div>
      </div>
    </div>
  </div>

  <!-- ==================== SECTION 1: ARCHITECTURAL OVERVIEW ==================== -->
  <div class="section-title">
    <span class="section-num">1</span>
    Architectural Philosophy & High-Level System Design
  </div>

  <p>
    The OrbitalX backend is structured around a <strong>Separation of Concerns (SoC)</strong> paradigm, implementing a battle-tested
    <strong>4-Tier Layered MVC & Domain Service Pattern</strong>. This ensures that network transport mechanisms, business rules,
    data persistence, and mathematical simulation loops remain strictly decoupled.
  </p>

  <div class="grid-2">
    <div class="feature-card">
      <div class="feature-card-header">
        <span>1. Transport & Middleware Tier</span>
        <code>server.js / middleware</code>
      </div>
      <p>
        Handles incoming HTTP ingress, TLS termination headers via <strong>Helmet</strong>, Gzip/Brotli payload compression,
        CORS security enforcement, and token-based authentication (<code>requireAuth</code> & <code>requireRole</code>).
      </p>
    </div>

    <div class="feature-card">
      <div class="feature-card-header">
        <span>2. Routing & Controller Tier</span>
        <code>src/routes & controllers</code>
      </div>
      <p>
        Validates request parameters and delegates execution. Controllers remain clean and declarative by wrapping all asynchronous
        operations inside a centralized <code>asyncHandler</code> and returning standardized <code>ApiResponse</code> envelopes.
      </p>
    </div>

    <div class="feature-card">
      <div class="feature-card-header">
        <span>3. Domain & Simulation Services</span>
        <code>src/services</code>
      </div>
      <p>
        Independent, persistent execution engines that handle continuous Keplerian orbit calculations, stochastic telemetry noise,
        anomaly generation, and aerospace flight-rule diagnostics independent of HTTP request lifecycles.
      </p>
    </div>

    <div class="feature-card">
      <div class="feature-card-header">
        <span>4. Persistence & Data Models</span>
        <code>src/models & config</code>
      </div>
      <p>
        Mongoose Object Data Modeling (ODM) with strongly typed schemas, compound indexing, and a resilient dual-engine database layer
        supporting cloud MongoDB Atlas with seamless zero-dependency In-Memory fallback.
      </p>
    </div>
  </div>

  <div class="callout callout-success">
    <div class="callout-title">Key Architectural Decision for Mentors</div>
    <strong>Why not put telemetry calculations inside the controller?</strong><br/>
    Satellites in orbit continuously generate telemetry regardless of whether an operator is viewing a dashboard. By decoupling the
    <code>telemetrySimulator.js</code> service from the HTTP request cycle, telemetry is continuously updated and indexed into MongoDB
    at 10-second intervals, allowing the API to serve sub-millisecond cached and queried orbital states to thousands of concurrent clients.
  </div>

  <!-- ==================== SECTION 2: DIRECTORY STRUCTURE ==================== -->
  <div class="page-break"></div>

  <div class="section-title">
    <span class="section-num">2</span>
    Complete Backend Directory Tree & Component Mapping
  </div>

  <p>
    The following filesystem tree details the exact physical layout of the <code>OrbitalX/backend</code> repository:
  </p>

  <pre class="code-tree">
backend/
├── <span class="tree-folder">src/</span>
│   ├── <span class="tree-folder">config/</span>
│   │   └── <span class="tree-file">db.js</span>                      <span class="tree-comment"># Dual-Engine MongoDB (Atlas SRV + In-Memory Fallback)</span>
│   ├── <span class="tree-folder">controllers/</span>
│   │   ├── <span class="tree-file">adminController.js</span>          <span class="tree-comment"># System health, metrics & node-level management</span>
│   │   ├── <span class="tree-file">aiController.js</span>             <span class="tree-comment"># Aerospace Flight-Rule AI anomaly triage & recovery</span>
│   │   ├── <span class="tree-file">alertController.js</span>          <span class="tree-comment"># Critical threshold trigger processing & resolution</span>
│   │   ├── <span class="tree-file">analyticsController.js</span>      <span class="tree-comment"># Fleet-wide aggregate telemetry & health scoring</span>
│   │   ├── <span class="tree-file">auditController.js</span>          <span class="tree-comment"># Immutable compliance & security event queries</span>
│   │   ├── <span class="tree-file">authController.js</span>           <span class="tree-comment"># Operator login, registration & JWT issuance</span>
│   │   ├── <span class="tree-file">communicationController.js</span>  <span class="tree-comment"># Uplink/Downlink pass scheduling & RF status</span>
│   │   ├── <span class="tree-file">cubesatCommandController.js</span> <span class="tree-comment"># 1U-16U CubeSat telecommands & state mutations</span>
│   │   ├── <span class="tree-file">groundStationController.js</span>  <span class="tree-comment"># Ground antenna tracking coordinates & coverage</span>
│   │   ├── <span class="tree-file">missionController.js</span>        <span class="tree-comment"># Spacecraft mission phase & objective management</span>
│   │   ├── <span class="tree-file">notificationController.js</span>   <span class="tree-comment"># Real-time operator push notifications</span>
│   │   ├── <span class="tree-file">satelliteController.js</span>      <span class="tree-comment"># Satellite asset registry & orbital parameters</span>
│   │   ├── <span class="tree-file">telemetryController.js</span>      <span class="tree-comment"># Time-series telemetry querying & real-time push</span>
│   │   └── <span class="tree-file">userController.js</span>           <span class="tree-comment"># User profile management & RBAC role assignments</span>
│   ├── <span class="tree-folder">middleware/</span>
│   │   ├── <span class="tree-file">auth.js</span>                     <span class="tree-comment"># JWT Bearer verification & Role-Based Access Control (RBAC)</span>
│   │   └── <span class="tree-file">errorHandler.js</span>             <span class="tree-comment"># Centralized unhandled error & ApiError interceptor</span>
│   ├── <span class="tree-folder">models/</span>
│   │   ├── <span class="tree-file">Alert.js</span>                    <span class="tree-comment"># Spacecraft threshold alerts & anomaly schema</span>
│   │   ├── <span class="tree-file">AuditLog.js</span>                 <span class="tree-comment"># Immutable user actions, telecommand timestamps & IPs</span>
│   │   ├── <span class="tree-file">Command.js</span>                  <span class="tree-comment"># Telecommand states (SENT, PROCESSING, ACKNOWLEDGED)</span>
│   │   ├── <span class="tree-file">Communication.js</span>            <span class="tree-comment"># Ground pass communications & signal budgets</span>
│   │   ├── <span class="tree-file">GroundStation.js</span>            <span class="tree-comment"># Earth antenna locations, azimuth/elevation limits</span>
│   │   ├── <span class="tree-file">Mission.js</span>                  <span class="tree-comment"># Active space mission metadata & milestone tracking</span>
│   │   ├── <span class="tree-file">Notification.js</span>             <span class="tree-comment"># Operator system notifications and priority flags</span>
│   │   ├── <span class="tree-file">Satellite.js</span>                <span class="tree-comment"># Satellite hardware profile, NORAD ID & orbit model</span>
│   │   ├── <span class="tree-file">Telemetry.js</span>                <span class="tree-comment"># High-frequency time-series telemetry metrics</span>
│   │   └── <span class="tree-file">User.js</span>                     <span class="tree-comment"># Operator accounts, bcrypt password hashes & roles</span>
│   ├── <span class="tree-folder">routes/</span>                         <span class="tree-comment"># 13 REST API endpoints corresponding to controllers</span>
│   ├── <span class="tree-folder">services/</span>
│   │   ├── <span class="tree-file">telemetrySimulator.js</span>       <span class="tree-comment"># Physics-based orbital motion & anomaly generator</span>
│   │   └── <span class="tree-file">auditService.js</span>             <span class="tree-comment"># Asynchronous audit log persistence helper</span>
│   ├── <span class="tree-folder">utils/</span>
│   │   ├── <span class="tree-file">ApiError.js</span>                 <span class="tree-comment"># Operational error class with HTTP status codes</span>
│   │   ├── <span class="tree-file">ApiResponse.js</span>              <span class="tree-comment"># Standardized JSON response envelope</span>
│   │   ├── <span class="tree-file">asyncHandler.js</span>             <span class="tree-comment"># Promise wrapper eliminating try-catch boilerplate</span>
│   │   ├── <span class="tree-file">cubeSatInitialStates.js</span>     <span class="tree-comment"># Baseline bus, power, and thermal configurations</span>
│   │   ├── <span class="tree-file">password.js</span>                 <span class="tree-comment"># Bcrypt hashing and validation utilities</span>
│   │   ├── <span class="tree-file">seedData.js</span>                 <span class="tree-comment"># Automatic initialization of satellites, stations & admin</span>
│   │   └── <span class="tree-file">token.js</span>                    <span class="tree-comment"># JWT token signing and verification helper</span>
│   └── <span class="tree-folder">scripts/</span>
│       └── <span class="tree-file">clearData.js</span>                <span class="tree-comment"># Database wiping & sanitization maintenance script</span>
├── <span class="tree-folder">tests/</span>
│   └── <span class="tree-file">securityAudit.js</span>            <span class="tree-comment"># Automated penetration test & authentication security suite</span>
├── <span class="tree-file">server.js</span>                           <span class="tree-comment"># Application entry point, HTTP server bootstrap & DB wiring</span>
├── <span class="tree-file">package.json</span>                        <span class="tree-comment"># Dependency manifest, scripts, and runtime configuration</span>
├── <span class="tree-file">Dockerfile</span>                          <span class="tree-comment"># Multi-stage production container image specification</span>
├── <span class="tree-file">docker-compose.yml</span>                  <span class="tree-comment"># Container orchestration with MongoDB & networks</span>
├── <span class="tree-file">.env / .env.example</span>                 <span class="tree-comment"># Environment configuration (Port, JWT secret, MongoDB URI)</span>
└── <span class="tree-file">.gitignore / .dockerignore</span>          <span class="tree-comment"># Build exclusion and repository hygiene rules</span>
</pre>

  <!-- ==================== SECTION 3: SUBSYSTEM DEEP DIVE ==================== -->
  <div class="page-break"></div>

  <div class="section-title">
    <span class="section-num">3</span>
    Deep-Dive: 4 High-Value Engineering Feats
  </div>

  <h2>1. Dual-Engine Resilient Database Architecture (<code>src/config/db.js</code>)</h2>
  <p>
    One of the most frequent friction points in aerospace and distributed software evaluation is database unavailability.
    OrbitalX implements a <strong>zero-failure database strategy</strong>:
  </p>
  <ul>
    <li><strong>DNS SRV Resolution Hardening:</strong> Configures Google (<code>8.8.8.8</code>) and Cloudflare (<code>1.1.1.1</code>) upstream DNS servers to prevent Windows network stack resolution failures on Atlas connection strings.</li>
    <li><strong>Automatic Dynamic In-Memory Failover:</strong> If the cloud MongoDB Atlas URI fails to connect within a 5-second timeout, the system seamlessly spins up a local <code>MongoMemoryServer</code> instance without terminating the server.</li>
    <li><strong>Buffer Command Safety:</strong> <code>mongoose.set('bufferCommands', false)</code> prevents silent thread-blocking when the database is temporarily unreachable.</li>
    <li><strong>Resource Hygiene:</strong> Automatically purges orphaned <code>mongo-mem-*</code> directories in the OS temporary directory on startup and teardown to prevent disk exhaustion.</li>
  </ul>

  <h2>2. Physics-Based Keplerian Orbital Telemetry Engine (<code>src/services/telemetrySimulator.js</code>)</h2>
  <p>
    Instead of broadcasting static mock data, OrbitalX runs a high-fidelity continuous orbital mechanics loop:
  </p>
  <pre>
// Continuous Keplerian orbital motion along fixed orbital plane
const nowSec = Date.now() / 1000;
const incRad = (sat.inclination || 51.6) * (Math.PI / 180);
const periodSec = isLEO ? 5700 : isMEO ? 43200 : 86400; // 95 min for LEO
const meanMotion = (2 * Math.PI) / periodSec;
const u = (nowSec * meanMotion + phaseOffset) % (2 * Math.PI); // Orbital position
const sinLat = Math.sin(incRad) * Math.sin(u);
const simLat = (Math.asin(Math.max(-1, Math.min(1, sinLat))) * (180 / Math.PI));
  </pre>
  <ul>
    <li>Accurately calculates satellite Latitude and Longitude by accounting for <strong>Earth's 24-hour sidereal rotation</strong>.</li>
    <li>Simulates real orbital altitude classes: <strong>LEO (550 km, 7.6 km/s)</strong>, <strong>MEO (20,200 km, 3.88 km/s)</strong>, and <strong>GEO (35,786 km, 3.07 km/s)</strong>.</li>
    <li>Features a stochastic 5% anomaly injection module that simulates realistic space environmental degradation (solar array shading, battery brownout, and thermal spikes), instantly broadcasting alerts.</li>
  </ul>

  <h2>3. Autonomous Aerospace Flight-Rules AI Diagnostics (<code>src/controllers/aiController.js</code>)</h2>
  <p>
    Integrates an aerospace flight-rule knowledge base covering six critical satellite subsystems:
  </p>
  <ul>
    <li><strong>EPS (Electrical Power):</strong> Load shedding, bus switching, and battery trickle commands.</li>
    <li><strong>ADCS (Attitude Control):</strong> B-dot magnetic detumble damping, wheel despin, and safe sun pointing.</li>
    <li><strong>COMMS (Communications & RF):</strong> Power amplifier throttling to 250mW, backup antenna switching, and beacon recovery.</li>
    <li><strong>TCS (Thermal Control):</strong> Attitude thermal rolls and survival heater override circuits.</li>
    <li><strong>OBC (On-Board Computer):</strong> MRAM golden partition reboots and hung I2C bus clearing pulses.</li>
  </ul>

  <h2>4. CubeSat 1U-16U Telecommand & Audit Lifecycle (<code>src/controllers/cubesatCommandController.js</code>)</h2>
  <p>
    Commands follow a strict finite-state machine (<code>SENT</code> &rarr; <code>PROCESSING</code> &rarr; <code>ACKNOWLEDGED</code> / <code>FAILED</code>).
    Every single command execution writes an immutable record to <code>AuditLog.js</code> capturing the Operator User ID, satellite ID, client IP address, and payload parameters.
  </p>

  <!-- ==================== SECTION 4: REQUEST LIFECYCLE ==================== -->
  <div class="page-break"></div>

  <div class="section-title">
    <span class="section-num">4</span>
    End-to-End Request-Response Lifecycle Trace
  </div>

  <p>
    To demonstrate architectural mastery to your mentor, trace a high-security action such as dispatching a telecommand to a CubeSat:
    <code>POST /api/telemetry/cubesat/command</code>.
  </p>

  <table>
    <thead>
      <tr>
        <th style="width: 15%;">Stage</th>
        <th style="width: 25%;">Layer / File</th>
        <th style="width: 60%;">Action Performed</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>1. Ingress & TLS</strong></td>
        <td><code>server.js</code></td>
        <td><strong>Helmet</strong> injects CSP, X-Frame-Options, and HSTS headers. <strong>Compression</strong> activates Gzip/Brotli. Body parser extracts JSON with a 10MB safety limit.</td>
      </tr>
      <tr>
        <td><strong>2. Authentication</strong></td>
        <td><code>src/middleware/auth.js</code><br/>(<code>requireAuth</code>)</td>
        <td>Extracts the <code>Authorization: Bearer &lt;token&gt;</code> header. Verifies cryptographic signature via <code>jwt.verify()</code>. Queries <code>User.findById()</code> and attaches the sanitized operator object to <code>req.user</code>.</td>
      </tr>
      <tr>
        <td><strong>3. Authorization</strong></td>
        <td><code>src/middleware/auth.js</code><br/>(<code>requireRole</code>)</td>
        <td>Inspects <code>req.user.role</code> against allowed roles (<code>['OPERATOR', 'ADMIN']</code>). If a viewer tries to issue a command, returns an immediate <code>403 Forbidden</code> via <code>ApiError</code>.</td>
      </tr>
      <tr>
        <td><strong>4. Route Dispatch</strong></td>
        <td><code>src/routes/telemetryRoutes.js</code></td>
        <td>Matches endpoint pattern and invokes <code>cubesatCommandController.sendCubeSatCommand</code> wrapped in <code>asyncHandler</code>.</td>
      </tr>
      <tr>
        <td><strong>5. Business Logic</strong></td>
        <td><code>src/controllers/cubesatCommandController.js</code></td>
        <td>Validates target satellite exists. Increments the sequential telecommand counter (<code>commandSequenceCounter++</code>). Mutates the in-memory or persisted subsystem state (e.g. switches attitude mode or toggles solar arrays).</td>
      </tr>
      <tr>
        <td><strong>6. Audit Trail</strong></td>
        <td><code>src/models/AuditLog.js</code> & <code>Notification.js</code></td>
        <td>Asynchronously writes an immutable audit log entry containing the operator ID, target satellite, command name, and client IP address. Dispatches an in-app notification to the operations room.</td>
      </tr>
      <tr>
        <td><strong>7. Standard Envelope</strong></td>
        <td><code>src/utils/ApiResponse.js</code></td>
        <td>Constructs an RFC-compliant response object: <code>{ statusCode: 200, data: {...}, message: "Telecommand executed successfully", success: true }</code>.</td>
      </tr>
      <tr>
        <td><strong>8. Fault Interception</strong></td>
        <td><code>src/middleware/errorHandler.js</code></td>
        <td>If any promise rejects at any point, execution immediately jumps to the centralized error handler, preventing server crashes and returning safe JSON without exposing stack traces in production.</td>
      </tr>
    </tbody>
  </table>

  <!-- ==================== SECTION 5: MENTOR PRESENTATION SCRIPT ==================== -->
  <div class="page-break"></div>

  <div class="section-title">
    <span class="section-num">5</span>
    How to Explain It to Your Mentor (Step-by-Step Script)
  </div>

  <p>
    When presenting this backend to your mentor, your goal is to demonstrate <strong>architectural maturity</strong>,
    <strong>defensive engineering</strong>, and <strong>domain-specific knowledge</strong>. Use the scripts below verbatim.
  </p>

  <div class="speech-box">
    <div class="speech-label">Step 1: The 60-Second Executive Pitch (Start with this)</div>
    <blockquote>
      "Good morning/afternoon, Sir/Ma'am. OrbitalX is a mission control backend built for satellite ground operations and telemetry telemetry processing.
      Instead of building a simple CRUD application, I designed this backend using an enterprise 4-Tier Layered MVC and Service Architecture.
      <br/><br/>
      It decouples network transport from business logic, features an autonomous Keplerian orbital mechanics simulation engine that runs in the background,
      implements aerospace flight-rule AI diagnostics for satellite subsystem failures, and guarantees zero-downtime development through an automated
      dual-engine database failover between MongoDB Atlas and an In-Memory MongoDB engine. Every privileged command is strictly enforced through JWT
      Role-Based Access Control and tracked in an immutable audit trail."
    </blockquote>
  </div>

  <div class="speech-box">
    <div class="speech-label">Step 2: Explaining the Folder Structure (Open VS Code Tree)</div>
    <blockquote>
      "Let me walk you through our folder hierarchy, which follows strict Separation of Concerns:
      <br/><br/>
      • <strong>src/config/db.js</strong>: Connects to MongoDB Atlas, but if external DNS or network fails, it automatically instantiates an In-Memory MongoDB server on the fly so the platform never fails to boot.<br/>
      • <strong>src/routes/ & controllers/</strong>: We maintain 13 dedicated domains—such as Satellites, Telemetry, CubeSat Commands, and AI. Every controller method is wrapped in a custom <code>asyncHandler</code>, eliminating redundant try-catch blocks.<br/>
      • <strong>src/services/telemetrySimulator.js</strong>: This is our background physics engine. Every 10 seconds, it calculates true Keplerian orbital positions, Earth sidereal rotation, and subsystem temperatures, while injecting realistic anomalies.<br/>
      • <strong>src/middleware/</strong>: Provides defense-in-depth with Helmet headers, Gzip compression, and role-based guards (<code>requireRole</code>).<br/>
      • <strong>src/models/</strong>: 10 strongly typed Mongoose schemas indexed for high-frequency telemetry lookups."
    </blockquote>
  </div>

  <div class="speech-box">
    <div class="speech-label">Step 3: The 3 Technical Innovations to Highlight</div>
    <blockquote>
      "Three specific engineering highlights distinguish this codebase from standard web backends:
      <br/><br/>
      1. <strong>Resilience Engineering:</strong> We solved the classic 'MongoDB Atlas connection timeout' problem by implementing dual-mode connectivity with Google and Cloudflare DNS fallbacks.<br/>
      2. <strong>Autonomous AI Diagnostics:</strong> In <code>aiController.js</code>, we encoded real aerospace flight rules for EPS, ADCS, and COMMS subsystems so the system can autonomously recommend step-by-step telecommands to recover a tumbling or overheated satellite.<br/>
      3. <strong>Defensive Telecommand Pipeline:</strong> CubeSat commands are stateful, sequence-counted, and immutably logged into <code>AuditLog</code> with operator identity and IP address for compliance."
    </blockquote>
  </div>

  <!-- ==================== SECTION 6: TOUGH QUESTIONS & DEFENSE ==================== -->
  <div class="page-break"></div>

  <div class="section-title">
    <span class="section-num">6</span>
    Mentor Defense: 8 Tough Questions & Verbatim Answers
  </div>

  <div class="qa-card">
    <div class="qa-question">
      <span class="qa-badge">Q1</span>
      Why did you choose Express 5 and Node.js instead of NestJS or Python/FastAPI?
    </div>
    <div class="qa-answer">
      "Express 5 provides native asynchronous error handling without the framework overhead or heavy reflection metadata of NestJS.
      Node.js's event loop and non-blocking I/O make it exceptionally suited for high-frequency concurrent telemetry data streams and
      asynchronous I/O. For heavy numerical orbital propagation, we kept the mathematical calculations lightweight and event-loop friendly,
      with clean service boundaries so that high-compute orbital ephemeris can be offloaded to a dedicated Python or WebAssembly microservice if required."
    </div>
  </div>

  <div class="qa-card">
    <div class="qa-question">
      <span class="qa-badge">Q2</span>
      Why is the telemetry simulation in a background service instead of generated on the frontend?
    </div>
    <div class="qa-answer">
      "In real aerospace operations, satellites broadcast telemetry to ground stations regardless of whether any human operator is logged into a dashboard.
      If the simulation ran on the client browser, two operators viewing the same satellite would see conflicting coordinates and desynchronized telemetry.
      By anchoring the telemetry simulator in <code>src/services/telemetrySimulator.js</code>, our backend acts as the single source of truth (SSoT),
      persisting time-series telemetry records in MongoDB that any client can query."
    </div>
  </div>

  <div class="qa-card">
    <div class="qa-question">
      <span class="qa-badge">Q3</span>
      How do you ensure data consistency and prevent server crashes when errors happen?
    </div>
    <div class="qa-answer">
      "We implement a three-layer defense: First, our custom <code>asyncHandler</code> wraps every asynchronous controller route and forwards uncaught
      exceptions directly to Express's <code>next(err)</code>. Second, our centralized <code>errorHandler.js</code> formats errors into a predictable
      JSON envelope while hiding internal stack traces in production. Third, critical operational errors are codified using our custom <code>ApiError</code>
      class with explicit HTTP status codes."
    </div>
  </div>

  <div class="qa-card">
    <div class="qa-question">
      <span class="qa-badge">Q4</span>
      What is your security posture against unauthorized telecommands?
    </div>
    <div class="qa-answer">
      "We practice <strong>Defense-in-Depth</strong>:
      1. <strong>Network layer:</strong> Helmet enforces HTTP security headers, and strict CORS configuration allows only whitelisted frontend origins.
      2. <strong>Identity layer:</strong> Stateless JWT tokens signed with HMAC-SHA256 require verification on every request.
      3. <strong>Access Control:</strong> Granular RBAC (<code>requireRole('OPERATOR', 'ADMIN')</code>) prevents standard Viewers from issuing telecommands.
      4. <strong>Accountability:</strong> Every command execution immediately writes an immutable entry into <code>AuditLog</code> with the operator's User ID, timestamp, and client IP address."
    </div>
  </div>

  <div class="qa-card">
    <div class="qa-question">
      <span class="qa-badge">Q5</span>
      How would this architecture scale if you deployed 10,000 satellites?
    </div>
    <div class="qa-answer">
      "Because the Express application tier is completely stateless, we can horizontally scale the Node.js API processes behind an Nginx or AWS ALB reverse proxy.
      For the high-frequency telemetry ingest, we would introduce a distributed message queue like Apache Kafka or Redis Streams between the telemetry receiver and
      MongoDB, and partition our MongoDB telemetry collection using time-series collections or sharding on <code>{ satelliteId: 1, timestamp: -1 }</code>, which is already indexed in our schema."
    </div>
  </div>

  <div class="qa-card">
    <div class="qa-question">
      <span class="qa-badge">Q6</span>
      Why do you have both Controllers and Services? What is the architectural distinction?
    </div>
    <div class="qa-answer">
      "<strong>Controllers</strong> are responsible for HTTP transport concerns—parsing query parameters, reading request headers, and sending the formatted HTTP response.
      <strong>Services</strong> encapsulate pure business logic and operational processes that are protocol-agnostic. For instance, <code>telemetrySimulator.js</code> runs on an internal timer loop without any knowledge of HTTP requests, and <code>auditService.js</code> handles compliance logging that can be invoked by controllers, cron tasks, or external queues."
    </div>
  </div>

  <!-- ==================== SECTION 7: SUMMARY & CHECKLIST ==================== -->
  <div class="page-break"></div>

  <div class="section-title">
    <span class="section-num">7</span>
    Mentor Presentation Checklist & Key Metrics
  </div>

  <div class="grid-2">
    <div class="feature-card">
      <div class="feature-card-header">
        <span>Demonstration Checklist</span>
        <span class="badge badge-accent">Live Demo</span>
      </div>
      <ul style="font-size: 8.5pt; padding-left: 16px;">
        <li>Show terminal booting with <code>npm run dev</code></li>
        <li>Point out the DB connection log (Atlas or In-Memory fallback)</li>
        <li>Show the automated <code>seedData()</code> population</li>
        <li>Demonstrate <code>telemetrySimulator</code> logging 10s cycles</li>
        <li>Open <code>src/config/db.js</code> to show resilience design</li>
        <li>Open <code>src/controllers/aiController.js</code> to show flight rules</li>
        <li>Open <code>src/middleware/auth.js</code> to show RBAC enforcement</li>
      </ul>
    </div>

    <div class="feature-card">
      <div class="feature-card-header">
        <span>Key Metrics to Quote</span>
        <span class="badge badge-accent">Architecture</span>
      </div>
      <ul style="font-size: 8.5pt; padding-left: 16px;">
        <li><strong>Architecture:</strong> 4-Tier Layered MVC + Domain Service</li>
        <li><strong>Route Domains:</strong> 13 dedicated API endpoints</li>
        <li><strong>Controllers:</strong> 14 business controllers</li>
        <li><strong>Models:</strong> 10 indexed Mongoose schemas</li>
        <li><strong>Physics Engine:</strong> Keplerian LEO/MEO/GEO calculations</li>
        <li><strong>Security:</strong> JWT, Helmet, bcrypt, Audit Trail</li>
        <li><strong>Database Strategy:</strong> Dual-Engine failover in &lt;5s</li>
      </ul>
    </div>
  </div>

  <div class="callout callout-warning">
    <div class="callout-title">Golden Advice for Mentor Evaluation</div>
    Always steer the conversation toward <strong>resilience</strong> and <strong>separation of concerns</strong>. Mentors respect candidates who understand
    <em>why</em> a certain design pattern was chosen, how it handles edge cases (like network drops or unauthorized commands), and how it scales to production.
  </div>

  <div style="text-align: center; margin-top: 40px; border-top: 1px solid #E2E8F0; padding-top: 20px; font-size: 8pt; color: #64748B;">
    OrbitalX Mission Operations Backend &bull; Official Engineering Architecture & Mentor Defense Specification &bull; Confidential &bull; Version 2.4.0
  </div>

</body>
</html>
`;

// Target paths
const backendDir = 'c:\\\\Users\\\\RH364\\\\OneDrive\\\\Desktop\\\\orbital desktop\\\\OrbitalX\\\\backend';
const parentDir = 'c:\\\\Users\\\\RH364\\\\OneDrive\\\\Desktop\\\\orbital desktop\\\\OrbitalX';

const htmlPath = path.join(backendDir, 'OrbitalX_Backend_Architecture_and_Mentor_Guide.html');
const pdfBackendPath = path.join(backendDir, 'OrbitalX_Backend_Architecture_and_Mentor_Guide.pdf');
const pdfParentPath = path.join(parentDir, 'OrbitalX_Backend_Architecture_and_Mentor_Guide.pdf');

fs.writeFileSync(htmlPath, htmlContent, 'utf8');
console.log('[HTML Generator] Successfully wrote HTML to:', htmlPath);

const edgeExecutable = "C:\\\\Program Files (x86)\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe";

if (!fs.existsSync(edgeExecutable)) {
  console.error('[Error] Microsoft Edge executable not found at:', edgeExecutable);
  process.exit(1);
}

const printCmd = `"${edgeExecutable}" --headless=new --disable-gpu --run-all-compositor-stages-before-draw --no-pdf-header-footer --print-to-pdf="${pdfBackendPath}" "file:///${htmlPath.replace(/\\/g, '/')}"`;

console.log('[PDF Generator] Executing Edge headless print to PDF...');
try {
  execSync(printCmd, { stdio: 'inherit' });
  console.log('[PDF Generator] SUCCESS! Created PDF at:', pdfBackendPath);

  // Copy to parent OrbitalX folder for convenience
  fs.copyFileSync(pdfBackendPath, pdfParentPath);
  console.log('[PDF Generator] Copied backup PDF to:', pdfParentPath);
} catch (err) {
  console.error('[PDF Generator] Error running print command:', err);
  process.exit(1);
}
