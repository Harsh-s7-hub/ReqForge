# AI Multimodal RAG-Based Automated Code Documentation

## Project Overview

This project is an AI-driven automated code documentation system that analyzes Python source code and generates documentation using a local Large Language Model (LLM).

The system combines:

- Python AST-based code analysis
- Function extraction
- Prompt engineering
- Local LLM inference using Ollama
- Multimodal image/diagram processing
- Context-aware documentation generation
- Automated testing
- Latency tracking

The project is designed as part of a larger Multimodal RAG-based Code Documentation and CI/CD Pipeline.

---

## Member 1: Multimodal AI / LLM Engineer

Member 1 is responsible for understanding source code, extracting functions, preparing prompts, processing multimodal information, communicating with the local LLM, and generating documentation.

### Member 1 Components

```text
scripts/
├── ast_process.py
├── function_extractor.py
├── prompt_builder.py
├── llm_generator.py
├── multimodal_processor.py
└── pipeline.py
