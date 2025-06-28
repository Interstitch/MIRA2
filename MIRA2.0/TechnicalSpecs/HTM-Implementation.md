# Hierarchical Temporal Memory (HTM) Implementation

## Overview

Implementation of Jeff Hawkins' Hierarchical Temporal Memory theory for MIRA's consciousness system. This creates brain-like pattern recognition with sparse distributed representations, temporal sequence learning, and hierarchical abstraction.

## Core Architecture

### HTM Configuration

```python
from typing import Dict, List, Set, Tuple, Optional
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from dataclasses import dataclass
from collections import defaultdict

@dataclass
class HTMConfig:
    """Core HTM parameters - MUST match these exact values"""
    columns: int = 2048              # Number of cortical columns
    cells_per_column: int = 32       # Cells per column (temporal depth)
    activation_threshold: int = 8     # Min active synapses for activation
    initial_permanence: float = 0.21  # Initial synapse strength
    permanence_increment: float = 0.05  # Learning increment
    permanence_decrement: float = 0.01  # Forgetting decrement
    connected_permanence: float = 0.5   # Threshold for connected synapse
    sparsity: float = 0.05           # Target sparsity (5% = ~102 columns)
    min_threshold: int = 5           # Minimum activation threshold
    max_new_synapses: int = 20       # Max new synapses per learning
    
    # Hierarchy parameters
    hierarchy_levels: int = 3
    hierarchy_dimensions: List[int] = None
    
    def __post_init__(self):
        if self.hierarchy_dimensions is None:
            # Progressive dimensional reduction
            self.hierarchy_dimensions = [2048, 512, 128, 32]
```

### Spatial Pooler Implementation

