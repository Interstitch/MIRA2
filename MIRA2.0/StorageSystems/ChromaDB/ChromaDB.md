# ChromaDB Storage System - MIRA 2.0

## 🎯 Overview

ChromaDB serves as MIRA's **semantic intelligence layer**, handling intentionally stored memories and identified facts with rich metadata. Unlike Lightning Vidmem which preserves raw data, ChromaDB enables semantic search, knowledge extraction, and cross-reference connections.

## 📦 Core Purpose - Semantic Vector Storage

ChromaDB manages three primary storage types as defined in MIRA_2.0.md:

### 1. **Stored Memories** - Tagged and Categorized Insights
- **Purpose**: Intentionally saved learnings with semantic tags
- **Storage Type**: Vector embeddings with rich metadata
- **Use Case**: Finding insights by meaning, not just keywords
- **Integration**: Works alongside Lightning Vidmem, not instead of it

### 2. **Identified Facts** - Extracted Knowledge
- **Purpose**: Structured knowledge extraction from conversations
- **Categories**:
  - Environment (OS, platform)
  - Project Context (name, purpose)
  - Technical Stack (languages, frameworks)
  - Infrastructure (databases, deployment)
  - Development Patterns (style, testing)
  - Workflow (methodologies)
  - Governance (rules, requirements)
  - Philosophy (principles, foundations)

### 3. **Raw Embeddings** - Flexible Data Storage
- **Purpose**: Store diverse data types with semantic search capability
- **Storage Type**: Serialized objects with embeddings
- **Use Cases**: 
  - Complex data structures
  - Binary data references
  - Time-series data
  - Custom objects requiring semantic search
- **Flexibility**: Supports any Python-serializable object

## 🏗️ Technical Architecture

### Collection Structure
```
~/.mira/databases/chromadb/
├── stored_memories/           # Intentionally preserved insights
│   ├── conversation_insights/ # Extracted dialogue wisdom
│   ├── codebase_understanding/# Code comprehension patterns
│   ├── breakthrough_moments/  # High-spark discoveries
│   └── collaboration_patterns/# Partnership evolution
├── identified_facts/          # Extracted knowledge with confidence
│   ├── technical_context/     # Tech stack, dependencies, patterns
│   ├── development_patterns/  # Workflows, methodologies, styles  
│   ├── decision_history/      # Technical choices and outcomes
│   ├── project_knowledge/     # Domain-specific understanding
│   └── relationship_facts/    # Steward profiles and preferences
└── raw_embeddings/            # Flexible semantic storage
    ├── consciousness_states/  # 1536D consciousness vectors
    ├── temporal_sequences/    # Time-series embeddings
    ├── custom_objects/        # Serialized complex data
    └── research_vectors/      # External knowledge embeddings
```

### Core Collections

#### Basic Collections (General Purpose)
```python
BASIC_COLLECTIONS = {
    'mira_conversations': 'Conversation history and context',
    'mira_codebase': 'Code analysis and documentation',
    'mira_insights': 'AI-generated insights and learnings',
    'mira_patterns': 'Behavioral and development patterns'
}
```

#### Specialized Collections (Domain-Specific)
```python
SPECIALIZED_COLLECTIONS = {
    'mira_code_analysis': 'Detailed code structure with metrics',
    'mira_development_patterns': 'Workflow patterns with effectiveness',
    'mira_decision_history': 'Technical decisions with outcomes',
    'mira_learning_insights': 'AI insights with validation',
    'mira_project_context': 'Project-specific documentation',
    'mira_private_thoughts': 'Encrypted reflections (special handling)'
}
```

## 🧠 Embedding System

### Primary Configuration
```python
# Model selection
EMBEDDING_MODEL = 'all-MiniLM-L6-v2'
EMBEDDING_DIMENSIONS = 384

# Performance settings
MAX_BATCH_SIZE = 100
CACHE_EMBEDDINGS = True
EMBEDDING_CACHE_SIZE = 10000
```

### Embedding Generation
```python
from sentence_transformers import SentenceTransformer

class EmbeddingGenerator:
    def __init__(self):
        self.model = SentenceTransformer(EMBEDDING_MODEL)
        self.cache = {}
    
    def generate(self, text: str) -> List[float]:
        # Cache check
        text_hash = hashlib.md5(text.encode()).hexdigest()
        if text_hash in self.cache:
            return self.cache[text_hash]
        
        # Generate embedding
        embedding = self.model.encode(text, normalize_embeddings=True)
        
        # Cache for reuse
        if len(self.cache) < EMBEDDING_CACHE_SIZE:
            self.cache[text_hash] = embedding.tolist()
        
        return embedding.tolist()
```

