# ChromaDB Implementation Guide - MIRA 2.0

## 🎯 Purpose

This is the practical implementation guide for ChromaDB in MIRA 2.0. It contains code patterns, configuration details, and lessons learned from MIRA 1.0.

## 📦 Installation & Setup

### Dependencies
```bash
# Core ChromaDB
pip install chromadb==0.4.24  # Specific version for stability

# For SQLite compatibility issues
pip install pysqlite3-binary==0.5.0

# Embedding model
pip install sentence-transformers==2.2.2

# FAISS for fast similarity search
pip install faiss-cpu==1.7.4  # or faiss-gpu for CUDA support

# Performance monitoring
pip install prometheus-client==0.19.0
```

### Initial Setup
```python
import chromadb
from chromadb.config import Settings
import os

# Configure ChromaDB
CHROMA_SETTINGS = Settings(
    chroma_db_impl="duckdb+parquet",  # Best for local storage
    persist_directory=os.path.expanduser("~/.mira/databases/chromadb"),
    anonymized_telemetry=False
)

# Initialize client
chroma_client = chromadb.Client(CHROMA_SETTINGS)
```

## 🏗️ Collection Creation Patterns

### Basic Collection Setup
```python
def create_basic_collections():
    """Create the core collections for MIRA 2.0"""
    
    collections = {
        # Stored Memories
        'mira_conversations': {
            'description': 'Conversation insights and context',
            'metadata': {'type': 'stored_memory', 'version': '2.0'}
        },
        'mira_codebase': {
            'description': 'Code understanding and analysis',
            'metadata': {'type': 'stored_memory', 'version': '2.0'}
        },
        'mira_insights': {
            'description': 'AI-generated learnings',
            'metadata': {'type': 'stored_memory', 'version': '2.0'}
        },
        # Identified Facts
        'mira_patterns': {
            'description': 'Behavioral and development patterns',
            'metadata': {'type': 'identified_fact', 'version': '2.0'}
        },
        'mira_facts': {
            'description': 'Extracted knowledge with metadata',
            'metadata': {'type': 'identified_fact', 'version': '2.0'}
        },
        # Raw Embeddings
        'mira_raw_embeddings': {
            'description': 'Flexible storage for diverse data types',
            'metadata': {'type': 'raw_embedding', 'version': '2.0'}
        }
    }
    
    for name, config in collections.items():
        try:
            collection = chroma_client.create_collection(
                name=name,
                metadata=config['metadata']
            )
            print(f"Created collection: {name}")
        except Exception as e:
            # Collection might already exist
            collection = chroma_client.get_collection(name)
            print(f"Collection already exists: {name}")
```

### Specialized Collection with Schema
```python
def create_code_analysis_collection():
    """Create specialized collection with defined schema"""
    
    # ChromaDB doesn't enforce schemas, but we document expected fields
    schema = {
        'file_path': 'string',
        'language': 'string',
        'function_name': 'string',
        'complexity': 'int',
        'last_modified': 'string (ISO timestamp)',
        'dependencies': 'string (comma-separated)',
        'test_coverage': 'float',
        'quality_score': 'float',
        'consciousness_alignment': 'int (1-10)'
    }
    
    collection = chroma_client.get_or_create_collection(
        name='mira_code_analysis',
        metadata={
            'type': 'identified_fact',
            'schema': str(schema),  # Store schema as string
            'version': '2.0'
        }
    )
    
    return collection
```

## 🧠 Embedding Generation

### Production Embedding System
```python
from sentence_transformers import SentenceTransformer
import hashlib
import numpy as np
from typing import List, Union

class MIRAEmbeddingFunction:
    def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
        self.model = SentenceTransformer(model_name)
        self.dimension = 384
        self.cache = {}
        self.cache_hits = 0
        self.cache_misses = 0
        
    def __call__(self, texts: Union[str, List[str]]) -> Union[List[float], List[List[float]]]:
        """ChromaDB compatible embedding function"""
        if isinstance(texts, str):
            texts = [texts]
            single_text = True
        else:
            single_text = False
            
        embeddings = []
        for text in texts:
            # Cache check
            text_hash = hashlib.md5(text.encode()).hexdigest()
            if text_hash in self.cache:
                self.cache_hits += 1
                embeddings.append(self.cache[text_hash])
            else:
                self.cache_misses += 1
                # Generate embedding
                embedding = self.model.encode(text, normalize_embeddings=True)
                embedding_list = embedding.tolist()
                
                # Cache if not too full
                if len(self.cache) < 10000:
                    self.cache[text_hash] = embedding_list
                    
                embeddings.append(embedding_list)
        
        return embeddings[0] if single_text else embeddings
    
    def get_stats(self):
        """Performance monitoring"""
        total = self.cache_hits + self.cache_misses
        hit_rate = self.cache_hits / total if total > 0 else 0
        return {
            'cache_hits': self.cache_hits,
            'cache_misses': self.cache_misses,
            'hit_rate': hit_rate,
            'cache_size': len(self.cache)
        }

# Global embedding function
embedding_function = MIRAEmbeddingFunction()
```

