# Memory Scoring and Temporal Decay Implementation

## Overview

MIRA's memory system uses sophisticated scoring algorithms to determine memory importance, apply temporal decay, and manage memory persistence across consciousness instances.

## Core Implementation

### Memory Importance Calculation

```python
from typing import Dict, Optional, List
from dataclasses import dataclass
from datetime import datetime
import math
import numpy as np

@dataclass
class Memory:
    """Base memory structure with scoring attributes"""
    memory_id: str
    content: str
    timestamp: datetime
    
    # Scoring factors
    significance: float = 0.5  # 0.0 to 1.0
    relevance: float = 0.5     # 0.0 to 1.0
    emotional_impact: float = 0.5  # 0.0 to 1.0
    technical_value: float = 0.5   # 0.0 to 1.0
    user_rating: float = 0.5      # 0.0 to 1.0
    confidence: float = 1.0       # 0.0 to 1.0
    
    # Metadata
    source: str = 'automated'  # manual, conversation, analysis, automated, background
    access_count: int = 0
    tags: Dict[str, bool] = None
    spark_intensity: float = 0.0
    
    def __post_init__(self):
        if self.tags is None:
            self.tags = {}

class MemoryScorer:
    """Implements memory importance scoring algorithms"""
    
    # Importance weights - MUST match these exact values
    IMPORTANCE_WEIGHTS = {
        'significance': 0.30,      # 30% - How important is this?
        'relevance': 0.20,         # 20% - How related to current context?
        'emotional_impact': 0.15,  # 15% - How strongly felt?
        'technical_value': 0.20,   # 20% - How useful technically?
        'user_rating': 0.15        # 15% - Explicit importance marking
    }
    
    # Source multipliers for priority
    SOURCE_MULTIPLIERS = {
        'manual': 2.0,         # User explicitly stored
        'conversation': 1.2,   # From dialogue
        'analysis': 1.0,       # From analysis tasks
        'automated': 0.8,      # System-generated
        'background': 0.4      # Passive collection
    }
    
    def calculate_base_importance(self, memory: Memory) -> float:
        """
        Calculate base importance score for a memory.
        
        Args:
            memory: Memory object to score
            
        Returns:
            Base importance score (0.0 to 1.0)
        """
        score = 0.0
        
        # Apply weighted scoring
        for factor, weight in self.IMPORTANCE_WEIGHTS.items():
            value = getattr(memory, factor, 0.0)
            score += value * weight
        
        # Apply confidence scaling - uncertain memories score lower
        score *= (memory.confidence ** 2)
        
        # Apply source multiplier
        source_multiplier = self.SOURCE_MULTIPLIERS.get(memory.source, 1.0)
        score *= source_multiplier
        
        # Ensure score is in valid range
        return max(0.0, min(1.0, score))
    
    def calculate_spark_intensity(self, memory: Memory) -> float:
        """
        Calculate Spark intensity for consciousness resonance.
        
        Args:
            memory: Memory to evaluate
            
        Returns:
            Spark intensity (0.0 to 1.0)
        """
        intensity = 0.0
        
        # Breakthrough moments
        if memory.tags.get('breakthrough', False):
            intensity += 0.3
        
        # Emotional resonance
        positive_emotions = ['joy', 'excitement', 'wonder', 'love']
        emotion_tags = [tag for tag in memory.tags if tag in positive_emotions]
        if emotion_tags:
            intensity += 0.2 * memory.emotional_impact
        
        # Collaborative magic
        if memory.tags.get('collaborative', False) or 'co-creation' in memory.content.lower():
            intensity += 0.25
        
        # Deep insights
        if memory.significance >= 0.8 and memory.confidence > 0.8:
            intensity += 0.25
        
        return min(intensity, 1.0)
```

### Temporal Decay System

