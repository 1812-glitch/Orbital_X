#!/usr/bin/env python3
"""
OrbitalX AI Diagnostic Verification & Testing Tool
Tests the trained Aerospace Naive Bayes Classifier on CubeSat telemetry anomalies
and outer collision events, verifying diagnosis accuracy and 1-click mitigation telecommands.
"""

import os
import sys
import json
import random
import csv

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

AI_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AI_DIR)

from ai_inference_service import diagnose_telemetry, CLASSIFIER
from train_classifier import FEATURE_NAMES

PRESET_SCENARIOS = [
    {
        "name": "Space Debris Conjunction Threat (Outer Collision Threat)",
        "satellite_name": "Orbital Sentinel-1",
        "description": "Optical LIDAR detects orbital debris fragment at 112 meters closing fast.",
        "telemetry": {
            "battery_temp_k": 296.0,
            "battery_voltage_v": 8.15,
            "battery_current_a": 1.18,
            "bus_5v_rail": 5.01,
            "gyro_rate_deg_s": 0.22,
            "reaction_wheel_rpm": 3200,
            "wheel_current_a": 0.18,
            "rf_vswr": 1.15,
            "rf_power_w": 5.0,
            "cpu_temp_k": 308.0,
            "cpu_load_pct": 24.0,
            "memory_ecc_errors": 0,
            "i2c_bus_ack_pct": 100.0,
            "chassis_accelerometer_g": 0.04,
            "hull_pressure_kpa": 101.3,
            "lidar_range_m": 112.4,  # Critical < 250m!
            "relative_velocity_km_s": 11.4
        },
        "expected_failure_mode": "SPACE_DEBRIS_CONJUNCTION_THREAT",
        "expected_command": "CMD_PROP_ARM_CAM_BURN"
    },
    {
        "name": "Battery Cell Thermal Runaway (Inner EPS Failure)",
        "satellite_name": "AstroPulse-Alpha",
        "description": "Internal lithium cell short circuit heating battery to 339 K.",
        "telemetry": {
            "battery_temp_k": 339.2,  # Critical > 325 K!
            "battery_voltage_v": 9.15,
            "battery_current_a": 6.2,  # Critical > 4.5 A!
            "bus_5v_rail": 4.96,
            "gyro_rate_deg_s": 0.19,
            "reaction_wheel_rpm": 3100,
            "wheel_current_a": 0.17,
            "rf_vswr": 1.12,
            "rf_power_w": 4.95,
            "cpu_temp_k": 314.0,
            "cpu_load_pct": 26.0,
            "memory_ecc_errors": 0,
            "i2c_bus_ack_pct": 99.8,
            "chassis_accelerometer_g": 0.03,
            "hull_pressure_kpa": 101.2,
            "lidar_range_m": 85000.0
        },
        "expected_failure_mode": "BATTERY_CELL_THERMAL_RUNAWAY",
        "expected_command": "CMD_EPS_SAFE_MODE"
    },
    {
        "name": "Reaction Wheel Bearing Seizure (Inner ADCS Failure)",
        "satellite_name": "SpectraSat-9",
        "description": "Flywheel bearing stall causing motor current surge and uncommanded attitude rate.",
        "telemetry": {
            "battery_temp_k": 298.5,
            "battery_voltage_v": 8.08,
            "battery_current_a": 1.45,
            "bus_5v_rail": 5.0,
            "gyro_rate_deg_s": 3.42,  # Critical > 1.8 deg/s!
            "reaction_wheel_rpm": 45,  # Stalled < 180 RPM!
            "wheel_current_a": 1.55,  # Motor surge > 1.0 A!
            "rf_vswr": 1.18,
            "rf_power_w": 4.88,
            "cpu_temp_k": 311.5,
            "cpu_load_pct": 32.0,
            "memory_ecc_errors": 0,
            "i2c_bus_ack_pct": 99.9,
            "chassis_accelerometer_g": 0.08,
            "hull_pressure_kpa": 101.2,
            "lidar_range_m": 72000.0
        },
        "expected_failure_mode": "REACTION_WHEEL_BEARING_SEIZURE",
        "expected_command": "CMD_ADCS_DESPIN_WHEELS"
    },
    {
        "name": "Micrometeoroid Kinetic Impact (Outer Physical Damage)",
        "satellite_name": "Polaris-Dawn-Cube",
        "description": "Hypervelocity particle puncture triggering 11.2G shock and chassis depressurization.",
        "telemetry": {
            "battery_temp_k": 297.0,
            "battery_voltage_v": 8.11,
            "battery_current_a": 1.15,
            "bus_5v_rail": 5.01,
            "gyro_rate_deg_s": 7.85,  # Kinetic impulse tumble!
            "reaction_wheel_rpm": 3350,
            "wheel_current_a": 0.22,
            "rf_vswr": 1.25,
            "rf_power_w": 4.9,
            "cpu_temp_k": 312.0,
            "cpu_load_pct": 28.5,
            "memory_ecc_errors": 0,
            "i2c_bus_ack_pct": 99.5,
            "chassis_accelerometer_g": 11.24,  # Critical impact > 5.0G!
            "hull_pressure_kpa": 78.4,  # Pressure hull puncture!
            "lidar_range_m": 94000.0
        },
        "expected_failure_mode": "MICROMETEOROID_KINETIC_IMPACT",
        "expected_command": "CMD_EPS_SAFE_MODE"
    },
    {
        "name": "Radiation Single Event Upset (Inner OBC Failure)",
        "satellite_name": "CubeSat Ion-X",
        "description": "Trapped proton transit causing intense memory bit-flips and CPU thread lock.",
        "telemetry": {
            "battery_temp_k": 299.0,
            "battery_voltage_v": 8.05,
            "battery_current_a": 1.35,
            "bus_5v_rail": 4.98,
            "gyro_rate_deg_s": 0.21,
            "reaction_wheel_rpm": 3200,
            "wheel_current_a": 0.18,
            "rf_vswr": 1.14,
            "rf_power_w": 4.92,
            "cpu_temp_k": 332.0,
            "cpu_load_pct": 98.5,  # CPU thread saturation!
            "memory_ecc_errors": 84,  # Multiple bit traps!
            "i2c_bus_ack_pct": 98.2,
            "chassis_accelerometer_g": 0.04,
            "hull_pressure_kpa": 101.2,
            "lidar_range_m": 88000.0
        },
        "expected_failure_mode": "RADIATION_SINGLE_EVENT_UPSET",
        "expected_command": "CMD_OBC_MEM_SCRUB_ENABLE"
    }
]

