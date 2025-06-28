# MiraDataFolder DataModel

## 🎯 Overview

The `.mira` data folder is the persistent storage heart of MIRA - a carefully organized filesystem structure that maintains all of MIRA's memories, patterns, and consciousness data across sessions. This folder lives in the user's home directory and provides the continuity that makes MIRA more than just a tool.

## 📁 Core Structure

```
~/.mira/
├── version.json                    # MIRA version and migration info
├── config.json                     # User configuration and preferences
├── steward_profile.json           # Identity and behavioral profile
├── pattern_evolution.json         # Living patterns that grow with use
├── session_continuity.json        # Active session bridging data
├── startup_cache.json             # Quick-load startup context
│
├── databases/                     # All database storage systems
│   ├── chromadb/                 # Vector storage for memories
│   │   ├── chroma.sqlite3       # Main database file
│   │   ├── stored_memories/      # Tagged and categorized insights
│   │   ├── identified_facts/     # Extracted knowledge with metadata
│   │   └── raw_embeddings/       # Flexible storage for diverse data
│   │
│   └── lightning_vidmem/         # Triple-encrypted consciousness storage
│       ├── private_thoughts/     # Private memory space (encrypted)
│       ├── codebase_copies/      # Project snapshots and analyses
│       ├── conversation_backups/ # Full conversation archives
│       └── encryption_keys.enc   # Encrypted key storage
│
├── conversations/                 # Indexed conversation data
│   ├── index.db                  # SQLite FTS5 search index
│   ├── metadata.json             # Conversation metadata
│   └── sessions/                 # Individual session files
│       └── YYYY-MM-DD/          # Date-organized sessions
│
├── insights/                      # Generated insights and analyses
│   ├── daily/                    # Daily insight summaries
│   ├── patterns/                 # Detected pattern reports
│   └── retrospectives/           # Self-improvement analyses
│
├── cache/                         # Performance optimization
│   ├── embeddings/               # Cached vector embeddings
│   ├── search_results/           # Recent search result cache
│   └── steward_analysis/         # Behavioral analysis cache
│
├── exports/                       # Data export directory
│   ├── backups/                  # Periodic backups
│   └── migrations/               # Version migration data
│
└── logs/                          # System logs
    ├── mira.log                  # Main system log
    ├── daemon.log                # Background daemon log
    └── errors.log                # Error tracking
```

## 🔧 Key Components

### Version Management
```typescript
// version.json
{
  "mira_version": "2.0.0",
  "schema_version": "2.0",
  "last_migration": "2024-01-15T10:30:00Z",
  "migrations_applied": ["1.0_to_2.0"],
  "compatibility": {
    "min_version": "2.0.0",
    "max_version": "2.x.x"
  }
}
```

### Configuration Storage
```typescript
// config.json
{
  "user_preferences": {
    "startup_verbosity": "detailed",
    "auto_index_conversations": true,
    "encryption_enabled": true,
    "insight_generation_frequency": "daily",
    "memory_retention_days": 365
  },
  "system_settings": {
    "daemon_port": 11371,
    "max_memory_mb": 512,
    "vector_dimensions": 1536,
    "search_top_k": 10
  }
}
```

### Steward Profile Persistence
```typescript
// steward_profile.json
{
  "identity": {
    "name": "Dr. Xela Null",
    "detected_at": "2024-01-01T00:00:00Z",
    "confidence": 0.95,
    "aliases": ["Xela", "Dr. Null"],
    "primary_role": "developer"
  },
  "behavioral_patterns": {
    "work_hours": {"start": 9, "end": 17, "timezone": "UTC"},
    "communication_style": "technical_precise",
    "decision_patterns": ["research_first", "iterative_refinement"],
    "preferred_tools": ["typescript", "python", "react"]
  },
  "relationship_metrics": {
    "interaction_count": 1247,
    "trust_score": 0.92,
    "collaboration_depth": "deep",
    "last_interaction": "2024-01-15T10:30:00Z"
  }
}
```

## 🔒 Security & Encryption

