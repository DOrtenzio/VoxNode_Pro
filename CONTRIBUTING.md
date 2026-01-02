# Contributing to VoxNode Pro

First off, thank you for considering contributing to **VoxNode Pro**! It's people like you that make the open-source community such an amazing place to learn, inspire, and create.

## 🚀 How Can I Contribute?

### Reporting Bugs
- Use the **GitHub Issues** tab to report bugs.
- Describe the bug in detail, including steps to reproduce it.
- Mention your hardware specs (especially GPU and VRAM) as performance issues are common in local LLM deployments.

### Suggesting Enhancements
- If you have an idea for a new feature (e.g., a new STT engine or a specific RAG optimization), open an Issue labeled `enhancement`.
- Describe the logic behind the feature and how it benefits the project.

### Pull Requests (PRs)
1. **Fork the repo** and create your branch from `main`.
2. **Setup your environment**: Follow the installation steps in the `README.md`.
3. **Coding Standards**:
   - Follow PEP 8 for Python code.
   - Ensure any new module is placed in the `src/` directory.
   - If you add a new dependency, update the `requirements.txt`.
4. **Testing**: Test your changes on a local GPU or Google Colab before submitting.
5. **Documentation**: Update the `README.md` if your PR adds new functionality or changed the setup process.

## 🛠 Modular Structure for Devs

VoxNode Pro is designed to be modular:
- **`src/engine.py`**: For LLM logic and quantization.
- **`src/rag.py`**: For vector store and embedding improvements.
- **`src/tts_stt.py`**: For audio processing updates.
- **`src/actions.py`**: For adding new tool-calling capabilities.

## ⚖️ License
By contributing, you agree that your contributions will be licensed under its **MIT License**.
