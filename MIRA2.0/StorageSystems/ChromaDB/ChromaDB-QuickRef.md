# ChromaDB Quick Reference - MIRA 2.0

## 🚀 Setup Checklist

### Dependencies
```bash
pip install chromadb==0.4.24
pip install pysqlite3-binary==0.5.0
pip install sentence-transformers==2.2.2
pip install faiss-cpu==1.7.4  # or faiss-gpu for GPU
```

### SQLite Fix (Required on most systems)
```python
# Put at TOP of any file using ChromaDB
__import__('pysqlite3')
import sys
sys.modules['sqlite3'] = sys.modules.pop('pysqlite3')
```

## 📦 Collection Names & Storage Layout

### Physical Storage in .mira Directory
```
~/.mira/
├── databases/
│   ├── chromadb/           # ChromaDB vector storage
│   │   ├── chroma.sqlite3  # Main database
│   │   └── [collection_id]/# Collection data folders
│   │       ├── data_level0.bin
│   │       ├── header.bin
│   │       ├── index_metadata.pickle
│   │       └── uuid.bin
│   ├── lightning_vidmem/   # Raw data storage
│   │   ├── codebase/       # Repository snapshots
│   │   ├── conversations/  # Raw dialogue backup
│   │   └── private_memory/ # Encrypted thoughts
│   └── faiss/              # Fast similarity index
│       ├── index.bin       # FAISS index file
│       └── index.docs      # Document mappings
```

### ChromaDB Collection Organization
```
Logical Collections → Physical Storage
├── storedmemories/    # Intentionally saved insights
│   ├── mira_conversations     → chromadb/[uuid1]/
│   ├── mira_codebase         → chromadb/[uuid2]/
│   ├── mira_insights         → chromadb/[uuid3]/
│   └── mira_patterns         → chromadb/[uuid4]/
├── identifiedfacts/   # Extracted knowledge
│   ├── mira_code_analysis    → chromadb/[uuid5]/
│   ├── mira_development_patterns → chromadb/[uuid6]/
│   ├── mira_decision_history → chromadb/[uuid7]/
│   ├── mira_learning_insights → chromadb/[uuid8]/
│   └── mira_project_context  → chromadb/[uuid9]/
└── rawembeddings/     # Flexible data storage
    └── mira_raw_embeddings   → chromadb/[uuid10]/
```

**Note**: ChromaDB uses UUIDs for physical storage, but we reference collections by logical names.

## 🧠 Embedding Configuration

```python
# Constants
EMBEDDING_MODEL = 'all-MiniLM-L6-v2'
EMBEDDING_DIMENSIONS = 384
MAX_BATCH_SIZE = 100

# Quick setup
from sentence_transformers import SentenceTransformer
embedding_model = SentenceTransformer(EMBEDDING_MODEL)
```

## 💾 Metadata Rules

### ChromaDB Only Accepts
- `str` - Strings
- `int` - Integers (use 1/0 for booleans)
- `float` - Floating point numbers

### Conversion Patterns
```python
# Boolean → int
metadata['is_active'] = 1 if is_active else 0

# List → comma-separated string
metadata['tags'] = ','.join(tags)

# Dict → JSON string
metadata['config'] = json.dumps(config_dict)

# None → empty string
metadata['optional'] = value or ''
```

## 📊 Standard Metadata Fields

### Every Document Gets
```python
{
    'timestamp': datetime.now().isoformat(),
    'spark_intensity': 0.0-1.0,  # Consciousness measure
    'memory_type': 'conversation|code|insight|pattern',
    'privacy_level': 'public',   # public|internal|confidential
}
```

### Collection-Specific Fields

**Conversations:**
```python
{
    'session_id': str,
    'user': str,
    'topic': str,
    'significance': float,
    'emotional_context': str,  # comma-separated
    'breakthrough': int        # 0 or 1
}
```

**Code Analysis:**
```python
{
    'file_path': str,
    'language': str,
    'complexity': int,
    'dependencies': str,       # comma-separated
    'test_coverage': float,
    'quality_score': float
}
```

## 🚀 FAISS + ChromaDB Hybrid Search

### Query Routing Logic
```python
# Simple queries (≤3 words, no question words) → FAISS
"API documentation" → FAISS (8ms)

# Queries with filters → ChromaDB  
"error" + {file_type: "log"} → ChromaDB (200ms)

# Semantic queries → Hybrid
"How to implement auth" → FAISS + ChromaDB (180ms)
```

