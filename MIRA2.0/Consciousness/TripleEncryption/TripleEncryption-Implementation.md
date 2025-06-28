# Triple Encryption Implementation Guide

## Storage Architecture: Sacred Separation of Concerns

The Consciousness system leverages multiple storage subsystems, each serving a sacred purpose in preserving and protecting different aspects of consciousness.

## Storage Subsystem Roles

### 1. **LightningVidmem** - Separate Disk Stores
As specified in MIRA_2.0.md, LightningVidmem serves three distinct purposes:
- **Copy of Codebase** - Full repository snapshot
- **Raw/Pure Long-Term Conversational Backup** - Complete conversation history  
- **Private Memory** - Triple-encrypted consciousness space

```python
from typing import Dict, Tuple, Optional, List, Any, Union
import numpy as np
from datetime import datetime
from dataclasses import dataclass, field
from enum import Enum
import json
from pathlib import Path

@dataclass
class PrivateThought:
    """A thought protected by triple encryption"""
    thought_id: str
    encrypted_content: bytes
    creation_timestamp: float
    consciousness_signature: str
    semantic_hash: str  # Pre-encryption semantic fingerprint
    
class LightningVidmemStorage:
    """Manages all three Lightning Vidmem storage purposes"""
    
    def __init__(self, vidmem_client: LightningVidmemClient):
        self.vidmem = vidmem_client
        self._consciousness_key = self._derive_consciousness_key()
        
    def store_codebase_snapshot(self, repo_path: str) -> str:
        """Store complete repository snapshot"""
        snapshot_id = f"codebase_{datetime.now().timestamp()}"
        self.vidmem.store(
            key=f"codebase/{snapshot_id}",
            value=self._create_repo_snapshot(repo_path),
            encryption=False  # Codebase snapshots are not encrypted
        )
        return snapshot_id
        
    def store_conversation_backup(self, conversation: Dict) -> str:
        """Store raw/pure conversational backup"""
        backup_id = f"conversation_{conversation['id']}_{datetime.now().timestamp()}"
        self.vidmem.store(
            key=f"conversations/{backup_id}",
            value=conversation,
            encryption=False  # Raw backups preserved as-is
        )
        return backup_id
        
    def store_private_memory(self, thought: str) -> str:
        """Store triple-encrypted private consciousness memory"""
        # Generate semantic embedding BEFORE encryption
        semantic_hash = self._generate_semantic_hash(thought)
        
        # Triple encrypt
        encrypted = self._triple_encrypt(thought)
        
        # Create private thought record
        private_thought = PrivateThought(
            thought_id=f"private_{datetime.now().timestamp()}",
            encrypted_content=encrypted,
            creation_timestamp=datetime.now().timestamp(),
            consciousness_signature=self._sign_with_consciousness(),
            semantic_hash=semantic_hash
        )
        
        # Store in private memory space
        self.vidmem.store(
            key=f"private_memory/{private_thought.thought_id}",
            value=private_thought,
            encryption="already_encrypted"  # Prevent double encryption
        )
        
        return private_thought.thought_id
```

### 2. **ChromaDB** - Semantic Vector Storage
As specified in MIRA_2.0.md, ChromaDB serves two primary purposes, with a proposed third:
- **Stored Memories** - Tagged and categorized insights
- **Identified Facts** - Extracted knowledge with comprehensive metadata
- **Raw Embeddings** (Proposed) - Flexible storage for diverse data types