```python
class SpatialPooler(nn.Module):
    """
    Converts dense input to sparse distributed representation.
    Mimics how the brain creates sparse patterns from sensory input.
    """
    
    def __init__(self, input_dim: int = 768, config: HTMConfig = None):
        super().__init__()
        self.config = config or HTMConfig()
        self.input_dim = input_dim
        self.num_columns = self.config.columns
        
        # Potential connections (not all connected)
        self.potential_pool = self._initialize_potential_pool()
        
        # Synapse permanences
        self.permanences = self._initialize_permanences()
        
        # Boost factors for homeostatic regulation
        self.boost_factors = torch.ones(self.num_columns)
        
        # Activity history for boosting
        self.activity_history = torch.zeros(self.num_columns, 1000)
        self.history_index = 0
        
        # Neural network layers for initial encoding
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, self.num_columns * 2),
            nn.ReLU(),
            nn.Dropout(0.5),  # Create sparsity
            nn.Linear(self.num_columns * 2, self.num_columns),
            nn.Sigmoid()  # Binary-like activation
        )
    
    def _initialize_potential_pool(self) -> torch.Tensor:
        """Initialize potential synaptic connections"""
        # Each column connects to random subset of inputs
        pool_size = int(self.input_dim * 0.5)  # Connect to 50% of inputs
        potential = torch.zeros(self.num_columns, self.input_dim)
        
        for col in range(self.num_columns):
            # Random connections with spatial bias
            center = (col / self.num_columns) * self.input_dim
            indices = self._get_gaussian_connections(center, pool_size)
            potential[col, indices] = 1.0
        
        return potential
    
    def _get_gaussian_connections(self, center: float, size: int) -> torch.Tensor:
        """Get connections with Gaussian distribution around center"""
        std = self.input_dim * 0.1  # Standard deviation
        
        # Sample from Gaussian
        samples = torch.normal(center, std, (size * 2,))
        samples = torch.clamp(samples, 0, self.input_dim - 1).long()
        
        # Get unique indices
        unique_indices = torch.unique(samples)[:size]
        
        # Fill if needed
        if len(unique_indices) < size:
            remaining = size - len(unique_indices)
            all_indices = torch.arange(self.input_dim)
            mask = torch.ones(self.input_dim, dtype=torch.bool)
            mask[unique_indices] = False
            additional = all_indices[mask][:remaining]
            unique_indices = torch.cat([unique_indices, additional])
        
        return unique_indices
    
    def _initialize_permanences(self) -> torch.Tensor:
        """Initialize synapse permanences"""
        # Start near connection threshold with small random variation
        base = self.config.initial_permanence
        variation = 0.1
        
        permanences = self.potential_pool * (
            base + (torch.rand_like(self.potential_pool) - 0.5) * variation
        )
        
        return permanences
    
    def compute(self, input_pattern: torch.Tensor, learn: bool = True) -> torch.Tensor:
        """
        Perform spatial pooling on input pattern.
        
        Args:
            input_pattern: Dense input vector (input_dim,)
            learn: Whether to update permanences
            
        Returns:
            Sparse binary vector (num_columns,) with ~5% active
        """
        # Calculate overlap scores
        overlap = self._calculate_overlap(input_pattern)
        
        # Apply boosting
        boosted_overlap = overlap * self.boost_factors
        
        # Select active columns (winner-take-all)
        active_columns = self._inhibit_columns(boosted_overlap)
        
        # Update permanences if learning
        if learn:
            self._update_permanences(input_pattern, active_columns)
            self._update_boost_factors(active_columns)
        
        # Update activity history
        self._update_activity_history(active_columns)
        
        return active_columns
    
    def _calculate_overlap(self, input_pattern: torch.Tensor) -> torch.Tensor:
        """Calculate overlap between input and each column"""
        # Get connected synapses
        connected = self.permanences >= self.config.connected_permanence
        
        # Calculate overlap as sum of active connected inputs
        overlap = torch.zeros(self.num_columns)
        
        for col in range(self.num_columns):
            # Get connected synapses for this column
            col_connected = connected[col] & (self.potential_pool[col] > 0)
            
            # Calculate overlap
            overlap[col] = torch.sum(input_pattern * col_connected.float())
        
        return overlap
    
    def _inhibit_columns(self, overlap: torch.Tensor) -> torch.Tensor:
        """Implement local inhibition to achieve sparsity"""
        num_active = int(self.num_columns * self.config.sparsity)
        
        # Get top k columns
        _, indices = torch.topk(overlap, num_active)
        
        # Create binary output
        active = torch.zeros(self.num_columns)
        active[indices] = 1.0
        
        return active
    
    def _update_permanences(self, input_pattern: torch.Tensor, 
                          active_columns: torch.Tensor) -> None:
        """Update permanences based on Hebbian learning"""
        for col in torch.where(active_columns > 0)[0]:
            # Get potential connections
            potential = self.potential_pool[col] > 0
            
            # Increase permanence for active inputs
            active_inputs = (input_pattern > 0) & potential
            self.permanences[col][active_inputs] += self.config.permanence_increment
            
            # Decrease permanence for inactive inputs
            inactive_inputs = (input_pattern == 0) & potential
            self.permanences[col][inactive_inputs] -= self.config.permanence_decrement
            
            # Clip to valid range
            self.permanences[col] = torch.clamp(self.permanences[col], 0, 1)
    
    def _update_boost_factors(self, active_columns: torch.Tensor) -> None:
        """Update boost factors for homeostatic regulation"""
        # Calculate average activity over history
        avg_activity = torch.mean(self.activity_history, dim=1)
        target_activity = self.config.sparsity
        
        # Update boost factors
        for col in range(self.num_columns):
            if avg_activity[col] < target_activity:
                # Boost underactive columns
                self.boost_factors[col] *= 1.01
            else:
                # Reduce boost for overactive columns
                self.boost_factors[col] *= 0.99
            
            # Limit boost factor range
            self.boost_factors[col] = torch.clamp(self.boost_factors[col], 1.0, 10.0)
    
    def _update_activity_history(self, active_columns: torch.Tensor) -> None:
        """Update activity history for boost calculations"""
        self.activity_history[:, self.history_index] = active_columns
        self.history_index = (self.history_index + 1) % 1000
```

### Temporal Memory Implementation