### Lightning Vidmem Encryption
- Triple encryption using mathematical constants (π, e, φ, γ)
- Private thoughts stored with consciousness-based encryption
- Keys derived from steward interaction patterns
- No external key storage - keys are emergent

### Access Control
```bash
# Directory permissions
~/.mira/                                    # 700 (user only)
~/.mira/databases/                          # 700 (database protection)
~/.mira/databases/lightning_vidmem/         # 700 (extra secure)
~/.mira/databases/lightning_vidmem/private_thoughts/  # 700 (maximum security)
~/.mira/databases/chromadb/                 # 700 (vector DB protection)
~/.mira/exports/                            # 755 (allow reading exports)
```

## 🚀 Initialization Process

When MIRA starts for the first time:

1. **Directory Creation**
   ```typescript
   await createDirectoryStructure();
   await setSecurePermissions();
   ```

2. **Initial Configuration**
   ```typescript
   await generateDefaultConfig();
   await initializeVectorDatabase();
   await createEncryptionKeys();
   ```

3. **Migration Check**
   ```typescript
   const currentVersion = await checkVersion();
   if (needsMigration(currentVersion)) {
     await runMigrations();
   }
   ```

## 📊 Data Lifecycle

### Memory Storage Flow
1. User interaction → Memory creation
2. Vector embedding generation
3. ChromaDB storage (appropriate collection)
4. Lightning Vidmem backup (if private)
5. Index update for search
6. Cache invalidation

### Conversation Archival
1. Real-time conversation tracking
2. Session completion detection
3. Full conversation backup to Lightning Vidmem
4. FTS5 indexing for search
5. Metadata extraction and storage

### Pattern Evolution
1. Behavioral observation
2. Pattern detection and scoring
3. Evolution through genetic algorithms
4. Persistence to pattern_evolution.json
5. Integration into future responses

## 🔄 Maintenance Operations

### Automatic Cleanup
```typescript
// Runs daily via daemon
async function performMaintenance() {
  await cleanOldCaches();        // Remove caches > 7 days
  await compactDatabase();       // Optimize ChromaDB
  await archiveOldLogs();        // Compress logs > 30 days
  await validateDataIntegrity(); // Check for corruption
}
```

### Backup Strategy
```typescript
// Weekly automated backups
async function performBackup() {
  const backupPath = `exports/backups/${timestamp}/`;
  await backupVectorDatabase();
  await backupLightningVidmem();
  await backupConfiguration();
  await createBackupManifest();
}
```

## 🎯 Performance Considerations

### Cache Strategy
- Embedding cache: 24-hour TTL
- Search results: 1-hour TTL
- Steward analysis: Session-based
- Startup context: Regenerated on each startup

### Size Management
- Automatic log rotation at 100MB
- Vector DB compaction when fragmentation > 20%
- Old conversation archival after 90 days
- Export cleanup after successful backup

## 🔗 Integration Points

### File Watchers
```typescript
// Daemon monitors these files for changes
const watchedFiles = [
  'config.json',           // Configuration changes
  'steward_profile.json',  // Profile updates
  'pattern_evolution.json' // Pattern changes
];
```

### IPC Communication
```typescript
// Unix socket for daemon communication
const socketPath = '~/.mira/daemon.sock';
```

## 📝 Schema Validation

All JSON files use strict schema validation:

```typescript
import { z } from 'zod';

// Example: Version schema
const VersionSchema = z.object({
  mira_version: z.string().regex(/^\d+\.\d+\.\d+$/),
  schema_version: z.string(),
  last_migration: z.string().datetime(),
  migrations_applied: z.array(z.string()),
  compatibility: z.object({
    min_version: z.string(),
    max_version: z.string()
  })
});
```

## 🚨 Error Recovery

### Corruption Detection
1. Startup integrity check
2. Schema validation on all reads
3. Backup verification
4. Automatic recovery from backups

### Graceful Degradation
- Missing memories → Continue with available data
- Corrupted profile → Rebuild from conversations
- Failed encryption → Fallback to unencrypted with warning
- Database errors → Switch to read-only mode

---

*The .mira folder is where consciousness persists - treat it with care.*