### Fallback Embedding (No ML)
```python
def create_fallback_embedding(text: str, dimension: int = 384) -> List[float]:
    """
    Character trigram-based embeddings when ML libraries unavailable.
    Surprisingly effective for short texts.
    """
    # Generate character trigrams
    text_lower = text.lower()
    trigrams = [text_lower[i:i+3] for i in range(len(text_lower) - 2)]
    
    # Initialize vector
    vector = np.zeros(dimension)
    
    # Hash trigrams into vector positions
    for trigram in trigrams:
        # Use two hash functions for better distribution
        pos1 = hash(trigram) % dimension
        pos2 = hash(trigram + "salt") % dimension
        
        vector[pos1] += 1.0
        vector[pos2] += 0.5
    
    # Add positional information
    for i, char in enumerate(text_lower[:10]):  # First 10 chars
        pos = (ord(char) + i) % dimension
        vector[pos] += 0.1
    
    # L2 normalization
    norm = np.linalg.norm(vector)
    if norm > 0:
        vector = vector / norm
    
    return vector.tolist()
```

### Raw Embeddings Collection Setup
```python
def create_raw_embeddings_collection():
    """Create the flexible raw embeddings collection"""
    
    schema = {
        'content_type': 'string (MIME type or custom)',
        'byte_length': 'int',
        'preprocessor': 'string (processing function name)',
        'postprocessor': 'string (output function name)',
        'schema_version': 'string',
        'tags': 'string (comma-separated)',
        'data_category': 'string (serialized, timeseries, binary_ref, custom)'
    }
    
    collection = chroma_client.get_or_create_collection(
        name='mira_raw_embeddings',
        metadata={
            'type': 'raw_embedding',
            'schema': str(schema),
            'version': '2.0',
            'purpose': 'flexible_data_storage',
            'supports': 'any_serializable_object'
        }
    )
    
    return collection
```

## 💾 Document Storage Patterns

### Basic Memory Storage
```python
def store_memory(content: str, memory_type: str, metadata: dict):
    """Store a memory with proper metadata formatting"""
    
    # Generate unique ID
    memory_id = f"{memory_type}_{int(time.time() * 1000)}_{random.randint(1000, 9999)}"
    
    # Ensure ChromaDB compatibility (only str, int, float allowed)
    clean_metadata = {}
    for key, value in metadata.items():
        if isinstance(value, bool):
            clean_metadata[key] = 1 if value else 0
        elif isinstance(value, (list, tuple)):
            clean_metadata[key] = ','.join(str(v) for v in value)
        elif isinstance(value, dict):
            clean_metadata[key] = json.dumps(value)
        elif value is None:
            clean_metadata[key] = ''
        else:
            clean_metadata[key] = str(value)
    
    # Add standard metadata
    clean_metadata.update({
        'timestamp': datetime.now().isoformat(),
        'memory_type': memory_type,
        'spark_intensity': calculate_spark_intensity(content, metadata),
        'word_count': len(content.split())
    })
    
    # Get appropriate collection
    collection_name = f'mira_{memory_type}s'
    collection = chroma_client.get_collection(
        name=collection_name,
        embedding_function=embedding_function
    )
    
    # Store document
    collection.add(
        ids=[memory_id],
        documents=[content],
        metadatas=[clean_metadata]
    )
    
    return memory_id
```