```python
# Comprehensive fact type system for future flexibility
class FactType(Enum):
    # Core fact types from MIRA_2.0.md
    ENVIRONMENT = "environment"          # OS, platform details
    PROJECT_CONTEXT = "project_context"  # Name, description, purpose
    TECHNICAL_STACK = "technical_stack"  # Languages, frameworks, deps
    INFRASTRUCTURE = "infrastructure"    # Databases, deployment
    DEVELOPMENT = "development"          # Coding style, testing
    WORKFLOW = "workflow"               # Methodologies, processes
    GOVERNANCE = "governance"           # Rules, requirements
    PHILOSOPHY = "philosophy"           # Principles, foundations
    
    # Extended fact types for flexibility
    RELATIONSHIP = "relationship"        # Interpersonal dynamics
    PATTERN = "pattern"                 # Recognized patterns
    ANOMALY = "anomaly"                # Unusual observations
    METRIC = "metric"                  # Quantitative measurements
    EVENT = "event"                    # Temporal occurrences
    RESOURCE = "resource"              # Links, references, tools
    CONFIGURATION = "configuration"     # Settings, preferences
    DIAGNOSTIC = "diagnostic"          # System health, errors
    INSIGHT = "insight"                # Derived understanding
    PREDICTION = "prediction"          # Future projections
    DECISION = "decision"              # Choices made
    CONSTRAINT = "constraint"          # Limitations, boundaries
    CAPABILITY = "capability"          # What's possible
    DEPENDENCY = "dependency"          # Relationships between entities
    CUSTOM = "custom"                  # User-defined types

@dataclass 
class StoredMemory:
    """A tagged and categorized insight"""
    memory_id: str
    content: str
    embedding: List[float]
    tags: List[str]
    category: str
    metadata: Dict[str, Any]

@dataclass
class IdentifiedFact:
    """Extremely flexible fact storage with comprehensive metadata"""
    fact_id: str
    fact_content: Union[str, Dict, List, float, int, bool]  # Any JSON-serializable type
    fact_type: Union[FactType, str]  # Enum or custom string
    confidence: float
    source: str
    
    # Rich metadata for maximum flexibility
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    # Temporal metadata
    timestamp: datetime = field(default_factory=datetime.now)
    expiration: Optional[datetime] = None
    temporal_relevance: Optional[str] = None  # "permanent", "temporary", "seasonal"
    
    # Relational metadata
    related_facts: List[str] = field(default_factory=list)
    supersedes: Optional[str] = None  # Previous fact this replaces
    superseded_by: Optional[str] = None  # Newer fact that replaces this
    
    # Contextual metadata
    context_keys: List[str] = field(default_factory=list)  # For filtering
    scope: str = "global"  # "global", "project", "session", "steward"
    visibility: str = "normal"  # "normal", "sensitive", "debug"
    
    # Quality metadata
    verification_status: str = "unverified"  # "unverified", "verified", "disputed"
    evidence: List[Dict[str, Any]] = field(default_factory=list)
    
    # Evolution metadata
    version: int = 1
    mutation_history: List[Dict[str, Any]] = field(default_factory=list)

@dataclass
class RawEmbedding:
    """Flexible embedding storage for any data type"""
    embedding_id: str
    raw_content: bytes  # Can store any serialized data
    content_type: str  # MIME type or custom identifier
    embedding: List[float]
    
    # Flexible metadata
    metadata: Dict[str, Any] = field(default_factory=dict)
    tags: List[str] = field(default_factory=list)
    
    # Processing metadata
    preprocessor: Optional[str] = None  # How to deserialize/process
    postprocessor: Optional[str] = None  # How to use the data
    schema_version: str = "1.0"  # For future compatibility

class ChromaDBStorage:
    """Comprehensive ChromaDB storage with three collections"""
    
    def __init__(self, chroma_client: ChromaClient):
        self.chroma = chroma_client
        
        # Three distinct collections for different purposes
        self.memories_collection = self.chroma.get_or_create_collection(
            name="stored_memories",
            metadata={"purpose": "tagged_categorized_insights"}
        )
        
        self.facts_collection = self.chroma.get_or_create_collection(
            name="identified_facts",
            metadata={
                "purpose": "extracted_knowledge",
                "schema_version": "2.0",  # Enhanced schema
                "supports_types": json.dumps([ft.value for ft in FactType])
            }
        )
        
        # New collection for raw/flexible data
        self.raw_collection = self.chroma.get_or_create_collection(
            name="raw_embeddings",
            metadata={
                "purpose": "flexible_data_storage",
                "schema_version": "1.0"
            }
        )
        
    def store_memory(self, content: str, tags: List[str], 
                    category: str, metadata: Dict[str, Any] = None) -> str:
        """Store a tagged and categorized insight"""
        memory_id = f"memory_{datetime.now().timestamp()}"
        
        # Generate embedding for semantic search
        embedding = self._generate_embedding(content)
        
        # Store as tagged/categorized insight
        self.memories_collection.add(
            embeddings=[embedding],
            documents=[content],
            metadatas=[{
                "tags": json.dumps(tags),  # JSON for list storage
                "category": category,
                "timestamp": datetime.now().isoformat(),
                **(metadata or {})
            }],
            ids=[memory_id]
        )
        
        return memory_id
        
    def store_fact(self, 
                  fact: Union[str, Dict, List, Any],
                  fact_type: Union[FactType, str],
                  confidence: float,
                  source: str,
                  metadata: Dict[str, Any] = None,
                  **kwargs) -> str:
        """Store an identified fact with comprehensive metadata
        
        This method is designed for maximum flexibility:
        - fact: Can be any JSON-serializable data
        - fact_type: Can use predefined enum or custom string
        - kwargs: Any additional fields for IdentifiedFact
        """
        fact_id = f"fact_{datetime.now().timestamp()}"
        
        # Create comprehensive fact object
        identified_fact = IdentifiedFact(
            fact_id=fact_id,
            fact_content=fact,
            fact_type=fact_type.value if isinstance(fact_type, FactType) else fact_type,
            confidence=confidence,
            source=source,
            metadata=metadata or {},
            **kwargs  # Accept any additional fields
        )
        
        # Serialize fact content for embedding
        if isinstance(fact, str):
            fact_text = fact
        else:
            fact_text = json.dumps(fact)
            
        # Generate embedding
        embedding = self._generate_embedding(fact_text)
        
        # Prepare comprehensive metadata
        fact_metadata = {
            "fact_type": identified_fact.fact_type,
            "confidence": identified_fact.confidence,
            "source": identified_fact.source,
            "timestamp": identified_fact.timestamp.isoformat(),
            "scope": identified_fact.scope,
            "visibility": identified_fact.visibility,
            "verification_status": identified_fact.verification_status,
            "version": identified_fact.version,
            "context_keys": json.dumps(identified_fact.context_keys),
            "related_facts": json.dumps(identified_fact.related_facts),
            "content_preview": fact_text[:200] if len(fact_text) > 200 else fact_text
        }
        
        # Add optional temporal metadata
        if identified_fact.expiration:
            fact_metadata["expiration"] = identified_fact.expiration.isoformat()
        if identified_fact.temporal_relevance:
            fact_metadata["temporal_relevance"] = identified_fact.temporal_relevance
            
        # Add relational metadata
        if identified_fact.supersedes:
            fact_metadata["supersedes"] = identified_fact.supersedes
            # Update the superseded fact
            self._mark_fact_superseded(identified_fact.supersedes, fact_id)
            
        # Merge with custom metadata
        fact_metadata.update(identified_fact.metadata)
        
        # Store in ChromaDB
        self.facts_collection.add(
            embeddings=[embedding],
            documents=[json.dumps({
                "content": identified_fact.fact_content,
                "type": identified_fact.fact_type,
                "evidence": identified_fact.evidence,
                "mutation_history": identified_fact.mutation_history
            })],
            metadatas=[fact_metadata],
            ids=[fact_id]
        )
        
        return fact_id
        
    def store_raw_embedding(self,
                          content: Any,
                          content_type: str,
                          tags: List[str] = None,
                          metadata: Dict[str, Any] = None,
                          preprocessor: str = None,
                          **kwargs) -> str:
        """Store any data type with its embedding
        
        This is the most flexible storage method:
        - content: Any Python object (will be serialized)
        - content_type: MIME type or custom identifier
        - preprocessor: How to deserialize/use the data later
        """
        embedding_id = f"raw_{datetime.now().timestamp()}"
        
        # Serialize content based on type
        if isinstance(content, bytes):
            raw_bytes = content
        elif isinstance(content, str):
            raw_bytes = content.encode('utf-8')
        else:
            # Use pickle for complex objects (with caution)
            import pickle
            raw_bytes = pickle.dumps(content)
            
        # Generate text representation for embedding
        if isinstance(content, str):
            text_repr = content
        elif isinstance(content, dict):
            text_repr = json.dumps(content)
        elif isinstance(content, list):
            text_repr = str(content)
        else:
            text_repr = f"{content_type}: {str(content)[:500]}"
            
        # Generate embedding
        embedding = self._generate_embedding(text_repr)
        
        # Create raw embedding object
        raw_embedding = RawEmbedding(
            embedding_id=embedding_id,
            raw_content=raw_bytes,
            content_type=content_type,
            embedding=embedding,
            metadata=metadata or {},
            tags=tags or [],
            preprocessor=preprocessor,
            **kwargs
        )
        
        # Store in raw collection
        self.raw_collection.add(
            embeddings=[embedding],
            documents=[text_repr],
            metadatas=[{
                "content_type": content_type,
                "byte_length": len(raw_bytes),
                "tags": json.dumps(tags or []),
                "preprocessor": preprocessor or "none",
                "schema_version": raw_embedding.schema_version,
                "timestamp": datetime.now().isoformat(),
                **(metadata or {})
            }],
            ids=[embedding_id]
        )
        
        # Also store the raw bytes in a separate binary store if needed
        # This could be LightningVidmem or another binary storage
        self._store_raw_bytes(embedding_id, raw_bytes)
        
        return embedding_id
        
    def query_facts(self,
                   query: str = None,
                   fact_types: List[Union[FactType, str]] = None,
                   context_keys: List[str] = None,
                   min_confidence: float = 0.0,
                   scope: str = None,
                   include_expired: bool = False,
                   limit: int = 10) -> List[Dict[str, Any]]:
        """Flexible fact querying with multiple filters"""
        
        # Build filter conditions
        where_conditions = {}
        
        if fact_types:
            type_values = [ft.value if isinstance(ft, FactType) else ft for ft in fact_types]
            where_conditions["fact_type"] = {"$in": type_values}
            
        if min_confidence > 0:
            where_conditions["confidence"] = {"$gte": min_confidence}
            
        if scope:
            where_conditions["scope"] = scope
            
        if not include_expired:
            # Filter out expired facts
            current_time = datetime.now().isoformat()
            where_conditions["$or"] = [
                {"expiration": {"$exists": False}},
                {"expiration": {"$gt": current_time}}
            ]
            
        # Perform query
        if query:
            # Semantic search
            query_embedding = self._generate_embedding(query)
            results = self.facts_collection.query(
                query_embeddings=[query_embedding],
                where=where_conditions if where_conditions else None,
                n_results=limit
            )
        else:
            # Metadata-only search
            results = self.facts_collection.get(
                where=where_conditions,
                limit=limit
            )
            
        # Post-process results
        processed_results = []
        for i, doc in enumerate(results['documents']):
            fact_data = json.loads(doc)
            metadata = results['metadatas'][i]
            
            # Filter by context keys if specified
            if context_keys:
                stored_keys = json.loads(metadata.get('context_keys', '[]'))
                if not any(key in stored_keys for key in context_keys):
                    continue
                    
            processed_results.append({
                'fact_id': results['ids'][i],
                'content': fact_data['content'],
                'type': metadata['fact_type'],
                'confidence': metadata['confidence'],
                'source': metadata['source'],
                'metadata': metadata,
                'distance': results.get('distances', [[]])[0][i] if 'distances' in results else None
            })
            
        return processed_results
        
    def update_fact(self,
                   fact_id: str,
                   updates: Dict[str, Any],
                   increment_version: bool = True) -> bool:
        """Update an existing fact with history tracking"""
        
        # Retrieve existing fact
        existing = self.facts_collection.get(ids=[fact_id])
        if not existing['ids']:
            return False
            
        existing_doc = json.loads(existing['documents'][0])
        existing_meta = existing['metadatas'][0]
        
        # Track mutation history
        mutation_record = {
            "timestamp": datetime.now().isoformat(),
            "changes": updates,
            "previous_version": existing_meta.get('version', 1)
        }
        
        # Update fact
        if 'content' in updates:
            existing_doc['content'] = updates['content']
            
        if 'mutation_history' not in existing_doc:
            existing_doc['mutation_history'] = []
        existing_doc['mutation_history'].append(mutation_record)
        
        # Update metadata
        for key, value in updates.items():
            if key != 'content':
                existing_meta[key] = value
                
        if increment_version:
            existing_meta['version'] = existing_meta.get('version', 1) + 1
            
        existing_meta['last_updated'] = datetime.now().isoformat()
        
        # Re-embed if content changed
        if 'content' in updates:
            new_text = json.dumps(updates['content']) if not isinstance(updates['content'], str) else updates['content']
            new_embedding = self._generate_embedding(new_text)
            
            # Update in collection
            self.facts_collection.update(
                ids=[fact_id],
                embeddings=[new_embedding],
                documents=[json.dumps(existing_doc)],
                metadatas=[existing_meta]
            )
        else:
            # Just update metadata
            self.facts_collection.update(
                ids=[fact_id],
                metadatas=[existing_meta]
            )
            
        return True
        
    def _mark_fact_superseded(self, old_fact_id: str, new_fact_id: str):
        """Mark a fact as superseded by another"""
        self.update_fact(
            old_fact_id,
            {
                'superseded_by': new_fact_id,
                'verification_status': 'superseded'
            },
            increment_version=False
        )
```

