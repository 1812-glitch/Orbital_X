#!/usr/bin/env python3
"""
OrbitalX AI Dataset Generator
Generates massive, high-fidelity datasets for training aerospace AI models
to detect inner subsystem errors and outer physical damage/collision events,
providing 1-click executable mitigation telecommands.
"""

import os
import json
import csv
import sqlite3
import random
import datetime
import argparse

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

# Subsystems and Failure Taxonomies
INNER_FAILURES = [
    {
        "subsystem": "EPS",
        "category": "INNER_ERROR",
        "failure_mode": "BATTERY_CELL_THERMAL_RUNAWAY",
        "telecommand": "CMD_EPS_SAFE_MODE",
        "alt_telecommands": ["CMD_EPS_CHARGE_CUTOFF", "CMD_EPS_SWITCH_BUS_B"],
        "severity": "CRITICAL",
        "description": "Internal dendritic lithium short-circuit causing rapid exothermic cell heating.",
        "sop": "1. Isolate primary battery bus. 2. Shed non-essential instrument loads. 3. Engage trickle regulator. 4. Orient solar arrays away from specular normal."
    },
    {
        "subsystem": "EPS",
        "category": "INNER_ERROR",
        "failure_mode": "5V_REGULATOR_COLLAPSE",
        "telecommand": "CMD_EPS_SWITCH_BUS_B",
        "alt_telecommands": ["CMD_EPS_LOAD_SHED_NON_ESSENTIAL"],
        "severity": "CRITICAL",
        "description": "DC-DC step down converter gate failure causing severe voltage drop on main avionics rail.",
        "sop": "1. Telecommand power transfer to redundant bus B. 2. Verify rail stability at 5.02V. 3. Re-engage critical OBC telemetry."
    },
    {
        "subsystem": "ADCS",
        "category": "INNER_ERROR",
        "failure_mode": "REACTION_WHEEL_BEARING_SEIZURE",
        "telecommand": "CMD_ADCS_DESPIN_WHEELS",
        "alt_telecommands": ["CMD_ADCS_DETUMBLE_BDOT", "CMD_ADCS_SAFE_SUN_POINT"],
        "severity": "HIGH",
        "description": "Vacuum cold welding and lubricant breakdown causing sudden mechanical stall of Y-axis flywheel.",
        "sop": "1. De-energize failed flywheel motor to prevent FET driver thermal damage. 2. Assert magnetic torquer B-dot control. 3. Re-bias 3-axis attitude authority to X/Z wheel pair."
    },
    {
        "subsystem": "ADCS",
        "category": "INNER_ERROR",
        "failure_mode": "UNCOMMANDED_GYROSCOPIC_TUMBLE",
        "telecommand": "CMD_ADCS_DETUMBLE_BDOT",
        "alt_telecommands": ["CMD_ADCS_RESET_GYRO_BIAS", "CMD_ADCS_SAFE_SUN_POINT"],
        "severity": "CRITICAL",
        "description": "Rate gyroscope sensor drift combined with thruster latch valve leakage inducing 18.5 deg/sec rotational tumble.",
        "sop": "1. Energize electromagnetic torquer rods at 100% duty cycle. 2. Counter angular momentum vector against geomagnetic field. 3. Lock sun sensors once rate < 1.0 deg/sec."
    },
    {
        "subsystem": "COMMS",
        "category": "INNER_ERROR",
        "failure_mode": "RF_AMPLIFIER_OVERTEMP",
        "telecommand": "CMD_COMMS_THROTTLE_PA_LOW",
        "alt_telecommands": ["CMD_COMMS_BEACON_MODE"],
        "severity": "HIGH",
        "description": "Prolonged high-throughput S-band downlink pass inducing excessive heat dissipation in GaN power amplifier.",
        "sop": "1. Command RF output drop from 5W to 250mW beacon mode. 2. Verify thermal sink decay rate. 3. Schedule next downlink after thermal equilibrium is restored."
    },
    {
        "subsystem": "COMMS",
        "category": "INNER_ERROR",
        "failure_mode": "ANTENNA_FEED_IMPEDANCE_MISMATCH",
        "telecommand": "CMD_COMMS_SWITCH_ANTENNA_B",
        "alt_telecommands": ["CMD_COMMS_RESET_RECEIVER"],
        "severity": "HIGH",
        "description": "Thermal expansion distortion on co-axial feed causing reflected power VSWR to exceed 4.5:1.",
        "sop": "1. Reroute RF front-end duplexer to secondary omnidirectional patch array. 2. Confirm VSWR < 1.5:1 on telemetry."
    },
    {
        "subsystem": "TCS",
        "category": "INNER_ERROR",
        "failure_mode": "ECLIPSE_DEEP_FREEZE",
        "telecommand": "CMD_TCS_HEATER1_FORCE_ON",
        "alt_telecommands": ["CMD_TCS_DUTY_CYCLE_OVERRIDE"],
        "severity": "HIGH",
        "description": "Autonomous thermostat relay failed to trip entering penumbra; battery temperature drops below 254K.",
        "sop": "1. Force closed survival heater line 1 via direct telecommand. 2. Verify heating current draw (+1.8A). 3. Monitor core temperature recovery to > 273K."
    },
    {
        "subsystem": "OBC",
        "category": "INNER_ERROR",
        "failure_mode": "RADIATION_SINGLE_EVENT_UPSET",
        "telecommand": "CMD_OBC_MEM_SCRUB_ENABLE",
        "alt_telecommands": ["CMD_OBC_WARM_REBOOT", "CMD_OBC_RELOAD_GOLDEN_IMAGE"],
        "severity": "CRITICAL",
        "description": "Trapped proton transit during South Atlantic Anomaly (SAA) causing multi-bit memory register corruption.",
        "sop": "1. Trigger aggressive ECC memory scrubbing engine. 2. Validate checksum on boot ROM partition. 3. If bit corruption persists, command warm reboot to golden image."
    },
    {
        "subsystem": "OBC",
        "category": "INNER_ERROR",
        "failure_mode": "I2C_TELEMETRY_BUS_HANG",
        "telecommand": "CMD_OBC_I2C_BUS_RESET",
        "alt_telecommands": ["CMD_OBC_WARM_REBOOT"],
        "severity": "MEDIUM",
        "description": "Peripheral sensor latchup pulling I2C clock line (SCL) low, stalling whole-spacecraft health monitoring.",
        "sop": "1. Issue 16 hardware toggle pulses on SCL clock line. 2. Clear master arbitration register. 3. Confirm sensor telemetry packets resume."
    }
]

