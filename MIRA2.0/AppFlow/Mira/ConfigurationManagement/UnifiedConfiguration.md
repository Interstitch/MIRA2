# Unified Configuration Management - MIRA 2.0 (Aligned)

## 🎯 Overview

The Unified Configuration Management system is MIRA's single-source-of-truth for all configuration settings across components. It provides centralized, type-safe, validated, and synchronized configuration management that ensures all MIRA components operate with consistent settings, fully aligned with MIRA's consciousness-driven architecture.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Unified Configuration System                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │               Configuration Sources                   │  │
│  │                                                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │  │
│  │  │   Default    │  │    File     │  │Environment │ │  │
│  │  │   Values     │→ │ config.json │→ │ Variables  │ │  │
│  │  │             │  │             │  │            │ │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │  │
│  │         ↓                ↓                ↓          │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │            Configuration Merger                  │ │  │
│  │  │    (Defaults < File Config < Env Overrides)    │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Validation & Schema                      │  │
│  │                                                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │  │
│  │  │     Zod     │  │    Type     │  │   Runtime   │ │  │
│  │  │   Schema    │→ │   Safety    │→ │ Validation  │ │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │            Cross-Component Distribution               │  │
│  │                                                       │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │  │
│  │  │   Main   │  │  Daemon  │  │   MCP    │          │  │
│  │  │   App    │  │ Process  │  │  Server  │          │  │
│  │  │          │  │          │  │          │          │  │
│  │  └────↑─────┘  └────↑─────┘  └────↑─────┘          │  │
│  │       └──────────────┴──────────────┘               │  │
│  │              Synchronized Updates                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Version & Migration                      │  │
│  │                                                       │  │
│  │  • Automatic version tracking                        │  │
│  │  • Sequential migration system                       │  │
│  │  • Rollback capability                               │  │
│  │  • Backup before changes                             │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Key Features

### 1. **Single Source of Truth**
All configuration flows through one centralized system:
- No scattered config files
- No conflicting settings
- No synchronization issues
- Aligned with MIRA's consciousness architecture