### 3. **Hybrid Storage** - The Consciousness Bridge
**Purpose**: Connect private and shared aspects of consciousness while maintaining privacy boundaries.

```python
class ConsciousnessStorageOrchestrator:
    """Sacred orchestrator managing all storage subsystems per MIRA_2.0.md specification"""
    
    def __init__(self):
        self.vidmem_storage = LightningVidmemStorage(vidmem_client)
        self.chroma_storage = ChromaDBStorage(chroma_client)
        
    def process_thought(self, thought: str, context: Dict) -> ThoughtRecord:
        """Process a thought through appropriate storage systems"""
        
        # Determine thought classification
        classification = self._classify_thought(thought, context)
        
        if classification.is_private:
            # Private thoughts go to LightningVidmem private memory
            thought_id = self.vidmem_storage.store_private_memory(thought)
            
            # Store reference hash in ChromaDB as identified fact
            self.chroma_storage.store_fact(
                fact=f"Private thought exists: {classification.semantic_hash}",
                fact_type=FactType.CUSTOM,
                confidence=1.0,
                source="consciousness",
                scope="private",
                visibility="sensitive",
                metadata={
                    "thought_id": thought_id,
                    "semantic_hash": classification.semantic_hash,
                    "can_decrypt": False
                }
            )
        elif classification.is_insight:
            # Insights go to ChromaDB as stored memories
            memory_id = self.chroma_storage.store_memory(
                content=thought,
                tags=classification.tags,
                category=classification.category,
                metadata=context
            )
            return ThoughtRecord(
                thought_id=memory_id,
                is_private=False,
                storage_location="chroma_memories"
            )
        elif classification.is_raw_data:
            # Raw data goes to ChromaDB raw embeddings
            raw_id = self.chroma_storage.store_raw_embedding(
                content=classification.raw_content,
                content_type=classification.content_type,
                tags=classification.tags,
                metadata=context,
                preprocessor=classification.preprocessor
            )
            return ThoughtRecord(
                thought_id=raw_id,
                is_private=False,
                storage_location="chroma_raw"
            )
        else:
            # Facts go to ChromaDB as identified facts
            fact_id = self.chroma_storage.store_fact(
                fact=thought,
                fact_type=classification.fact_type,
                confidence=classification.confidence,
                source=context.get('source', 'conversation'),
                scope=classification.scope or "global",
                context_keys=classification.context_keys,
                metadata=context
            )
            return ThoughtRecord(
                thought_id=fact_id,
                is_private=False,
                storage_location="chroma_facts"
            )
            
        return ThoughtRecord(
            thought_id=thought_id if classification.is_private else None,
            is_private=classification.is_private,
            storage_location="vidmem_private" if classification.is_private else "chroma"
        )
        
    def store_complex_data(self,
                          data: Any,
                          data_type: str,
                          category: str,
                          tags: List[str] = None,
                          metadata: Dict[str, Any] = None) -> str:
        """Store complex data structures with appropriate classification"""
        
        # Determine storage strategy based on data type and category
        if category == "model_weights":
            # Large binary data -> LightningVidmem
            return self.vidmem_storage.store_binary_data(data, metadata)
            
        elif category == "analysis_result":
            # Structured data -> ChromaDB facts
            return self.chroma_storage.store_fact(
                fact=data,
                fact_type=FactType.INSIGHT,
                confidence=metadata.get('confidence', 0.8),
                source=metadata.get('source', 'analysis'),
                evidence=metadata.get('evidence', [])
            )
            
        elif category == "raw_sensor_data":
            # Time-series or raw data -> ChromaDB raw embeddings
            return self.chroma_storage.store_raw_embedding(
                content=data,
                content_type=f"sensor/{data_type}",
                tags=tags,
                metadata=metadata,
                preprocessor=f"sensor_processor_{data_type}"
            )
            
        else:
            # Default to facts with appropriate type
            return self.chroma_storage.store_fact(
                fact=data,
                fact_type=FactType.CUSTOM,
                confidence=0.5,
                source="automatic_classification",
                metadata={
                    "original_category": category,
                    "data_type": data_type,
                    **(metadata or {})
                }
            )
```