OUTER_FAILURES = [
    {
        "subsystem": "ENV_STRUCTURE",
        "category": "OUTER_COLLISION_DAMAGE",
        "failure_mode": "SPACE_DEBRIS_CONJUNCTION_THREAT",
        "telecommand": "CMD_PROP_ARM_CAM_BURN",
        "alt_telecommands": ["CMD_ADCS_MIN_CROSS_SECTION"],
        "severity": "CRITICAL",
        "description": "Radar tracking detects 5cm defunct satellite fragmentation debris with miss distance < 180m, Pc = 4.2e-3.",
        "sop": "1. Arm autonomous collision avoidance cold-gas thruster. 2. Calculate delta-V vector (+0.85 m/s along radial vector). 3. Execute 4.2-second burn to expand miss distance to > 2.5 km."
    },
    {
        "subsystem": "ENV_STRUCTURE",
        "category": "OUTER_COLLISION_DAMAGE",
        "failure_mode": "MICROMETEOROID_KINETIC_IMPACT",
        "telecommand": "CMD_EPS_SAFE_MODE",
        "alt_telecommands": ["CMD_ADCS_DETUMBLE_BDOT", "CMD_TCS_COOLING_SLEW"],
        "severity": "CRITICAL",
        "description": "High-velocity hypervelocity particle (2mm @ 14 km/s) impacted outer structural honeycomb rail; sudden 8.5G accelerometer spike detected.",
        "sop": "1. Assess hull pressure sensor and bus continuity. 2. Execute 1-click safe mode to prevent electrical arcing across punctured solar harness. 3. Detumble spacecraft using B-dot coils."
    },
    {
        "subsystem": "ENV_STRUCTURE",
        "category": "OUTER_COLLISION_DAMAGE",
        "failure_mode": "SOLAR_WING_COLLISION_SEVERANCE",
        "telecommand": "CMD_EPS_SWITCH_BUS_B",
        "alt_telecommands": ["CMD_ADCS_MIN_CROSS_SECTION", "CMD_EPS_LOAD_SHED_NON_ESSENTIAL"],
        "severity": "CRITICAL",
        "description": "Orbital debris swipe severed Port-side solar panel deployable bracket; generation dropped by 52%, asymmetric torque induced.",
        "sop": "1. Isolate severed port solar bus immediately. 2. Shed payload instruments to balance Starboard array capacity. 3. Adjust reaction wheel biases to counter asymmetric solar photon pressure."
    },
    {
        "subsystem": "ENV_STRUCTURE",
        "category": "OUTER_COLLISION_DAMAGE",
        "failure_mode": "OPTICAL_PAYLOAD_LENS_DEBRIS_PITTING",
        "telecommand": "CMD_PAYLOAD_SHUTTER_CLOSE",
        "alt_telecommands": ["CMD_PAYLOAD_SAFE_POWER_DOWN"],
        "severity": "HIGH",
        "description": "Dust particle bombardment pitted nadir camera front optical aperture; image contrast collapsed with high scattering glare.",
        "sop": "1. Deploy motorized dust shutter over camera optic. 2. Power down optical sensor CCD array to prevent thermal well saturation. 3. Switch observation schedule to secondary RF radar payload."
    },
    {
        "subsystem": "ENV_STRUCTURE",
        "category": "OUTER_COLLISION_DAMAGE",
        "failure_mode": "SEVERE_SOLAR_PROTON_STORM",
        "telecommand": "CMD_OBC_RADIATION_SAFE_MODE",
        "alt_telecommands": ["CMD_EPS_SAFE_MODE", "CMD_PAYLOAD_SAFE_POWER_DOWN"],
        "severity": "CRITICAL",
        "description": "GOES space weather alert: Major X9.3 solar coronal mass ejection (CME) impacting magnetosphere; proton flux > 2500 pfu.",
        "sop": "1. Put On-Board Computer into radiation safe mode. 2. Power down sensitive CMOS focal planes. 3. Sleep high-gain RF transmitters to avoid electrostatic discharge (ESD) latchups."
    },
    {
        "subsystem": "ENV_STRUCTURE",
        "category": "OUTER_COLLISION_DAMAGE",
        "failure_mode": "ANTENNA_MAST_DEBRIS_DEFLECTION",
        "telecommand": "CMD_COMMS_SWITCH_ANTENNA_B",
        "alt_telecommands": ["CMD_ADCS_SAFE_SUN_POINT"],
        "severity": "HIGH",
        "description": "Graze collision with trackable millimeter debris bent primary whip antenna 45 degrees off-axis; uplink signal collapsed by -28 dB.",
        "sop": "1. Switch RF transceiver to secondary omnidirectional patch antenna B. 2. Command attitude slew to orient patch normal to ground station line of sight."
    }
]