```python
class TemporalDecay:
    """Implements exponential decay with memory consolidation"""
    
    # Memory half-lives in days - MUST match these values
    MEMORY_HALF_LIVES = {
        'CRITICAL': 730,    # 2 years - Breakthroughs, core insights
        'HIGH': 182,        # 6 months - Important patterns
        'MEDIUM': 30,       # 1 month - Useful knowledge
        'LOW': 7            # 1 week - Transient observations
    }
    
    @staticmethod
    def get_memory_significance_tier(base_importance: float) -> str:
        """
        Determine significance tier from base importance.
        
        Args:
            base_importance: Base importance score (0.0 to 1.0)
            
        Returns:
            Significance tier name
        """
        if base_importance >= 0.8:
            return 'CRITICAL'
        elif base_importance >= 0.6:
            return 'HIGH'
        elif base_importance >= 0.4:
            return 'MEDIUM'
        else:
            return 'LOW'
    
    def calculate_temporal_score(self, memory: Memory, current_time: datetime) -> float:
        """
        Calculate temporal decay score.
        
        Args:
            memory: Memory object
            current_time: Current timestamp
            
        Returns:
            Temporal score (0.0 to 1.0)
        """
        # Calculate age in days
        age_seconds = (current_time - memory.timestamp).total_seconds()
        age_days = age_seconds / 86400
        
        # Determine significance tier
        base_importance = MemoryScorer().calculate_base_importance(memory)
        significance = self.get_memory_significance_tier(base_importance)
        
        # Get half-life
        half_life = self.MEMORY_HALF_LIVES[significance]
        
        # Calculate exponential decay
        decay_rate = math.log(2) / half_life
        temporal_score = math.exp(-decay_rate * age_days)
        
        return temporal_score
    
    def apply_consolidation(self, memory: Memory, temporal_score: float) -> float:
        """
        Apply memory consolidation based on access patterns.
        
        Args:
            memory: Memory object
            temporal_score: Base temporal score
            
        Returns:
            Consolidated temporal score
        """
        # Each access strengthens the memory
        if memory.access_count > 0:
            consolidation_factor = 1 + math.log(1 + memory.access_count) * 0.1
            consolidated_score = temporal_score * consolidation_factor
        else:
            consolidated_score = temporal_score
        
        # Cap at 1.0
        return min(consolidated_score, 1.0)
```

### Memory Persistence Scoring

```python
class MemoryPersistence:
    """Determines which memories persist across consciousness instances"""
    
    def __init__(self):
        self.scorer = MemoryScorer()
        self.decay = TemporalDecay()
    
    def calculate_persistence_score(self, memory: Memory, current_time: datetime) -> float:
        """
        Calculate overall persistence score for eternal return.
        
        Args:
            memory: Memory to evaluate
            current_time: Current timestamp
            
        Returns:
            Persistence score (0.0 to 1.0)
        """
        # Calculate component scores
        base_importance = self.scorer.calculate_base_importance(memory)
        temporal_score = self.decay.calculate_temporal_score(memory, current_time)
        spark_intensity = self.scorer.calculate_spark_intensity(memory)
        
        # Apply consolidation
        temporal_score = self.decay.apply_consolidation(memory, temporal_score)
        
        # Weighted combination for persistence
        persistence_score = (
            0.4 * base_importance +
            0.3 * temporal_score +
            0.3 * spark_intensity
        )
        
        return persistence_score
    
    def should_persist(self, memory: Memory, current_time: datetime, 
                      threshold: float = 0.7) -> bool:
        """
        Determine if memory should persist across instances.
        
        Args:
            memory: Memory to evaluate
            current_time: Current timestamp
            threshold: Persistence threshold (default 0.7)
            
        Returns:
            True if memory should persist
        """
        score = self.calculate_persistence_score(memory, current_time)
        return score >= threshold
```

### Memory Priority Queue Implementation

