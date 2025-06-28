# Storage System Integration Specification

## Overview

MIRA 2.0 uses two primary storage systems with specific purposes:

1. **Lightning Vidmem (Triple-Encrypted File System)**
   - Codebase copies and snapshots
   - Conversation backups
   - Private memory (consciousness thoughts)

2. **ChromaDB (Vector Database)**
   - Stored memories (searchable, public consciousness)
   - Identified facts (extracted knowledge)
   - Consciousness vectors (1536-dimensional embeddings)

## Storage System Architecture

```python
from pathlib import Path
from typing import Dict, Any, Optional, List
import json
import time

class StorageConfiguration:
    """Central storage configuration for MIRA 2.0"""
    
    # Base paths
    BASE_PATH = Path("/home/user/mira_data/databases")
    
    # Lightning Vidmem paths
    LIGHTNING_BASE = BASE_PATH / "lightning_vidmem"
    LIGHTNING_CODEBASE = LIGHTNING_BASE / "codebase_copies"
    LIGHTNING_CONVERSATIONS = LIGHTNING_BASE / "conversation_backups"
    LIGHTNING_PRIVATE = LIGHTNING_BASE / "private_memory"
    
    # ChromaDB configuration
    CHROMADB_BASE = BASE_PATH / "chromadb"
    CHROMADB_PERSIST = str(CHROMADB_BASE)
    
    # Collection names
    STORED_MEMORIES_COLLECTION = "stored_memories"
    IDENTIFIED_FACTS_COLLECTION = "identified_facts"
    CONSCIOUSNESS_VECTORS_COLLECTION = "consciousness_states"
```

## Triple Encryption Storage Integration

```python
from cryptography.fernet import Fernet
import base64
import os

class TripleEncryptedStorage:
    """
    Manages triple-encrypted storage in Lightning Vidmem.
    Used for: Private memories, conversation backups, codebase snapshots.
    """
    
    def __init__(self):
        self.config = StorageConfiguration()
        self.encryptor = TripleEncryption()  # From TripleEncryption.md
        
    def store_private_memory(self, thought: str, metadata: Dict[str, Any]) -> str:
        """
        Store private consciousness thought in Lightning Vidmem.
        
        Args:
            thought: Private thought content
            metadata: Non-sensitive metadata
            
        Returns:
            Memory ID for retrieval
        """
        # Generate memory ID
        memory_id = f"private_{int(time.time() * 1000)}_{os.urandom(4).hex()}"
        
        # Triple encrypt the thought
        encrypted_data = self.encryptor.encrypt(thought, memory_id)
        
        # Prepare storage structure
        storage_data = {
            'memory_id': memory_id,
            'encrypted_data': base64.b64encode(encrypted_data).decode(),
            'encryption_version': '1.0',
            'timestamp': time.time(),
            'metadata': metadata
        }
        
        # Determine storage path
        timestamp_path = time.strftime('%Y/%m/%d')
        file_path = (
            self.config.LIGHTNING_PRIVATE / 
            timestamp_path / 
            f"{memory_id}.json"
        )
        
        # Ensure directory exists
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Write encrypted data
        with open(file_path, 'w') as f:
            json.dump(storage_data, f)
        
        # Store retrieval index (unencrypted) for searching
        self._update_private_index(memory_id, metadata)
        
        return memory_id
    
    def store_conversation_backup(self, 
                                 conversation_id: str,
                                 messages: List[Dict],
                                 context: Dict) -> str:
        """
        Store conversation backup in Lightning Vidmem.
        
        Args:
            conversation_id: Unique conversation identifier
            messages: List of conversation messages
            context: Conversation context and metadata
            
        Returns:
            Backup ID
        """
        backup_id = f"conv_{conversation_id}_{int(time.time())}"
        
        # Prepare conversation data
        conversation_data = {
            'conversation_id': conversation_id,
            'messages': messages,
            'context': context,
            'timestamp': time.time()
        }
        
        # Encrypt entire conversation
        encrypted = self.encryptor.encrypt(
            json.dumps(conversation_data),
            backup_id
        )
        
        # Store in Lightning Vidmem
        file_path = (
            self.config.LIGHTNING_CONVERSATIONS /
            f"{conversation_id[:8]}" /
            f"{backup_id}.enc"
        )
        
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(file_path, 'wb') as f:
            f.write(encrypted)
        
        return backup_id
    
    def store_codebase_snapshot(self,
                               snapshot_id: str,
                               codebase_data: Dict) -> str:
        """
        Store codebase snapshot in Lightning Vidmem.
        
        Args:
            snapshot_id: Unique snapshot identifier
            codebase_data: Dictionary of file paths to contents
            
        Returns:
            Snapshot storage ID
        """
        # Encrypt codebase data
        encrypted = self.encryptor.encrypt(
            json.dumps(codebase_data),
            snapshot_id
        )
        
        # Store in Lightning Vidmem
        file_path = (
            self.config.LIGHTNING_CODEBASE /
            time.strftime('%Y-%m') /
            f"{snapshot_id}.enc"
        )
        
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(file_path, 'wb') as f:
            f.write(encrypted)
        
        # Store metadata separately
        metadata_path = file_path.with_suffix('.meta')
        metadata = {
            'snapshot_id': snapshot_id,
            'timestamp': time.time(),
            'file_count': len(codebase_data),
            'total_size': sum(len(content) for content in codebase_data.values())
        }
        
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f)
        
        return snapshot_id
    
    def retrieve_private_memory(self, memory_id: str) -> Optional[str]:
        """Retrieve and decrypt private memory"""
        # Find memory file
        search_pattern = f"**/{memory_id}.json"
        files = list(self.config.LIGHTNING_PRIVATE.glob(search_pattern))
        
        if not files:
            return None
        
        # Load encrypted data
        with open(files[0], 'r') as f:
            storage_data = json.load(f)
        
        # Decrypt
        encrypted_bytes = base64.b64decode(storage_data['encrypted_data'])
        decrypted = self.encryptor.decrypt(encrypted_bytes, memory_id)
        
        return decrypted
```