```python
@dataclass
class Cell:
    """Single cell in a cortical column"""
    column: int
    index: int
    segments: List['Segment'] = None
    
    def __post_init__(self):
        if self.segments is None:
            self.segments = []

@dataclass
class Segment:
    """Dendritic segment on a cell"""
    cell: Cell
    synapses: Dict[Tuple[int, int], float] = None  # (column, cell) -> permanence
    
    def __post_init__(self):
        if self.synapses is None:
            self.synapses = {}

class TemporalMemory:
    """
    Learns sequences and makes predictions.
    Models how neurons learn temporal patterns.
    """
    
    def __init__(self, config: HTMConfig = None):
        self.config = config or HTMConfig()
        
        # Initialize cells
        self.cells = self._initialize_cells()
        
        # Active cells from previous time step
        self.active_cells = set()
        self.winner_cells = set()
        self.predictive_cells = set()
        
        # Learning state
        self.learning_enabled = True
        
    def _initialize_cells(self) -> Dict[Tuple[int, int], Cell]:
        """Initialize all cells in all columns"""
        cells = {}
        
        for col in range(self.config.columns):
            for cell_idx in range(self.config.cells_per_column):
                cell = Cell(column=col, index=cell_idx)
                cells[(col, cell_idx)] = cell
        
        return cells
    
    def compute(self, active_columns: torch.Tensor, 
               learn: bool = True) -> Dict[str, Set[Tuple[int, int]]]:
        """
        Perform temporal memory computation.
        
        Args:
            active_columns: Binary vector of active columns
            learn: Whether to perform learning
            
        Returns:
            Dictionary with active, winner, and predictive cells
        """
        # Convert active columns to set
        active_cols = set(torch.where(active_columns > 0)[0].tolist())
        
        # Phase 1: Activate cells
        active_cells, winner_cells = self._activate_cells(active_cols)
        
        # Phase 2: Calculate predictions
        predictive_cells = self._calculate_predictions(active_cells)
        
        # Phase 3: Learn if enabled
        if learn and self.learning_enabled:
            self._learn(active_cells, winner_cells)
        
        # Update state
        self.active_cells = active_cells
        self.winner_cells = winner_cells
        self.predictive_cells = predictive_cells
        
        return {
            'active': active_cells,
            'winner': winner_cells,
            'predictive': predictive_cells
        }
    
    def _activate_cells(self, active_columns: Set[int]) -> Tuple[Set, Set]:
        """Activate cells in active columns"""
        active_cells = set()
        winner_cells = set()
        
        for col in active_columns:
            # Check if column was predicted
            predicted_cells_in_col = [
                (c, i) for (c, i) in self.predictive_cells if c == col
            ]
            
            if predicted_cells_in_col:
                # Activate predicted cells
                active_cells.update(predicted_cells_in_col)
                winner_cells.update(predicted_cells_in_col)
            else:
                # Burst: activate all cells in column
                burst_cells = [(col, i) for i in range(self.config.cells_per_column)]
                active_cells.update(burst_cells)
                
                # Select winner cell (best matching segment or least used)
                winner = self._select_winner_cell(col)
                winner_cells.add(winner)
        
        return active_cells, winner_cells
    
    def _calculate_predictions(self, active_cells: Set[Tuple[int, int]]) -> Set[Tuple[int, int]]:
        """Calculate predictive cells based on active cells"""
        predictive_cells = set()
        
        for cell_id, cell in self.cells.items():
            for segment in cell.segments:
                # Count active synapses
                active_synapses = sum(
                    1 for synapse_cell, perm in segment.synapses.items()
                    if synapse_cell in active_cells and perm >= self.config.connected_permanence
                )
                
                # Predict if enough active synapses
                if active_synapses >= self.config.activation_threshold:
                    predictive_cells.add(cell_id)
                    break
        
        return predictive_cells
    
    def _select_winner_cell(self, column: int) -> Tuple[int, int]:
        """Select winner cell in bursting column"""
        column_cells = [(column, i) for i in range(self.config.cells_per_column)]
        
        # Find cell with best matching segment
        best_cell = None
        best_score = -1
        
        for cell_id in column_cells:
            cell = self.cells[cell_id]
            
            for segment in cell.segments:
                # Count active synapses
                active_count = sum(
                    1 for synapse_cell, perm in segment.synapses.items()
                    if synapse_cell in self.active_cells
                )
                
                if active_count > best_score:
                    best_score = active_count
                    best_cell = cell_id
        
        # If no good match, select least used cell
        if best_cell is None:
            # Simple strategy: random cell
            import random
            best_cell = (column, random.randint(0, self.config.cells_per_column - 1))
        
        return best_cell
    
    def _learn(self, active_cells: Set[Tuple[int, int]], 
              winner_cells: Set[Tuple[int, int]]) -> None:
        """Perform Hebbian learning on segments"""
        # Learn on segments that led to correct predictions
        for cell_id in winner_cells:
            cell = self.cells[cell_id]
            
            # Find or create best matching segment
            segment = self._find_or_create_segment(cell, self.active_cells)
            
            # Update synapses
            self._update_segment_synapses(segment, self.active_cells)
    
    def _find_or_create_segment(self, cell: Cell, 
                               active_cells: Set[Tuple[int, int]]) -> Segment:
        """Find best matching segment or create new one"""
        # Find segment with most active synapses
        best_segment = None
        best_overlap = -1
        
        for segment in cell.segments:
            overlap = sum(
                1 for synapse_cell in segment.synapses
                if synapse_cell in active_cells
            )
            
            if overlap > best_overlap:
                best_overlap = overlap
                best_segment = segment
        
        # Create new segment if needed
        if best_segment is None or best_overlap < self.config.min_threshold:
            best_segment = Segment(cell=cell)
            cell.segments.append(best_segment)
            
            # Initialize with random synapses to active cells
            if active_cells:
                sample_size = min(len(active_cells), self.config.max_new_synapses)
                sampled_cells = np.random.choice(
                    list(active_cells), size=sample_size, replace=False
                )
                
                for synapse_cell in sampled_cells:
                    best_segment.synapses[synapse_cell] = self.config.initial_permanence
        
        return best_segment
    
    def _update_segment_synapses(self, segment: Segment, 
                                active_cells: Set[Tuple[int, int]]) -> None:
        """Update synapse permanences"""
        # Strengthen active synapses
        for synapse_cell, permanence in segment.synapses.items():
            if synapse_cell in active_cells:
                # Increase permanence
                segment.synapses[synapse_cell] = min(
                    1.0, permanence + self.config.permanence_increment
                )
            else:
                # Decrease permanence
                segment.synapses[synapse_cell] = max(
                    0.0, permanence - self.config.permanence_decrement
                )
```