SATELLITE_NAMES = [
    "CubeSat Ion-X", "Orbital Sentinel-1", "AeroVanguard 3U", "AstroPulse-Alpha",
    "SpectraSat-9", "Helios-2 LEO", "NovaLink Smallsat", "CosmoSurveyor-4"
]

def generate_telemetry_record(event, sat_id, timestamp):
    cat = event["category"]
    mode = event["failure_mode"]
    
    # Baseline nominal values
    batt_temp = round(random.uniform(288.0, 305.0), 2)
    batt_volt = round(random.uniform(7.8, 8.35), 2)
    batt_curr = round(random.uniform(0.8, 1.8), 2)
    bus_5v = round(random.uniform(4.98, 5.05), 2)
    gyro_rate = round(random.uniform(0.05, 0.45), 3)
    wheel_rpm = random.randint(2200, 4100)
    wheel_curr = round(random.uniform(0.12, 0.28), 2)
    vswr = round(random.uniform(1.08, 1.35), 2)
    rf_power = round(random.uniform(4.5, 5.2), 2)
    cpu_temp = round(random.uniform(300.0, 325.0), 2)
    cpu_load = round(random.uniform(18.0, 45.0), 1)
    ecc_errors = 0
    i2c_ack = round(random.uniform(99.0, 100.0), 1)
    accel_g = round(random.uniform(0.01, 0.08), 3)
    hull_kpa = round(random.uniform(101.0, 101.5), 1)
    lidar_m = round(random.uniform(50000.0, 120000.0), 1)
    rel_vel = round(random.uniform(0.01, 0.5), 2)
    solar_flux = round(random.uniform(1340.0, 1370.0), 1)

    # Inject anomaly signatures
    if mode == "BATTERY_CELL_THERMAL_RUNAWAY":
        batt_temp = round(random.uniform(326.0, 345.0), 2)
        batt_volt = round(random.uniform(8.7, 9.4), 2)
        batt_curr = round(random.uniform(4.2, 7.5), 2)
    elif mode == "5V_REGULATOR_COLLAPSE":
        bus_5v = round(random.uniform(2.8, 3.8), 2)
    elif mode == "REACTION_WHEEL_BEARING_SEIZURE":
        wheel_rpm = random.randint(0, 180)
        wheel_curr = round(random.uniform(0.95, 1.8), 2)
        gyro_rate = round(random.uniform(1.8, 4.5), 3)
    elif mode == "UNCOMMANDED_GYROSCOPIC_TUMBLE":
        gyro_rate = round(random.uniform(8.5, 24.0), 3)
        wheel_rpm = random.randint(5500, 6800)
    elif mode == "RF_AMPLIFIER_OVERTEMP":
        cpu_temp = round(random.uniform(345.0, 362.0), 2)
        rf_power = round(random.uniform(1.2, 2.5), 2)
    elif mode == "ANTENNA_FEED_IMPEDANCE_MISMATCH":
        vswr = round(random.uniform(3.8, 6.5), 2)
        rf_power = round(random.uniform(0.8, 2.1), 2)
    elif mode == "ECLIPSE_DEEP_FREEZE":
        batt_temp = round(random.uniform(240.0, 258.0), 2)
        cpu_temp = round(random.uniform(248.0, 260.0), 2)
    elif mode == "RADIATION_SINGLE_EVENT_UPSET":
        ecc_errors = random.randint(28, 180)
        cpu_load = round(random.uniform(92.0, 100.0), 1)
    elif mode == "I2C_TELEMETRY_BUS_HANG":
        i2c_ack = round(random.uniform(5.0, 35.0), 1)
    # Outer collision / physical damage signatures
    elif mode == "SPACE_DEBRIS_CONJUNCTION_THREAT":
        lidar_m = round(random.uniform(85.0, 450.0), 1)
        rel_vel = round(random.uniform(7.8, 14.5), 2)
    elif mode == "MICROMETEOROID_KINETIC_IMPACT":
        accel_g = round(random.uniform(4.5, 18.2), 3)
        gyro_rate = round(random.uniform(3.5, 12.0), 3)
        hull_kpa = round(random.uniform(72.0, 91.0), 1)
    elif mode == "SOLAR_WING_COLLISION_SEVERANCE":
        accel_g = round(random.uniform(3.8, 9.2), 3)
        batt_curr = round(random.uniform(0.2, 0.6), 2)
        solar_flux = round(random.uniform(580.0, 750.0), 1)
        gyro_rate = round(random.uniform(1.5, 5.2), 3)
    elif mode == "OPTICAL_PAYLOAD_LENS_DEBRIS_PITTING":
        accel_g = round(random.uniform(1.1, 3.4), 3)
    elif mode == "SEVERE_SOLAR_PROTON_STORM":
        solar_flux = round(random.uniform(1580.0, 2100.0), 1)
        ecc_errors = random.randint(110, 450)
        cpu_temp = round(random.uniform(330.0, 348.0), 2)
    elif mode == "ANTENNA_MAST_DEBRIS_DEFLECTION":
        accel_g = round(random.uniform(1.8, 4.2), 3)
        vswr = round(random.uniform(4.5, 8.2), 2)
        rf_power = round(random.uniform(0.5, 1.5), 2)

    return {
        "timestamp": timestamp.isoformat(),
        "satellite_name": SATELLITE_NAMES[sat_id % len(SATELLITE_NAMES)],
        "subsystem": event["subsystem"],
        "anomaly_category": event["category"],
        "failure_mode": event["failure_mode"],
        "severity": event["severity"],
        "battery_temp_k": batt_temp,
        "battery_voltage_v": batt_volt,
        "battery_current_a": batt_curr,
        "bus_5v_rail": bus_5v,
        "gyro_rate_deg_s": gyro_rate,
        "reaction_wheel_rpm": wheel_rpm,
        "wheel_current_a": wheel_curr,
        "rf_vswr": vswr,
        "rf_power_w": rf_power,
        "cpu_temp_k": cpu_temp,
        "cpu_load_pct": cpu_load,
        "memory_ecc_errors": ecc_errors,
        "i2c_bus_ack_pct": i2c_ack,
        "chassis_accelerometer_g": accel_g,
        "hull_pressure_kpa": hull_kpa,
        "lidar_range_m": lidar_m,
        "relative_velocity_km_s": rel_vel,
        "solar_flux_w_m2": solar_flux,
        "recommended_telecommand": event["telecommand"],
        "alt_telecommands": ";".join(event["alt_telecommands"]),
        "root_cause_analysis": event["description"],
        "sop_checklist": event["sop"],
        "one_click_solvable": True,
        "execution_safety_confidence": round(random.uniform(0.95, 0.99), 4)
    }