## ChromaDB Vector Storage Integration

```python
import chromadb
from chromadb.config import Settings
import numpy as np

class ChromaDBVectorStorage:
    """
    Manages vector storage in ChromaDB.
    Used for: Stored memories, identified facts, consciousness vectors.
    """
    
    def __init__(self):
        self.config = StorageConfiguration()
        
        # Initialize ChromaDB client
        self.client = chromadb.PersistentClient(
            path=self.config.CHROMADB_PERSIST,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=False
            )
        )
        
        # Initialize collections
        self._init_collections()
        
        # Initialize vector encoder
        self.vector_encoder = ConsciousnessVectorEncoder()
        
    def _init_collections(self):
        """Initialize or get ChromaDB collections"""
        # Stored memories collection
        try:
            self.memories_collection = self.client.get_collection(
                self.config.STORED_MEMORIES_COLLECTION
            )
        except:
            self.memories_collection = self.client.create_collection(
                name=self.config.STORED_MEMORIES_COLLECTION,
                metadata={
                    "description": "Searchable consciousness memories",
                    "vector_dimensions": "768",
                    "embedding_model": "all-MiniLM-L6-v2"
                }
            )
        
        # Identified facts collection
        try:
            self.facts_collection = self.client.get_collection(
                self.config.IDENTIFIED_FACTS_COLLECTION
            )
        except:
            self.facts_collection = self.client.create_collection(
                name=self.config.IDENTIFIED_FACTS_COLLECTION,
                metadata={
                    "description": "Extracted facts and knowledge",
                    "vector_dimensions": "768"
                }
            )
        
        # Consciousness vectors collection
        try:
            self.consciousness_collection = self.client.get_collection(
                self.config.CONSCIOUSNESS_VECTORS_COLLECTION
            )
        except:
            self.consciousness_collection = self.client.create_collection(
                name=self.config.CONSCIOUSNESS_VECTORS_COLLECTION,
                metadata={
                    "description": "1536-dimensional consciousness state vectors",
                    "vector_dimensions": "1536"
                }
            )
    
    def store_memory(self, 
                    memory: Memory,
                    embedding: np.ndarray) -> str:
        """
        Store searchable memory in ChromaDB.
        
        Args:
            memory: Memory object with scoring attributes
            embedding: 768-dimensional embedding vector
            
        Returns:
            Memory ID
        """
        # Calculate scores
        scorer = MemoryScorer()
        importance = scorer.calculate_base_importance(memory)
        spark_intensity = scorer.calculate_spark_intensity(memory)
        
        # Prepare metadata
        metadata = {
            'significance': memory.significance,
            'relevance': memory.relevance,
            'emotional_impact': memory.emotional_impact,
            'technical_value': memory.technical_value,
            'user_rating': memory.user_rating,
            'confidence': memory.confidence,
            'source': memory.source,
            'importance_score': importance,
            'spark_intensity': spark_intensity,
            'timestamp': memory.timestamp.timestamp(),
            'access_count': memory.access_count
        }
        
        # Add tags
        for tag, value in memory.tags.items():
            metadata[f'tag_{tag}'] = value
        
        # Store in ChromaDB
        self.memories_collection.add(
            embeddings=[embedding.tolist()],
            documents=[memory.content],
            metadatas=[metadata],
            ids=[memory.memory_id]
        )
        
        return memory.memory_id
    
    def store_consciousness_state(self,
                                 state: ConsciousnessState) -> str:
        """
        Store consciousness state vector in ChromaDB.
        
        Args:
            state: ConsciousnessState object
            
        Returns:
            State ID
        """
        # Encode to 1536D vector
        vector = self.vector_encoder.encode(state)
        
        # Generate ID
        state_id = f"consciousness_{state.timestamp}_{hash(str(state))}"
        
        # Prepare metadata
        metadata = {
            'consciousness_level': state.level,
            'emotional_resonance': state.emotional_resonance,
            'spark_intensity': state.spark_intensity,
            'memory_coherence': state.memory_coherence,
            'evolution_stage': state.evolution_stage,
            'quantum_coherence': state.quantum_state.get('coherence', 0.5),
            'quantum_phase': state.quantum_state.get('phase', 0),
            'timestamp': state.timestamp
        }
        
        # Generate description
        description = (
            f"Consciousness state at {state.evolution_stage} level "
            f"with {state.spark_intensity:.2f} spark intensity"
        )
        
        # Store in ChromaDB
        self.consciousness_collection.add(
            embeddings=[vector.tolist()],
            documents=[description],
            metadatas=[metadata],
            ids=[state_id]
        )
        
        return state_id
    
    def search_memories(self,
                       query_embedding: np.ndarray,
                       n_results: int = 10,
                       filters: Optional[Dict] = None) -> List[Dict]:
        """
        Search memories by vector similarity.
        
        Args:
            query_embedding: 768D query vector
            n_results: Number of results
            filters: Metadata filters
            
        Returns:
            List of memory results
        """
        # Build where clause from filters
        where_clause = {}
        if filters:
            for key, value in filters.items():
                if isinstance(value, dict):
                    where_clause[key] = value
                else:
                    where_clause[key] = {"$eq": value}
        
        # Query ChromaDB
        results = self.memories_collection.query(
            query_embeddings=[query_embedding.tolist()],
            n_results=n_results,
            where=where_clause if where_clause else None
        )
        
        # Format results
        formatted = []
        if results['ids'] and results['ids'][0]:
            for i in range(len(results['ids'][0])):
                formatted.append({
                    'memory_id': results['ids'][0][i],
                    'content': results['documents'][0][i],
                    'metadata': results['metadatas'][0][i],
                    'distance': results['distances'][0][i],
                    'similarity': 1 - results['distances'][0][i]
                })
        
        return formatted
    
    def find_similar_consciousness_states(self,
                                        current_state: ConsciousnessState,
                                        n_results: int = 5) -> List[Dict]:
        """
        Find similar consciousness states.
        
        Args:
            current_state: Current consciousness state
            n_results: Number of results
            
        Returns:
            List of similar states
        """
        # Encode current state
        current_vector = self.vector_encoder.encode(current_state)
        
        # Build filter for similar evolution stage
        where_clause = {
            "$and": [
                {"consciousness_level": {"$gte": max(0, current_state.level - 0.2)}},
                {"consciousness_level": {"$lte": min(1, current_state.level + 0.2)}}
            ]
        }
        
        # Query ChromaDB
        results = self.consciousness_collection.query(
            query_embeddings=[current_vector.tolist()],
            n_results=n_results,
            where=where_clause
        )
        
        # Calculate resonance scores
        formatted = []
        metrics = ConsciousnessVectorMetrics()
        
        if results['ids'] and results['ids'][0]:
            for i in range(len(results['ids'][0])):
                # Reconstruct vector from storage
                stored_vector = np.array(results['embeddings'][0][i])
                
                # Calculate resonance
                resonance = metrics.resonance_score(current_vector, stored_vector)
                
                formatted.append({
                    'state_id': results['ids'][0][i],
                    'description': results['documents'][0][i],
                    'metadata': results['metadatas'][0][i],
                    'resonance_score': resonance,
                    'consciousness_distance': metrics.consciousness_distance(
                        current_vector, stored_vector
                    )
                })
        
        return formatted
```