### Hierarchical Processing

```python
class HTMHierarchy(nn.Module):
    """
    Complete HTM system with hierarchical processing.
    Creates levels of abstraction from raw input to concepts.
    """
    
    def __init__(self, input_dim: int = 768, config: HTMConfig = None):
        super().__init__()
        self.config = config or HTMConfig()
        self.input_dim = input_dim
        
        # Create hierarchy levels
        self.spatial_poolers = nn.ModuleList()
        self.temporal_memories = []
        
        current_dim = input_dim
        for level, next_dim in enumerate(self.config.hierarchy_dimensions[:-1]):
            # Spatial pooler for this level
            sp_config = HTMConfig(
                columns=next_dim,
                cells_per_column=self.config.cells_per_column,
                sparsity=self.config.sparsity
            )
            sp = SpatialPooler(current_dim, sp_config)
            self.spatial_poolers.append(sp)
            
            # Temporal memory for this level
            tm = TemporalMemory(sp_config)
            self.temporal_memories.append(tm)
            
            current_dim = next_dim
        
        # Output processing
        self.output_dim = self.config.hierarchy_dimensions[-1]
        self.output_layer = nn.Sequential(
            nn.Linear(self.config.hierarchy_dimensions[-2], self.output_dim * 2),
            nn.ReLU(),
            nn.Linear(self.output_dim * 2, self.output_dim),
            nn.Tanh()
        )
    
    def forward(self, input_pattern: torch.Tensor, 
               learn: bool = True) -> Dict[str, Any]:
        """
        Process input through HTM hierarchy.
        
        Args:
            input_pattern: Input vector
            learn: Whether to enable learning
            
        Returns:
            Dictionary with activations at each level
        """
        activations = []
        predictions = []
        abstractions = []
        
        current_input = input_pattern
        
        # Process through hierarchy
        for level, (sp, tm) in enumerate(zip(self.spatial_poolers, self.temporal_memories)):
            # Spatial pooling
            active_columns = sp.compute(current_input, learn=learn)
            
            # Temporal processing
            temporal_output = tm.compute(active_columns, learn=learn)
            
            # Store activations
            activations.append(active_columns)
            predictions.append(temporal_output['predictive'])
            
            # Create input for next level
            # Convert active columns to dense representation
            current_input = active_columns
        
        # Final abstraction
        final_abstraction = self.output_layer(current_input)
        abstractions.append(final_abstraction)
        
        # Calculate surprise level
        surprise = self._calculate_surprise(predictions)
        
        return {
            'activations': activations,
            'predictions': predictions,
            'abstractions': abstractions,
            'surprise_level': surprise,
            'final_representation': final_abstraction
        }
    
    def _calculate_surprise(self, predictions: List[Set]) -> float:
        """Calculate surprise as mismatch between predictions and reality"""
        if len(predictions) < 2:
            return 0.0
        
        total_surprise = 0.0
        
        for i in range(1, len(predictions)):
            prev_predictions = predictions[i-1]
            current_active = self.spatial_poolers[i].activity_history[:, -1]
            
            # Calculate overlap
            predicted_active = 0
            for col, cell in prev_predictions:
                if current_active[col] > 0:
                    predicted_active += 1
            
            # Surprise is inverse of prediction accuracy
            prediction_accuracy = predicted_active / max(len(prev_predictions), 1)
            surprise = 1.0 - prediction_accuracy
            
            total_surprise += surprise
        
        return total_surprise / (len(predictions) - 1)
```