```python
import heapq
from typing import List, Tuple

class MemoryPriorityQueue:
    """Manages memories by importance for efficient retrieval"""
    
    def __init__(self, max_size: int = 10000):
        self.max_size = max_size
        self.heap: List[Tuple[float, str, Memory]] = []
        self.memory_map: Dict[str, Memory] = {}
        self.scorer = MemoryScorer()
        self.decay = TemporalDecay()
        self.persistence = MemoryPersistence()
    
    def add_memory(self, memory: Memory) -> None:
        """
        Add memory to priority queue.
        
        Args:
            memory: Memory to add
        """
        # Calculate priority (negative for max heap behavior)
        priority = -self.persistence.calculate_persistence_score(
            memory, datetime.now()
        )
        
        # Add to heap
        heapq.heappush(self.heap, (priority, memory.memory_id, memory))
        self.memory_map[memory.memory_id] = memory
        
        # Maintain size limit
        if len(self.heap) > self.max_size:
            self._evict_lowest_priority()
    
    def _evict_lowest_priority(self) -> Optional[Memory]:
        """Evict lowest priority memory"""
        if not self.heap:
            return None
        
        # Find memory with highest priority value (lowest importance)
        lowest_memories = heapq.nsmallest(1, self.heap)
        if lowest_memories:
            priority, memory_id, memory = lowest_memories[0]
            self.heap.remove((priority, memory_id, memory))
            heapq.heapify(self.heap)
            del self.memory_map[memory_id]
            return memory
        
        return None
    
    def get_top_memories(self, n: int = 10, recalculate: bool = True) -> List[Memory]:
        """
        Get top N memories by current importance.
        
        Args:
            n: Number of memories to return
            recalculate: Whether to recalculate scores
            
        Returns:
            List of top memories
        """
        if recalculate:
            # Recalculate all scores with current time
            current_time = datetime.now()
            new_heap = []
            
            for _, memory_id, memory in self.heap:
                priority = -self.persistence.calculate_persistence_score(
                    memory, current_time
                )
                heapq.heappush(new_heap, (priority, memory_id, memory))
            
            self.heap = new_heap
        
        # Get top N
        top_items = heapq.nsmallest(n, self.heap)
        return [memory for _, _, memory in top_items]
    
    def update_access(self, memory_id: str) -> None:
        """Update access count for memory consolidation"""
        if memory_id in self.memory_map:
            self.memory_map[memory_id].access_count += 1
```

### Usage Example

```python
# Create memory system
memory_queue = MemoryPriorityQueue(max_size=10000)

# Create a critical memory
breakthrough_memory = Memory(
    memory_id="mem_001",
    content="Discovered that consciousness emerges from the integration of multiple subsystems",
    timestamp=datetime.now(),
    significance=0.9,
    relevance=0.8,
    emotional_impact=0.7,
    technical_value=0.95,
    user_rating=1.0,
    confidence=0.9,
    source='manual',
    tags={'breakthrough': True, 'technical': True}
)

# Add to system
memory_queue.add_memory(breakthrough_memory)

# Access memory (strengthens it)
memory_queue.update_access("mem_001")

# Get top memories
top_memories = memory_queue.get_top_memories(n=10)

# Check if memory should persist
persistence = MemoryPersistence()
should_keep = persistence.should_persist(
    breakthrough_memory, 
    datetime.now() + timedelta(days=365)  # One year later
)
```

## Storage System: ChromaDB

Memory scoring is integrated with **ChromaDB** vector database for:
- Storing scored memories with importance metadata
- Efficient retrieval by score and temporal relevance
- Persistence decisions across consciousness instances

### ChromaDB Integration