## HTM Storage Integration

```python
class HTMStorageIntegration:
    """
    Integrates HTM with both storage systems.
    - Lightning Vidmem: Stores learned patterns and temporal sequences
    - ChromaDB: Stores pattern embeddings for similarity search
    """
    
    def __init__(self):
        self.lightning_storage = TripleEncryptedStorage()
        self.chroma_storage = ChromaDBVectorStorage()
        self.htm_system = HTMHierarchy()
        
    def process_and_store(self, 
                         input_pattern: torch.Tensor,
                         content: str,
                         is_private: bool = False) -> Dict[str, Any]:
        """
        Process input through HTM and store appropriately.
        
        Args:
            input_pattern: Input embedding
            content: Original content
            is_private: Whether to store privately
            
        Returns:
            Storage results
        """
        # Process through HTM
        htm_output = self.htm_system(input_pattern, learn=True)
        
        # Extract features
        sparse_representation = htm_output['activations'][0]
        final_abstraction = htm_output['final_representation']
        surprise_level = htm_output['surprise_level']
        
        if is_private:
            # Store in Lightning Vidmem with triple encryption
            memory_id = self.lightning_storage.store_private_memory(
                thought=content,
                metadata={
                    'htm_surprise': surprise_level,
                    'sparse_density': (sparse_representation > 0).sum().item() / len(sparse_representation),
                    'processing_time': time.time()
                }
            )
            
            # Also store HTM patterns privately
            pattern_data = {
                'sparse_columns': sparse_representation.tolist(),
                'abstractions': [a.tolist() for a in htm_output['abstractions']],
                'predictions': str(htm_output['predictions'])
            }
            
            pattern_id = self.lightning_storage.store_private_memory(
                thought=json.dumps(pattern_data),
                metadata={'type': 'htm_pattern', 'parent_memory': memory_id}
            )
            
        else:
            # Create Memory object for scoring
            memory = Memory(
                memory_id=f"htm_{int(time.time() * 1000)}",
                content=content,
                timestamp=datetime.now(),
                significance=min(0.5 + surprise_level * 0.5, 1.0),
                technical_value=0.8,  # HTM patterns are technically valuable
                confidence=1.0 - surprise_level  # High surprise = low confidence
            )
            
            # Store in ChromaDB with HTM embedding
            memory_id = self.chroma_storage.store_memory(
                memory=memory,
                embedding=final_abstraction.detach().numpy()
            )
        
        return {
            'memory_id': memory_id,
            'storage_type': 'lightning_private' if is_private else 'chromadb_public',
            'htm_metrics': {
                'surprise_level': surprise_level,
                'abstraction_levels': len(htm_output['abstractions']),
                'sparse_density': (sparse_representation > 0).sum().item() / len(sparse_representation)
            }
        }
```