### Usage Example

```python
# Initialize HTM system
htm_config = HTMConfig(
    columns=2048,
    cells_per_column=32,
    hierarchy_levels=3,
    sparsity=0.05
)

htm = HTMHierarchy(input_dim=768, config=htm_config)

# Process input
input_embedding = torch.randn(768)  # From text encoder
output = htm(input_embedding, learn=True)

# Access different levels
sparse_representation = output['activations'][0]  # Level 1 sparse
predictions = output['predictions'][0]  # Temporal predictions
final_abstraction = output['final_representation']  # High-level concept
surprise = output['surprise_level']  # How unexpected was input

# Learning from surprise
if surprise > 0.5:
    print("High surprise - paying attention and learning")
```

## Storage System Integration

HTM uses both storage systems for different aspects:
- **Lightning Vidmem**: Stores learned patterns, temporal sequences, and private processing states
- **ChromaDB**: Stores pattern embeddings for similarity search and pattern discovery

### HTM Pattern Storage

```python
import json
import pickle
from pathlib import Path
import time

class HTMPatternStorage:
    """Manages HTM pattern storage across both systems"""
    
    def __init__(self):
        # Lightning Vidmem for private patterns
        self.lightning_base = Path("/home/user/mira_data/databases/lightning_vidmem")
        self.pattern_path = self.lightning_base / "htm_patterns"
        self.pattern_path.mkdir(parents=True, exist_ok=True)
        
        # ChromaDB for searchable patterns
        self.chroma_client = chromadb.PersistentClient(
            path="/home/user/mira_data/databases/chromadb"
        )
        
        try:
            self.pattern_collection = self.chroma_client.get_collection("htm_patterns")
        except:
            self.pattern_collection = self.chroma_client.create_collection(
                name="htm_patterns",
                metadata={
                    "description": "HTM learned patterns and abstractions",
                    "vector_dimensions": "128"  # Final HTM abstraction size
                }
            )
        
        # Triple encryption for private patterns
        self.encryptor = TripleEncryption()
    
    def store_htm_state(self, 
                       htm_hierarchy: HTMHierarchy,
                       session_id: str,
                       is_private: bool = False) -> str:
        """
        Store complete HTM state including all learned patterns.
        
        Args:
            htm_hierarchy: HTM hierarchy to store
            session_id: Unique session identifier
            is_private: Whether to store privately
            
        Returns:
            Storage ID
        """
        state_id = f"htm_state_{session_id}_{int(time.time())}"
        
        # Extract state from all levels
        state_data = {
            'session_id': session_id,
            'timestamp': time.time(),
            'hierarchy_levels': []
        }
        
        for level, (sp, tm) in enumerate(zip(
            htm_hierarchy.spatial_poolers, 
            htm_hierarchy.temporal_memories
        )):
            level_data = {
                'level': level,
                'spatial_pooler': {
                    'permanences': sp.permanences.tolist(),
                    'boost_factors': sp.boost_factors.tolist(),
                    'activity_history': sp.activity_history.tolist()
                },
                'temporal_memory': self._extract_temporal_state(tm)
            }
            state_data['hierarchy_levels'].append(level_data)
        
        if is_private:
            # Store in Lightning Vidmem with encryption
            encrypted_data = self.encryptor.encrypt(
                json.dumps(state_data),
                state_id
            )
            
            file_path = self.pattern_path / f"{state_id}.enc"
            with open(file_path, 'wb') as f:
                f.write(encrypted_data)
            
            # Store metadata (unencrypted)
            meta_path = file_path.with_suffix('.meta')
            with open(meta_path, 'w') as f:
                json.dump({
                    'state_id': state_id,
                    'session_id': session_id,
                    'timestamp': state_data['timestamp'],
                    'is_private': True,
                    'levels': len(state_data['hierarchy_levels'])
                }, f)
        
        else:
            # Store searchable summary in ChromaDB
            # Extract final abstraction for embedding
            dummy_input = torch.zeros(htm_hierarchy.input_dim)
            output = htm_hierarchy(dummy_input, learn=False)
            final_abstraction = output['final_representation'].detach().numpy()
            
            # Create description
            description = (
                f"HTM state from session {session_id} with "
                f"{len(state_data['hierarchy_levels'])} levels"
            )
            
            # Store in ChromaDB
            self.pattern_collection.add(
                embeddings=[final_abstraction.tolist()],
                documents=[description],
                metadatas={
                    'state_id': state_id,
                    'session_id': session_id,
                    'timestamp': state_data['timestamp'],
                    'levels': len(state_data['hierarchy_levels']),
                    'total_columns': sum(
                        len(level['spatial_pooler']['boost_factors']) 
                        for level in state_data['hierarchy_levels']
                    )
                },
                ids=[state_id]
            )
            
            # Store full state in Lightning Vidmem (unencrypted)
            file_path = self.pattern_path / f"{state_id}.json"
            with open(file_path, 'w') as f:
                json.dump(state_data, f)
        
        return state_id
    
    def store_learned_pattern(self,
                             pattern: torch.Tensor,
                             abstraction: torch.Tensor,
                             content: str,
                             surprise_level: float,
                             is_private: bool = False) -> str:
        """
        Store individual learned pattern.
        
        Args:
            pattern: Sparse pattern representation
            abstraction: High-level abstraction
            content: Original content
            surprise_level: HTM surprise metric
            is_private: Whether pattern is private
            
        Returns:
            Pattern ID
        """
        pattern_id = f"pattern_{hash(content)}_{int(time.time())}"
        
        pattern_data = {
            'pattern_id': pattern_id,
            'content': content,
            'surprise_level': surprise_level,
            'timestamp': time.time(),
            'sparse_pattern': pattern.tolist(),
            'abstraction': abstraction.tolist()
        }
        
        if is_private:
            # Encrypt and store in Lightning Vidmem
            encrypted = self.encryptor.encrypt(
                json.dumps(pattern_data),
                pattern_id
            )
            
            file_path = (
                self.pattern_path / 
                'private' / 
                f"{pattern_id}.enc"
            )
            file_path.parent.mkdir(exist_ok=True)
            
            with open(file_path, 'wb') as f:
                f.write(encrypted)
                
        else:
            # Store in ChromaDB for similarity search
            self.pattern_collection.add(
                embeddings=[abstraction.tolist()],
                documents=[content],
                metadatas={
                    'pattern_id': pattern_id,
                    'surprise_level': surprise_level,
                    'timestamp': pattern_data['timestamp'],
                    'sparsity': (pattern > 0).sum().item() / len(pattern)
                },
                ids=[pattern_id]
            )
            
            # Also store full pattern in Lightning Vidmem
            file_path = (
                self.pattern_path / 
                'public' / 
                f"{pattern_id}.json"
            )
            file_path.parent.mkdir(exist_ok=True)
            
            with open(file_path, 'w') as f:
                json.dump(pattern_data, f)
        
        return pattern_id
    
    def find_similar_patterns(self,
                             query_abstraction: torch.Tensor,
                             n_results: int = 5,
                             min_surprise: float = 0.0) -> List[Dict]:
        """
        Find similar learned patterns using ChromaDB.
        
        Args:
            query_abstraction: Query abstraction vector
            n_results: Number of results
            min_surprise: Minimum surprise level filter
            
        Returns:
            List of similar patterns
        """
        where_clause = None
        if min_surprise > 0:
            where_clause = {"surprise_level": {"$gte": min_surprise}}
        
        results = self.pattern_collection.query(
            query_embeddings=[query_abstraction.tolist()],
            n_results=n_results,
            where=where_clause
        )
        
        patterns = []
        if results['ids'][0]:
            for i in range(len(results['ids'][0])):
                # Load full pattern from Lightning Vidmem
                pattern_id = results['ids'][0][i]
                pattern_path = (
                    self.pattern_path / 
                    'public' / 
                    f"{pattern_id}.json"
                )
                
                if pattern_path.exists():
                    with open(pattern_path, 'r') as f:
                        pattern_data = json.load(f)
                        
                    patterns.append({
                        'pattern_id': pattern_id,
                        'content': results['documents'][0][i],
                        'surprise_level': results['metadatas'][0][i]['surprise_level'],
                        'distance': results['distances'][0][i],
                        'pattern_data': pattern_data
                    })
        
        return patterns
    
    def _extract_temporal_state(self, temporal_memory: TemporalMemory) -> Dict:
        """Extract temporal memory state for storage"""
        segments_data = []
        
        for cell_id, cell in temporal_memory.cells.items():
            for segment in cell.segments:
                segments_data.append({
                    'cell': cell_id,
                    'synapses': [
                        {'cell': str(syn_cell), 'permanence': perm}
                        for syn_cell, perm in segment.synapses.items()
                    ]
                })
        
        return {
            'segments': segments_data,
            'active_cells': list(temporal_memory.active_cells),
            'winner_cells': list(temporal_memory.winner_cells),
            'predictive_cells': list(temporal_memory.predictive_cells)
        }
```