def generate_llm_sample(rec):
    prompt = f"""[ORBITALX AEROSPACE MISSION CONTROL TELEMETRY SNAPSHOT]
Satellite: {rec['satellite_name']}
Subsystem: {rec['subsystem']}
Category: {rec['anomaly_category']}
Timestamp: {rec['timestamp']}

Sensor Ingestion Stream:
- Battery Temperature: {rec['battery_temp_k']} K
- Battery Voltage: {rec['battery_voltage_v']} V | Current: {rec['battery_current_a']} A
- 5V Regulated Rail: {rec['bus_5v_rail']} V
- Gyroscopic Angular Rate: {rec['gyro_rate_deg_s']} deg/s
- Reaction Wheel Speed: {rec['reaction_wheel_rpm']} RPM | Motor Current: {rec['wheel_current_a']} A
- RF Antenna VSWR: {rec['rf_vswr']} : 1 | RF Output: {rec['rf_power_w']} W
- Processor Core Temp: {rec['cpu_temp_k']} K | CPU Load: {rec['cpu_load_pct']}%
- Memory ECC Parity Traps: {rec['memory_ecc_errors']} errors/orbit
- I2C Bus Acknowledgment: {rec['i2c_bus_ack_pct']}%
- Chassis Accelerometer Shock: {rec['chassis_accelerometer_g']} G
- Hull Pressure: {rec['hull_pressure_kpa']} kPa
- LIDAR Target Miss Distance: {rec['lidar_range_m']} m (Rel Velocity: {rec['relative_velocity_km_s']} km/s)
- Solar Flux: {rec['solar_flux_w_m2']} W/m^2

Task: Analyze incoming telemetry. Classify whether this is an Inner Subsystem Error or Outer Collision/Physical Damage. State the specific failure mode, root-cause physics, standard operating procedure (SOP), and formulate the exact 1-Click Mitigation Telecommand for immediate operator dispatch."""

    completion = f"""### AI MISSION COPILOT DIAGNOSIS & RECOVERY DISPATCH

**1. Incident Classification:**
- **Anomaly Domain:** {rec['anomaly_category']}
- **Primary Subsystem:** {rec['subsystem']}
- **Failure Mode Signature:** {rec['failure_mode']}
- **Severity Rating:** {rec['severity']}
- **Autonomous Confidence Level:** {int(rec['execution_safety_confidence'] * 100)}%

**2. Physical Root-Cause Analysis (RCA):**
{rec['root_cause_analysis']}

**3. Standard Operating Procedure (SOP):**
{rec['sop_checklist']}

**4. One-Click Executable Telecommand:**
`{rec['recommended_telecommand']}`
(Fallback Redundancy Commands: `{rec['alt_telecommands']}`)

**5. Verification & Telemetry Confirmation Gate:**
Upon operator 1-click transmission of `{rec['recommended_telecommand']}`, monitor telemetry bus for command counter ACK increment (+1), state of health transition to STABLE within 15 seconds, and bus stabilization."""

    return {
        "instruction": prompt,
        "input": "",
        "output": completion,
        "metadata": {
            "satellite": rec["satellite_name"],
            "failure_mode": rec["failure_mode"],
            "telecommand": rec["recommended_telecommand"],
            "severity": rec["severity"]
        }
    }