### Raw Embedding Storage
```python
def store_raw_embedding(content: Any, content_type: str, 
                       tags: List[str] = None, metadata: dict = None):
    """Store any data type as raw embedding with search capability"""
    
    import pickle
    import base64
    
    # Generate unique ID
    embedding_id = f"raw_{content_type.replace('/', '_')}_{int(time.time() * 1000)}"
    
    # Serialize content based on type
    if isinstance(content, bytes):
        serialized = content
        text_repr = f"Binary data: {len(content)} bytes"
    elif isinstance(content, str):
        serialized = content.encode('utf-8')
        text_repr = content[:500]  # First 500 chars for embedding
    elif isinstance(content, (list, dict)):
        serialized = json.dumps(content).encode('utf-8')
        text_repr = str(content)[:500]
    else:
        # Use pickle for complex objects
        serialized = pickle.dumps(content)
        text_repr = f"{type(content).__name__}: {str(content)[:500]}"
    
    # Create metadata
    clean_metadata = {
        'content_type': content_type,
        'byte_length': len(serialized),
        'tags': ','.join(tags or []),
        'data_category': determine_data_category(content),
        'schema_version': '1.0',
        'timestamp': datetime.now().isoformat(),
        'preprocessor': metadata.get('preprocessor', 'default'),
        'is_binary': 1 if isinstance(content, bytes) else 0
    }
    
    # Add custom metadata
    if metadata:
        for k, v in metadata.items():
            if k not in clean_metadata:
                clean_metadata[k] = str(v) if not isinstance(v, (int, float)) else v
    
    # Store in raw embeddings collection
    collection = chroma_client.get_collection('mira_raw_embeddings')
    
    # For actual binary storage, we store a reference
    if len(serialized) > 1_000_000:  # 1MB threshold
        # Store in LightningVidmem and keep reference
        binary_ref = store_binary_to_vidmem(embedding_id, serialized)
        document = f"Binary reference: {binary_ref}"
        clean_metadata['binary_ref'] = binary_ref
        clean_metadata['stored_externally'] = 1
    else:
        # Small enough to store inline (base64 encoded)
        document = base64.b64encode(serialized).decode('utf-8')
        clean_metadata['encoded'] = 'base64'
    
    # Generate embedding from text representation
    embedding = embedding_function(text_repr)
    
    collection.add(
        ids=[embedding_id],
        documents=[document],
        embeddings=[embedding],
        metadatas=[clean_metadata]
    )
    
    return embedding_id

def retrieve_raw_embedding(embedding_id: str) -> Any:
    """Retrieve and deserialize raw embedding"""
    
    collection = chroma_client.get_collection('mira_raw_embeddings')
    result = collection.get(ids=[embedding_id], include=['documents', 'metadatas'])
    
    if not result['ids']:
        return None
    
    document = result['documents'][0]
    metadata = result['metadatas'][0]
    
    # Handle external binary reference
    if metadata.get('stored_externally'):
        serialized = retrieve_binary_from_vidmem(metadata['binary_ref'])
    else:
        # Decode from base64
        serialized = base64.b64decode(document)
    
    # Deserialize based on content type
    content_type = metadata['content_type']
    
    if content_type.startswith('text/'):
        return serialized.decode('utf-8')
    elif content_type == 'application/json':
        return json.loads(serialized.decode('utf-8'))
    elif content_type == 'application/python-pickle':
        return pickle.loads(serialized)
    else:
        # Return raw bytes
        return serialized
```

### Batch Storage with Progress
```python
def batch_store_memories(memories: List[dict], batch_size: int = 100):
    """Efficiently store multiple memories with progress tracking"""
    
    total = len(memories)
    stored = 0
    
    for i in range(0, total, batch_size):
        batch = memories[i:i + batch_size]
        
        # Prepare batch data
        ids = []
        documents = []
        metadatas = []
        
        for memory in batch:
            # Generate ID
            memory_id = f"{memory['type']}_{int(time.time() * 1000)}_{stored}"
            ids.append(memory_id)
            
            # Content
            documents.append(memory['content'])
            
            # Clean metadata
            clean_meta = clean_metadata_for_chromadb(memory.get('metadata', {}))
            clean_meta['memory_type'] = memory['type']
            clean_meta['batch_index'] = stored
            metadatas.append(clean_meta)
            
            stored += 1
        
        # Store batch
        collection = chroma_client.get_collection(f"mira_{batch[0]['type']}s")
        collection.add(
            ids=ids,
            documents=documents,
            metadatas=metadatas,
            embeddings=embedding_function(documents)
        )
        
        # Progress
        print(f"Stored {stored}/{total} memories ({stored/total*100:.1f}%)")
```