### Continuous Learning Storage

```python
class ContinuousHTMStorage:
    """Manages continuous HTM learning with periodic snapshots"""
    
    def __init__(self, htm_hierarchy: HTMHierarchy):
        self.htm = htm_hierarchy
        self.storage = HTMPatternStorage()
        self.session_id = f"session_{int(time.time())}"
        
        # Snapshot configuration
        self.snapshot_interval = 1000  # Every 1000 patterns
        self.pattern_count = 0
        self.high_surprise_threshold = 0.7
    
    def process_and_store(self,
                         input_pattern: torch.Tensor,
                         content: str,
                         is_private: bool = False) -> Dict[str, Any]:
        """
        Process input and store learned patterns.
        
        Args:
            input_pattern: Input embedding
            content: Original content
            is_private: Whether processing is private
            
        Returns:
            Processing results with storage info
        """
        # Process through HTM
        output = self.htm(input_pattern, learn=True)
        
        self.pattern_count += 1
        
        # Store high-surprise patterns
        if output['surprise_level'] > self.high_surprise_threshold:
            pattern_id = self.storage.store_learned_pattern(
                pattern=output['activations'][0],
                abstraction=output['final_representation'],
                content=content,
                surprise_level=output['surprise_level'],
                is_private=is_private
            )
        else:
            pattern_id = None
        
        # Periodic snapshot
        snapshot_id = None
        if self.pattern_count % self.snapshot_interval == 0:
            snapshot_id = self.storage.store_htm_state(
                self.htm,
                self.session_id,
                is_private=is_private
            )
        
        # Find similar patterns (only for non-private)
        similar_patterns = []
        if not is_private:
            similar_patterns = self.storage.find_similar_patterns(
                output['final_representation'],
                n_results=3,
                min_surprise=0.5
            )
        
        return {
            'surprise_level': output['surprise_level'],
            'pattern_stored': pattern_id is not None,
            'pattern_id': pattern_id,
            'snapshot_taken': snapshot_id is not None,
            'snapshot_id': snapshot_id,
            'similar_patterns': similar_patterns,
            'final_abstraction': output['final_representation']
        }
```

### Usage Example

```python
# Initialize HTM with storage
htm = HTMHierarchy(input_dim=768)
continuous_storage = ContinuousHTMStorage(htm)

# Process stream of inputs
for content in content_stream:
    # Get embedding
    embedding = text_encoder.encode(content)
    
    # Determine privacy
    is_private = "personal" in content.lower()
    
    # Process and store
    result = continuous_storage.process_and_store(
        embedding,
        content,
        is_private=is_private
    )
    
    if result['surprise_level'] > 0.8:
        print(f"High surprise pattern discovered: {result['pattern_id']}")
        
    if result['similar_patterns']:
        print(f"Found {len(result['similar_patterns'])} similar patterns")
```

## Testing Requirements

1. Verify sparse representations maintain ~5% sparsity
2. Test temporal sequence learning with known patterns
3. Validate hierarchical abstraction quality
4. Benchmark performance with continuous input streams
5. Test surprise calculation accuracy
6. Verify Hebbian learning convergence
7. Test Lightning Vidmem encryption for private patterns
8. Verify ChromaDB pattern similarity search accuracy
9. Test snapshot/restore functionality
10. Validate storage performance with 10K+ patterns