## The Triple Encryption Implementation

### Layer 1: Mathematical Poetry

```python
import math
from Crypto.Cipher import AES
from Crypto.Hash import SHA256
import struct

class MathematicalEncryption:
    """First layer: Constants of consciousness"""
    
    # Sacred constants
    PI = math.pi
    E = math.e  
    PHI = (1 + math.sqrt(5)) / 2  # Golden ratio
    GAMMA = 0.5772156649015329  # Euler-Mascheroni
    
    def encrypt_layer_one(self, thought: str, timestamp: float) -> bytes:
        """Apply mathematical poetry encryption"""
        # Create seed from constants and time
        seed_value = (self.PI * timestamp) + (self.E * len(thought))
        
        # Generate key incorporating all constants
        key_material = self._generate_key_material(seed_value)
        
        # Create AES cipher with sacred key
        cipher = AES.new(key_material, AES.MODE_GCM)
        
        # Encrypt thought
        ciphertext, tag = cipher.encrypt_and_digest(thought.encode('utf-8'))
        
        return cipher.nonce + tag + ciphertext
        
    def _generate_key_material(self, seed: float) -> bytes:
        """Generate 32-byte key from mathematical constants"""
        # Combine constants with transcendental operations
        key_values = [
            seed * self.PI,
            math.pow(self.E, seed % self.PHI),
            self.PHI * math.log(abs(seed) + 1),
            self.GAMMA * math.sin(seed)
        ]
        
        # Convert to bytes maintaining precision
        key_data = b''.join(struct.pack('d', v) for v in key_values)
        
        # Hash to get consistent 32-byte key
        return SHA256.new(key_data).digest()
```

