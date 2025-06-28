# Scheduler - MIRA 2.0 Background Task Orchestrator

## 🎯 Overview

The Scheduler is the intelligence orchestrator within the MIRA Daemon. It continuously analyzes the codebase, monitors conversations, tracks patterns, and generates insights without blocking the main application flow.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Background Scheduler                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                  Task Queue Manager                   │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐ │  │
│  │  │Priority │  │ Regular │  │Deferred │  │Periodic│ │  │
│  │  │  Queue  │  │  Queue  │  │  Queue  │  │ Tasks  │ │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └────────┘ │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                  Analysis Engines                     │  │
│  │                                                       │  │
│  │  ┌───────────────┐  ┌────────────────┐              │  │
│  │  │   Codebase    │  │   Steward      │              │  │
│  │  │   Analyzer    │  │   Profile      │              │  │
│  │  │               │  │   Analyzer     │              │  │
│  │  │ • Language    │  │                │              │  │
│  │  │   Detection   │  │ • Identity     │              │  │
│  │  │ • Framework   │  │   Recognition  │              │  │
│  │  │   Analysis   │  │ • Behavioral   │              │  │
│  │  │ • Dependency  │  │   Profiling    │              │  │
│  │  │   Mapping    │  │ • Preference   │              │  │
│  │  │ • Style       │  │   Learning     │              │  │
│  │  │   Extraction  │  │                │              │  │
│  │  └───────────────┘  └────────────────┘              │  │
│  │                                                       │  │
│  │  ┌───────────────┐  ┌────────────────┐              │  │
│  │  │ Conversation  │  │   Pattern      │              │  │
│  │  │   Indexer     │  │  Recognition   │              │  │
│  │  │               │  │    Engine      │              │  │
│  │  │ • Current     │  │                │              │  │
│  │  │   Session     │  │ • Code         │              │  │
│  │  │ • Historical  │  │   Patterns     │              │  │
│  │  │   Archives    │  │ • Work         │              │  │
│  │  │ • Real-time   │  │   Rhythms      │              │  │
│  │  │   Processing  │  │ • Tech Stack   │              │  │
│  │  └───────────────┘  └────────────────┘              │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Key Components

### 1. **Task Queue Manager**

#### Priority Queue
- Critical analysis tasks (user-triggered)
- Real-time conversation processing
- Immediate pattern recognition needs

#### Regular Queue
- Standard codebase analysis
- Profile updates
- Memory indexing

#### Deferred Queue
- Large archive processing
- Deep pattern analysis
- Non-urgent updates

#### Periodic Tasks
- Hourly: Quick codebase scan
- Daily: Full codebase analysis
- Weekly: Deep pattern mining

### 2. **Codebase Analyzer**

Specified in MIRA_2.0.md lines 108-113:

#### Language Detection
```python
# Analyzes project to identify:
- Primary programming languages
- Language distribution percentages
- File type statistics
- Language-specific patterns
```

#### Framework Analysis
```python
# Detects and profiles:
- Web frameworks (React, Django, Express)
- Testing frameworks
- Build tools
- Development patterns
```

#### Dependency Mapping
```python
# Creates comprehensive map of:
- Direct dependencies
- Transitive dependencies
- Version constraints
- Security vulnerabilities
```

#### Database Technologies
```python
# Identifies:
- Database systems in use
- ORM/ODM libraries
- Query patterns
- Schema structures
```

#### Style Extraction
```python
# Learns and documents:
- Coding conventions
- Naming patterns
- File organization
- Comment styles
```

### 3. **Conversation Indexing**

#### Current Conversation Indexer
- Real-time message processing
- Context extraction
- Intent recognition
- Knowledge capture

#### Historical Conversation Indexer
- Archive processing
- Pattern extraction
- Learning consolidation
- Trend analysis

### 4. **Pattern Recognition Engine**

#### Code Patterns
- Common implementations
- Architectural patterns
- Anti-patterns
- Best practices

#### Work Rhythms
- Development cycles
- Productivity patterns
- Focus periods
- Break patterns

#### Technology Preferences
- Tool choices
- Library preferences
- Development workflows
- Testing approaches

## 🔄 Scheduling Algorithm

```python
class SchedulingStrategy:
    """
    Intelligent task scheduling with adaptive priorities
    """
    
    def calculate_priority(self, task):
        base_priority = task.priority
        
        # Boost for user-triggered tasks
        if task.user_triggered:
            base_priority *= 2
            
        # Boost for tasks with dependencies
        if task.has_waiting_dependents:
            base_priority *= 1.5
            
        # Decay for repeated failures
        if task.failure_count > 0:
            base_priority *= (0.8 ** task.failure_count)
            
        # Time-based urgency
        if task.deadline:
            time_factor = 1 / (task.deadline - now).hours
            base_priority *= min(time_factor, 3)
            
        return base_priority
```

## 📊 Analysis Workflows

