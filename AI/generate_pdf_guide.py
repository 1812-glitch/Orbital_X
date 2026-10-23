#!/usr/bin/env python3
"""
OrbitalX AI Defense System Guide PDF Generator
Creates an aerospace-grade, beautifully formatted PDF engineering manual.
"""

import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

PDF_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "OrbitalX_AI_Anomaly_and_Collision_Defense_Guide.pdf")

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Draw running header (pages 2+)
        if self._pageNumber > 1:
            self.drawString(54, 755, "ORBITALX AEROSPACE MISSION CONTROL — AI DEFENSE & 1-CLICK MITIGATION GUIDE")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, 747, letter[0] - 54, 747)

        # Running footer
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(letter[0] - 54, 36, page_str)
        self.drawString(54, 36, "CONFIDENTIAL & PROPRIETARY — ORBITALX AUTONOMOUS FLIGHT OPERATIONS")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 48, letter[0] - 54, 48)
        self.restoreState()

def create_guide_pdf():
    doc = SimpleDocTemplate(
        PDF_PATH,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom styles
    c_primary = colors.HexColor("#0A2540")
    c_cyan = colors.HexColor("#0077B6")
    c_dark = colors.HexColor("#1E293B")
    c_accent = colors.HexColor("#0284C7")
    c_light_bg = colors.HexColor("#F8FAFC")
    c_callout_bg = colors.HexColor("#F0F9FF")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=c_primary,
        alignment=0,
        spaceAfter=8
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=c_cyan,
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'DocH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=c_primary,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'DocH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=c_accent,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=c_dark,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'DocBullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=c_dark,
        leftIndent=14,
        spaceAfter=3
    )

    code_style = ParagraphStyle(
        'DocCode',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#0F172A")
    )

    callout_style = ParagraphStyle(
        'DocCallout',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#0369A1")
    )

    story = []

    # Title Block
    story.append(Paragraph("ORBITALX MISSION OPERATIONS", ParagraphStyle('Badge', fontName='Helvetica-Bold', fontSize=9, textColor=c_cyan, spaceAfter=4)))
    story.append(Paragraph("Aerospace AI Anomaly & Outer Collision Defense System", title_style))
    story.append(Paragraph("Engineering Specification, Training Manual & 1-Click Mitigation Architecture", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_cyan, spaceBefore=4, spaceAfter=14))

    # Executive Summary Card
    meta_data = [
        [
            Paragraph("<b>Document Version:</b> 2.4.0", body_style),
            Paragraph("<b>Target Platform:</b> OrbitalX CubeSat Constellations", body_style)
        ],
        [
            Paragraph("<b>AI Model Architecture:</b> Hybrid Naive Bayes + LLM Copilot", body_style),
            Paragraph("<b>Dataset Capacity:</b> 10,000+ Multi-Dimensional Records", body_style)
        ],
        [
            Paragraph("<b>Core Capabilities:</b> Inner Component Faults + Outer Collision Triage", body_style),
            Paragraph("<b>Mitigation:</b> Sub-Second Single-Click Telecommand Dispatch", body_style)
        ]
    ]
    t_meta = Table(meta_data, colWidths=[240, 260])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_light_bg),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#E2E8F0")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 12))

    # Section 1: Executive Overview
    story.append(Paragraph("1. Executive Overview & System Architecture", h1_style))
    story.append(Paragraph(
        "Modern spacecraft operations in Low Earth Orbit (LEO) demand autonomous intelligence capable of distinguishing between "
        "<b>inner subsystem failures</b> (such as power converter brownouts, reaction wheel bearing stalls, and thermal runaway) "
        "and <b>outer physical damage events</b> (such as hypervelocity micrometeoroid impacts, space debris conjunctions, "
        "and solar array shear collisions).", body_style
    ))
    story.append(Paragraph(
        "The OrbitalX AI Defense Architecture unifies continuous multi-subsystem telemetry stream ingestion, physics-based feature extraction, "
        "and a dual-tier diagnostic machine learning engine to present the flight operator with instant root-cause analysis and an actionable, "
        "<b>Single-Click Autonomous Mitigation Telecommand</b>.", body_style
    ))

    # Architecture Diagram Table
    arch_box = [
        [Paragraph("<b>ORBITALX DUAL-TIER AI ARCHITECTURE PIPELINE</b>", ParagraphStyle('ArchH', fontName='Helvetica-Bold', fontSize=8.5, textColor=colors.white, alignment=1))],
        [Paragraph(
            "<b>Telemetry Ingestion Layer:</b> Real-time high-rate bus polling (EPS, ADCS, COMMS, TCS, OBC) + Impact Accelerometers + Optical Glare/LIDAR.<br/>"
            "↓<br/>"
            "<b>Tier-1 High-Speed Classifier (Naive Bayes / Random Forest):</b> Executes in &lt; 2 milliseconds. Computes log-probabilities across 16 sensor vectors, classifying incident domain (Inner Fault vs. Outer Damage) and pinpointing specific failure mode.<br/>"
            "↓<br/>"
            "<b>Tier-2 LLM Reasoning Engine (Gemini / Mistral / Llama 3):</b> Synthesizes physical root-cause explanation (RCA), evaluates orbital safety margins, and generates formal Standard Operating Procedure (SOP) recovery steps.<br/>"
            "↓<br/>"
            "<b>1-Click Dispatch Interlock:</b> Populates Operator Console with pre-validated flight telecommand (e.g., <code>CMD_PROP_ARM_CAM_BURN</code>, <code>CMD_EPS_SAFE_MODE</code>), enabling instant single-click execution with automated telemetry ACK verification.",
            body_style
        )]
    ]
    t_arch = Table(arch_box, colWidths=[500])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('BACKGROUND', (0,1), (-1,1), c_callout_bg),
        ('BOX', (0,0), (-1,-1), 1, c_cyan),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_arch)
    story.append(Spacer(1, 10))

    # Section 2: Failure Taxonomy Matrix
    story.append(Paragraph("2. Dual-Domain Aerospace Failure Taxonomy", h1_style))
    story.append(Paragraph(
        "The AI training dataset categorizes failure signatures into two primary domains, each mapped to specific sensor telemetry anomalies and corresponding 1-click mitigation commands:", body_style
    ))

    taxonomy_data = [
        ["Domain", "Subsystem", "Failure Mode", "Telemetry Signature", "1-Click Telecommand"],
        ["INNER", "EPS", "Battery Thermal Runaway", "Temp > 325K, Curr > 4.5A", "CMD_EPS_SAFE_MODE"],
        ["INNER", "EPS", "5V Rail Regulator Collapse", "Voltage < 3.8V (Nominal 5.0V)", "CMD_EPS_SWITCH_BUS_B"],
        ["INNER", "ADCS", "Reaction Wheel Seizure", "RPM < 200, Curr > 1.2A", "CMD_ADCS_DESPIN_WHEELS"],
        ["INNER", "ADCS", "Gyroscopic Rapid Tumble", "Angular Rate > 8.0 deg/s", "CMD_ADCS_DETUMBLE_BDOT"],
        ["INNER", "COMMS", "Antenna Feed Mismatch", "VSWR > 4.0:1, Power Drops", "CMD_COMMS_SWITCH_ANTENNA_B"],
        ["INNER", "TCS", "Eclipse Deep Freeze", "Battery Temp < 255K", "CMD_TCS_HEATER1_FORCE_ON"],
        ["INNER", "OBC", "Radiation SEU Bitflip", "ECC Errors > 30 / orbit", "CMD_OBC_MEM_SCRUB_ENABLE"],
        ["OUTER", "STRUCTURE", "Space Debris Conjunction", "LIDAR Miss Dist < 250m", "CMD_PROP_ARM_CAM_BURN"],
        ["OUTER", "STRUCTURE", "Micrometeoroid Impact", "Chassis Shock > 5.0 G", "CMD_EPS_SAFE_MODE"],
        ["OUTER", "EPS", "Solar Wing Severance", "Solar Flux / Generation -50%", "CMD_EPS_SWITCH_BUS_B"],
        ["OUTER", "PAYLOAD", "Optical Lens Debris Pitting", "Sensor Well Capacity Sat.", "CMD_PAYLOAD_SHUTTER_CLOSE"],
        ["OUTER", "ENV", "Severe Solar Proton Storm", "Solar Flux > 1800 W/m²", "CMD_OBC_RADIATION_SAFE_MODE"]
    ]
    t_tax = Table(taxonomy_data, colWidths=[55, 65, 125, 135, 120])
    t_tax.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 7.5),
        ('LEADING', (0,0), (-1,-1), 10),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light_bg]),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_tax)
    story.append(Spacer(1, 10))

    # Page Break for Training Data & Pipeline
    story.append(PageBreak())

    # Section 3: Training Datasets
    story.append(Paragraph("3. AI Training Dataset & Database Specifications", h1_style))
    story.append(Paragraph(
        "A robust aerospace AI model requires diverse, physically grounded datasets containing nominal baseline operating envelopes, "
        "subsystem degradations, and hypervelocity kinetic collision vectors. Three primary datasets are generated in the <code>AI/</code> directory:", body_style
    ))

    db_cards = [
        [
            Paragraph("<b>File Artifact</b>", ParagraphStyle('Hdr1', fontName='Helvetica-Bold', fontSize=8, textColor=colors.white)),
            Paragraph("<b>Format & Sample Volume</b>", ParagraphStyle('Hdr2', fontName='Helvetica-Bold', fontSize=8, textColor=colors.white)),
            Paragraph("<b>Purpose & Target AI Model</b>", ParagraphStyle('Hdr3', fontName='Helvetica-Bold', fontSize=8, textColor=colors.white))
        ],
        [
            Paragraph("<code>satellite_telemetry_anomaly_dataset.csv</code>", code_style),
            Paragraph("10,000 tabular rows<br/>16 continuous sensor features", body_style),
            Paragraph("Supervised classification: Naive Bayes, Random Forest, XGBoost, Support Vector Machines.", body_style)
        ],
        [
            Paragraph("<code>ai_satellite_training_prompts.jsonl</code>", code_style),
            Paragraph("10,000 instruction-tuning pairs<br/>~22.0 MB raw token volume", body_style),
            Paragraph("LLM Fine-Tuning: LoRA / QLoRA for Llama 3 8B, Mistral 7B, Gemma 2, or OpenAI / Gemini Fine-Tuning.", body_style)
        ],
        [
            Paragraph("<code>spacecraft_diagnostics_database.sqlite</code>", code_style),
            Paragraph("Production relational DB<br/>10,000 incident rows", body_style),
            Paragraph("Mission ground-station storage: satellite ephemeris, time-series telemetry incidents, telecommand dictionary.", body_style)
        ]
    ]
    t_db = Table(db_cards, colWidths=[160, 140, 200])
    t_db.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light_bg]),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_db)
    story.append(Spacer(1, 10))

    # Section 4: 1-Click Mitigation Flow
    story.append(Paragraph("4. The 1-Click Mitigation & Autonomous Safety Loop", h1_style))
    story.append(Paragraph(
        "A central requirement of the OrbitalX AI system is empowering the flight operator to review complex diagnostics "
        "and trigger the approved recovery action with <b>one single click</b>. The execution lifecycle adheres to strict aerospace command verification standards:", body_style
    ))

    flow_data = [
        ["Phase", "Action", "Safety Interlock & Telemetry Verification Gate"],
        [
            "1. Detection",
            "Continuous Telemetry Polling",
            "AI calculates anomaly probability vector; triggers alert once confidence exceeds 90% threshold."
        ],
        [
            "2. Diagnostics",
            "RCA & Telecommand Binding",
            "AI maps specific failure mode to pre-approved CCSDS command from the telecommand library."
        ],
        [
            "3. Operator Review",
            "Visual Dashboard Prompt",
            "Operator views root cause, severity, and interactive button: <b>[EXECUTE 1-CLICK DISPATCH]</b>."
        ],
        [
            "4. Single Click",
            "Encrypted RF Uplink Dispatch",
            "Payload dispatches via authenticated REST / WebSocket to backend (<code>/api/satellites/command</code>)."
        ],
        [
            "5. Flight ACK",
            "Spacecraft Handshake & ACK",
            "Ground station receives command execution frame; increments On-Board Computer telecommand execution counter (+1)."
        ],
        [
            "6. Recovery Audit",
            "Autonomous Health Recovery",
            "AI monitors sensor stream for 15 seconds to ensure telemetry returns within nominal envelope."
        ]
    ]
    t_flow = Table(flow_data, colWidths=[80, 140, 280])
    t_flow.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_accent),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 7.5),
        ('LEADING', (0,0), (-1,-1), 10),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light_bg]),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_flow)
    story.append(Spacer(1, 10))

    # Section 5: Training Guide & Commands
    story.append(Paragraph("5. Step-by-Step AI Model Training Guide", h1_style))
    story.append(Paragraph(
        "All generation and training scripts are pre-installed in the <code>AI/</code> directory. Execute the following terminal commands to retrain or fine-tune models:", body_style
    ))

    cmd_box = [
        [Paragraph("<b>COMMAND LINE EXECUTION RECIPES</b>", ParagraphStyle('CmdH', fontName='Helvetica-Bold', fontSize=8, textColor=colors.white))],
        [Paragraph(
            "<b>1. Generate or Expand Dataset:</b><br/>"
            "<code>python AI/generate_dataset.py --samples 10000</code><br/>"
            "<i>Produces 10,000 synthetic records in CSV, JSONL, and SQLite database.</i><br/><br/>"
            "<b>2. Train High-Speed Diagnostic Classifier:</b><br/>"
            "<code>python AI/train_classifier.py</code><br/>"
            "<i>Evaluates on test partition (100% precision) and saves <code>satellite_classifier_model.pkl</code>.</i><br/><br/>"
            "<b>3. Run Standalone Inference Service:</b><br/>"
            "<code>python AI/ai_inference_service.py</code> (Local CLI test)<br/>"
            "<code>python AI/ai_inference_service.py --serve</code> (Launches HTTP REST Microservice on port 5050)<br/><br/>"
            "<b>4. Fine-Tune Open-Source LLMs (Llama 3 / Mistral via LoRA):</b><br/>"
            "<code>python AI/fine_tune_llm.py</code><br/>"
            "<i>Applies 4-bit QLoRA instruction tuning using HuggingFace TRL and PEFT libraries.</i>",
            code_style
        )]
    ]
    t_cmd = Table(cmd_box, colWidths=[500])
    t_cmd.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('BACKGROUND', (0,1), (-1,1), c_callout_bg),
        ('BOX', (0,0), (-1,-1), 1, c_cyan),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_cmd)
    story.append(Spacer(1, 10))

    # Section 6: OrbitalX Integration Blueprint
    story.append(Paragraph("6. OrbitalX Full-Stack Integration Blueprint", h1_style))
    story.append(Paragraph(
        "To connect this trained AI model directly into the live OrbitalX dashboard (<code>/alerts</code> and <code>/telemetry</code>):", body_style
    ))
    story.append(Paragraph("• <b>Backend Route Hook:</b> Connect <code>OrbitalX/backend/src/controllers/aiController.js</code> to query the local AI microservice at <code>http://localhost:5050/diagnose</code> or import <code>satellite_classifier_model.pkl</code>.", bullet_style))
    story.append(Paragraph("• <b>Cloud LLM Keys:</b> Optionally insert <code>GEMINI_API_KEY</code> or <code>OPENAI_API_KEY</code> into <code>OrbitalX/backend/.env</code> for hybrid LLM generative explanations.", bullet_style))
    story.append(Paragraph("• <b>1-Click UI Dispatch:</b> The frontend component <code>AiDiagnosisCard.jsx</code> displays the root-cause card with an automated dispatch button that triggers <code>POST /api/satellites/command</code> upon click.", bullet_style))

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[OK] Successfully built PDF Guide: {PDF_PATH}")

if __name__ == "__main__":
    create_guide_pdf()