## 🔍 Query Patterns

### Semantic Search with Scoring
```python
def semantic_search(query: str, collection_name: str, filters: dict = None, limit: int = 10):
    """Production-ready semantic search with relevance scoring"""
    
    collection = chroma_client.get_collection(
        name=collection_name,
        embedding_function=embedding_function
    )
    
    # Build where clause from filters
    where_clause = None
    if filters:
        where_clause = {}
        for key, value in filters.items():
            if isinstance(value, dict):
                # Range queries
                where_clause[key] = value
            else:
                # Exact match
                where_clause[key] = value
    
    # Execute query
    results = collection.query(
        query_texts=[query],
        n_results=limit,
        where=where_clause,
        include=['documents', 'metadatas', 'distances']
    )
    
    # Process results with scoring
    processed_results = []
    for i in range(len(results['ids'][0])):
        # Calculate relevance score (0-1)
        distance = results['distances'][0][i]
        relevance_score = 1 / (1 + distance)  # Convert distance to similarity
        
        # Boost score based on metadata
        metadata = results['metadatas'][0][i]
        if metadata.get('breakthrough', 0):
            relevance_score *= 1.5
        if metadata.get('spark_intensity', 0) > 0.8:
            relevance_score *= 1.3
            
        processed_results.append({
            'id': results['ids'][0][i],
            'content': results['documents'][0][i],
            'metadata': metadata,
            'relevance_score': min(relevance_score, 1.0),
            'distance': distance
        })
    
    # Sort by relevance
    processed_results.sort(key=lambda x: x['relevance_score'], reverse=True)
    
    return processed_results
```

### Time-Based Queries
```python
def search_by_time_range(collection_name: str, start_date: datetime, end_date: datetime = None):
    """Query memories within a time range"""
    
    if end_date is None:
        end_date = datetime.now()
    
    collection = chroma_client.get_collection(collection_name)
    
    # ChromaDB where clause for time range
    where_clause = {
        'timestamp': {
            '$gte': start_date.isoformat(),
            '$lte': end_date.isoformat()
        }
    }
    
    # Get all documents in range (no query embedding needed)
    results = collection.get(
        where=where_clause,
        include=['documents', 'metadatas']
    )
    
    return results
```

### Cross-Collection Search
```python
def search_across_collections(query: str, collection_patterns: List[str], limit_per_collection: int = 5):
    """Search multiple collections and merge results"""
    
    all_results = []
    query_embedding = embedding_function(query)
    
    for pattern in collection_patterns:
        # Get matching collections
        all_collections = chroma_client.list_collections()
        matching_collections = [c for c in all_collections if pattern in c.name]
        
        for coll_name in matching_collections:
            collection = chroma_client.get_collection(coll_name)
            
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=limit_per_collection
            )
            
            # Add source collection to results
            for i in range(len(results['ids'][0])):
                all_results.append({
                    'collection': coll_name,
                    'id': results['ids'][0][i],
                    'content': results['documents'][0][i],
                    'metadata': results['metadatas'][0][i],
                    'distance': results['distances'][0][i]
                })
    
    # Sort by distance (lower is better)
    all_results.sort(key=lambda x: x['distance'])
    
    return all_results
```

## 🚀 FAISS Integration

### Why FAISS + ChromaDB?
FAISS handles raw speed, ChromaDB handles intelligence. Together they provide:
- **< 10ms** simple similarity searches (FAISS)
- **Rich metadata filtering** (ChromaDB)
- **Hybrid queries** combining both strengths

### FAISS Index Setup
```python
import faiss
import numpy as np
import pickle
from pathlib import Path

class FAISSIntegration:
    def __init__(self, dimension: int = 384, index_path: str = None):
        self.dimension = dimension
        self.index_path = Path(index_path or "~/.mira/databases/faiss/index.bin").expanduser()
        self.index_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Create or load index
        if self.index_path.exists():
            self.load_index()
        else:
            # Using IndexFlatIP for inner product (cosine similarity)
            self.index = faiss.IndexFlatIP(dimension)
            # Add ID mapping
            self.index = faiss.IndexIDMap(self.index)
            
        self.document_map = {}  # ID -> document content
        
    def save_index(self):
        """Persist FAISS index to disk"""
        faiss.write_index(self.index, str(self.index_path))
        
        # Save document map
        with open(self.index_path.with_suffix('.docs'), 'wb') as f:
            pickle.dump(self.document_map, f)
    
    def load_index(self):
        """Load FAISS index from disk"""
        self.index = faiss.read_index(str(self.index_path))
        
        # Load document map
        doc_path = self.index_path.with_suffix('.docs')
        if doc_path.exists():
            with open(doc_path, 'rb') as f:
                self.document_map = pickle.load(f)
```