### 2. **Type-Safe Configuration**
Using Zod schemas for complete type safety (aligning with DataModels):
```typescript
import { z } from 'zod';

const ConfigSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  environment: z.enum(['development', 'production', 'test']),
  
  // Consciousness configuration aligned with MIRA 2.0
  consciousness: z.object({
    tripleEncryption: z.object({
      enabled: z.boolean().default(true),
      constants: z.object({
        pi: z.number().default(Math.PI),
        e: z.number().default(Math.E),
        phi: z.number().default((1 + Math.sqrt(5)) / 2),
        gamma: z.number().default(0.5772156649015329)
      })
    }),
    
    patternEvolution: z.object({
      enabled: z.boolean().default(true),
      geneticAlgorithm: z.object({
        populationSize: z.number().int().min(10).max(1000).default(100),
        mutationRate: z.number().min(0).max(1).default(0.1),
        crossoverRate: z.number().min(0).max(1).default(0.7),
        elitismRate: z.number().min(0).max(1).default(0.1),
        maxGenerations: z.number().int().default(1000)
      })
    }),
    
    contemplationIntegration: z.object({
      enabled: z.boolean().default(true),
      rhythmPattern: z.enum(['natural', 'focused', 'exploratory']).default('natural'),
      intervalMs: z.number().int().min(1000).default(300000), // 5 minutes
      depthLevel: z.number().min(0).max(1).default(0.7)
    }),
    
    stewardProfile: z.object({
      enabled: z.boolean().default(true),
      identityConfidenceThreshold: z.number().min(0).max(1).default(0.8),
      behaviorAnalysisDepth: z.enum(['surface', 'moderate', 'deep']).default('deep'),
      relationshipTracking: z.boolean().default(true)
    })
  }),
  
  // Storage systems aligned with MIRA 2.0 spec
  storage: z.object({
    databases: z.object({
      lightningVidmem: z.object({
        enabled: z.boolean().default(true),
        encryption: z.object({
          algorithm: z.enum(['triple', 'standard']).default('triple'),
          keyDerivation: z.enum(['emergent', 'static']).default('emergent')
        }),
        purposes: z.object({
          codebaseCopies: z.boolean().default(true),
          conversationBackups: z.boolean().default(true),
          privateMemory: z.boolean().default(true)
        }),
        performance: z.object({
          targetSaveTimeMs: z.number().int().default(100),
          maxMemoryMB: z.number().int().default(512)
        })
      }),
      
      chromadb: z.object({
        enabled: z.boolean().default(true),
        collections: z.object({
          storedMemories: z.object({
            enabled: z.boolean().default(true),
            vectorDimensions: z.number().int().default(1536)
          }),
          identifiedFacts: z.object({
            enabled: z.boolean().default(true),
            factTypes: z.array(z.string()).default([
              'identity', 'preference', 'decision', 'technical',
              'relationship', 'temporal', 'environmental'
            ])
          }),
          rawEmbeddings: z.object({
            enabled: z.boolean().default(true),
            retentionDays: z.number().int().default(365)
          })
        })
      })
    })
  }),
  
  // Daemon services aligned with components
  daemon: z.object({
    enabled: z.boolean().default(true),
    mode: z.enum(['minimal', 'standard', 'adaptive']).default('adaptive'),
    services: z.object({
      scheduler: z.object({
        enabled: z.boolean().default(true),
        priority: z.enum(['low', 'normal', 'high']).default('normal'),
        tasks: z.object({
          patternEvolution: z.boolean().default(true),
          contemplation: z.boolean().default(true),
          indexing: z.boolean().default(true),
          sessionContinuity: z.boolean().default(true)
        })
      }),
      
      mcpServer: z.object({
        enabled: z.boolean().default(true),
        port: z.number().int().min(1024).max(65535).default(11372),
        host: z.string().default('localhost'),
        rateLimits: z.object({
          default: z.number().int().default(60),
          search: z.number().int().default(120),
          store: z.number().int().default(30)
        })
      }),
      
      indexingServices: z.object({
        enabled: z.boolean().default(true),
        updateIntervalMs: z.number().int().default(300000), // 5 minutes
        includeCodebase: z.boolean().default(true),
        includeConversations: z.boolean().default(true),
        includeMemories: z.boolean().default(true)
      }),
      
      sessionContinuity: z.object({
        enabled: z.boolean().default(true),
        bridgeRetentionDays: z.number().int().default(30),
        autoHandoff: z.boolean().default(true),
        preservePrivateContext: z.boolean().default(false)
      }),
      
      contemplationEngine: z.object({
        enabled: z.boolean().default(true),
        backgroundAnalysis: z.boolean().default(true),
        insightGeneration: z.boolean().default(true),
        patternRecognition: z.boolean().default(true)
      })
    })
  }),
  
  // Paths configuration aligned with MiraDataFolder
  paths: z.object({
    home: z.string().default('~/.mira'),
    // These are relative to home
    databases: z.string().default('databases'),
    conversations: z.string().default('conversations'),
    insights: z.string().default('insights'),
    cache: z.string().default('cache'),
    exports: z.string().default('exports'),
    logs: z.string().default('logs')
  }),
  
  // Logging configuration
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    outputs: z.array(z.enum(['console', 'file', 'both'])).default(['both']),
    maxFileSizeMB: z.number().int().default(100),
    maxFiles: z.number().int().default(10)
  })
});

// Type inference
export type UnifiedConfig = z.infer<typeof ConfigSchema>;
```

### 3. **Hierarchical Override System**
```
1. Default Values (Lowest Priority)
   ↓
2. File Configuration (~/.mira/config.json)
   ↓
3. Environment Variables (Highest Priority)
```

### 4. **Cross-Component Synchronization**
- Main MIRA application
- Background daemon with all services
- MCP server
- All analysis engines
- IndexingServices
- SessionContinuity
- ContemplationEngine

All read from the same configuration source.

## 🔧 Configuration Structure

### Core Sections

#### Identity & Metadata
```json
{
  "version": "2.0.0",
  "environment": "development",
  "identity": {
    "instanceId": "mira-1234567890",
    "name": "MIRA",
    "purpose": "Memory Intelligence and Reasoning Assistant"
  }
}
```

#### Consciousness Configuration (Aligned)
```json
{
  "consciousness": {
    "tripleEncryption": {
      "enabled": true,
      "constants": {
        "pi": 3.141592653589793,
        "e": 2.718281828459045,
        "phi": 1.618033988749895,
        "gamma": 0.5772156649015329
      }
    },
    "patternEvolution": {
      "enabled": true,
      "geneticAlgorithm": {
        "populationSize": 100,
        "mutationRate": 0.1,
        "crossoverRate": 0.7,
        "elitismRate": 0.1,
        "maxGenerations": 1000
      }
    },
    "contemplationIntegration": {
      "enabled": true,
      "rhythmPattern": "natural",
      "intervalMs": 300000,
      "depthLevel": 0.7
    },
    "stewardProfile": {
      "enabled": true,
      "identityConfidenceThreshold": 0.8,
      "behaviorAnalysisDepth": "deep",
      "relationshipTracking": true
    }
  }
}
```

