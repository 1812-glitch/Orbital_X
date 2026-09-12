# 📊 OrbitalX — Complete Database Tables & UI Grids Reference

This document provides a technical specification of **all 10 backend database collections (tables)** and **all 10 frontend interactive data tables and grids** implemented in the OrbitalX Spacecraft Fleet Management & 3D CubeSat Design System.

---

## 🗄️ PART 1: Backend MongoDB Database Collections (Tables)

OrbitalX uses Mongoose on Node.js/Express with automatic failover to an In-Memory MongoDB Server.

### 1. `users` Collection
- **Model File**: [`OrbitalX/backend/src/models/User.js`](file:///c:/Users/RH364/OneDrive/Desktop/orbital%20desktop/OrbitalX/backend/src/models/User.js)
- **Description**: Stores controller accounts, flight director credentials, security roles, and activity tracking.
- **Schema Fields**:
  | Field | Type | Required | Constraints / Default | Description |
  | :--- | :--- | :---: | :--- | :--- |
  | `_id` | `ObjectId` | Auto | Primary Key | Unique user identifier |
  | `name` | `String` | Yes | - | Operator full name |
  | `email` | `String` | Yes | `unique: true` | Primary email / login username |
  | `passwordHash` | `String` | Yes | Salted bcrypt (10 rounds) | Securely hashed credential |
  | `role` | `String` | Yes | Enum: `['VIEWER', 'OPERATOR', 'ADMIN']`, default: `'VIEWER'` | Access control tier |
  | `isActive` | `Boolean` | No | `default: true` | Account active flag |
  | `lastLoginAt` | `Date` | No | - | Timestamp of most recent auth session |
  | `createdAt` | `Date` | Auto | Mongoose timestamp | Account creation date |
  | `updatedAt` | `Date` | Auto | Mongoose timestamp | Last profile modification |
- **Primary API Endpoints**:
  - `POST /api/auth/register` (Public registration)
  - `POST /api/auth/login` (Returns JWT Bearer token)
  - `GET /api/auth/me` (Protected operator profile)
  - `GET /api/users` (Admin only — user directory)

---

### 2. `satellites` Collection
- **Model File**: [`OrbitalX/backend/src/models/Satellite.js`](file:///c:/Users/RH364/OneDrive/Desktop/orbital%20desktop/OrbitalX/backend/src/models/Satellite.js)
- **Description**: Orbital fleet spacecraft inventory, NORAD designations, and real-time Keplerian parameters.
- **Schema Fields**:
  | Field | Type | Required | Constraints / Default | Description |
  | :--- | :--- | :---: | :--- | :--- |
  | `_id` | `ObjectId` | Auto | Primary Key | Spacecraft internal identifier |
  | `name` | `String` | Yes | - | Spacecraft mission name (e.g. `Orion-1`) |
  | `satelliteId` | `String` | Yes | `unique: true` | Operational callsign (e.g. `SAT-001`) |
  | `noradId` | `String` | No | - | NORAD catalog ID (e.g. `55012`) |
  | `status` | `String` | No | `default: 'ACTIVE'` | Fleet state (`ACTIVE`, `WARNING`, `OFFLINE`) |
  | `orbitType` | `String` | No | `default: 'LEO'` | Regime (`LEO`, `MEO`, `GEO`, `SSO`) |
  | `orbitRadius` | `Number` | No | - | Orbital semi-major radius in km |
  | `orbitSpeed` | `Number` | No | - | Tangential velocity (km/s, e.g. 7.6) |
  | `inclination` | `Number` | No | - | Orbital plane tilt angle in degrees |
  | `currentPosition.x` | `Number` | No | `default: 0` | 3D Cartesian coordinates |
  | `currentPosition.y` | `Number` | No | `default: 0` | 3D Cartesian coordinates |
  | `currentPosition.z` | `Number` | No | `default: 0` | 3D Cartesian coordinates |
  | `currentTelemetry` | `ObjectId` | No | `ref: 'Telemetry'` | Pointer to instantaneous telemetry record |
- **Primary API Endpoints**:
  - `GET /api/satellites` (List all satellites)
  - `GET /api/satellites/:id` (Satellite detail & telemetry)
  - `POST /api/satellites` (Admin registration)

---

### 3. `missions` Collection
- **Model File**: [`OrbitalX/backend/src/models/Mission.js`](file:///c:/Users/RH364/OneDrive/Desktop/orbital%20desktop/OrbitalX/backend/src/models/Mission.js)
- **Description**: Flight programs, exploration goals, and constellation allocations.
- **Schema Fields**:
  | Field | Type | Required | Constraints / Default | Description |
  | :--- | :--- | :---: | :--- | :--- |
  | `_id` | `ObjectId` | Auto | Primary Key | Mission identifier |
  | `name` | `String` | Yes | - | Mission name (e.g. `Apollo Operations`) |
  | `missionId` | `String` | Yes | `unique: true` | Mission designator (e.g. `MSN-A1`) |
  | `description` | `String` | No | - | Detailed mission scope |
  | `status` | `String` | No | `default: 'PLANNED'` | `PLANNED`, `ACTIVE`, `COMPLETED`, `ABORTED` |
  | `launchDate` | `Date` | No | - | Scheduled or actual launch date |
  | `launchSite` | `String` | No | - | Spaceport (e.g. `Cape Canaveral`) |
  | `assignedSatellites` | `[ObjectId]` | No | `ref: 'Satellite'` | Array of participating spacecraft |
  | `duration` | `String` | No | - | Mission lifetime (e.g. `24 Months`) |
  | `objective` | `String` | No | - | Primary science/telecom objective |
- **Primary API Endpoints**:
  - `GET /api/missions` (List flight missions)
  - `GET /api/missions/:id` (Mission status & assigned fleet)
  - `POST /api/missions` (Create mission)

---

### 4. `telemetries` Collection
- **Model File**: [`OrbitalX/backend/src/models/Telemetry.js`](file:///c:/Users/RH364/OneDrive/Desktop/orbital%20desktop/OrbitalX/backend/src/models/Telemetry.js)
- **Description**: High-frequency spacecraft health samples. Managed via a **sliding-window retention queue** (capped at 300 records per satellite).
- **Index**: `{ satelliteId: 1, timestamp: -1 }` (compound descending index for fast time-series queries).
- **Schema Fields**:
  | Field | Type | Required | Constraints / Default | Description |
  | :--- | :--- | :---: | :--- | :--- |
  | `_id` | `ObjectId` | Auto | Primary Key | Telemetry record ID |
  | `satelliteId` | `ObjectId` | Yes | `ref: 'Satellite'` | Spacecraft generating sample |
  | `timestamp` | `Date` | Yes | `default: Date.now` | Observation UTC timestamp |
  | `temperature` | `Number` | No | - | Bus temperature in Celsius (-10°C to 115°C) |
  | `speed` | `Number` | No | - | Orbital speed (km/s) |
  | `altitude` | `Number` | No | - | Geodetic altitude in km |
  | `distanceFromEarth`| `Number` | No | - | Radial distance from Earth core (km) |
  | `battery` | `Number` | No | - | State of charge percentage (0–100%) |
  | `signal` | `Number` | No | - | Signal-to-noise ratio (-90 to -60 dBm) |
  | `connectivity` | `String` | No | - | `CONNECTED` or `INTERMITTENT` |
  | `latitude` | `Number` | No | - | Sub-satellite latitude (-90° to +90°) |
  | `longitude` | `Number` | No | - | Sub-satellite longitude (-180° to +180°) |
  | `health` | `Number` | No | - | Overall subsystem health index (0–100%) |
  | `cpu` | `Number` | No | - | On-board processor utilization (0–100%) |
  | `memory` | `Number` | No | - | Flash/RAM memory utilization (0–100%) |
- **Primary API Endpoints**:
  - `GET /api/telemetry/latest` (Instantaneous snapshot of active fleet)
  - `GET /api/telemetry/history` (Filtered time-range chart points)
  - `GET /api/telemetry/stats` (Fleet aggregations)

---

### 5. `groundstations` Collection
- **Model File**: [`OrbitalX/backend/src/models/GroundStation.js`](file:///c:/Users/RH364/OneDrive/Desktop/orbital%20desktop/OrbitalX/backend/src/models/GroundStation.js)
- **Description**: Deep space and near-Earth antenna network nodes.
- **Schema Fields**:
  | Field | Type | Required | Constraints / Default | Description |
  | :--- | :--- | :---: | :--- | :--- |
  | `_id` | `ObjectId` | Auto | Primary Key | Station identifier |
  | `name` | `String` | Yes | - | Station designation (e.g. `Ground Station Alpha`) |
  | `stationId` | `String` | Yes | `unique: true` | Call code (e.g. `GS-001`, `GS-HOUSTON`) |
  | `country` | `String` | No | - | Host nation / region |
  | `latitude` | `Number` | No | - | Geographic latitude coordinate |
  | `longitude` | `Number` | No | - | Geographic longitude coordinate |
  | `status` | `String` | No | `default: 'ACTIVE'` | `ACTIVE`, `DEGRADED`, `OFFLINE` |
  | `connectedSatellites` | `[ObjectId]` | No | `ref: 'Satellite'` | Active spacecraft in line-of-sight |
  | `signalQuality` | `Number` | No | - | Downlink carrier-to-noise ratio % (e.g. 98) |
  | `lastContact` | `Date` | No | - | Timestamp of last received telemetry packet |
  | `nextContact` | `Date` | No | - | Predicted start of next pass window |
- **Primary API Endpoints**:
  - `GET /api/ground-stations` (List all ground stations with populated satellites)

---

### 6. `alerts` Collection
- **Model File**: [`OrbitalX/backend/src/models/Alert.js`](file:///c:/Users/RH364/OneDrive/Desktop/orbital%20desktop/OrbitalX/backend/src/models/Alert.js)
- **Description**: Autonomous thermal anomalies, battery brownouts, and communication loss events.
- **Schema Fields**:
  | Field | Type | Required | Constraints / Default | Description |
  | :--- | :--- | :---: | :--- | :--- |
  | `_id` | `ObjectId` | Auto | Primary Key | Alert identifier |
  | `satelliteId` | `ObjectId` | Yes | `ref: 'Satellite'` | Target spacecraft |
  | `severity` | `String` | No | Enum: `['INFO', 'WARNING', 'CRITICAL', 'RESOLVED']` | Severity level |
  | `type` | `String` | Yes | - | Incident title (e.g. `THERMAL ANOMALY`) |
  | `message` | `String` | Yes | - | Detailed diagnosis message |
  | `metric` | `String` | No | - | Trigger metric (e.g. `Temperature`, `Battery`) |
  | `value` | `Number` | No | - | Detected anomalous reading |
  | `threshold` | `Number` | No | - | Tripped boundary threshold |
  | `acknowledged` | `Boolean` | No | `default: false` | Operator acknowledgment state |
  | `acknowledgedBy` | `ObjectId` | No | `ref: 'User'` | Operator ID who acknowledged |
  | `resolvedAt` | `Date` | No | - | Timestamp when incident cleared |
- **Primary API Endpoints**:
  - `GET /api/alerts` (Active incidents with severity & satellite filtering)
  - `GET /api/alerts/stats` (KPI counts for Critical, Warning, Resolved, Total)
  - `PUT /api/alerts/:id/ack` (Acknowledge active alert)

---

### 7. `commands` Collection
- **Model File**: [`OrbitalX/backend/src/models/Command.js`](file:///c:/Users/RH364/OneDrive/Desktop/orbital%20desktop/OrbitalX/backend/src/models/Command.js)
- **Description**: Uplinked satellite telecommands and execution state transitions.
- **Schema Fields**:
  | Field | Type | Required | Constraints / Default | Description |
  | :--- | :--- | :---: | :--- | :--- |
  | `_id` | `ObjectId` | Auto | Primary Key | Telecommand UUID |
  | `satelliteId` | `ObjectId` | Yes | `ref: 'Satellite'` | Destination spacecraft |
  | `userId` | `ObjectId` | Yes | `ref: 'User'` | Authorizing operator |
  | `type` | `String` | Yes | - | Command name (e.g. `PING_TELEMETRY`) |
  | `payload` | `Mixed` | No | - | Command arguments (JSON) |
  | `status` | `String` | No | Enum: `['SENT', 'PROCESSING', 'ACKNOWLEDGED', 'FAILED']` | Lifecycle state |
  | `sentAt` | `Date` | No | `default: Date.now` | Dispatch timestamp |
  | `acknowledgedAt` | `Date` | No | - | Spacecraft execution confirmation time |
  | `response` | `String` | No | - | Return payload / telemetry dump |

---

### 8. `communications` Collection
- **Model File**: [`OrbitalX/backend/src/models/Communication.js`](file:///c:/Users/RH364/OneDrive/Desktop/orbital%20desktop/OrbitalX/backend/src/models/Communication.js)
- **Description**: Bidirectional live encrypted telecommunications ledger.
- **Schema Fields**:
  | Field | Type | Required | Constraints / Default | Description |
  | :--- | :--- | :---: | :--- | :--- |
  | `_id` | `ObjectId` | Auto | Primary Key | Comm packet identifier |
  | `satelliteId` | `ObjectId` | Yes | `ref: 'Satellite'` | Target spacecraft |
  | `userId` | `ObjectId` | Yes | `ref: 'User'` | Operator |
  | `direction` | `String` | Yes | Enum: `['TX', 'RX']` | `TX` = Uplink, `RX` = Downlink |
  | `message` | `String` | Yes | - | Message or command payload |
  | `type` | `String` | No | `default: 'TEXT'` | Transmission format |
  | `status` | `String` | No | `default: 'DELIVERED'` | Delivery confirmation |
  | `latency` | `Number` | No | - | Round-trip transmission time (ms) |
  | `createdAt` | `Date` | Auto | Timestamp | Packet dispatch/receipt time |
- **Primary API Endpoints**:
  - `GET /api/communications/mission/:id` (Mission comm history)
  - `POST /api/communications` (Dispatch telecommand message)

---

### 9. `notifications` Collection
- **Model File**: [`OrbitalX/backend/src/models/Notification.js`](file:///c:/Users/RH364/OneDrive/Desktop/orbital%20desktop/OrbitalX/backend/src/models/Notification.js)
- **Description**: In-app alert toasts and operator broadcast notices.
- **Schema Fields**:
  | Field | Type | Required | Constraints / Default | Description |
  | :--- | :--- | :---: | :--- | :--- |
  | `_id` | `ObjectId` | Auto | Primary Key | Notification ID |
  | `userId` | `ObjectId` | Yes | `ref: 'User'` | Targeted recipient operator |
  | `type` | `String` | Yes | - | Category (e.g. `SYSTEM_ALERT`, `COMM`) |
  | `title` | `String` | Yes | - | Notification headline |
  | `message` | `String` | Yes | - | Detailed alert body |
  | `read` | `Boolean` | No | `default: false` | Unread / read badge status |
  | `createdAt` | `Date` | Auto | Timestamp | Emission timestamp |
- **Primary API Endpoints**:
  - `GET /api/notifications` (List operator notifications)
  - `PUT /api/notifications/:id/read` (Mark single notification as read)
  - `PUT /api/notifications/read-all` (Mark all notifications as read)

---

### 10. `auditlogs` Collection
- **Model File**: [`OrbitalX/backend/src/models/AuditLog.js`](file:///c:/Users/RH364/OneDrive/Desktop/orbital%20desktop/OrbitalX/backend/src/models/AuditLog.js)
- **Description**: Immutable cryptographic compliance and operational security ledger.
- **Schema Fields**:
  | Field | Type | Required | Constraints / Default | Description |
  | :--- | :--- | :---: | :--- | :--- |
  | `_id` | `ObjectId` | Auto | Primary Key | Audit log UUID |
  | `userId` | `ObjectId` | No | `ref: 'User'` | Originating user ID |
  | `source` | `String` | No | - | Origin subsystem (e.g. `SYS_AUTH`, `TX_CNTRL`) |
  | `action` | `String` | Yes | - | Action name (`LOGIN`, `COMMAND_TX`, `MISSION_CREATE`) |
  | `resource` | `String` | No | - | Impacted entity (e.g. `Vanguard-1`) |
  | `resourceId` | `String` | No | - | Identifier of modified record |
  | `details` | `Mixed` | No | - | Payload diff, IP, user-agent |
  | `severity` | `String` | No | Enum: `['INFO', 'WARNING', 'CRITICAL']` | Log importance tier |
  | `ipAddress` | `String` | No | - | Client IP address |
  | `timestamp` | `Date` | Auto | Timestamp | Immutable recorded event time |
- **Primary API Endpoints**:
  - `GET /api/audit` (Admin only — filterable compliance audit trail)

---

## 🖥️ PART 2: Frontend Interactive UI Tables & Data Grids

Across the frontend, 10 specialized tables and data grids display and manipulate this data:

| # | UI Table / Grid | Route | Component File | Columns / Fields Displayed | Interactive Features |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | **Global Station Network** | `/ground-stations` | `GroundStations.jsx` | Station ID, Location, Status, Sat Links, Signal %, Last Contact, Actions | Row selection highlights station on 3D globe; Eye icon to focus camera; Refresh to ping; Export CSV |
| **2** | **Communication Event Log** | `/communications` | `Communications.jsx` | Timestamp, Log Level (`INFO`, `WARN`, `ERROR`), Source, Message | Filter by parameter query; Export CSV ledger; Real-time auto-scroll |
| **3** | **Bill of Materials (BOM)** | `/studio` | `CubeSatStudio.jsx` | Category, Component Name, Form Factor, Mass (g), Power (W), Qty, Unit Cost ($), Subtotal ($), Action | Qty increment/decrement; Single-click unit removal; Dynamic BOM total recalculation |
| **4** | **Satellite Fleet Inventory** | `/satellites` | `SatelliteFleet.jsx` | Callsign, Name, Orbit Type, Speed (km/s), Altitude (km), Battery %, Health %, Status | Search input; Orbit filter tabs (`ALL`, `LEO`, `GEO`, `MEO`); Navigate to `/satellites/:id` |
| **5** | **Mission Fleet Matrix** | `/missions` | `MissionFleet.jsx` | Mission ID, Name, Launch Date, Spaceport, Satellites Assigned, Objective, Status | Status filtering (`ALL`, `ACTIVE`, `PLANNED`); `+ Add Mission` modal; Navigate to detail view |
| **6** | **Alerts & Incidents Ledger** | `/alerts` | `AlertsIncidents.jsx` | Severity Badge, Target Satellite, Incident Type, Diagnostics, 30m Telemetry Sparkline, Acknowledgment | Severity filter pills; Satellite dropdown (`SAT: ALL`); Click **`ACKNOWLEDGE`** / **`RESOLVE`** |
| **7** | **User Management Directory** | `/admin/users` | `UserManagement.jsx` | Avatar, Operator Name, Email, Assigned Role (`ADMIN`, `OPERATOR`, `VIEWER`), Status, Last Active | Role change dropdown; Account activation toggle; Password reset modal |
| **8** | **System Audit Trail** | `/admin/logs` | `ActivityLogs.jsx` | Timestamp, Severity (`INFO`, `WARN`, `CRITICAL`), Subsystem Source, Action, Resource, Operator IP | Action search; Severity filter; Detailed JSON payload viewer modal; CSV Export |
| **9** | **Mission Summary Reports** | `/reports` | `Reports.jsx` | Mission ID, Name, Status, Launch Date, Satellites Count, Target Orbit, Objectives | Date range selector; Single-click CSV export button |
| **10**| **Notification Center List** | `/notifications` | `NotificationCenter.jsx` | Priority Icon, Notification Title, Subsystem Source, Message Body, Received Timestamp, Status | Mark individual notification read; Click **`Mark All Read`**; Clear notifications |
