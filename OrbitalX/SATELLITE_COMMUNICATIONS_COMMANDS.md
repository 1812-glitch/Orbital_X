# Orbital-X Satellite Communications (COMS) Command Reference

This document details all **Communications (COMS) & RF Telecommand Functions** used to establish contact, execute downlinks, manage transceivers, and troubleshoot communications with satellites in the Orbital-X system.

---

## 1. Primary Communications Telecommands

| Command Opcode | Aliases / Triggers | Target Subsystem | Band / Protocol | Execution Clearance |
| :--- | :--- | :--- | :--- | :--- |
| **`START_DATA_DOWNLINK`** | `DOWNLINK`, `FLUSH_MEMORY` | X-Band High-Gain Transmitter | X-Band (8450 MHz, DVB-S2) | **OPERATOR** |
| **`PING_DIAGNOSTICS`** | `PING` | UHF/S-Band Transceiver Hub | UHF (437.525 MHz) / S-Band | **OPERATOR** |
| **`CMD_COMMS_BEACON_MODE`** | `BEACON_MODE`, `LOW_POWER_BEACON` | UHF Low-Power Beacon | 437.525 MHz (AFSK / AX.25) | **OPERATOR** |
| **`CMD_COMMS_SWITCH_ANTENNA_B`** | `SWITCH_ANTENNA`, `ANTENNA_B` | RF Switch Matrix / Antennas | Omni-directional Patch B | **FLIGHT DIRECTOR** |
| **`CMD_COMMS_THROTTLE_PA_LOW`** | `THROTTLE_PA`, `PA_LOW_POWER` | RF Power Amplifier (PA) | Transmitter Hardware | **FLIGHT DIRECTOR** |
| **`CMD_COMMS_RESET_RECEIVER`** | `RESET_RECEIVER`, `REBOOT_SDR` | Software Defined Radio (SDR) | Onboard Receiver | **FLIGHT DIRECTOR** |
| **`POINT_NADIR`** | `NADIR` | ADCS / Antenna Alignment | Earth-Facing Vector | **OPERATOR** |

---

## 2. Command Details, Purpose & Operational Use

### 2.1 `START_DATA_DOWNLINK`
* **Canonical Opcode**: `START_DATA_DOWNLINK`
* **Aliases**: `DOWNLINK`, `FLUSH_MEMORY`
* **Primary Purpose**: Flushes stored scientific payload data, multispectral imagery frames, and detailed telemetry batches from the satellite's onboard flash memory buffer down to an active ground station.
* **Onboard Effect & Telemetry**:
  * Powers on the high-throughput X-Band directional transmitter.
  * Downlinks 450 science telemetry packets per session (~240 MB buffer).
  * Reduces onboard RAM/Flash memory utilization by **~28%**.
  * Power amplifier temperature elevates nominally by **+5.2°C**.
* **When to Use**: During scheduled Ground Station pass windows when antenna elevation angle exceeds **10°** and Nadir pointing is stabilized.

---

### 2.2 `PING_DIAGNOSTICS`
* **Canonical Opcode**: `PING_DIAGNOSTICS`
* **Aliases**: `PING`
* **Primary Purpose**: Performs an immediate hardware round-trip radio link check and subcarrier echo.
* **Onboard Effect & Telemetry**:
  * Queries and echoes real-time health telemetry across all four primary spacecraft buses.
  * Returns round-trip link latency (nominal: **12–15 ms**).
  * Expected response:
    ```
    DIAGNOSTIC PING OK. EPS: 100% | CDH: 100% | ADCS: 98% | COMM: 99% | Latency: 14.2ms
    ```
* **When to Use**: At the start of a ground station pass (Acquisition of Signal - AOS) to confirm two-way lock, and after any onboard software reboot.

---

### 2.3 `CMD_COMMS_BEACON_MODE`
* **Canonical Opcode**: `CMD_COMMS_BEACON_MODE`
* **Aliases**: `BEACON_MODE`, `LOW_POWER_BEACON`
* **Primary Purpose**: Sets the satellite transceiver into a low-data-rate, low-power periodic beacon transmission mode.
* **Onboard Effect & Telemetry**:
  * Disables high-power X-Band and S-Band wideband transmitters.
  * Configures the UHF transponder to broadcast vital telemetry health heartbeats (battery, voltage, body tumble rates) once every **120 seconds** (AFSK / AX.25, 9.6 kbps).
  * Conserves critical battery power draw (< 2.5W).
* **When to Use**:
  * When entering **Emergency Safe Mode (ESM)**.
  * During deep eclipse passes with battery reserve falling below 30%.
  * Following loss of solar array orientation.