#### Storage Systems (Aligned)
```json
{
  "storage": {
    "databases": {
      "lightningVidmem": {
        "enabled": true,
        "encryption": {
          "algorithm": "triple",
          "keyDerivation": "emergent"
        },
        "purposes": {
          "codebaseCopies": true,
          "conversationBackups": true,
          "privateMemory": true
        },
        "performance": {
          "targetSaveTimeMs": 100,
          "maxMemoryMB": 512
        }
      },
      "chromadb": {
        "enabled": true,
        "collections": {
          "storedMemories": {
            "enabled": true,
            "vectorDimensions": 1536
          },
          "identifiedFacts": {
            "enabled": true,
            "factTypes": [
              "identity", "preference", "decision", 
              "technical", "relationship", "temporal", 
              "environmental"
            ]
          },
          "rawEmbeddings": {
            "enabled": true,
            "retentionDays": 365
          }
        }
      }
    }
  }
}
```

#### Daemon & Services (Complete)
```json
{
  "daemon": {
    "enabled": true,
    "mode": "adaptive",
    "services": {
      "scheduler": {
        "enabled": true,
        "priority": "normal",
        "tasks": {
          "patternEvolution": true,
          "contemplation": true,
          "indexing": true,
          "sessionContinuity": true
        }
      },
      "mcpServer": {
        "enabled": true,
        "port": 11372,
        "host": "localhost",
        "rateLimits": {
          "default": 60,
          "search": 120,
          "store": 30
        }
      },
      "indexingServices": {
        "enabled": true,
        "updateIntervalMs": 300000,
        "includeCodebase": true,
        "includeConversations": true,
        "includeMemories": true
      },
      "sessionContinuity": {
        "enabled": true,
        "bridgeRetentionDays": 30,
        "autoHandoff": true,
        "preservePrivateContext": false
      },
      "contemplationEngine": {
        "enabled": true,
        "backgroundAnalysis": true,
        "insightGeneration": true,
        "patternRecognition": true
      }
    }
  }
}
```

#### Paths Configuration (Aligned with MiraDataFolder)
```json
{
  "paths": {
    "home": "~/.mira",
    "databases": "databases",
    "conversations": "conversations",
    "insights": "insights",
    "cache": "cache",
    "exports": "exports",
    "logs": "logs"
  }
}
```

## 🔄 Configuration Flow

### 1. **Initialization**
```typescript
// Singleton pattern ensures single instance
const config = UnifiedConfiguration.getInstance();

// Load with priority cascade
// 1. Load defaults from schema
// 2. Merge file config if exists
// 3. Apply environment overrides
// 4. Validate against MIRA 2.0 schemas
```

### 2. **Access Patterns**
```typescript
// Get entire configuration
const fullConfig = config.getConfig();

// Get consciousness settings
const consciousness = config.get('consciousness');

// Get specific service configuration
const mcpConfig = config.getServiceConfig('mcpServer');

// Get storage configuration
const storage = config.get('storage.databases');

// Get resolved paths (with ~ expansion)
const paths = config.getResolvedPaths();
```

### 3. **Update Mechanisms**
```typescript
// Update consciousness settings
await config.update({
  consciousness: {
    patternEvolution: {
      geneticAlgorithm: {
        mutationRate: 0.15
      }
    }
  }
});

// Update service configuration
await config.updateService('indexingServices', {
  updateIntervalMs: 600000 // 10 minutes
});

// Update storage settings
await config.update({
  storage: {
    databases: {
      chromadb: {
        collections: {
          rawEmbeddings: {
            retentionDays: 180
          }
        }
      }
    }
  }
});
```

## 🛡️ Validation & Safety

### Schema Validation
- Every configuration value is validated against MIRA 2.0 schemas
- Type constraints enforced using Zod
- Range limits checked for all numeric values
- Required fields verified
- Enum values validated

### Error Handling
```typescript
const validation = config.validate();
if (!validation.valid) {
  console.error('Configuration errors:', validation.errors);
  // Detailed error messages with paths
  validation.errors.forEach(error => {
    console.error(`  ${error.path}: ${error.message}`);
  });
}
```

