# 🛰️ OrbitalX AI Defense Suite Directory

Welcome to the **AI Defense & Anomaly Resolution Suite** for OrbitalX. This folder contains everything required to train, evaluate, serve, and understand the aerospace AI system that diagnoses **inner subsystem errors** and **outer collisions/physical damage**, providing operators with **1-click mitigation telecommands**.

---

## 📂 Folder Artifacts Summary

| File | Description | Size / Volume |
| :--- | :--- | :--- |
| **`OrbitalX_AI_Beginners_Guide.pdf`** | 📘 **Beginner's Operational Handbook & Manual** — Zero-jargon guide explaining how to use, test, and operate the AI in plain English. | Complete Beginner's PDF |
| **`OrbitalX_AI_Anomaly_and_Collision_Defense_Guide.pdf`** | 📑 **Official Engineering PDF Guide** detailing system architecture, failure taxonomy, mathematical foundations, and 1-click execution safety loops. | Formal PDF Document |
| **`AI_DEVELOPMENT_GUIDE.md`** | 📖 Markdown version of the complete engineering guide and operations manual. | Complete Markdown Guide |
| **`test_ai_diagnosis.py`** | 🧪 **Interactive Test & Benchmark CLI** — Tests preset emergency scenarios or benchmarks random dataset rows with 100% verification. | Test Tool |
| **`satellite_telemetry_anomaly_dataset.csv`** | 📊 **10,000 multi-feature telemetry records** covering 14 inner/outer failure modes across 16 sensor streams. | ~5.2 MB |
| **`ai_satellite_training_prompts.jsonl`** | 🧠 **10,000 prompt-completion pairs** formatted for fine-tuning LLMs (Llama 3, Mistral, Gemini, OpenAI). | ~22.0 MB |
| **`spacecraft_diagnostics_database.sqlite`** | 🗄️ **Relational database** containing `satellites`, `telemetry_incidents` (10,000 rows), and `telecommand_library` tables. | ~5.6 MB |
| **`generate_dataset.py`** | ⚙️ Python script to regenerate or scale the dataset to any capacity (`--samples 10000`) with physics-based sensor signatures. | Python Script |
| **`train_classifier.py`** | 🎯 Machine learning training script (100% test accuracy on inner/outer triage) saving `satellite_classifier_model.pkl`. | Python Script |
| **`satellite_classifier_model.pkl`** | 💾 Trained binary model ready for instant sub-millisecond inference. | Model Artifact |
| **`fine_tune_llm.py`** | 🚀 HuggingFace PEFT LoRA / QLoRA fine-tuning pipeline for open-source LLMs. | Python Script |
| **`ai_inference_service.py`** | 🌐 Standalone diagnosis engine and HTTP REST API microservice (`POST /diagnose` on port 5050). | Microservice Script |
| **`generate_pdf_guide.py`** | 🖨️ ReportLab script that compiles the official PDF guide. | Python Script |

---

## ⚡ Quick Start

### 1. Run a Test Inference
```bash
python AI/ai_inference_service.py
```

### 2. Start the AI Microservice for OrbitalX
```bash
python AI/ai_inference_service.py --serve
```

### 3. Retrain the AI Classifier
```bash
python AI/train_classifier.py
```

### 4. Regenerate or Scale the Training Database
```bash
python AI/generate_dataset.py
```