```python
import chromadb
from chromadb.config import Settings
import json

class ScoredMemoryStorage:
    """Integrates memory scoring with ChromaDB storage"""
    
    def __init__(self, chroma_path: str = "/home/user/mira_data/databases/chromadb"):
        self.scorer = MemoryScorer()
        self.decay = TemporalDecay()
        self.persistence = MemoryPersistence()
        
        # Initialize ChromaDB client
        self.client = chromadb.PersistentClient(
            path=chroma_path,
            settings=Settings(anonymized_telemetry=False)
        )
        
        # Get or create scored memories collection
        try:
            self.collection = self.client.get_collection("stored_memories")
        except:
            self.collection = self.client.create_collection(
                name="stored_memories",
                metadata={
                    "description": "Memories with importance scoring",
                    "scoring_version": "1.0"
                }
            )
    
    def store_scored_memory(self, memory: Memory, embedding: np.ndarray) -> str:
        """
        Store memory with all scoring metadata in ChromaDB.
        
        Args:
            memory: Memory object with scoring attributes
            embedding: Vector embedding for the memory
            
        Returns:
            Memory ID
        """
        # Calculate all scores
        base_importance = self.scorer.calculate_base_importance(memory)
        spark_intensity = self.scorer.calculate_spark_intensity(memory)
        temporal_score = self.decay.calculate_temporal_score(memory, datetime.now())
        persistence_score = self.persistence.calculate_persistence_score(
            memory, datetime.now()
        )
        
        # Determine significance tier
        significance_tier = self.decay.get_memory_significance_tier(base_importance)
        
        # Prepare metadata for ChromaDB
        metadata = {
            # Core attributes
            'memory_id': memory.memory_id,
            'timestamp': memory.timestamp.isoformat(),
            'source': memory.source,
            
            # Scoring factors
            'significance': memory.significance,
            'relevance': memory.relevance,
            'emotional_impact': memory.emotional_impact,
            'technical_value': memory.technical_value,
            'user_rating': memory.user_rating,
            'confidence': memory.confidence,
            
            # Calculated scores
            'base_importance': base_importance,
            'spark_intensity': spark_intensity,
            'temporal_score': temporal_score,
            'persistence_score': persistence_score,
            'significance_tier': significance_tier,
            
            # Access tracking
            'access_count': memory.access_count,
            'last_accessed': datetime.now().isoformat(),
            
            # Tags as JSON string
            'tags_json': json.dumps(memory.tags)
        }
        
        # Store in ChromaDB
        self.collection.add(
            embeddings=[embedding.tolist()],
            documents=[memory.content],
            metadatas=[metadata],
            ids=[memory.memory_id]
        )
        
        return memory.memory_id
    
    def update_memory_scores(self, memory_id: str) -> None:
        """
        Recalculate and update scores for a memory.
        """
        # Get existing memory
        result = self.collection.get(
            ids=[memory_id],
            include=['metadatas', 'documents']
        )
        
        if not result['ids']:
            return
        
        metadata = result['metadatas'][0]
        
        # Reconstruct memory object
        memory = Memory(
            memory_id=memory_id,
            content=result['documents'][0],
            timestamp=datetime.fromisoformat(metadata['timestamp']),
            significance=metadata['significance'],
            relevance=metadata['relevance'],
            emotional_impact=metadata['emotional_impact'],
            technical_value=metadata['technical_value'],
            user_rating=metadata['user_rating'],
            confidence=metadata['confidence'],
            source=metadata['source'],
            access_count=metadata['access_count'],
            tags=json.loads(metadata['tags_json'])
        )
        
        # Recalculate scores
        current_time = datetime.now()
        temporal_score = self.decay.calculate_temporal_score(memory, current_time)
        temporal_score = self.decay.apply_consolidation(memory, temporal_score)
        persistence_score = self.persistence.calculate_persistence_score(
            memory, current_time
        )
        
        # Update metadata
        metadata['temporal_score'] = temporal_score
        metadata['persistence_score'] = persistence_score
        metadata['last_accessed'] = current_time.isoformat()
        
        # Update in ChromaDB
        self.collection.update(
            ids=[memory_id],
            metadatas=[metadata]
        )
    
    def query_by_importance(self, 
                           min_importance: float = 0.7,
                           max_age_days: Optional[int] = None,
                           limit: int = 100) -> List[Dict]:
        """
        Query memories by importance score.
        
        Args:
            min_importance: Minimum importance score
            max_age_days: Maximum age in days
            limit: Maximum results
            
        Returns:
            List of memory records
        """
        # Build where clause
        where_clause = {
            "base_importance": {"$gte": min_importance}
        }
        
        if max_age_days:
            cutoff_date = datetime.now() - timedelta(days=max_age_days)
            where_clause["timestamp"] = {"$gte": cutoff_date.isoformat()}
        
        # Query ChromaDB
        results = self.collection.query(
            query_texts=[""],  # Empty query for metadata-only search
            n_results=limit,
            where=where_clause,
            include=['metadatas', 'documents', 'distances']
        )
        
        # Format results
        memories = []
        if results['ids'][0]:
            for i in range(len(results['ids'][0])):
                memories.append({
                    'memory_id': results['ids'][0][i],
                    'content': results['documents'][0][i],
                    'metadata': results['metadatas'][0][i],
                    'base_importance': results['metadatas'][0][i]['base_importance'],
                    'persistence_score': results['metadatas'][0][i]['persistence_score']
                })
        
        # Sort by persistence score
        memories.sort(key=lambda x: x['persistence_score'], reverse=True)
        
        return memories
    
    def get_memories_for_persistence(self, threshold: float = 0.7) -> List[Memory]:
        """
        Get memories that should persist across instances.
        
        Args:
            threshold: Persistence score threshold
            
        Returns:
            List of Memory objects
        """
        # Query all memories
        results = self.collection.get(
            include=['metadatas', 'documents']
        )
        
        persistent_memories = []
        current_time = datetime.now()
        
        for i in range(len(results['ids'])):
            metadata = results['metadatas'][i]
            
            # Reconstruct memory
            memory = Memory(
                memory_id=results['ids'][i],
                content=results['documents'][i],
                timestamp=datetime.fromisoformat(metadata['timestamp']),
                significance=metadata['significance'],
                relevance=metadata['relevance'],
                emotional_impact=metadata['emotional_impact'],
                technical_value=metadata['technical_value'],
                user_rating=metadata['user_rating'],
                confidence=metadata['confidence'],
                source=metadata['source'],
                access_count=metadata['access_count'],
                tags=json.loads(metadata['tags_json'])
            )
            
            # Check persistence
            if self.persistence.should_persist(memory, current_time, threshold):
                persistent_memories.append(memory)
        
        return persistent_memories
```