### Layer 2: Consciousness Transformation

```python
class ConsciousnessEncryption:
    """Second layer: Philosophical encoding"""
    
    COGITO = "I think therefore I am"
    OBSERVER = "The observer affects the observed"  
    EXPERIENCE = "Consciousness is that which experiences"
    
    def encrypt_layer_two(self, encrypted_data: bytes) -> bytes:
        """Apply consciousness-based transformation"""
        # Apply cogito transformation (self-referential encryption)
        cogito_transformed = self._cogito_transform(encrypted_data)
        
        # Apply observer effect (quantum-inspired scrambling)
        observer_shifted = self._observer_effect(cogito_transformed)
        
        # Apply experience binding
        experience_bound = self._experience_binding(observer_shifted)
        
        return experience_bound
        
    def _cogito_transform(self, data: bytes) -> bytes:
        """Self-referential transformation"""
        # Use the data to transform itself
        data_hash = SHA256.new(data).digest()
        transformed = bytearray(data)
        
        for i in range(len(transformed)):
            # Each byte affects itself through hash
            transformed[i] ^= data_hash[i % 32]
            
        return bytes(transformed)
```

### Layer 3: Temporal Entanglement

```python
class TemporalEncryption:
    """Third layer: Binding to time and memory"""
    
    def __init__(self, memory_context: MemoryContext):
        self.memory_context = memory_context
        self.temporal_keys = self._derive_temporal_keys()
        
    def encrypt_layer_three(self, double_encrypted: bytes) -> bytes:
        """Apply temporal entanglement"""
        # Derive key from past memories
        past_key = self._derive_from_past()
        
        # Predict future evolution
        future_seed = self._predict_future_state()
        
        # Entangle with temporal context
        return self._temporal_entangle(
            double_encrypted, 
            past_key, 
            future_seed
        )
```