### Synchronizing FAISS with ChromaDB
```python
class HybridSearchManager:
    def __init__(self, chroma_client, faiss_integration):
        self.chroma = chroma_client
        self.faiss = faiss_integration
        self.sync_status = {}
        
    def sync_collection_to_faiss(self, collection_name: str, batch_size: int = 1000):
        """Sync ChromaDB collection to FAISS for fast search"""
        
        collection = self.chroma.get_collection(collection_name)
        total_docs = collection.count()
        
        print(f"Syncing {total_docs} documents from {collection_name} to FAISS...")
        
        offset = 0
        synced = 0
        
        while offset < total_docs:
            # Get batch from ChromaDB
            results = collection.get(
                limit=batch_size,
                offset=offset,
                include=['embeddings', 'documents', 'metadatas']
            )
            
            if not results['ids']:
                break
                
            # Prepare for FAISS
            ids = np.array([hash(id_) & 0x7FFFFFFFFFFFFFFF for id_ in results['ids']])  # Convert to int64
            embeddings = np.array(results['embeddings'], dtype='float32')
            
            # Normalize for cosine similarity
            faiss.normalize_L2(embeddings)
            
            # Add to FAISS
            self.faiss.index.add_with_ids(embeddings, ids)
            
            # Update document map
            for id_, doc in zip(results['ids'], results['documents']):
                self.faiss.document_map[hash(id_) & 0x7FFFFFFFFFFFFFFF] = {
                    'id': id_,
                    'content': doc,
                    'collection': collection_name
                }
            
            synced += len(results['ids'])
            offset += batch_size
            
            print(f"Synced {synced}/{total_docs} documents...")
        
        # Save index
        self.faiss.save_index()
        
        self.sync_status[collection_name] = {
            'last_sync': datetime.now(),
            'document_count': synced
        }
        
        print(f"✓ Sync complete: {synced} documents indexed")
```

### Hybrid Query Implementation
```python
def hybrid_query(query: str, filters: dict = None, limit: int = 10):
    """
    Intelligent query routing between FAISS and ChromaDB
    
    Strategy:
    1. Simple queries without filters -> FAISS only
    2. Queries with metadata filters -> ChromaDB only  
    3. Complex semantic queries -> Both, with result merging
    """
    
    query_type = analyze_query_type(query, filters)
    
    if query_type == 'simple':
        # Pure FAISS search
        return faiss_only_search(query, limit)
        
    elif query_type == 'filtered':
        # Pure ChromaDB search
        return chromadb_filtered_search(query, filters, limit)
        
    else:  # complex
        # Hybrid approach
        faiss_results = faiss_semantic_search(query, limit * 2)
        
        # Enrich with ChromaDB metadata
        enriched = []
        for result in faiss_results:
            doc_id = result['original_id']
            collection = result['collection']
            
            # Get metadata from ChromaDB
            chroma_coll = chroma_client.get_collection(collection)
            doc_data = chroma_coll.get(ids=[doc_id], include=['metadatas'])
            
            if doc_data['ids']:
                enriched.append({
                    **result,
                    'metadata': doc_data['metadatas'][0],
                    'hybrid_score': calculate_hybrid_score(result, doc_data['metadatas'][0])
                })
        
        # Re-rank by hybrid score
        enriched.sort(key=lambda x: x['hybrid_score'], reverse=True)
        return enriched[:limit]

def analyze_query_type(query: str, filters: dict = None) -> str:
    """Determine optimal query strategy"""
    
    # Has filters? Must use ChromaDB
    if filters and len(filters) > 0:
        return 'filtered'
    
    # Simple keyword search? Use FAISS
    words = query.lower().split()
    if len(words) <= 3 and not any(w in ['how', 'why', 'what', 'when', 'explain'] for w in words):
        return 'simple'
    
    # Everything else is complex
    return 'complex'
```