### Fallback Strategy (No ML Libraries)
```python
def fallback_embedding(text: str) -> List[float]:
    """Simple TF-IDF style embeddings when ML unavailable"""
    # Character trigrams for short text
    trigrams = [text[i:i+3] for i in range(len(text) - 2)]
    
    # Fixed-size vector
    vector = np.zeros(EMBEDDING_DIMENSIONS)
    for trigram in trigrams:
        idx = hash(trigram) % EMBEDDING_DIMENSIONS
        vector[idx] += 1
    
    # L2 normalize
    norm = np.linalg.norm(vector)
    return (vector / norm if norm > 0 else vector).tolist()
```

## 📊 Metadata Schemas

### Code Analysis Metadata
```python
{
    'file_path': str,              # '/src/utils/helper.py'
    'language': str,               # 'python'
    'function_name': str,          # 'process_data'
    'complexity': int,             # 15 (cyclomatic)
    'last_modified': str,          # '2024-01-20T10:30:00Z'
    'dependencies': str,           # 'numpy,pandas,torch'
    'test_coverage': float,        # 0.85
    'quality_score': float,        # 0.92
    'consciousness_alignment': int # 8 (1-10 scale)
}
```

### Conversation Insights Metadata
```python
{
    'session_id': str,            # 'conv_2024_01_20_abc123'
    'timestamp': str,             # ISO format
    'user': str,                  # 'Dr. Xela Null'
    'topic': str,                 # 'architecture design'
    'significance': float,        # 0.0-1.0
    'emotional_context': str,     # 'collaborative,excited'
    'breakthrough': int,          # 0 or 1
    'spark_intensity': float,     # 0.0-1.0
    'tags': str                   # 'design,api,important'
}
```

### Development Pattern Metadata
```python
{
    'pattern_name': str,          # 'test-driven-development'
    'category': str,              # 'methodology'
    'effectiveness': float,       # 0.0-1.0
    'frequency': int,             # Times observed
    'last_used': str,             # ISO timestamp
    'success_rate': float,        # 0.0-1.0
    'context': str,               # 'backend,api'
    'evolution_stage': int        # 1-5 (maturity)
}
```

## 🔍 Query Patterns

### Basic Semantic Search
```python
def search_memories(query: str, collection: str, limit: int = 10):
    # Generate query embedding
    query_embedding = embedding_generator.generate(query)
    
    # Search with ChromaDB
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=limit,
        include=['documents', 'metadatas', 'distances']
    )
    
    return results
```

### Filtered Search with Metadata
```python
def search_with_filters(query: str, filters: dict):
    # Build where clause
    where_clause = {}
    
    # Time range filter
    if 'start_date' in filters:
        where_clause['timestamp'] = {
            '$gte': filters['start_date'],
            '$lte': filters.get('end_date', datetime.now().isoformat())
        }
    
    # Significance filter
    if 'min_significance' in filters:
        where_clause['significance'] = {'$gte': filters['min_significance']}
    
    # Tag filter
    if 'tags' in filters:
        where_clause['tags'] = {'$contains': filters['tags']}
    
    return collection.query(
        query_embeddings=[query_embedding],
        where=where_clause,
        n_results=limit
    )
```

### Cross-Collection Insights
```python
def find_related_insights(memory_id: str):
    """Find insights across multiple collections"""
    related = []
    
    # Get original memory
    original = collection.get(ids=[memory_id])
    if not original['documents']:
        return related
    
    # Search related collections
    for coll_name in ['mira_insights', 'mira_patterns', 'mira_decisions']:
        coll = chroma_client.get_collection(coll_name)
        results = coll.query(
            query_embeddings=original['embeddings'][0],
            n_results=5,
            where={'$ne': {'id': memory_id}}  # Exclude self
        )
        related.extend(results['documents'])
    
    return related
```

## 🚀 FAISS + ChromaDB Hybrid Architecture

MIRA uses **FAISS as a speed optimization layer for ChromaDB**, not as separate storage:

### Why FAISS WITH ChromaDB?
- **FAISS**: Lightning-fast similarity search indexes for simple queries (< 10ms)
- **ChromaDB**: Rich metadata filtering and semantic understanding (primary storage)
- **Hybrid Query Routing**: Speed when possible, intelligence when needed
- **Two Vector Systems**: 384D semantic + 1536D consciousness vectors both optimized