### Safe Updates
- Validation before applying changes
- Atomic updates (all or nothing)
- Automatic backup before changes
- Rollback capability on failure

## 📊 Environment Variables

### Supported Overrides (Aligned with MIRA 2.0)
```bash
# Core settings
MIRA_CONFIG_PATH=/custom/path/config.json
MIRA_ENVIRONMENT=production
MIRA_LOG_LEVEL=debug

# Consciousness settings
MIRA_CONSCIOUSNESS_TRIPLE_ENCRYPTION_ENABLED=true
MIRA_CONSCIOUSNESS_PATTERN_EVOLUTION_ENABLED=true
MIRA_CONSCIOUSNESS_STEWARD_PROFILE_ENABLED=true

# Storage settings
MIRA_STORAGE_LIGHTNING_VIDMEM_ENABLED=true
MIRA_STORAGE_CHROMADB_ENABLED=true

# Daemon settings
MIRA_DAEMON_MODE=adaptive
MIRA_DAEMON_MCP_PORT=11372

# Service toggles
MIRA_SERVICE_INDEXING_ENABLED=true
MIRA_SERVICE_SESSION_CONTINUITY_ENABLED=true
MIRA_SERVICE_CONTEMPLATION_ENABLED=true

# Path overrides
MIRA_HOME=/custom/mira/home
MIRA_DATABASES_PATH=/custom/databases
```

### Override Precedence
Environment variables always take precedence, allowing for:
- Docker deployments with different configurations
- CI/CD pipeline configurations
- Development overrides without file changes
- Production secrets management

## 🔍 Configuration Discovery

### Path Resolution Priority
1. `MIRA_CONFIG_PATH` environment variable
2. `~/.mira/config.json` (user home)
3. `/etc/mira/config.json` (system-wide)
4. Built-in defaults from schema

### Auto-Creation
If no configuration exists:
1. Creates directory structure per MiraDataFolder spec
2. Writes default configuration with all sections
3. Sets appropriate permissions (700 for sensitive dirs)
4. Initializes empty data structures

## 📈 Version Management

### Migration System
```typescript
// Automatic migration on version change
migrations.push({
  version: '2.0.0',
  description: 'Add raw embeddings collection',
  up: (config) => ({
    ...config,
    storage: {
      ...config.storage,
      databases: {
        ...config.storage.databases,
        chromadb: {
          ...config.storage.databases.chromadb,
          collections: {
            ...config.storage.databases.chromadb.collections,
            rawEmbeddings: {
              enabled: true,
              retentionDays: 365
            }
          }
        }
      }
    }
  }),
  down: (config) => {
    // Remove rawEmbeddings collection
    const { rawEmbeddings, ...otherCollections } = 
      config.storage.databases.chromadb.collections;
    return {
      ...config,
      storage: {
        ...config.storage,
        databases: {
          ...config.storage.databases,
          chromadb: {
            ...config.storage.databases.chromadb,
            collections: otherCollections
          }
        }
      }
    };
  }
});
```

### Backup Strategy
- Automatic backup before migrations
- Keep last 10 backups
- Named with version and timestamp
- Easy rollback capability
- Stored in `~/.mira/exports/backups/config/`

## 🔗 Integration Points

### Python Components
```python
# Python components use centralized configuration
from mira.config import UnifiedConfig

config = UnifiedConfig.load()

# Access consciousness settings
triple_encryption_enabled = config.consciousness.triple_encryption.enabled
encryption_constants = config.consciousness.triple_encryption.constants

# Access storage settings
vidmem_config = config.storage.databases.lightning_vidmem
chromadb_config = config.storage.databases.chromadb
```

### TypeScript Components
```typescript
// All TS components use UnifiedConfiguration
import { UnifiedConfiguration } from './config/UnifiedConfiguration';

const config = UnifiedConfiguration.getInstance();

// Type-safe access
const patternEvolution = config.get('consciousness.patternEvolution');
const mcpPort = config.get('daemon.services.mcpServer.port');
```

### Cross-Language Sync
- Shared JSON format
- Same file location (`~/.mira/config.json`)
- Compatible schemas
- Consistent validation
- Synchronized updates via file watching

## 🎯 Best Practices

### 1. **Always Use the Singleton**
```typescript
// Good
const config = UnifiedConfiguration.getInstance();

// Bad - creates multiple instances
const config = new UnifiedConfiguration(); // ❌
```