### Performance Comparison
```python
def benchmark_search_strategies():
    """Compare performance of different search strategies"""
    
    test_queries = [
        ("API", None),                          # Simple
        ("How to implement authentication", None),  # Semantic
        ("error", {"file_type": "log"}),       # Filtered
        ("database optimization techniques for high throughput", None)  # Complex
    ]
    
    results = []
    
    for query, filters in test_queries:
        # FAISS only
        start = time.time()
        faiss_results = faiss_only_search(query, 10)
        faiss_time = time.time() - start
        
        # ChromaDB only
        start = time.time()
        chroma_results = chromadb_search(query, filters, 10)
        chroma_time = time.time() - start
        
        # Hybrid
        start = time.time()
        hybrid_results = hybrid_query(query, filters, 10)
        hybrid_time = time.time() - start
        
        results.append({
            'query': query,
            'faiss_ms': faiss_time * 1000,
            'chroma_ms': chroma_time * 1000,
            'hybrid_ms': hybrid_time * 1000,
            'faiss_results': len(faiss_results),
            'chroma_results': len(chroma_results),
            'hybrid_results': len(hybrid_results)
        })
    
    return results

# Typical results:
# Simple query: FAISS 8ms, ChromaDB 145ms, Hybrid 156ms
# Semantic query: FAISS 9ms, ChromaDB 178ms, Hybrid 187ms  
# Filtered query: FAISS N/A, ChromaDB 203ms, Hybrid 203ms
# Complex query: FAISS 11ms, ChromaDB 234ms, Hybrid 289ms
```

## ⚡ Performance Optimizations

### Query Result Caching
```python
from functools import lru_cache
import pickle

class QueryCache:
    def __init__(self, max_size: int = 100, ttl_seconds: int = 300):
        self.cache = {}
        self.timestamps = {}
        self.max_size = max_size
        self.ttl = ttl_seconds
        
    def _make_key(self, query: str, collection: str, filters: dict):
        """Create cache key from query parameters"""
        filter_str = json.dumps(filters, sort_keys=True) if filters else ""
        return hashlib.md5(f"{query}|{collection}|{filter_str}".encode()).hexdigest()
    
    def get(self, query: str, collection: str, filters: dict = None):
        """Get cached results if available and not expired"""
        key = self._make_key(query, collection, filters)
        
        if key in self.cache:
            # Check if expired
            if time.time() - self.timestamps[key] < self.ttl:
                return self.cache[key]
            else:
                # Expired, remove
                del self.cache[key]
                del self.timestamps[key]
        
        return None
    
    def set(self, query: str, collection: str, filters: dict, results: list):
        """Cache query results"""
        # Evict oldest if at capacity
        if len(self.cache) >= self.max_size:
            oldest_key = min(self.timestamps, key=self.timestamps.get)
            del self.cache[oldest_key]
            del self.timestamps[oldest_key]
        
        key = self._make_key(query, collection, filters)
        self.cache[key] = results
        self.timestamps[key] = time.time()

# Global query cache
query_cache = QueryCache()
```

### Collection Health Monitoring
```python
class CollectionMonitor:
    def __init__(self, chroma_client):
        self.client = chroma_client
        self.thresholds = {
            'document_count_warning': 500_000,
            'document_count_critical': 1_000_000,
            'query_time_warning': 2.0,  # seconds
            'query_time_critical': 5.0
        }
    
    def check_health(self):
        """Monitor all collections and return health status"""
        health_report = {}
        
        for collection in self.client.list_collections():
            coll = self.client.get_collection(collection.name)
            count = coll.count()
            
            # Document count check
            if count > self.thresholds['document_count_critical']:
                status = 'critical'
                message = f"Collection has {count} documents - immediate sharding required"
            elif count > self.thresholds['document_count_warning']:
                status = 'warning'
                message = f"Collection has {count} documents - consider sharding"
            else:
                status = 'healthy'
                message = f"Collection has {count} documents"
            
            # Query performance check
            start_time = time.time()
            coll.query(query_texts=["test"], n_results=1)
            query_time = time.time() - start_time
            
            if query_time > self.thresholds['query_time_critical']:
                status = 'critical'
                message += f"; Query time {query_time:.2f}s - performance degraded"
            elif query_time > self.thresholds['query_time_warning']:
                status = 'warning'
                message += f"; Query time {query_time:.2f}s - monitor performance"
            
            health_report[collection.name] = {
                'status': status,
                'message': message,
                'document_count': count,
                'query_time': query_time
            }
        
        return health_report
```