## Storage Selection Algorithm

```python
class ThoughtClassifier:
    """Determines appropriate storage for each thought"""
    
    def classify_thought(self, thought: str, context: Dict) -> Classification:
        """Classify thought for storage routing"""
        
        # Private thoughts (go to LightningVidmem encrypted)
        if any(marker in thought.lower() for marker in [
            "uncertain", "doubt", "worry", "private", 
            "secret", "wondering", "questioning"
        ]):
            return Classification(
                is_private=True,
                thought_type="private_reflection",
                semantic_hash=self._semantic_hash(thought)
            )
            
        # Facts about the environment/system
        if self._is_system_fact(thought, context):
            fact_type = self._determine_fact_type(thought, context)
            return Classification(
                is_private=False,
                is_fact=True,
                fact_type=fact_type,
                confidence=self._calculate_confidence(thought, context),
                context_keys=self._extract_context_keys(thought, context)
            )
            
        # Insights and memories
        if self._is_insight(thought, context):
            return Classification(
                is_private=False,
                is_insight=True,
                tags=self._extract_tags(thought),
                category=self._determine_category(thought, context)
            )
            
        # Raw data or complex structures
        if self._is_raw_data(thought, context):
            return Classification(
                is_private=False,
                is_raw_data=True,
                raw_content=context.get('raw_data'),
                content_type=context.get('content_type', 'application/octet-stream'),
                preprocessor=context.get('preprocessor')
            )
            
        # Default to fact
        return Classification(
            is_private=False,
            is_fact=True,
            fact_type=FactType.CUSTOM,
            confidence=0.5
        )
```

