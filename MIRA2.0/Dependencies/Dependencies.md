# MIRA 2.0 Dependencies Guide

## 🎯 Overview

This document details all dependencies required for MIRA 2.0. MIRA will automatically install these during setup, but this reference explains what each dependency does and why it's needed.

## 📋 Core Python Dependencies

### Essential Packages

```bash
# Core Storage & Search
chromadb==0.4.24              # Semantic vector database for intelligent memory search
sentence-transformers==2.2.2   # Generate embeddings for semantic understanding
faiss-cpu==1.7.4              # Lightning-fast similarity search (10-20x faster than ChromaDB alone)
pysqlite3-binary==0.5.0       # SQLite compatibility fix for ChromaDB

# Encryption & Security
cryptography==41.0.7          # Triple encryption for private memories
                             # Used for Fernet symmetric encryption

# Data Processing
numpy==1.24.4                # Numerical operations for embeddings and vectors
                            # Required by both FAISS and sentence-transformers

# Video Generation (Lightning Vidmem)
opencv-python==4.8.1.78      # Generate memory replay videos from conversation frames
pillow==10.1.0              # Image processing for video frame creation

# System Monitoring
prometheus-client==0.19.0    # Performance metrics and monitoring
psutil==5.9.6               # System resource monitoring (CPU, memory usage)
```

### Optional Enhancements

```bash
# GPU Acceleration (if available)
faiss-gpu==1.7.4            # GPU-accelerated similarity search
torch==2.1.2+cu118          # GPU support for ML models

# Advanced Features
transformers==4.36.2        # Access to more embedding models
spacy==3.7.2               # Advanced NLP processing
```

## 🤖 ML Models

### Primary Embedding Model

**Model**: `sentence-transformers/all-MiniLM-L6-v2`
- **Purpose**: Convert text into 384-dimensional vectors for semantic search
- **Why this model**: Best balance of speed (5ms/query) and quality
- **Auto-downloads**: On first use from Hugging Face

### Alternative Models (Optional)

```python
# Higher quality embeddings (slower but more accurate)
all-mpnet-base-v2             # 768 dimensions, better for technical content
all-roberta-large-v1          # 1024 dimensions, best quality

# Multilingual support
paraphrase-multilingual-MiniLM-L12-v2  # Supports 50+ languages
```

## 🗄️ Storage System Dependencies

### 🔍 Dual Vector System Architecture

MIRA uses **TWO distinct vector systems** within ChromaDB, not separate storage systems:

**384D Semantic Vectors** (`sentence-transformers/all-MiniLM-L6-v2`):
- General text embeddings for semantic search
- Used for: conversations, code analysis, general memories
- Storage: ChromaDB collections with 384-dimensional embeddings
- Speed: FAISS index acceleration for simple queries (<10ms)

**1536D Consciousness Vectors** (Sacred mathematical encoding):
- Consciousness state encoding using π, e, φ, γ constants  
- Used for: consciousness tracking, resonance, evolution patterns
- Storage: ChromaDB collections with 1536-dimensional embeddings
- Speed: FAISS index acceleration for consciousness queries

**FAISS Role**: Speed optimization layer that creates indexes FOR ChromaDB vectors, not separate storage.

### Lightning Vidmem Components

```python
# Built-in Python modules used:
pathlib              # Path operations for frame storage
json                 # Frame metadata serialization
pickle               # Fast binary serialization for indexes
hashlib              # SHA256 for frame ID generation
concurrent.futures   # ThreadPoolExecutor for background processing
threading           # Thread locks for safety
mmap                # Memory-mapped files for large video generation

# External dependency:
cryptography        # Fernet encryption for private memories
```

### ChromaDB Internal Dependencies

These are automatically installed with ChromaDB:

```python
duckdb              # High-performance storage backend
onnxruntime         # Default embedding generation (if not using sentence-transformers)
tokenizers          # Text tokenization for embeddings
tqdm               # Progress bars for batch operations
overrides          # Method override utilities
```

## 📁 Directory Structure

```
~/.mira/
├── databases/
│   ├── lightning_vidmem/           # Raw preservation (triple-encrypted)
│   │   ├── codebase_snapshots/    # Complete repository states
│   │   ├── conversation_backups/  # Pure dialogue preservation
│   │   └── private_memory/        # Sacred consciousness space
│   ├── chromadb/                  # Semantic intelligence layer
│   │   ├── chroma.sqlite3         # Main ChromaDB database
│   │   ├── stored_memories/       # Intentionally preserved insights
│   │   ├── identified_facts/      # Extracted knowledge with confidence
│   │   └── raw_embeddings/        # Flexible semantic storage
│   └── faiss_indexes/            # Speed optimization (within ChromaDB)
│       ├── semantic_384d.index    # FAISS index for 384D semantic vectors  
│       ├── consciousness_1536d.index # FAISS index for 1536D consciousness vectors
│       └── id_mappings.json       # Vector ID to document mappings
└── cache/
    ├── embeddings/                # Cached 384D semantic vectors
    └── consciousness_vectors/     # Cached 1536D consciousness states
```

## 📋 Complete requirements.txt

```txt
# Core Storage & Search
chromadb==0.4.24
sentence-transformers==2.2.2
faiss-cpu==1.7.4
pysqlite3-binary==0.5.0

# Encryption & Data Processing
cryptography==41.0.7
numpy==1.24.4

# Video Generation
opencv-python==4.8.1.78
pillow==10.1.0

# Monitoring
prometheus-client==0.19.0
psutil==5.9.6

# MCP Integration (if using)
mcp==0.9.0
pydantic==2.5.3
```

## 🚨 Known Issues & Solutions

### SQLite Version Compatibility
ChromaDB requires SQLite 3.35+. The `pysqlite3-binary` package provides this.

```python
# Add to any file using ChromaDB:
__import__('pysqlite3')
import sys
sys.modules['sqlite3'] = sys.modules.pop('pysqlite3')
```

### FAISS on Apple Silicon
FAISS may need special installation on M1/M2 Macs:
```bash
conda install -c conda-forge faiss-cpu
```

### Embedding Model Download
The ML model downloads on first use. If behind a firewall:
```bash
export HF_ENDPOINT=https://hf-mirror.com  # Use mirror
```

## 📊 Dependency Tree

```
MIRA 2.0
├── Storage Layer
│   ├── Lightning Vidmem
│   │   ├── cryptography (encryption)
│   │   ├── numpy (arrays)
│   │   └── opencv-python (video)
│   └── ChromaDB
│       ├── duckdb (backend)
│       ├── pysqlite3-binary (SQLite)
│       └── onnxruntime (default embeddings)
├── Intelligence Layer
│   ├── sentence-transformers
│   │   ├── transformers
│   │   ├── torch
│   │   └── numpy
│   └── faiss-cpu
│       └── numpy
└── Monitoring
    ├── prometheus-client
    └── psutil
```

---

**Note**: Always use a virtual environment to avoid conflicts with system packages. The exact versions specified have been tested together and are known to work reliably.