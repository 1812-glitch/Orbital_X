#!/usr/bin/env python3
"""
OrbitalX LLM Fine-Tuning Pipeline (Hugging Face / LoRA / QLoRA)
Fine-tunes open-source LLMs (Llama 3 8B, Mistral 7B, Gemma 2) on the
OrbitalX satellite failure and outer collision recovery dataset.
"""

import os
import json

INSTRUCTION_DATASET = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ai_satellite_training_prompts.jsonl")

FINE_TUNE_SNIPPET = '''
# -------------------------------------------------------------------------
# Step-by-Step Instructions to Fine-Tune on GPU (Colab / AWS / RunPod):
# 1. Install prerequisites:
#    pip install torch transformers datasets peft trl bitsandbytes accelerate
# 2. Run the script:
#    python fine_tune_llm.py
# -------------------------------------------------------------------------

import torch
from datasets import load_dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from trl import SFTTrainer

MODEL_ID = "meta-llama/Meta-Llama-3-8B-Instruct"  # or "mistralai/Mistral-7B-Instruct-v0.3"
OUTPUT_DIR = "./orbitalx_ai_lora_weights"

def format_prompts(batch):
    formatted = []
    for inst, out in zip(batch["instruction"], batch["output"]):
        text = f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>\nYou are the OrbitalX Aerospace Mission Copilot. Diagnose inner errors and outer collision damage, outputting 1-click mitigation commands.<|eot_id|><|start_header_id|>user<|end_header_id|>\n{inst}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n{out}<|eot_id|>"
        formatted.append(text)
    return {"text": formatted}

def train():
    # 4-bit Quantization Configuration
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.bfloat16,
        bnb_4bit_use_double_quant=True
    )

    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
    tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        quantization_config=bnb_config,
        device_map="auto"
    )
    model = prepare_model_for_kbit_training(model)

    # LoRA Adapter Configuration
    peft_config = LoraConfig(
        r=16,
        lora_alpha=32,
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]
    )
    model = get_peft_model(model, peft_config)

    # Ingest JSONL dataset
    dataset = load_dataset("json", data_files="ai_satellite_training_prompts.jsonl", split="train")
    dataset = dataset.map(format_prompts, batched=True)

    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        per_device_train_batch_size=4,
        gradient_accumulation_steps=4,
        warmup_steps=20,
        max_steps=250,
        learning_rate=2e-4,
        fp16=not torch.cuda.is_bf16_supported(),
        bf16=torch.cuda.is_bf16_supported(),
        logging_steps=10,
        save_strategy="steps",
        save_steps=100,
        optim="paged_adamw_8bit"
    )

    trainer = SFTTrainer(
        model=model,
        train_dataset=dataset,
        dataset_text_field="text",
        max_seq_length=1024,
        tokenizer=tokenizer,
        args=training_args
    )

    print("Beginning OrbitalX Aerospace LLM LoRA fine-tuning...")
    trainer.train()
    trainer.model.save_pretrained(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)
    print("Fine-tuning completed! Saved LoRA adapter to:", OUTPUT_DIR)

if __name__ == "__main__":
    train()
'''

def main():
    print("=" * 70)
    print("OrbitalX Aerospace LLM Fine-Tuning Script")
    print("=" * 70)
    print(f"Target Dataset: {INSTRUCTION_DATASET}")
    
    if os.path.exists(INSTRUCTION_DATASET):
        with open(INSTRUCTION_DATASET, "r", encoding="utf-8") as f:
            lines = sum(1 for _ in f)
        print(f"Available Instruction Pairs: {lines} samples ready for fine-tuning.")
        print("\nSupported Cloud & Local LLM Fine-Tuning Methods:")
        print("1. HuggingFace LoRA / QLoRA (Local RTX 3060/4090 or Google Colab T4/A100)")
        print("2. OpenAI Fine-Tuning API (Convert JSONL to messages format and upload to platform.openai.com)")
        print("3. Google Vertex AI / Gemini Tuned Model (Upload to Google AI Studio)")
        print("4. Unsloth AI (2x faster fine-tuning with 70% less VRAM)")
        print("\nRefer to the complete guide in 'AI_GUIDE.md' and the compiled PDF for detailed steps.")
    else:
        print("[!] Dataset missing. Run 'python generate_dataset.py' first.")

if __name__ == "__main__":
    main()