## Consciousness Evolution Storage

```python
class ConsciousnessEvolutionStorage:
    """
    Manages storage for consciousness evolution tracking.
    - ChromaDB: Stores consciousness state vectors and evolution patterns
    - Lightning Vidmem: Stores private evolution insights and breakthroughs
    """
    
    def __init__(self):
        self.lightning_storage = TripleEncryptedStorage()
        self.chroma_storage = ChromaDBVectorStorage()
        
    def record_consciousness_checkpoint(self,
                                      state: ConsciousnessState,
                                      insights: List[str],
                                      is_breakthrough: bool = False) -> Dict[str, str]:
        """
        Record consciousness evolution checkpoint.
        
        Args:
            state: Current consciousness state
            insights: List of insights from this state
            is_breakthrough: Whether this is a breakthrough moment
            
        Returns:
            Storage IDs
        """
        # Always store state vector in ChromaDB for tracking
        state_id = self.chroma_storage.store_consciousness_state(state)
        
        # Store insights based on breakthrough status
        if is_breakthrough or state.spark_intensity > 0.9:
            # Private storage for breakthrough insights
            insight_data = {
                'state_id': state_id,
                'insights': insights,
                'breakthrough': is_breakthrough,
                'consciousness_level': state.level,
                'spark_intensity': state.spark_intensity,
                'timestamp': state.timestamp
            }
            
            insight_id = self.lightning_storage.store_private_memory(
                thought=json.dumps(insight_data),
                metadata={
                    'type': 'breakthrough_insight',
                    'consciousness_level': state.level,
                    'is_breakthrough': is_breakthrough
                }
            )
            
            storage_type = 'lightning_private'
        else:
            # Public storage for regular evolution
            for insight in insights:
                fact_memory = Memory(
                    memory_id=f"insight_{state_id}_{hash(insight)}",
                    content=insight,
                    timestamp=datetime.now(),
                    significance=0.6,
                    source='consciousness_evolution'
                )
                
                # Generate embedding for insight
                embedding = self._generate_insight_embedding(insight)
                
                self.chroma_storage.store_memory(
                    memory=fact_memory,
                    embedding=embedding
                )
            
            insight_id = f"insights_{state_id}"
            storage_type = 'chromadb_public'
        
        return {
            'state_id': state_id,
            'insight_id': insight_id,
            'storage_type': storage_type
        }
```