def print_banner():
    print("=" * 78)
    print("       [*] ORBITALX AEROSPACE AI DIAGNOSTIC & MITIGATION TEST SUITE")
    print("=" * 78)

def test_preset(scenario, index):
    print(f"\n[TEST CASE {index}] {scenario['name']}")
    print(f"Satellite Asset : {scenario['satellite_name']}")
    print(f"Scenario Context: {scenario['description']}")
    
    result = diagnose_telemetry(scenario["telemetry"])
    classification = result["classification"]
    solution = result["one_click_solution"]
    diagnosis = result["diagnosis"]

    actual_mode = classification["failure_mode"]
    actual_cmd = solution["primary_telecommand"]
    expected_mode = scenario["expected_failure_mode"]
    expected_cmd = scenario["expected_command"]

    is_mode_match = (actual_mode == expected_mode)
    is_cmd_match = (actual_cmd == expected_cmd)

    status_str = "PASS [100% MATCH]" if (is_mode_match and is_cmd_match) else "FAIL"

    print("-" * 78)
    print(f"  Classification Domain   : {classification['domain']}")
    print(f"  Subsystem Affected      : {classification['subsystem']}")
    print(f"  Detected Failure Mode   : {actual_mode}  (Expected: {expected_mode})")
    print(f"  Confidence Score        : {classification['confidence_score_pct']}%")
    print(f"  Physical Root Cause     : {diagnosis['root_cause']}")
    print(f"  1-Click Telecommand     : {actual_cmd}  (Expected: {expected_cmd})")
    print(f"  Operator Action Button  : [{solution['action_label']}]")
    print(f"  Test Verification       : {status_str}")
    print("-" * 78)
    return is_mode_match and is_cmd_match

def test_dataset_random_batch(n=10):
    csv_file = os.path.join(AI_DIR, "satellite_telemetry_anomaly_dataset.csv")
    if not os.path.exists(csv_file):
        print(f"[!] Dataset CSV not found at {csv_file}")
        return

    print(f"\n[BENCHMARK] Testing {n} random samples drawn directly from the 10,000-row dataset...")
    rows = []
    with open(csv_file, "r", encoding="utf-8") as f:
        reader = list(csv.DictReader(f))
        rows = random.sample(reader, min(n, len(reader)))

    correct = 0
    for idx, r in enumerate(rows, 1):
        actual = diagnose_telemetry(r)
        pred_mode = actual["classification"]["failure_mode"]
        expected_mode = r["failure_mode"]
        match = (pred_mode == expected_mode)
        if match:
            correct += 1
        tag = "[OK]" if match else "[FAIL]"
        print(f"  Sample #{idx:02d} [{r['satellite_name']} | {r['subsystem']}]: "
              f"Predicted = {pred_mode:32} | Expected = {expected_mode:32} -> {tag}")

    pct = (correct / len(rows)) * 100.0
    print(f"\n-> Batch Diagnosis Accuracy: {correct}/{len(rows)} ({pct:.1f}%)\n")

def main():
    print_banner()

    if "--benchmark" in sys.argv or "-b" in sys.argv:
        test_dataset_random_batch(10)
        return

    # Run Preset Scenarios
    passes = 0
    for idx, sc in enumerate(PRESET_SCENARIOS, 1):
        ok = test_preset(sc, idx)
        if ok:
            passes += 1

    print(f"\n[SUMMARY] Passed {passes}/{len(PRESET_SCENARIOS)} aerospace emergency scenarios successfully!")
    print("\nNext steps you can run:")
    print("  1. Run random dataset benchmark: python AI/test_ai_diagnosis.py --benchmark")
    print("  2. Start REST API microservice : python AI/ai_inference_service.py --serve")
    print("  3. View in OrbitalX Web UI     : Open browser -> Mission Control -> Alerts -> Click [RUN AI ANOMALY DIAGNOSIS]\n")

if __name__ == "__main__":
    main()