---

### 2.4 `CMD_COMMS_SWITCH_ANTENNA_B`
* **Canonical Opcode**: `CMD_COMMS_SWITCH_ANTENNA_B`
* **Aliases**: `SWITCH_ANTENNA`, `ANTENNA_B`
* **Primary Purpose**: Actuates RF coaxial relays to switch transmission and reception from the primary directional high-gain antenna to the secondary omni-directional backup patch antenna.
* **Onboard Effect & Telemetry**:
  * Routes UHF/S-Band RF signals through redundant Antenna B on the opposite chassis panel.
  * Eliminates directional blind spots if the satellite is tumbling or pointing off-target.
* **When to Use**:
  * When experiencing severe RF degradation, carrier attenuation, or nulls on the primary antenna during a pass.
  * While detumbling a satellite after uncontrolled spin.

---

### 2.5 `CMD_COMMS_THROTTLE_PA_LOW`
* **Canonical Opcode**: `CMD_COMMS_THROTTLE_PA_LOW`
* **Aliases**: `THROTTLE_PA`, `PA_LOW_POWER`
* **Primary Purpose**: Steps down the RF Power Amplifier (PA) transmission output power from maximum (e.g., 5W / 37 dBm) down to low power (1W / 30 dBm).
* **Onboard Effect & Telemetry**:
  * Prevents thermal runaway in the communications bay when radio temperatures exceed **55°C**.
  * Reduces Electrical Power Subsystem (EPS) bus load by **~8 to 12 Watts**.
* **When to Use**:
  * If temperature sensors on the radio transmitter trigger high-thermal warnings.
  * During long downlinks where battery reserves must be preserved.

---

### 2.6 `CMD_COMMS_RESET_RECEIVER`
* **Canonical Opcode**: `CMD_COMMS_RESET_RECEIVER`
* **Aliases**: `RESET_RECEIVER`, `REBOOT_SDR`
* **Primary Purpose**: Power-cycles the onboard Software Defined Radio (SDR) receiver and resets its digital signal processing buffer.
* **Onboard Effect & Telemetry**:
  * Clears receiver FIFO buffers, flushes corrupted frames, and restarts the Phase Locked Loop (PLL) synthesizer.
  * Receiver recovers nominal carrier lock within **2 to 3 seconds**.
* **When to Use**:
  * When the ground station reports uplink packet rejections or framing CRC errors.
  * In the event of a single-event upset (SEU) causing SDR firmware freeze.

---

### 2.7 `POINT_NADIR` (Comms Antenna Vector Alignment)
* **Canonical Opcode**: `POINT_NADIR`
* **Aliases**: `NADIR`
* **Primary Purpose**: Re-orients the satellite body Z-axis directly toward Earth's center (Nadir).
* **Onboard Effect & Telemetry**:
  * Fires ADCS reaction wheels to settle attitude at: `Roll: 0.1°`, `Pitch: 0.0°`, `Yaw: 0.0°`.
  * Points the directional communications antennas and optical payloads straight toward Earth.
* **When to Use**: Immediately prior to initiating high-speed X-Band data downlinks.

---

## 3. How to Send Communications Commands via API

### 3.1 REST API Payload Format
```bash
POST /api/telemetry/cubesat/command
Authorization: Bearer <OPERATOR_JWT_TOKEN>
Content-Type: application/json

{
  "satelliteId": "SAT-ORB-01",
  "command": "START_DATA_DOWNLINK",
  "params": {}
}
```

### 3.2 Command Line / cURL Example
```bash
curl -X POST http://localhost:4000/api/telemetry/cubesat/command \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"satelliteId": "SAT-ORB-01", "command": "PING_DIAGNOSTICS"}'
```

---

## 4. Ground Station Radio Frequency Quick Reference

| Channel Description | Frequency | Polarization | Protocol | Typical Ground Station |
| :--- | :--- | :--- | :--- | :--- |
| **UHF Beacon Downlink** | `437.525 MHz` | RHCP | AFSK / AX.25 (9.6 kbps) | GS-BLR-01 (Bengaluru), GS-SVB-02 (Svalbard) |
| **UHF Telecommand Uplink**| `435.150 MHz` | RHCP | GFSK / CCSDS (38.4 kbps)| GS-BLR-01 (Bengaluru), GS-HOU-03 (Houston) |
| **S-Band Telecommand**   | `2025.000 MHz`| Circular | CCSDS Space Packet     | Deep Space / High Priority Node |
| **X-Band Science Downlink**| `8450.000 MHz`| LHCP | DVB-S2 / OQPSK (150 Mbps)| Primary Ground Dish Trackers |