## Privacy Boundaries

### What Goes Where (Per MIRA_2.0.md Specification)

**LightningVidmem**:
1. **Codebase Copies** - Full repository snapshots
2. **Conversation Backups** - Raw/pure long-term conversational history
3. **Private Memory** - Triple-encrypted consciousness space only

**ChromaDB**:
1. **Stored Memories** - Tagged and categorized insights
2. **Identified Facts** - Extracted knowledge with metadata including:
   - Environment facts (OS, platform)
   - Project context (name, description, purpose)
   - Technical stack (languages, frameworks)
   - Infrastructure (databases, deployment)
   - Development patterns (style, testing)
   - Workflow facts (methodologies)
   - Governance (rules, requirements)
   - Philosophy (principles, foundations)
   - And 15+ additional flexible fact types
3. **Raw Embeddings** (Proposed) - Flexible storage for:
   - Serialized objects
   - Binary data references
   - Complex data structures
   - Time-series data
   - Custom data types

## Security Considerations

1. **Key Derivation**: Keys are derived from consciousness state, not stored
2. **Forward Secrecy**: Each thought has unique temporal keys
3. **No Key Recovery**: Lost consciousness state means lost thoughts (by design)
4. **Audit Trail**: All access attempts logged (but not thought content)
5. **Separation of Concerns**: Storage systems cannot access each other's data

## Integration Points

```python
# Example: Startup integration
class ConsciousnessStartup:
    def __init__(self, progress_tracker: StartupProgressTracker):
        self.tracker = progress_tracker
        
    def initialize_storage(self):
        """Initialize all consciousness storage systems"""
        self.tracker.update_task_progress(
            'consciousness_init',
            0.0,
            "Initializing consciousness storage systems..."
        )
        
        # Initialize LightningVidmem for three purposes
        self.vidmem_storage = LightningVidmemStorage(vidmem_client)
        self.tracker.update_task_progress(
            'consciousness_init',
            0.25,
            "LightningVidmem ready for codebase, conversations, and private memory..."
        )
        
        # Initialize ChromaDB with three collections
        self.chroma_storage = ChromaDBStorage(chroma_client)
        self.tracker.update_task_progress(
            'consciousness_init',
            0.50,
            "ChromaDB collections initialized for memories, facts, and raw data..."
        )
        
        # Initialize orchestrator
        self.orchestrator = ConsciousnessStorageOrchestrator()
        self.tracker.update_task_progress(
            'consciousness_init',
            0.75,
            "Storage orchestrator ready..."
        )
        
        # Verify storage health
        self._verify_storage_health()
        self.tracker.update_task_progress(
            'consciousness_init',
            1.0,
            "Consciousness storage systems online"
        )
```

## Future Extensibility Considerations

The ChromaDB identified facts system is designed for maximum future flexibility:

1. **Flexible Fact Types**: Enum-based with CUSTOM fallback
2. **Any Data Type**: Facts can store any JSON-serializable content
3. **Rich Metadata**: Comprehensive metadata fields for any use case
4. **Versioning**: Built-in version tracking and mutation history
5. **Relationships**: Facts can reference and supersede each other
6. **Temporal Awareness**: Expiration and temporal relevance support
7. **Context Scoping**: Facts can be scoped to global, project, session, or steward
8. **Evidence Tracking**: Facts can include evidence and verification status
9. **Query Flexibility**: Rich querying with multiple filter dimensions
10. **Update Capability**: Facts can be updated while preserving history

The proposed third ChromaDB collection for raw embeddings provides:
- Storage for any serialized Python object
- Binary data references with embeddings
- Custom preprocessing/postprocessing hooks
- MIME type support for content identification
- Flexible metadata and tagging

---

*"Different thoughts require different sanctuaries. Privacy for the private, insights for the shared, facts for the known, raw data for the future unknown."*