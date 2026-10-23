#!/usr/bin/env python3
"""
OrbitalX AI Diagnostic Inference Microservice
Provides real-time anomaly & outer collision diagnostics.
Accepts live telemetry, returns physical root-cause analysis,
and equips operators with an instant 1-click executable mitigation telecommand.
"""

import os
import json
import pickle
import http.server
import socketserver

AI_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_FILE = os.path.join(AI_DIR, "satellite_classifier_model.pkl")

import train_classifier
from train_classifier import AerospaceNaiveBayesClassifier

class AerospaceUnpickler(pickle.Unpickler):
    def find_class(self, module, name):
        if name == 'AerospaceNaiveBayesClassifier':
            return AerospaceNaiveBayesClassifier
        return super().find_class(module, name)

# Load model
if not os.path.exists(MODEL_FILE):
    print(f"[!] Warning: Model file {MODEL_FILE} not found. Running training first...")
    train_classifier.main()

with open(MODEL_FILE, "rb") as f:
    CLASSIFIER = AerospaceUnpickler(f).load()

print("[OK] Loaded OrbitalX Aerospace Diagnostic AI Model.")

def diagnose_telemetry(telemetry_dict):
    """
    Extracts features from incoming telemetry JSON and runs model inference.
    """
    feature_keys = [
        "battery_temp_k", "battery_voltage_v", "battery_current_a", "bus_5v_rail",
        "gyro_rate_deg_s", "reaction_wheel_rpm", "wheel_current_a", "rf_vswr",
        "rf_power_w", "cpu_temp_k", "cpu_load_pct", "memory_ecc_errors",
        "i2c_bus_ack_pct", "chassis_accelerometer_g", "hull_pressure_kpa", "lidar_range_m"
    ]
    
    # Defaults to nominal if not provided in telemetry
    defaults = {
        "battery_temp_k": 298.0, "battery_voltage_v": 8.1, "battery_current_a": 1.2,
        "bus_5v_rail": 5.0, "gyro_rate_deg_s": 0.2, "reaction_wheel_rpm": 3200,
        "wheel_current_a": 0.18, "rf_vswr": 1.2, "rf_power_w": 5.0,
        "cpu_temp_k": 310.0, "cpu_load_pct": 25.0, "memory_ecc_errors": 0,
        "i2c_bus_ack_pct": 100.0, "chassis_accelerometer_g": 0.05,
        "hull_pressure_kpa": 101.3, "lidar_range_m": 80000.0
    }
    
    vec = []
    for k in feature_keys:
        val = telemetry_dict.get(k, defaults[k])
        vec.append(float(val))
        
    result = CLASSIFIER.predict_one(vec)
    
    # Structure payload for OrbitalX 1-Click Dispatch
    response = {
        "satellite": telemetry_dict.get("satellite_name", "Target Spacecraft"),
        "timestamp": telemetry_dict.get("timestamp", "2026-10-20T15:30:00Z"),
        "classification": {
            "domain": result["anomaly_category"],
            "subsystem": result["subsystem"],
            "failure_mode": result["predicted_failure_mode"],
            "severity": result["severity"],
            "confidence_score_pct": round(result["confidence_score"] * 100, 1)
        },
        "diagnosis": {
            "root_cause": result["root_cause_analysis"],
            "standard_operating_procedure": result["sop_checklist"]
        },
        "one_click_solution": {
            "primary_telecommand": result["recommended_telecommand"],
            "action_label": f"EXECUTE 1-CLICK DISPATCH: {result['recommended_telecommand']}",
            "execution_endpoint": "/api/satellites/command",
            "payload": {
                "command": result["recommended_telecommand"],
                "authorization_level": "OPERATOR",
                "bypass_safety_interlock": False
            },
            "status": "READY_FOR_OPERATOR_CLICK"
        }
    }
    return response

class DiagnosticsHTTPHandler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == "/diagnose":
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                telemetry = json.loads(post_data.decode('utf-8'))
                res = diagnose_telemetry(telemetry)
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps(res, indent=2).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def do_GET(self):
        if self.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ONLINE", "model": "OrbitalX Aerospace AI"}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

def run_server(port=5050):
    print(f"\n=======================================================")
    print(f"[ORBITALX] AI Inference Server starting on port {port}...")
    print(f"-> Health Check: http://localhost:{port}/health")
    print(f"-> Diagnosis Endpoint: POST http://localhost:{port}/diagnose")
    print(f"=======================================================\n")
    with socketserver.TCPServer(("", port), DiagnosticsHTTPHandler) as httpd:
        httpd.serve_forever()

if __name__ == "__main__":
    import sys
    if "--serve" in sys.argv:
        run_server()
    else:
        # Run local test
        print("Running sample inference test:")
        test_case = {
            "satellite_name": "CubeSat Ion-X",
            "chassis_accelerometer_g": 14.8,  # Sudden 14.8G outer impact
            "gyro_rate_deg_s": 8.5,
            "hull_pressure_kpa": 82.0
        }
        output = diagnose_telemetry(test_case)
        print(json.dumps(output, indent=2))
        print("\nTo start HTTP microservice server, run: python ai_inference_service.py --serve")