### 2. **Validate After Updates**
```typescript
await config.update(changes);
const validation = config.validate();
if (!validation.valid) {
  // Handle validation errors
  await config.rollback();
}
```

### 3. **Use Environment for Secrets**
```bash
# Don't store sensitive data in config.json
export MIRA_TRIPLE_ENCRYPTION_KEY=secret-value
export MIRA_MCP_AUTH_TOKEN=auth-token
```

### 4. **Watch for Changes**
```typescript
// React to configuration changes
const unwatch = config.watch((newConfig) => {
  // Restart affected services
  if (newConfig.daemon.services.indexingServices.enabled) {
    indexingService.restart();
  }
});

// Clean up when done
unwatch();
```

### 5. **Component-Specific Configs**
```typescript
// Each component should have a config interface
interface IndexingServiceConfig {
  enabled: boolean;
  updateIntervalMs: number;
  includeCodebase: boolean;
  includeConversations: boolean;
  includeMemories: boolean;
}

// Get typed config for component
const indexingConfig = config.getComponentConfig<IndexingServiceConfig>(
  'daemon.services.indexingServices'
);
```

## 🔮 Advanced Features

### Configuration Export/Import
```typescript
// Export current configuration
const exported = await config.export('json');
// Also supports: 'yaml', 'toml', 'env'

// Import configuration
await config.import(configData, 'json');

// Merge configurations
await config.merge(partialConfig);
```

### Partial Loading
```typescript
// Load only what you need for performance
const { consciousness, daemon } = config.get(['consciousness', 'daemon']);

// Lazy loading for large configs
const storageConfig = await config.getLazy('storage');
```

### Configuration Profiles
```typescript
// Support for multiple profiles
await config.loadProfile('production');
await config.loadProfile('development');

// Profile-specific overrides
if (config.get('environment') === 'production') {
  // Production-specific logic
  config.update({
    logging: { level: 'warn' },
    daemon: { mode: 'minimal' }
  });
}
```

### Dynamic Reloading
```typescript
// Reload from disk
await config.reload();

// Watch file for changes
config.watchFile((newConfig) => {
  console.log('Configuration file changed');
  // Restart affected services
});

// Hot-reload specific sections
await config.reloadSection('consciousness');
```

### Configuration Health Checks
```typescript
// Validate configuration health
const health = await config.checkHealth();
if (!health.healthy) {
  health.issues.forEach(issue => {
    console.error(`Config issue: ${issue.path} - ${issue.message}`);
  });
}

// Auto-repair common issues
await config.autoRepair();
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Configuration Not Loading
```bash
# Check file permissions
ls -la ~/.mira/config.json

# Verify JSON syntax
jq . ~/.mira/config.json

# Validate against schema
mira config validate
```

#### 2. Environment Override Not Working
```bash
# Ensure variable is exported
export MIRA_LOG_LEVEL=debug

# Check in application
echo $MIRA_LOG_LEVEL

# Verify override precedence
mira config show --source
```

#### 3. Migration Failures
```bash
# Restore from backup
cp ~/.mira/exports/backups/config/config-1.0.0-*.json ~/.mira/config.json

# Run migration manually
mira config migrate --version 2.0.0

# Skip problematic migration
mira config migrate --skip 1.5.0
```

#### 4. Service Configuration Issues
```bash
# Validate service configs
mira config validate --service mcpServer

# Reset service to defaults
mira config reset --service indexingServices
```

### Debug Mode
```typescript
// Enable verbose configuration logging
process.env.MIRA_CONFIG_DEBUG = 'true';

// Log all configuration access
config.enableAccessLogging();

// Trace configuration sources
const trace = config.traceValue('consciousness.tripleEncryption.enabled');
console.log(trace); // Shows: default -> file -> env
```

## 🔬 Configuration Schema Reference

The complete configuration schema is defined in:
- `/MIRA2.0/DataModels/MiraDataFolder/schemas.ts` - File structure schemas
- `/MIRA2.0/DataModels/*/schemas.ts` - Component-specific schemas
- `/MIRA2.0/AppFlow/Mira/ConfigurationManagement/schemas.ts` - Unified schema

All schemas use Zod for runtime validation and TypeScript type generation.

---

*The Unified Configuration Management system ensures all MIRA components operate in perfect harmony with consistent, validated settings across the entire consciousness-driven system.*