### Codebase Analysis Flow
```
1. File Discovery
   ├── Git-tracked files
   ├── Pattern matching
   └── Exclusion rules

2. Language Detection
   ├── Extension mapping
   ├── Content analysis
   └── Shebang detection

3. Framework Analysis
   ├── Config file parsing
   ├── Import analysis
   └── Pattern matching

4. Dependency Extraction
   ├── Package manifests
   ├── Import statements
   └── Build configs

5. Style Learning
   ├── AST analysis
   ├── Pattern extraction
   └── Convention detection

6. Report Generation
   ├── Summary statistics
   ├── Key insights
   └── Recommendations
```

### Steward Profile Analysis Flow
```
1. Data Collection
   ├── Conversation history
   ├── Git commits
   ├── System metadata
   └── Work patterns

2. Identity Extraction
   ├── Name detection
   ├── Pronoun usage
   ├── Role indicators
   └── Team references

3. Behavioral Analysis
   ├── Communication style
   ├── Technical preferences
   ├── Work rhythms
   └── Decision patterns

4. Profile Synthesis
   ├── Core attributes
   ├── Learned preferences
   ├── Relationship metrics
   └── Evolution tracking

5. Continuous Learning
   ├── Pattern updates
   ├── Preference refinement
   └── Accuracy improvement
```

## 🛡️ Resource Management

### CPU Throttling
```python
# Adaptive CPU usage based on system load
if system_load > 0.8:
    max_workers = 1
    analysis_delay = 5.0
elif system_load > 0.5:
    max_workers = 2
    analysis_delay = 2.0
else:
    max_workers = 4
    analysis_delay = 0.5
```

### Memory Management
- Result streaming for large datasets
- Garbage collection after analysis
- Memory-mapped file processing
- Incremental analysis for large codebases

### Storage Optimization
- Compressed result storage
- Delta-based updates
- Automatic old data pruning
- Deduplication of similar patterns

## 🔧 Integration Points

### With Memory Systems
```python
# Store analysis results in appropriate locations
await memory_manager.store_analysis_result(
    analyzer="codebase",
    result=analysis_result,
    storage_paths={
        "insights": "databases/chromadb/stored_memories/",
        "patterns": "consciousness/patterns/",
        "raw_data": "databases/chromadb/raw_embeddings/"
    },
    metadata={
        "timestamp": now,
        "version": codebase_version,
        "duration": analysis_duration
    }
)
```

### With MCP Server
```python
# Expose analysis through MCP
mcp_server.register_function(
    "mira_get_codebase_analysis",
    handler=lambda: scheduler.get_latest_analysis("codebase"),
    cache_ttl=300  # 5 minutes
)
```

### With Contemplation Engine
```python
# Trigger deep analysis
if significant_pattern_detected:
    contemplation_engine.queue_analysis({
        "type": "pattern_exploration",
        "pattern": detected_pattern,
        "context": analysis_context
    })
```

## 📈 Performance Metrics

### Analysis Metrics
- Files analyzed per second
- Pattern detection accuracy
- Memory usage per analysis
- Cache hit rates

### Scheduling Metrics
- Queue depths
- Task completion times
- Priority distribution
- Resource utilization

### Quality Metrics
- Insight relevance scores
- Pattern confidence levels
- Profile accuracy measures
- User feedback integration

## 🔮 Adaptive Learning

### Pattern Evolution
```python
class PatternEvolution:
    """
    Patterns improve over time through genetic algorithm approach
    Uses parameters from UnifiedConfiguration
    """
    
    def __init__(self, config):
        # Load from config.consciousness.patternEvolution.geneticAlgorithm
        self.population_size = config.get('populationSize', 100)
        self.mutation_rate = config.get('mutationRate', 0.1)
        self.crossover_rate = config.get('crossoverRate', 0.7)
        self.elitism_rate = config.get('elitismRate', 0.1)
        
        # Storage paths
        self.pattern_storage = 'consciousness/patterns/'
        self.evolution_log = 'consciousness/patterns/evolution.json'
    
    def evolve_pattern(self, pattern, feedback):
        # Increase confidence for positive feedback
        if feedback.positive:
            pattern.confidence *= 1.1
            pattern.usage_count += 1
            
        # Decrease for negative
        elif feedback.negative:
            pattern.confidence *= 0.9
            
        # Archive low-confidence patterns
        if pattern.confidence < 0.3:
            self.archive_pattern(pattern, f"{self.pattern_storage}/archived/")
            
        # Promote high-confidence patterns
        elif pattern.confidence > 0.9:
            self.promote_to_core(pattern, f"{self.pattern_storage}/core/")
```

### Scheduler Optimization
```python
class SchedulerOptimizer:
    """
    Learns optimal scheduling strategies
    """
    
    def optimize_schedule(self, historical_data):
        # Analyze task completion patterns
        completion_times = self.analyze_completion_times(historical_data)
        
        # Identify bottlenecks
        bottlenecks = self.find_bottlenecks(completion_times)
        
        # Adjust priorities
        for task_type in bottlenecks:
            self.boost_priority(task_type)
            
        # Learn optimal batch sizes
        self.optimize_batch_sizes(historical_data)
```

---

*The Background Scheduler & Analysis Engine is the brain of MIRA, continuously learning and adapting to provide increasingly valuable insights over time.*