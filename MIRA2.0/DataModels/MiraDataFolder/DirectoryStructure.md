# MiraDataFolder Directory Structure Implementation

## 🏗️ Structure Creation During Startup

When MIRA starts up, the Health Check system automatically creates and validates the complete `.mira` directory structure. This ensures that all necessary directories and configuration files exist before any other operations begin.

## 📁 Directory Creation Order

The directories are created in a specific order to ensure dependencies are met:

```python
# 1. Root directory
~/.mira/

# 2. Database parent directory
~/.mira/databases/

# 3. Database subdirectories
~/.mira/databases/chromadb/
~/.mira/databases/chromadb/stored_memories/
~/.mira/databases/chromadb/identified_facts/
~/.mira/databases/chromadb/raw_embeddings/

~/.mira/databases/lightning_vidmem/
~/.mira/databases/lightning_vidmem/private_thoughts/
~/.mira/databases/lightning_vidmem/codebase_copies/
~/.mira/databases/lightning_vidmem/conversation_backups/

# 4. Conversation storage
~/.mira/conversations/
~/.mira/conversations/sessions/

# 5. Operational directories
~/.mira/insights/
~/.mira/insights/daily/
~/.mira/insights/patterns/
~/.mira/insights/retrospectives/

~/.mira/cache/
~/.mira/cache/embeddings/
~/.mira/cache/search_results/
~/.mira/cache/steward_analysis/

# 6. Maintenance directories
~/.mira/exports/
~/.mira/exports/backups/
~/.mira/exports/migrations/

~/.mira/logs/
```

## 🔧 Configuration File Initialization

After directory creation, the following configuration files are initialized with defaults:

### 1. version.json
```json
{
  "mira_version": "2.0.0",
  "schema_version": "2.0",
  "last_migration": "<current_timestamp>",
  "migrations_applied": [],
  "compatibility": {
    "min_version": "2.0.0",
    "max_version": "2.x.x"
  }
}
```

### 2. config.json
```json
{
  "user_preferences": {
    "startup_verbosity": "detailed",
    "auto_index_conversations": true,
    "encryption_enabled": true,
    "insight_generation_frequency": "daily",
    "memory_retention_days": 365,
    "privacy_mode": false,
    "language": "en",
    "timezone": "UTC"
  },
  "system_settings": {
    "daemon_port": 11371,
    "daemon_host": "localhost",
    "max_memory_mb": 512,
    "vector_dimensions": 1536,
    "search_top_k": 10,
    "embedding_model": "text-embedding-ada-002",
    "chunk_size": 1000,
    "chunk_overlap": 200,
    "cache_ttl_hours": 24,
    "log_level": "info"
  },
  "last_updated": "<current_timestamp>",
  "config_version": "2.0"
}
```

### 3. steward_profile.json
```json
{
  "identity": {
    "name": "User",
    "detected_at": "<current_timestamp>",
    "confidence": 0.0,
    "aliases": [],
    "primary_role": "developer"
  },
  "behavioral_patterns": {
    "work_hours": {
      "start": 9,
      "end": 17,
      "timezone": "UTC",
      "days": ["mon", "tue", "wed", "thu", "fri"]
    },
    "communication_style": "technical_precise",
    "decision_patterns": [],
    "preferred_tools": [],
    "coding_patterns": {
      "languages": [],
      "frameworks": [],
      "paradigms": []
    }
  },
  "relationship_metrics": {
    "interaction_count": 0,
    "trust_score": 0.0,
    "collaboration_depth": "surface",
    "last_interaction": "<current_timestamp>",
    "sentiment_trend": "stable",
    "topics_discussed": []
  },
  "profile_version": "2.0",
  "last_updated": "<current_timestamp>"
}
```

### 4. pattern_evolution.json
```json
{
  "patterns": [],
  "evolution_config": {
    "mutation_rate": 0.1,
    "selection_pressure": 0.7,
    "population_size": 20,
    "elite_retention": 0.2
  },
  "last_evolution_run": "<current_timestamp>",
  "total_generations": 0
}
```

### 5. session_continuity.json
```json
{
  "active_session": null,
  "recent_sessions": [],
  "handoff_data": null,
  "continuity_version": "2.0"
}
```

### 6. conversations/metadata.json
```json
{
  "total_conversations": 0,
  "total_messages": 0,
  "date_range": {
    "earliest": "<current_timestamp>",
    "latest": "<current_timestamp>"
  },
  "indexed_count": 0,
  "last_index_update": "<current_timestamp>",
  "index_version": "2.0",
  "conversation_types": {}
}
```

## 🔒 Permission Settings

Directory permissions are set based on security requirements:

```bash
# Standard directories (755 - rwxr-xr-x)
~/.mira/
~/.mira/cache/
~/.mira/exports/
~/.mira/logs/
~/.mira/insights/

# Secure directories (700 - rwx------)
~/.mira/memories/
~/.mira/lightning_vidmem/
~/.mira/lightning_vidmem/private_thoughts/
~/.mira/conversations/

# Configuration files (600 - rw-------)
~/.mira/*.json
~/.mira/lightning_vidmem/encryption_keys.enc
```

## 🔄 Startup Integration

The directory structure is validated and created during the Health Check phase of startup:

```python
class HealthCheckStartup:
    def execute(self):
        # STRUCTURE VERIFICATION
        self.tracker.start_task('health_structure',
                               "Scanning directory structure...")
        
        # StructureHealer validates and creates all directories
        structure_result = self.orchestrator.structure_healer.validate_structure()
        
        if structure_result['repairs']:
            self.tracker.start_task('health_structure',
                                   f"Creating {len(structure_result['repairs'])} directories...")
            
            # Configuration files are initialized automatically
            # after directory creation
        
        self.tracker.complete_task('health_structure', success=True)
```

## 📊 Validation Process

The validation follows these steps:

1. **Check Root Directory**: Ensure `~/.mira/` exists
2. **Recursive Structure Check**: Validate all subdirectories
3. **Permission Validation**: Ensure proper access rights
4. **Configuration File Check**: Create missing config files
5. **ChromaDB Initialization**: Prepare vector database directories
6. **Log Initialization**: Create initial log files

## 🚨 Error Handling

If directory creation fails:

1. **Permission Denied**: Suggest alternative location or sudo
2. **Disk Full**: Alert user and suggest cleanup
3. **Path Exists as File**: Rename existing file and create directory
4. **Network Drive Issues**: Fall back to local temp directory

## 🔮 Future Considerations

### Auto-Migration
When MIRA version changes, the structure may need updates:
- New directories added automatically
- Old directories migrated or archived
- Configuration schemas updated with defaults

### Multi-User Support
Future versions may support:
- User-specific subdirectories
- Shared memory pools
- Permission-based access control

---

*The .mira directory structure is the foundation of MIRA's persistence - created automatically, maintained continuously.*