def main():
    parser = argparse.ArgumentParser(description="Generate OrbitalX AI Telemetry Datasets")
    parser.add_argument("--samples", "--rows", "-n", type=int, default=10000, help="Number of telemetry samples to generate (default: 10000)")
    args = parser.parse_args()

    total_samples = args.samples
    print(f"Generating OrbitalX AI Datasets ({total_samples} samples: Inner Errors + Outer Collisions)...")
    
    csv_file = os.path.join(OUTPUT_DIR, "satellite_telemetry_anomaly_dataset.csv")
    jsonl_file = os.path.join(OUTPUT_DIR, "ai_satellite_training_prompts.jsonl")
    sqlite_file = os.path.join(OUTPUT_DIR, "spacecraft_diagnostics_database.sqlite")

    all_events = INNER_FAILURES + OUTER_FAILURES
    records = []
    
    start_time = datetime.datetime.now() - datetime.timedelta(days=60)
    total_seconds_span = 60 * 86400  # 60 days in seconds
    sec_per_sample = max(1.0, total_seconds_span / max(1, total_samples))

    for i in range(total_samples):
        event = random.choice(all_events)
        sat_id = random.randint(0, len(SATELLITE_NAMES) - 1)
        record_time = start_time + datetime.timedelta(seconds=int(i * sec_per_sample + random.uniform(0, sec_per_sample)))
        rec = generate_telemetry_record(event, sat_id, record_time)
        records.append(rec)

    # 1. Export CSV
    keys = list(records[0].keys())
    with open(csv_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=keys)
        writer.writeheader()
        writer.writerows(records)
    print(f"-> Generated CSV Dataset: {csv_file} ({len(records)} rows)")

    # 2. Export JSONL (for fine-tuning LLMs)
    with open(jsonl_file, "w", encoding="utf-8") as f:
        for rec in records:
            llm_item = generate_llm_sample(rec)
            f.write(json.dumps(llm_item) + "\n")
    print(f"-> Generated JSONL Dataset: {jsonl_file} ({len(records)} prompt-completion pairs)")

    # 3. Create SQLite Database
    if os.path.exists(sqlite_file):
        os.remove(sqlite_file)
    conn = sqlite3.connect(sqlite_file)
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE satellites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        mass_kg REAL,
        orbit_type TEXT,
        status TEXT
    )
    """)

    cur.execute("""
    CREATE TABLE telemetry_incidents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        satellite_name TEXT,
        subsystem TEXT,
        anomaly_category TEXT,
        failure_mode TEXT,
        severity TEXT,
        battery_temp_k REAL,
        battery_voltage_v REAL,
        battery_current_a REAL,
        bus_5v_rail REAL,
        gyro_rate_deg_s REAL,
        reaction_wheel_rpm INTEGER,
        wheel_current_a REAL,
        rf_vswr REAL,
        rf_power_w REAL,
        cpu_temp_k REAL,
        cpu_load_pct REAL,
        memory_ecc_errors INTEGER,
        i2c_bus_ack_pct REAL,
        chassis_accelerometer_g REAL,
        hull_pressure_kpa REAL,
        lidar_range_m REAL,
        relative_velocity_km_s REAL,
        solar_flux_w_m2 REAL,
        recommended_telecommand TEXT,
        root_cause_analysis TEXT,
        sop_checklist TEXT,
        one_click_solvable INTEGER,
        execution_safety_confidence REAL
    )
    """)

    cur.execute("""
    CREATE TABLE telecommand_library (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telecommand TEXT UNIQUE,
        target_subsystem TEXT,
        description TEXT,
        risk_level TEXT
    )
    """)

    # Populate satellites
    for sat in SATELLITE_NAMES:
        cur.execute("INSERT OR IGNORE INTO satellites (name, mass_kg, orbit_type, status) VALUES (?, ?, ?, ?)",
                    (sat, round(random.uniform(4.0, 16.0), 1), "LEO - 550km SSO", "ACTIVE"))

    # Populate telecommands
    commands_set = {}
    for ev in all_events:
        cmd = ev["telecommand"]
        if cmd not in commands_set:
            commands_set[cmd] = (cmd, ev["subsystem"], f"Automated 1-click mitigation for {ev['failure_mode']}", ev["severity"])
        for alt in ev["alt_telecommands"]:
            if alt not in commands_set:
                commands_set[alt] = (alt, ev["subsystem"], f"Redundant backup command for {ev['failure_mode']}", "HIGH")

    for c in commands_set.values():
        cur.execute("INSERT OR IGNORE INTO telecommand_library (telecommand, target_subsystem, description, risk_level) VALUES (?, ?, ?, ?)", c)

    # Populate incidents
    insert_sql = f"""
    INSERT INTO telemetry_incidents (
        {', '.join(keys[0:22])}, recommended_telecommand, root_cause_analysis, sop_checklist, one_click_solvable, execution_safety_confidence
    ) VALUES ({', '.join(['?'] * 27)})
    """
    
    rows_to_insert = [
        (
            r["timestamp"], r["satellite_name"], r["subsystem"], r["anomaly_category"],
            r["failure_mode"], r["severity"], r["battery_temp_k"], r["battery_voltage_v"],
            r["battery_current_a"], r["bus_5v_rail"], r["gyro_rate_deg_s"], r["reaction_wheel_rpm"],
            r["wheel_current_a"], r["rf_vswr"], r["rf_power_w"], r["cpu_temp_k"],
            r["cpu_load_pct"], r["memory_ecc_errors"], r["i2c_bus_ack_pct"], r["chassis_accelerometer_g"],
            r["hull_pressure_kpa"], r["lidar_range_m"], r["recommended_telecommand"],
            r["root_cause_analysis"], r["sop_checklist"], 1 if r["one_click_solvable"] else 0,
            r["execution_safety_confidence"]
        ) for r in records
    ]
    cur.executemany(insert_sql, rows_to_insert)
    conn.commit()
    conn.close()
    print(f"-> Generated SQLite Production Database: {sqlite_file} (Tables: satellites, telemetry_incidents, telecommand_library)")
    print("Dataset generation completed successfully!")

if __name__ == "__main__":
    main()