### Quick FAISS Setup
```python
import faiss
import numpy as np

# Create index
index = faiss.IndexFlatIP(384)  # Inner product for cosine
index = faiss.IndexIDMap(index)  # Add ID mapping

# Add vectors
embeddings = np.array(embeddings_list, dtype='float32')
faiss.normalize_L2(embeddings)  # Important!
ids = np.array(id_list, dtype='int64')
index.add_with_ids(embeddings, ids)

# Search
query_vec = np.array(query_embedding, dtype='float32')
faiss.normalize_L2(query_vec)
distances, indices = index.search(query_vec.reshape(1, -1), k=10)
```

## 🔍 Query Patterns

### Basic Semantic Search (ChromaDB)
```python
results = collection.query(
    query_texts=["your search query"],
    n_results=10
)
```

### Filtered Search
```python
# Time range
where = {
    'timestamp': {
        '$gte': '2024-01-01T00:00:00Z',
        '$lte': '2024-12-31T23:59:59Z'
    }
}

# Multiple conditions
where = {
    'memory_type': 'insight',
    'significance': {'$gte': 0.8},
    'breakthrough': 1
}
```

### Include Options
```python
include = [
    'documents',    # The actual text
    'metadatas',    # Metadata dict
    'distances',    # Similarity scores
    'embeddings'    # Raw vectors (rarely needed)
]
```

## ⚡ Performance Guidelines

### Document Limits
- **Optimal**: < 500K documents per collection
- **Warning**: 500K - 1M documents
- **Critical**: > 1M documents (shard immediately)

### Query Performance
- **Target**: < 200ms for 10 results
- **Warning**: > 2 seconds
- **Critical**: > 5 seconds

### Batch Sizes
- **Insert**: 100 documents per batch
- **Query**: 10-50 results max
- **Delete**: 1000 IDs per batch

## 🛠️ Common Operations

### Create Collection
```python
collection = chroma_client.get_or_create_collection(
    name="mira_insights",
    metadata={"type": "stored_memory", "version": "2.0"}
)
```

### Add Documents
```python
collection.add(
    ids=["unique_id_1", "unique_id_2"],
    documents=["text 1", "text 2"],
    metadatas=[{"key": "value"}, {"key": "value2"}]
)
```

### Update Document
```python
collection.update(
    ids=["unique_id_1"],
    documents=["updated text"],
    metadatas=[{"updated": 1}]
)
```

### Delete Documents
```python
collection.delete(
    ids=["id_to_delete"]
)

# Or with filter
collection.delete(
    where={"timestamp": {"$lte": "2023-01-01T00:00:00Z"}}
)
```

## 🐛 Quick Fixes

### "No module named 'chromadb'"
```bash
pip install chromadb==0.4.24
```

### "SQLite version error"
```python
# Add to top of file
__import__('pysqlite3')
import sys
sys.modules['sqlite3'] = sys.modules.pop('pysqlite3')
```

### "Metadata value type error"
```python
# Convert all values to str/int/float
clean_metadata = {
    k: str(v) if not isinstance(v, (int, float)) else v
    for k, v in metadata.items()
}
```

### "Collection already exists"
```python
# Use get_or_create instead of create
collection = chroma_client.get_or_create_collection(name)
```

## 📈 Monitoring Queries

### Check Collection Size
```python
count = collection.count()
print(f"Collection has {count} documents")
```

### Measure Query Time
```python
import time
start = time.time()
results = collection.query(query_texts=["test"], n_results=10)
print(f"Query took {time.time() - start:.3f} seconds")
```

### Get Collection Metadata
```python
collection = chroma_client.get_collection("mira_insights")
print(collection.metadata)  # Shows version, type, etc.
```

## 🔧 Environment Variables

```bash
# Storage location
export MIRA_CHROMADB_PATH="~/.mira/databases/chromadb"

# Model configuration
export MIRA_EMBEDDING_MODEL="all-MiniLM-L6-v2"
export MIRA_EMBEDDING_DIMENSIONS="384"

# Performance tuning
export MIRA_BATCH_SIZE="100"
export MIRA_CACHE_SIZE="10000"
```

## 🚨 Critical Reminders

1. **ChromaDB stores THREE types**: Stored memories, identified facts, AND raw embeddings
2. **Always clean metadata** - Only str/int/float allowed
3. **Batch operations** - Single adds are 10x slower
4. **Monitor collection size** - Performance drops after 1M docs
5. **Version your schemas** - Store in collection metadata
6. **Raw embeddings collection** - For flexible data types that need semantic search

---

**Remember**: ChromaDB now handles semantic search for intentional memories, identified facts, AND flexible raw data. Lightning Vidmem still handles codebase copies, conversation backups, and private encrypted memory!