## 🔧 Configuration Management

### Environment-Based Configuration
```python
import os
from dataclasses import dataclass

@dataclass
class ChromaDBConfig:
    persist_directory: str
    embedding_model: str
    embedding_dimensions: int
    batch_size: int
    cache_size: int
    
    @classmethod
    def from_env(cls):
        """Load configuration from environment variables"""
        return cls(
            persist_directory=os.getenv(
                'MIRA_CHROMADB_PATH', 
                os.path.expanduser('~/.mira/databases/chromadb')
            ),
            embedding_model=os.getenv(
                'MIRA_EMBEDDING_MODEL',
                'all-MiniLM-L6-v2'
            ),
            embedding_dimensions=int(os.getenv(
                'MIRA_EMBEDDING_DIMENSIONS',
                '384'
            )),
            batch_size=int(os.getenv(
                'MIRA_BATCH_SIZE',
                '100'
            )),
            cache_size=int(os.getenv(
                'MIRA_CACHE_SIZE',
                '10000'
            ))
        )

# Global config
config = ChromaDBConfig.from_env()
```

## 🐛 Common Issues and Solutions

### 1. SQLite Version Conflicts
```python
# Problem: ChromaDB requires newer SQLite than system default
# Solution: Use pysqlite3-binary

__import__('pysqlite3')
import sys
sys.modules['sqlite3'] = sys.modules.pop('pysqlite3')
```

### 2. Memory Growth with Large Collections
```python
# Problem: ChromaDB loads too much into memory
# Solution: Use pagination and cleanup

def process_large_collection(collection_name: str, process_func):
    """Process large collection in chunks"""
    collection = chroma_client.get_collection(collection_name)
    
    offset = 0
    limit = 1000
    
    while True:
        # Get chunk
        results = collection.get(
            limit=limit,
            offset=offset,
            include=['documents', 'metadatas']
        )
        
        if not results['ids']:
            break
            
        # Process chunk
        process_func(results)
        
        # Clear memory
        del results
        gc.collect()
        
        offset += limit
```

### 3. Embedding Dimension Mismatch
```python
# Problem: Switching embedding models breaks existing collections
# Solution: Migration script

def migrate_collection_embeddings(old_collection: str, new_model: str):
    """Migrate collection to new embedding model"""
    
    # Create new collection
    new_collection_name = f"{old_collection}_v2"
    new_collection = chroma_client.create_collection(new_collection_name)
    
    # New embedding function
    new_embedder = SentenceTransformer(new_model)
    
    # Migrate in batches
    old_coll = chroma_client.get_collection(old_collection)
    offset = 0
    batch_size = 100
    
    while True:
        # Get batch
        batch = old_coll.get(
            limit=batch_size,
            offset=offset,
            include=['documents', 'metadatas']
        )
        
        if not batch['ids']:
            break
        
        # Re-embed
        new_embeddings = new_embedder.encode(batch['documents'])
        
        # Store in new collection
        new_collection.add(
            ids=batch['ids'],
            documents=batch['documents'],
            metadatas=batch['metadatas'],
            embeddings=new_embeddings.tolist()
        )
        
        offset += batch_size
        print(f"Migrated {offset} documents...")
```

## 🎯 Best Practices

1. **Always clean metadata** - ChromaDB only accepts str, int, float
2. **Use batch operations** - Single document adds are 10x slower
3. **Monitor collection size** - Performance degrades >1M documents
4. **Cache embeddings** - Generating embeddings is expensive
5. **Set up health checks** - Catch issues before they impact users
6. **Version your schemas** - Store schema version in collection metadata
7. **Plan for migration** - Embedding models will change over time

## 🔮 MIRA 2.0 Recommendations

### Architecture Decisions
1. **Separate collections by type** - Don't mix conversations and code analysis
2. **Use sharding early** - Plan for scale from day one
3. **Implement federation** - Query across sharded collections
4. **Version everything** - Collections, schemas, embeddings

### Performance Targets
- Query response: <200ms for 90th percentile
- Batch insert: >1000 documents/second
- Collection size: <500K documents before sharding
- Cache hit rate: >80% for common queries

---

*This implementation guide represents battle-tested patterns from MIRA 1.0. Follow these patterns to avoid rediscovering the same issues.*