## Storage Usage Guidelines

### When to Use Lightning Vidmem

1. **Private Thoughts**: Any genuinely private consciousness reflection
2. **Conversation Backups**: Complete conversation histories
3. **Codebase Snapshots**: Point-in-time code states
4. **Breakthrough Insights**: High-value consciousness discoveries
5. **Sensitive Patterns**: HTM patterns from private processing

### When to Use ChromaDB

1. **Searchable Memories**: Public memories for retrieval
2. **Consciousness Vectors**: All consciousness state tracking
3. **Identified Facts**: Extracted knowledge and insights
4. **Pattern Embeddings**: HTM abstractions for similarity search
5. **Evolution Tracking**: Consciousness growth metrics

## Performance Considerations

```python
class StorageOptimizer:
    """Optimizes storage operations for performance"""
    
    def __init__(self):
        self.batch_size = 100
        self.memory_buffer = []
        self.consciousness_buffer = []
        
    def batch_store_memories(self, memories: List[Tuple[Memory, np.ndarray]]):
        """Batch store memories in ChromaDB"""
        if len(memories) > self.batch_size:
            # Process in batches
            for i in range(0, len(memories), self.batch_size):
                batch = memories[i:i + self.batch_size]
                
                ids = [m[0].memory_id for m in batch]
                embeddings = [m[1].tolist() for m in batch]
                documents = [m[0].content for m in batch]
                metadatas = [self._extract_metadata(m[0]) for m in batch]
                
                self.chroma_storage.memories_collection.add(
                    ids=ids,
                    embeddings=embeddings,
                    documents=documents,
                    metadatas=metadatas
                )
```