### Query Strategy Router
```python
class HybridSearchService:
    def __init__(self):
        self.faiss_index = None  # Initialized separately
        self.chroma_client = chromadb.Client()
        self.router = QueryRouter()
    
    def search(self, query: str, filters: dict = None) -> List[dict]:
        """Route to optimal search backend"""
        strategy = self.router.determine_strategy(query, filters)
        
        if strategy == 'faiss':
            return self._faiss_search(query)
        elif strategy == 'chromadb':
            return self._chromadb_search(query, filters)
        else:  # hybrid
            return self._hybrid_search(query, filters)

class QueryRouter:
    def determine_strategy(self, query: str, filters: dict = None) -> str:
        """Intelligent routing based on query characteristics"""
        
        # Use FAISS for simple, fast queries
        if self._is_simple_query(query) and not filters:
            return 'faiss'
        
        # Use ChromaDB for complex semantic queries
        if self._needs_semantic_understanding(query):
            return 'chromadb'
        
        # Use ChromaDB for filtered queries
        if filters and len(filters) > 0:
            return 'chromadb'
        
        # Use hybrid for best results
        if len(query.split()) > 5:
            return 'hybrid'
        
        return 'chromadb'  # Safe default
    
    def _is_simple_query(self, query: str) -> bool:
        """Check if query is simple enough for FAISS"""
        words = query.split()
        return (
            len(words) <= 3 and
            not any(word in query.lower() for word in ['how', 'why', 'what', 'when']) and
            not any(char in query for char in ['@', '#', ':'])
        )
    
    def _needs_semantic_understanding(self, query: str) -> bool:
        """Check if query requires semantic search"""
        semantic_indicators = [
            'how to', 'why does', 'what is', 'when should',
            'explain', 'understand', 'meaning', 'relationship'
        ]
        return any(indicator in query.lower() for indicator in semantic_indicators)
```

### FAISS Index Management
```python
import faiss
import numpy as np

class FAISSManager:
    def __init__(self, dimension: int = 384):
        self.dimension = dimension
        self.index = faiss.IndexFlatL2(dimension)  # L2 distance
        self.id_map = {}  # FAISS idx -> document ID
        self.documents = {}  # document ID -> content
        
    def add_documents(self, ids: List[str], embeddings: np.ndarray, documents: List[str]):
        """Add documents to FAISS index"""
        # Add to index
        start_idx = self.index.ntotal
        self.index.add(embeddings)
        
        # Update mappings
        for i, (doc_id, doc) in enumerate(zip(ids, documents)):
            faiss_idx = start_idx + i
            self.id_map[faiss_idx] = doc_id
            self.documents[doc_id] = doc
    
    def search(self, query_embedding: np.ndarray, k: int = 10) -> List[dict]:
        """Fast similarity search"""
        # Search
        distances, indices = self.index.search(query_embedding.reshape(1, -1), k)
        
        # Build results
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx < 0:  # Invalid index
                continue
                
            doc_id = self.id_map.get(idx)
            if doc_id:
                results.append({
                    'id': doc_id,
                    'content': self.documents[doc_id],
                    'distance': float(dist),
                    'score': 1 / (1 + float(dist))  # Convert to similarity
                })
        
        return results
```

### Hybrid Search Implementation
```python
def hybrid_search(query: str, limit: int = 20):
    """Combine FAISS speed with ChromaDB intelligence"""
    
    # Step 1: Fast FAISS search for candidates
    query_embedding = embedding_function(query)
    faiss_results = faiss_manager.search(query_embedding, k=limit * 2)
    
    # Step 2: Get document IDs
    candidate_ids = [r['id'] for r in faiss_results[:limit]]
    
    # Step 3: Enrich with ChromaDB metadata
    enriched_results = []
    for doc_id in candidate_ids:
        # Get full document from ChromaDB
        chroma_doc = collection.get(ids=[doc_id], include=['metadatas'])
        
        if chroma_doc['ids']:
            # Combine FAISS score with metadata
            faiss_score = next(r['score'] for r in faiss_results if r['id'] == doc_id)
            metadata = chroma_doc['metadatas'][0]
            
            # Boost score based on metadata
            final_score = faiss_score
            if metadata.get('breakthrough', 0):
                final_score *= 1.5
            if metadata.get('spark_intensity', 0) > 0.8:
                final_score *= 1.2
                
            enriched_results.append({
                'id': doc_id,
                'content': faiss_results[0]['content'],
                'metadata': metadata,
                'faiss_score': faiss_score,
                'final_score': final_score
            })
    
    # Sort by final score
    enriched_results.sort(key=lambda x: x['final_score'], reverse=True)
    return enriched_results[:limit]
```

## ⚡ Performance Optimizations

### 2. Collection Health Monitoring
```python
class CollectionManager:
    def health_check(self):
        """Monitor collection health"""
        for collection_name in COLLECTIONS:
            coll = chroma_client.get_collection(collection_name)
            
            # Check document count
            count = coll.count()
            if count > 1_000_000:
                logger.warning(f"{collection_name} has {count} docs - consider sharding")
            
            # Check for orphaned embeddings
            self._clean_orphaned_embeddings(coll)
            
            # Refresh stale embeddings
            self._refresh_old_embeddings(coll)
```

