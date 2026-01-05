# VoxNode Pro - Tiny Implementation

This directory contains a specialized, low-VRAM implementation of VoxNode Pro, specifically engineered for high-performance inference on legacy hardware such as **NVIDIA T4 (Google Colab)** or local GPUs with < 8GB VRAM.

## 🚀 Key Improvements

To achieve a "True Tiny" footprint, the architecture has been decoupled from the main `src/` modules:

1.  **Unified Model Instance**: Eliminated redundant Whisper instances. The system now shares a single `Whisper-Tiny` model for STT, saving ~1.2GB of VRAM compared to the base version.
2.  **Advanced Quantization**: Implemented **4-bit NormalFloat (NF4)** quantization with Double Quantization for the `Phi-3-mini` LLM, reducing its memory footprint to ~2.2GB.
3.  **Lightweight RAG Pipeline**: Replaced the multilingual MiniLM-L12 with `all-MiniLM-L6-v2`. This reduces embedding latency by ~40% and minimizes CPU/RAM overhead during vector search.
4.  **Flash Attention 2 Integration**: Forced implementation of Flash Attention 2 to optimize the KV-cache on T4 architectures, significantly speeding up token generation.

## 🛠 Hardware Requirements

| Component | Minimum Requirement | Recommended |
| :--- | :--- | :--- |
| **GPU VRAM** | 4 GB | 6 GB+ |
| **System RAM** | 8 GB | 12 GB |
| **Storage** | 10 GB (for weights) | SSD |
| **Compute** | CUDA Compute 7.5+ (T4, RTX 20 series) | CUDA Compute 8.0+ |

## 📦 Architecture Overhaul

The logic is contained within `tiny_src/` to ensure zero interference with the "Pro" or "Standard" versions:
* `tts_stt_tiny.py`: Optimized Whisper-Tiny + Kitten-Nano TTS.
* `rag_tiny.py`: Fast indexing using 300-token chunks and k=1 retrieval for maximum speed.

## 💡 Potential Applications

* **Edge AI Workstations**: Running a full voice assistant on mid-range laptops.
* **Colab-Free Tier Deployment**: Sustained performance without hitting OOM (Out Of Memory) limits.
* **Low-Latency Interactivity**: Ideal for real-time voice-to-voice applications where response speed is prioritized over complex reasoning.

## 🖥 How to Use

1. Ensure you have an NVIDIA GPU and drivers installed.
2. Grant execution permissions: `chmod +x start_tiny.sh`
3. Run the bootstrapper: `./start_tiny.sh`