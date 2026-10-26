const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>OrbitalX - Satellite Telecommand & Flight Communications Reference Manual</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

    @page {
      size: A4 portrait;
      margin: 14mm 14mm 14mm 14mm;
      @bottom-right {
        content: "Page " counter(page);
        font-family: 'Inter', sans-serif;
        font-size: 8pt;
        color: #64748B;
      }
      @bottom-left {
        content: "ORBITAL-X FLIGHT OPERATIONS // TELECOMMAND MANUAL";
        font-family: 'JetBrains Mono', monospace;
        font-size: 7.5pt;
        color: #94A3B8;
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
      line-height: 1.5;
      font-size: 9pt;
      margin: 0;
      padding: 0;
    }

    /* Page Breaks & Table Formatting */
    .page-break {
      page-break-after: always;
    }

    table, tr, td, th {
      page-break-inside: avoid !important;
    }

    .panel-card, .callout, .code-box, .grid-2 {
      page-break-inside: avoid !important;
    }

    /* Cover Page */
    .cover-page {
      height: 94vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
      padding: 30px 20px 20px 20px;
    }

    .cover-top {
      border-bottom: 3px solid #0284C7;
      padding-bottom: 25px;
    }

    .brand-badge {
      display: inline-block;
      background: #0B1221;
      color: #00F0FF;
      font-family: 'JetBrains Mono', monospace;
      font-size: 8.5pt;
      font-weight: 700;
      padding: 5px 14px;
      border-radius: 4px;
      border: 1px solid #00F0FF;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 18px;
    }

    .cover-title {
      font-size: 26pt;
      font-weight: 800;
      color: #0F172A;
      line-height: 1.15;
      margin: 0 0 10px 0;
      letter-spacing: -0.5px;
    }

    .cover-subtitle {
      font-size: 13pt;
      font-weight: 500;
      color: #0369A1;
      margin: 0 0 15px 0;
    }

    .cover-desc {
      font-size: 9.5pt;
      color: #475569;
      line-height: 1.6;
      max-width: 650px;
    }

    .cover-meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-top: 30px;
      padding: 20px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
    }

    .meta-box h4 {
      margin: 0 0 4px 0;
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64748B;
      font-family: 'JetBrains Mono', monospace;
    }

    .meta-box p {
      margin: 0;
      font-size: 9pt;
      font-weight: 600;
      color: #0F172A;
    }

    .cover-footer {
      border-top: 1px solid #E2E8F0;
      padding-top: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8pt;
      color: #64748B;
      font-family: 'JetBrains Mono', monospace;
    }

    /* Headings */
    h1 {
      font-size: 16pt;
      font-weight: 800;
      color: #0F172A;
      margin: 0 0 12px 0;
      padding-bottom: 6px;
      border-bottom: 2px solid #0284C7;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    h1 .sec-tag {
      font-size: 8pt;
      font-family: 'JetBrains Mono', monospace;
      color: #0284C7;
      font-weight: 600;
      background: #E0F2FE;
      padding: 3px 8px;
      border-radius: 3px;
    }

    h2 {
      font-size: 11pt;
      font-weight: 700;
      color: #0369A1;
      margin: 16px 0 8px 0;
      display: flex;
      align-items: center;
    }

    h2::before {
      content: "";
      display: inline-block;
      width: 4px;
      height: 14px;
      background: #0284C7;
      margin-right: 8px;
      border-radius: 2px;
    }

    p {
      margin: 0 0 10px 0;
      color: #334155;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 6px 0 10px 0;
      font-size: 7.5pt;
    }

    th {
      background: #0F172A;
      color: #FFFFFF;
      font-family: 'JetBrains Mono', monospace;
      font-size: 7pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      text-align: left;
      padding: 5px 7px;
      border: 1px solid #0F172A;
    }

    td {
      padding: 4.5px 7px;
      border: 1px solid #E2E8F0;
      vertical-align: top;
      color: #1E293B;
      line-height: 1.35;
    }

    tr:nth-child(even) td {
      background-color: #F8FAFC;
    }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 1.5px 5px;
      border-radius: 3px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 6.5pt;
      font-weight: 700;
      text-transform: uppercase;
    }

    .badge-crit { background: #FEE2E2; color: #DC2626; border: 1px solid #FCA5A5; }
    .badge-high { background: #FEF3C7; color: #D97706; border: 1px solid #FCD34D; }
    .badge-info { background: #E0F2FE; color: #0284C7; border: 1px solid #BAE6FD; }
    .badge-ok   { background: #DCFCE7; color: #16A34A; border: 1px solid #86EFAC; }
    .badge-dark { background: #0F172A; color: #00F0FF; border: 1px solid #00F0FF; }

    /* Code Blocks */
    .code-box {
      background: #0B1221;
      color: #E2E8F0;
      padding: 7px 11px;
      border-radius: 5px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 7.2pt;
      margin: 6px 0 8px 0;
      border: 1px solid #1E293B;
      line-height: 1.35;
    }

    .code-cmd { color: #00F0FF; font-weight: 700; }
    .code-param { color: #F59E0B; }
    .code-comment { color: #64748B; font-style: italic; }

    /* Callouts */
    .callout {
      border-left: 3px solid #0284C7;
      background: #F0F9FF;
      padding: 7px 11px;
      margin: 8px 0;
      border-radius: 0 5px 5px 0;
      font-size: 7.5pt;
      line-height: 1.35;
    }

    .callout-title {
      font-weight: 700;
      color: #0369A1;
      margin-bottom: 2px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 7.5pt;
      text-transform: uppercase;
    }

    .callout-warn {
      border-left-color: #D97706;
      background: #FFFBEB;
    }
    .callout-warn .callout-title { color: #B45309; }

    .callout-danger {
      border-left-color: #DC2626;
      background: #FEF2F2;
    }
    .callout-danger .callout-title { color: #B91C1C; }

    /* Grid Layouts */
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .panel-card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 5px;
      padding: 8px 10px;
    }

    .panel-card h3 {
      margin: 0 0 4px 0;
      font-size: 8pt;
      font-weight: 700;
      color: #0F172A;
      font-family: 'JetBrains Mono', monospace;
    }
  </style>
</head>
<body>

  <!-- ==================== COVER PAGE ==================== -->
  <div class="cover-page">
    <div class="cover-top">
      <div class="brand-badge">ORBITAL-X FLIGHT OPERATIONS // MANUAL REF: OX-TC-2026-V4</div>
      <h1 class="cover-title">Satellite Telecommand &amp; Flight Communications Reference Manual</h1>
      <div class="cover-subtitle">Complete Command Vocabulary, Telemetry Packet Formats, Ground Station Uplink Protocols &amp; Emergency Recovery Procedures</div>
      <p class="cover-desc">
        This document provides the definitive operational specifications for communicating with CubeSats and orbital assets
        managed under the Orbital-X Mission Operations System. It details every valid telecommand opcode, argument schemas,
        expected physical and software telemetry effects, radio frequency bands, CCSDS packet framing, and emergency contingency procedures.
      </p>

      <div class="cover-meta-grid">
        <div class="meta-box">
          <h4>Applicable Assets</h4>
          <p>ApexSat-1 (SAT-ORB-01), ApexSat-2 (SAT-ORB-02), Generic 3U/6U CubeSats</p>
        </div>
        <div class="meta-box">
          <h4>Flight Software Version</h4>
          <p>OrbitalX-FSW v3.8.4 (SGP4/Keplerian Solvers Integrated)</p>
        </div>
        <div class="meta-box">
          <h4>Communication Standards</h4>
          <p>CCSDS 231.0-B-3 (TC Framing), AX.25, UHF/S/X-Band Duplex</p>
        </div>
        <div class="meta-box">
          <h4>Clearance Level</h4>
          <p>Mission Operator Clearance / Flight Director Execution Authority</p>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <span>CLASSIFICATION: OPERATIONAL USE ONLY</span>
      <span>ORBITAL-X MISSION CONTROL CENTER</span>
      <span>OCTOBER 2026</span>
    </div>
  </div>

  <!-- ==================== SECTION 1: SYSTEM OVERVIEW ==================== -->
  <div>
    <h1>
      1. Telecommand Architecture &amp; Uplink Pipeline
      <span class="sec-tag">SECTION 1.0</span>
    </h1>

    <p>
      Satellite telecommands in Orbital-X originate from the Mission Control Console or automated scripts,
      pass through security authentication and permission verifications, and are dispatched via REST or WebSocket
      to ground station software-defined transceivers for RF modulation.
    </p>

    <div class="panel-card" style="margin-bottom: 14px; background: #0B1221; color: #F8FAFC; border-color: #1E293B;">
      <h3 style="color: #00F0FF; margin-bottom: 8px;">TELECOMMAND DISPATCH FLOW</h3>
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 7.8pt; line-height: 1.6; color: #94A3B8;">
        [MCC Operator / Script] ──(HTTPS Bearer Token)──&gt; [OrbitalX API Gateway :4000]<br/>
        &nbsp;&nbsp;└── Auth Verification &amp; Clearance Check (Requires Role: OPERATOR / ADMIN)<br/>
        &nbsp;&nbsp;└── Endpoint: <span style="color: #00F0FF;">POST /api/telemetry/cubesat/command</span><br/>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── [Audit Logger] Records timestamp, operator ID, satellite ID, opcode<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── [Ground Station Router] Evaluates pass window, elevation &gt; 10°, and Doppler offset<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── [Onboard Telemetry Simulator] Evaluates physical effects, battery, ADCS attitude, thrust &amp; temp
      </div>
    </div>

    <h2>1.1 REST Telecommand Ingest Interface</h2>
    <p>Operators and automated flight systems execute telecommands via standard authenticated HTTP payloads:</p>

    <div class="code-box">
<span class="code-comment">// Dispatched to: POST /api/telemetry/cubesat/command</span>
<span class="code-comment">// Headers: Authorization: Bearer &lt;TOKEN&gt; | Content-Type: application/json</span>
{
  <span class="code-param">"satelliteId"</span>: <span class="code-cmd">"SAT-ORB-01"</span>,
  <span class="code-param">"command"</span>: <span class="code-cmd">"COLD_GAS_THRUST"</span>,
  <span class="code-param">"params"</span>: {
    <span class="code-param">"deltaV"</span>: 0.08,
    <span class="code-param">"durationSec"</span>: 3
  }
}
    </div>

    <h2>1.2 Radio Frequency &amp; Ground Station Link Parameters</h2>
    <table>
      <thead>
        <tr>
          <th>Link Type</th>
          <th>Frequency Band</th>
          <th>Downlink Freq</th>
          <th>Uplink Freq</th>
          <th>Modulation / Protocol</th>
          <th>Max Data Rate</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Telemetry Beacon</strong></td>
          <td>UHF (Amateur/CubeSat)</td>
          <td>437.525 MHz</td>
          <td>N/A (Broadcast)</td>
          <td>AFSK / AX.25 (G3RUH)</td>
          <td>9.6 kbps</td>
        </tr>
        <tr>
          <td><strong>Telecommand Uplink</strong></td>
          <td>UHF / S-Band</td>
          <td>N/A</td>
          <td>435.150 MHz / 2025 MHz</td>
          <td>GFSK / CCSDS Packet</td>
          <td>38.4 kbps</td>
        </tr>
        <tr>
          <td><strong>Payload Data Downlink</strong></td>
          <td>X-Band</td>
          <td>8450.000 MHz</td>
          <td>N/A</td>
          <td>OQPSK / DVB-S2</td>
          <td>150.0 Mbps</td>
        </tr>
        <tr>
          <td><strong>Ground Stations</strong></td>
          <td colspan="5">Bengaluru (GS-BLR-01: 12.97°N, 77.59°E) &bull; Svalbard (GS-SVB-02: 78.22°N, 15.65°E) &bull; Houston (GS-HOU-03: 29.76°N, -95.36°E)</td>
        </tr>
      </tbody>
    </table>

    <div class="callout callout-warn">
      <div class="callout-title">Doppler Shift Compensation Requirement</div>
      For Low Earth Orbit (LEO) passes at 500 km altitude (orbital velocity ~7.6 km/s), ground station transmitters must
      apply real-time frequency correction of up to <strong>&plusmn;9.5 kHz on UHF</strong> and <strong>&plusmn;45 kHz on S-Band</strong>
      throughout the 10-minute pass window to prevent receiver PLL lock dropouts.
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 2: COMPLETE COMMAND VOCABULARY ==================== -->
  <div>
    <h1>
      2. Comprehensive Satellite Telecommand Vocabulary
      <span class="sec-tag">SECTION 2.0</span>
    </h1>

    <p>
      The following tables detail all valid commands parsed and executed by the Orbital-X Onboard Computer (OBC)
      and physics simulation engine. Commands may be issued using the canonical opcode or standard alias shortcuts.
    </p>

    <h2>2.1 Electrical Power Subsystem (EPS) Commands</h2>
    <table>
      <thead>
        <tr>
          <th>Command Opcode</th>
          <th>Valid Aliases</th>
          <th>Parameters</th>
          <th>Onboard Physical Effect &amp; Telemetry Response</th>
          <th>Clearance</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong style="color: #0369A1;">DEPLOY_SOLAR_PANELS</strong></td>
          <td>DEPLOY_PANELS, DEPLOY</td>
          <td>None</td>
          <td>
            Sets <code>solarPanelsDeployed = true</code>. Increases solar generation (+35W).
            Solar panel temperature rises nominal (+3.2&deg;C). Battery charging accelerates.
          </td>
          <td><span class="badge badge-ok">OPERATOR</span></td>
        </tr>
        <tr>
          <td><strong style="color: #0369A1;">RETRACT_SOLAR_PANELS</strong></td>
          <td>STOW_PANELS, STOW</td>
          <td>None</td>
          <td>
            Sets <code>solarPanelsDeployed = false</code>. Stows array into chassis for protective high-drag passes.
            Reduces bus power input.
          </td>
          <td><span class="badge badge-high">FLT DIR</span></td>
        </tr>
        <tr>
          <td><strong style="color: #0369A1;">CMD_EPS_SAFE_MODE</strong></td>
          <td>EPS_SAFE, POWER_CONSERVE</td>
          <td>None</td>
          <td>
            Sheds non-essential sensor rails. Restricts power draw strictly to OBC and UHF receiver (&lt; 6.4W).
          </td>
          <td><span class="badge badge-high">FLT DIR</span></td>
        </tr>
        <tr>
          <td><strong style="color: #0369A1;">CMD_EPS_SWITCH_BUS_B</strong></td>
          <td>BUS_B_TOGGLE</td>
          <td>None</td>
          <td>
            Switches regulated power distribution to redundant secondary 5V/12V converter rails.
          </td>
          <td><span class="badge badge-crit">ADMIN</span></td>
        </tr>
      </tbody>
    </table>

    <h2>2.2 Attitude Determination &amp; Control System (ADCS) Commands</h2>
    <table>
      <thead>
        <tr>
          <th>Command Opcode</th>
          <th>Valid Aliases</th>
          <th>Parameters</th>
          <th>Onboard Physical Effect &amp; Telemetry Response</th>
          <th>Clearance</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong style="color: #0369A1;">ADCS_DETUMBLE</strong></td>
          <td>DETUMBLE</td>
          <td>None</td>
          <td>
            Activates B-dot magnetic torquer coils. Nulls tumbling spacecraft angular rates below <strong>0.01&deg;/s</strong>.
            Sets mode to <code>DETUMBLED</code>. Spikes CPU load +22% for control loop.
          </td>
          <td><span class="badge badge-ok">OPERATOR</span></td>
        </tr>
        <tr>
          <td><strong style="color: #0369A1;">POINT_NADIR</strong></td>
          <td>NADIR</td>
          <td>None</td>
          <td>
            Slews satellite body Z-axis directly toward Earth center (Nadir). Sets Roll: 0.1&deg;, Pitch: 0.0&deg;, Yaw: 0.0&deg;.
            Required for optical imaging passes and high-gain ground antenna downlinks.
          </td>
          <td><span class="badge badge-ok">OPERATOR</span></td>
        </tr>
        <tr>
          <td><strong style="color: #0369A1;">POINT_SUN</strong></td>
          <td>SUN, SUN_TRACK</td>
          <td>None</td>
          <td>
            Aligns solar panel normal vector to the Sun vector. Optimizes solar energy absorption (+4.8&deg;C solar panel temp).
          </td>
          <td><span class="badge badge-ok">OPERATOR</span></td>
        </tr>
        <tr>
          <td><strong style="color: #0369A1;">CMD_ADCS_RESET_GYRO_BIAS</strong></td>
          <td>RESET_GYRO</td>
          <td>None</td>
          <td>
            Re-calibrates MEMS gyroscope zero-rate offset using Kalman filter star-tracker attitude truth.
          </td>
          <td><span class="badge badge-high">FLT DIR</span></td>
        </tr>
      </tbody>
    </table>

    <h2>2.3 Propulsion &amp; Orbital Maneuvers</h2>
    <table>
      <thead>
        <tr>
          <th>Command Opcode</th>
          <th>Valid Aliases</th>
          <th>Parameters</th>
          <th>Onboard Physical Effect &amp; Telemetry Response</th>
          <th>Clearance</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong style="color: #0369A1;">COLD_GAS_THRUST</strong></td>
          <td>ORBITAL_BOOST, THRUST, BURST</td>
          <td><code>deltaV</code> (km/s)<br/><code>durationSec</code> (s)</td>
          <td>
            Fires micro-thruster nozzle for 3 seconds. Imparts <strong>+0.08 km/s</strong> speed boost.
            Raises orbital altitude +3.8 km. Consumes 2.4% cold-gas propellant.
            Status transitions to <code>THRUSTER_BURN</code>, then auto-recovers to <code>NOMINAL</code>.
          </td>
          <td><span class="badge badge-crit">FLT DIR / ADMIN</span></td>
        </tr>
        <tr>
          <td><strong style="color: #0369A1;">CMD_PROP_ARM_CAM_BURN</strong></td>
          <td>ARM_CAM</td>
          <td><code>burnVector</code> [x,y,z]</td>
          <td>
            Arms emergency collision avoidance maneuver (CAM) valve sequence. Requires dual operator confirmation.
          </td>
          <td><span class="badge badge-crit">FLT DIR</span></td>
        </tr>
      </tbody>
    </table>

    <div class="callout callout-danger">
      <div class="callout-title">Propellant Expenditure Constraint</div>
      Cold-gas propellant is non-renewable. Each firing consumes approximately <strong>2.4% of total tank capacity</strong>.
      Thruster bursts must only be authorized for orbital altitude station-keeping or certified conjunction avoidance maneuvers.
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 3: PAYLOAD, COMMS & SYSTEM COMMANDS ==================== -->
  <div>
    <h1>
      3. Payload, Communications &amp; System Health Commands
      <span class="sec-tag">SECTION 3.0</span>
    </h1>

    <h2>3.1 Scientific Payload &amp; Earth Observation</h2>
    <table>
      <thead>
        <tr>
          <th>Command Opcode</th>
          <th>Valid Aliases</th>
          <th>Parameters</th>
          <th>Onboard Physical Effect &amp; Telemetry Response</th>
          <th>Clearance</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong style="color: #0369A1;">EXECUTE_PAYLOAD_CAPTURE</strong></td>
          <td>CAPTURE_IMAGE, CAPTURE, SCIENCE_PASS</td>
          <td>None</td>
          <td>
            Activates multispectral optical imager. Captures Earth surface frames. Spikes CPU load to <strong>~75-96%</strong>
            and memory usage +26%. Writes 240 MB imagery data to onboard flash buffer.
          </td>
          <td><span class="badge badge-ok">OPERATOR</span></td>
        </tr>
        <tr>
          <td><strong style="color: #0369A1;">START_DATA_DOWNLINK</strong></td>
          <td>DOWNLINK, FLUSH_MEMORY</td>
          <td>None</td>
          <td>
            Powers X-Band high-gain transmitter. Downlinks <strong>450 science telemetry packets</strong> to active ground station.
            Reduces onboard memory utilization by 28%. Elevates radio power amplifier temp (+5.2&deg;C).
          </td>
          <td><span class="badge badge-ok">OPERATOR</span></td>
        </tr>
      </tbody>
    </table>

    <h2>3.2 Thermal Control Subsystem (TCS)</h2>
    <table>
      <thead>
        <tr>
          <th>Command Opcode</th>
          <th>Valid Aliases</th>
          <th>Parameters</th>
          <th>Onboard Physical Effect &amp; Telemetry Response</th>
          <th>Clearance</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong style="color: #0369A1;">CYCLE_HEATERS</strong></td>
          <td>HEATERS_ON, HEATERS, TOGGLE_HEATERS</td>
          <td>None</td>
          <td>
            Toggles internal resistance heating loops ON/OFF. When ON: Elevates internal bus temperature (+5.8&deg;C)
            and battery temp (+4.2&deg;C). Draws additional 8.5W bus power. Yellow HUD heater indicator lights up.
          </td>
          <td><span class="badge badge-ok">OPERATOR</span></td>
        </tr>
        <tr>
          <td><strong style="color: #0369A1;">HEATERS_OFF</strong></td>
          <td>HEATER_OFF</td>
          <td>None</td>
          <td>
            Explicitly de-energizes heating loops. Prevents overheating during high solar irradiance passes.
          </td>
          <td><span class="badge badge-ok">OPERATOR</span></td>
        </tr>
      </tbody>
    </table>

    <h2>3.3 Command &amp; Data Handling (CDH / OBC) &amp; Diagnostics</h2>
    <table>
      <thead>
        <tr>
          <th>Command Opcode</th>
          <th>Valid Aliases</th>
          <th>Parameters</th>
          <th>Onboard Physical Effect &amp; Telemetry Response</th>
          <th>Clearance</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong style="color: #0369A1;">PING_DIAGNOSTICS</strong></td>
          <td>PING</td>
          <td>None</td>
          <td>
            Executes full round-trip radio ping &amp; health echo. Returns:
            <code>EPS: 100% | CDH: 100% | ADCS: 98% | COMM: 99% | Latency: 14.2ms</code>.
          </td>
          <td><span class="badge badge-ok">OPERATOR</span></td>
        </tr>
        <tr>
          <td><strong style="color: #0369A1;">ENTER_SAFE_MODE</strong></td>
          <td>SAFE_MODE, SAFE</td>
          <td>None</td>
          <td>
            Forces spacecraft into safe configuration: powers down science payload, shuts off auxiliary heaters,
            throttles CPU clock to 8%, sets bus draw to 6.4W.
          </td>
          <td><span class="badge badge-high">FLT DIR</span></td>
        </tr>
        <tr>
          <td><strong style="color: #0369A1;">RESUME_NORMAL_OPS</strong></td>
          <td>NORMAL_OPS, RESUME</td>
          <td>None</td>
          <td>
            Clears safe mode flags. Resumes normal 24% CPU baseline and nominal telemetry streaming.
          </td>
          <td><span class="badge badge-high">FLT DIR</span></td>
        </tr>
        <tr>
          <td><strong style="color: #0369A1;">REBOOT_OBC</strong></td>
          <td>REBOOT</td>
          <td>None</td>
          <td>
            Performs warm reboot of flight computer processor. Re-initializes RAM, executes firmware checksum
            verification (<code>0x8F4A</code>), and recovers within 3 seconds.
          </td>
          <td><span class="badge badge-crit">FLT DIR</span></td>
        </tr>
      </tbody>
    </table>

    <h2>3.4 Quick Reference Command Syntax Cheat-Sheet</h2>
    <div class="grid-2">
      <div class="code-box">
<span class="code-comment">// 1. Stabilize Tumbling Satellite</span>
POST /api/telemetry/cubesat/command
{ "satelliteId": "SAT-ORB-01", "command": "<span class="code-cmd">DETUMBLE</span>" }

<span class="code-comment">// 2. Point Nadir &amp; Start Downlink</span>
{ "satelliteId": "SAT-ORB-01", "command": "<span class="code-cmd">POINT_NADIR</span>" }
{ "satelliteId": "SAT-ORB-01", "command": "<span class="code-cmd">START_DATA_DOWNLINK</span>" }
      </div>
      <div class="code-box">
<span class="code-comment">// 3. Orbit Raise Altitude Burn</span>
POST /api/telemetry/cubesat/command
{ "satelliteId": "SAT-ORB-01", "command": "<span class="code-cmd">COLD_GAS_THRUST</span>" }

<span class="code-comment">// 4. Emergency Safe Mode Contingency</span>
{ "satelliteId": "SAT-ORB-01", "command": "<span class="code-cmd">ENTER_SAFE_MODE</span>" }
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 4: CCSDS PACKET FORMAT & GROUND PROTOCOLS ==================== -->
  <div>
    <h1>
      4. Telemetry &amp; Telecommand Packet Specifications
      <span class="sec-tag">SECTION 4.0</span>
    </h1>

    <p>
      For low-level software-defined radio (SDR) integration, commands are encoded according to
      the <strong>CCSDS 231.0-B-3 Space Link Protocol</strong>. Each telecommand frame contains a standardized 48-bit
      primary header followed by the command payload and an error-detecting cyclic redundancy code.
    </p>

    <h2>4.1 CCSDS Telecommand Transfer Frame Structure</h2>
    <table>
      <thead>
        <tr>
          <th>Field Name</th>
          <th>Bit Width</th>
          <th>Field Description &amp; Values</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Version Number</strong></td>
          <td>3 bits</td>
          <td>Set to <code>000b</code> for CCSDS Version 1 Transfer Frames</td>
        </tr>
        <tr>
          <td><strong>Type Indicator</strong></td>
          <td>1 bit</td>
          <td><code>1b</code> = Telecommand (Uplink), <code>0b</code> = Telemetry (Downlink)</td>
        </tr>
        <tr>
          <td><strong>Secondary Header Flag</strong></td>
          <td>1 bit</td>
          <td><code>1b</code> indicates presence of 32-bit timestamp in secondary header</td>
        </tr>
        <tr>
          <td><strong>Application Process ID (APID)</strong></td>
          <td>11 bits</td>
          <td>
            <code>0x010</code> = EPS Power &bull; <code>0x020</code> = ADCS Attitude &bull;
            <code>0x030</code> = Propulsion &bull; <code>0x040</code> = Science Payload &bull; <code>0x050</code> = OBC CDH
          </td>
        </tr>
        <tr>
          <td><strong>Sequence Flags</strong></td>
          <td>2 bits</td>
          <td><code>11b</code> = Unsegmented single packet</td>
        </tr>
        <tr>
          <td><strong>Packet Sequence Count</strong></td>
          <td>14 bits</td>
          <td>Monotonically increasing sequence counter (0 to 16383) to prevent replay attacks</td>
        </tr>
        <tr>
          <td><strong>Packet Data Length</strong></td>
          <td>16 bits</td>
          <td>Length of user telecommand payload in bytes minus 1</td>
        </tr>
        <tr>
          <td><strong>Command Opcode &amp; Args</strong></td>
          <td>Variable</td>
          <td>8-bit opcode followed by argument bytes (e.g. <code>0x1A 0x03</code> for cold gas thruster burst)</td>
        </tr>
        <tr>
          <td><strong>Frame Error Control (CRC-16)</strong></td>
          <td>16 bits</td>
          <td>CCITT-16 checksum polynomial (<code>x^16 + x^12 + x^5 + 1</code>) for frame error rejection</td>
        </tr>
      </tbody>
    </table>

    <h2>4.2 Ground Station Pass Coordination Checklist</h2>
    <p>
      Ground station passes typically last between <strong>8 and 12 minutes</strong> for low-earth satellites.
      Flight controllers must follow this sequence for every pass:
    </p>

    <div class="grid-2">
      <div class="panel-card">
        <h3>AOS (Acquisition of Signal) Checklist</h3>
        <ol style="margin: 0; padding-left: 18px; font-size: 8pt; color: #334155; line-height: 1.6;">
          <li>Antenna dish slews to predicted AOS azimuth / elevation.</li>
          <li>RF demodulator acquires carrier lock at horizon +10&deg;.</li>
          <li>Receive and decode broadcast beacon packets (UHF 437.525 MHz).</li>
          <li>Verify battery state of charge (&gt; 70%) and bus voltage (&gt; 11.4V).</li>
          <li>Confirm attitude determination mode is <code>NADIR</code> or <code>SUN_TRACKING</code>.</li>
        </ol>
      </div>

      <div class="panel-card">
        <h3>LOS (Loss of Signal) Checklist</h3>
        <ol style="margin: 0; padding-left: 18px; font-size: 8pt; color: #334155; line-height: 1.6;">
          <li>Transmit all pending queued telecommands before elevation &lt; 10&deg;.</li>
          <li>Verify command execution acknowledgments from telemetry stream.</li>
          <li>Confirm X-Band payload downlink buffer flushed to ground archive.</li>
          <li>Command payload transmitter OFF to conserve battery reserve.</li>
          <li>Log pass statistics: total packets, signal SNR, Doppler shift, bit errors.</li>
        </ol>
      </div>
    </div>

    <h2>4.3 Emergency Contingency Matrix</h2>
    <table>
      <thead>
        <tr>
          <th>Observed Anomaly</th>
          <th>Root Cause Diagnosis</th>
          <th>Immediate Corrective Telecommand Sequence</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="badge badge-crit">TUMBLE RATE &gt; 15&deg;/s</span></td>
          <td>Reaction wheel saturation or separation tip-off</td>
          <td>
            1. <code>ENTER_SAFE_MODE</code><br/>
            2. <code>ADCS_DETUMBLE</code> (Energizes B-dot coils)<br/>
            3. Await body rate &lt; 0.1&deg;/s, then issue <code>POINT_SUN</code>
          </td>
        </tr>
        <tr>
          <td><span class="badge badge-high">BATTERY &lt; 20%</span></td>
          <td>Subsystem eclipse drain or array misalignment</td>
          <td>
            1. <code>HEATERS_OFF</code> (Kill auxiliary thermal loads)<br/>
            2. <code>DEPLOY_SOLAR_PANELS</code> (Verify full array exposure)<br/>
            3. <code>POINT_SUN</code> (Maximize solar angle of incidence)
          </td>
        </tr>
        <tr>
          <td><span class="badge badge-high">CPU HANG / TELEMETRY FREEZE</span></td>
          <td>Radiation single-event latchup in flight software</td>
          <td>
            1. Transmit <code>PING_DIAGNOSTICS</code> on hardware carrier<br/>
            2. Issue <code>REBOOT_OBC</code> to trigger golden image bootloader<br/>
            3. Verify checksum response: <code>0x8F4A</code> verified
          </td>
        </tr>
      </tbody>
    </table>

    <div style="text-align: center; margin-top: 10px; border-top: 1px solid #E2E8F0; padding-top: 6px; font-size: 7.5pt; color: #64748B; font-family: 'JetBrains Mono', monospace;">
      OrbitalX Mission Operations &bull; Satellite Telecommand Reference Manual &bull; Confidential &bull; Version 4.0.0
    </div>
  </div>

</body>
</html>
`;

// Target File Paths
const backendDir = 'c:\\\\Users\\\\RH364\\\\OneDrive\\\\Desktop\\\\orbital desktop\\\\OrbitalX\\\\backend';
const parentDir = 'c:\\\\Users\\\\RH364\\\\OneDrive\\\\Desktop\\\\orbital desktop\\\\OrbitalX';

const htmlPath = path.join(backendDir, 'OrbitalX_Satellite_Telecommand_Manual.html');
const pdfBackendPath = path.join(backendDir, 'OrbitalX_Satellite_Telecommand_Manual.pdf');
const pdfParentPath = path.join(parentDir, 'OrbitalX_Satellite_Telecommand_Manual.pdf');
const pdfUserDesktop = 'c:\\\\Users\\\\RH364\\\\OneDrive\\\\Desktop\\\\OrbitalX_Satellite_Telecommand_Manual.pdf';

fs.writeFileSync(htmlPath, htmlContent, 'utf8');
console.log('[Telecommand Manual] Successfully wrote HTML source to:', htmlPath);

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

  // Copy to parent project folder
  fs.copyFileSync(pdfBackendPath, pdfParentPath);
  console.log('[PDF Generator] Copied PDF to root project folder:', pdfParentPath);

  // Copy to desktop for user immediate convenience
  try {
    fs.copyFileSync(pdfBackendPath, pdfUserDesktop);
    console.log('[PDF Generator] Copied PDF to User Desktop:', pdfUserDesktop);
  } catch (e) {
    console.log('[PDF Generator] Could not copy to desktop, parent copy ready.');
  }
} catch (err) {
  console.error('[PDF Generator] Error during print-to-pdf:', err);
  process.exit(1);
}