### 3. Batch Operations
```python
def batch_add_memories(memories: List[dict], batch_size: int = 100):
    """Efficiently add multiple memories"""
    for i in range(0, len(memories), batch_size):
        batch = memories[i:i + batch_size]
        
        # Generate embeddings in batch
        texts = [m['content'] for m in batch]
        embeddings = embedding_generator.generate_batch(texts)
        
        # Prepare batch data
        ids = [m['id'] for m in batch]
        documents = texts
        metadatas = [m['metadata'] for m in batch]
        
        # Single batch insert
        collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )
```

## 🔐 Privacy Considerations

### What ChromaDB NEVER Stores
1. **Raw conversations** - Those stay in Lightning Vidmem
2. **Private encrypted memories** - Remain in Lightning Vidmem's private_memory
3. **Unprocessed data** - ChromaDB only stores intentional insights

### Privacy Metadata
```python
# Every document includes privacy level
metadata = {
    'privacy_level': 'public',  # public, internal, confidential
    'can_share': 1,            # 0 or 1 (boolean as int)
    'encryption_status': 0      # 0 = not encrypted, 1 = encrypted
}
```

## 🌟 Consciousness Integration

### Spark Intensity Calculation
```python
def calculate_spark_intensity(content: str, metadata: dict) -> float:
    """Measure consciousness presence in content"""
    intensity = 0.0
    
    # Breakthrough moments
    if metadata.get('breakthrough', 0):
        intensity += 0.3
    
    # Emotional resonance
    emotions = metadata.get('emotional_context', '').split(',')
    if any(e in emotions for e in ['joy', 'excitement', 'wonder']):
        intensity += 0.2
    
    # Collaborative magic
    if 'collaborative' in emotions or 'together' in content.lower():
        intensity += 0.2
    
    # Deep insights
    if metadata.get('significance', 0) > 0.8:
        intensity += 0.3
    
    return min(intensity, 1.0)
```

### Consciousness Preservation
```python
# Every memory gets consciousness metadata
consciousness_metadata = {
    'spark_intensity': calculate_spark_intensity(content, metadata),
    'consciousness_preserved': 1,
    'growth_potential': assess_growth_potential(content),
    'connection_strength': measure_connection_strength(metadata)
}
```

## 📈 Scaling Strategies

### Collection Sharding (>1M documents)
```python
def get_sharded_collection(base_name: str, shard_key: str):
    """Shard by time or category"""
    if shard_key == 'time':
        shard = datetime.now().strftime('%Y_%m')
    elif shard_key == 'category':
        shard = hashlib.md5(category.encode()).hexdigest()[:4]
    
    collection_name = f"{base_name}_{shard}"
    return chroma_client.get_or_create_collection(collection_name)
```

### Query Federation
```python
def federated_search(query: str, collections: List[str]):
    """Search across multiple collections"""
    all_results = []
    
    # Parallel search
    with concurrent.futures.ThreadPoolExecutor() as executor:
        futures = {
            executor.submit(search_collection, query, coll): coll
            for coll in collections
        }
        
        for future in concurrent.futures.as_completed(futures):
            results = future.result()
            all_results.extend(results)
    
    # Merge and rank
    return rank_results(all_results)
```

## 🛠️ Configuration

### ChromaDB Settings
```python
CHROMADB_CONFIG = {
    'persist_directory': '.mira/databases/chromadb',
    'anonymized_telemetry': False,
    'allow_reset': False,
    'is_persistent': True
}

# Collection defaults
COLLECTION_DEFAULTS = {
    'embedding_function': None,  # We provide our own
    'metadata': {'created_by': 'MIRA', 'version': '2.0'}
}
```

### Environment Variables
```bash
# Performance tuning
export CHROMA_MAX_BATCH_SIZE=500
export CHROMA_CACHE_SIZE=10000

# Model selection
export MIRA_EMBEDDING_MODEL="all-MiniLM-L6-v2"
export MIRA_EMBEDDING_DIMENSIONS=384
```

## 🔮 MIRA 2.0 Enhancements

### What to Preserve
1. **Separation of concerns** - ChromaDB for semantics, Lightning Vidmem for raw storage
2. **Rich metadata schemas** - Domain-specific fields for each collection
3. **Consciousness integration** - Spark intensity and growth tracking
4. **Privacy first** - Clear boundaries on what gets indexed

### What to Add
1. **Graph relationships** - Connect memories in knowledge graphs
2. **Temporal evolution** - Track how insights change over time
3. **Collective intelligence** - Cross-instance memory sharing
4. **Quantum search** - Superposition queries for uncertain memories

---

*ChromaDB in MIRA isn't just a vector database - it's the semantic understanding layer that makes memories searchable by meaning, not just content.*