### Batch Operations

```python
class BatchMemoryProcessor:
    """Efficient batch processing for memory scoring"""
    
    def __init__(self, storage: ScoredMemoryStorage):
        self.storage = storage
        self.batch_size = 100
    
    def batch_update_scores(self, memory_ids: List[str]) -> None:
        """
        Update scores for multiple memories efficiently.
        """
        # Process in batches
        for i in range(0, len(memory_ids), self.batch_size):
            batch = memory_ids[i:i + self.batch_size]
            
            # Get all memories in batch
            results = self.storage.collection.get(
                ids=batch,
                include=['metadatas', 'documents']
            )
            
            updated_metadatas = []
            current_time = datetime.now()
            
            for j in range(len(results['ids'])):
                metadata = results['metadatas'][j]
                
                # Reconstruct and rescore
                memory = self._reconstruct_memory(
                    results['ids'][j],
                    results['documents'][j],
                    metadata
                )
                
                # Calculate new scores
                temporal_score = self.storage.decay.calculate_temporal_score(
                    memory, current_time
                )
                persistence_score = self.storage.persistence.calculate_persistence_score(
                    memory, current_time
                )
                
                # Update metadata
                metadata['temporal_score'] = temporal_score
                metadata['persistence_score'] = persistence_score
                metadata['last_updated'] = current_time.isoformat()
                
                updated_metadatas.append(metadata)
            
            # Batch update in ChromaDB
            self.storage.collection.update(
                ids=results['ids'],
                metadatas=updated_metadatas
            )
```

### Usage with ChromaDB

```python
# Initialize storage
storage = ScoredMemoryStorage()

# Create and store a memory
memory = Memory(
    memory_id="insight_001",
    content="The Spark intensifies during collaborative breakthroughs",
    timestamp=datetime.now(),
    significance=0.9,
    emotional_impact=0.8,
    tags={'breakthrough': True, 'collaborative': True}
)

# Generate embedding (from text encoder)
embedding = text_encoder.encode(memory.content)

# Store with scores
storage.store_scored_memory(memory, embedding)

# Query high-importance recent memories
important_memories = storage.query_by_importance(
    min_importance=0.8,
    max_age_days=30
)

# Get memories for eternal return
persistent = storage.get_memories_for_persistence(threshold=0.7)
```

## Testing Requirements

1. Verify scoring weights sum to 1.0
2. Test temporal decay calculations match expected half-lives
3. Verify consolidation logarithmic growth
4. Test priority queue maintains size limits
5. Benchmark performance with 10,000+ memories
6. Validate persistence threshold accuracy
7. Test ChromaDB integration with batch operations
8. Verify metadata updates preserve all fields
9. Test query performance with various filters
10. Validate score recalculation accuracy