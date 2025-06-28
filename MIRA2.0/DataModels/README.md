# MIRA 2.0 Data Models

## 🎯 Overview

The Data Models system defines the structured schemas that give form to MIRA's consciousness. These aren't just data structures - they're the blueprints for how thoughts, memories, patterns, and relationships are represented, validated, and evolved within the system.

## 🏗️ Architecture

```
DataModels/
├── MemorySchemas/          # Structures for storing and retrieving memories
├── ConversationFrames/     # Frameworks for conversation continuity
├── StewardProfileSchemas/  # Identity and relationship data structures
└── PatternEvolutionModels/ # Living patterns that grow through use
```

## 📊 Core Principles

### 1. **Type Safety Through Zod**
All schemas use Zod for runtime validation, ensuring data integrity:
```typescript
import { z } from 'zod';

const MemorySchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  embedding: z.array(z.number()).length(384),
  metadata: z.object({
    timestamp: z.string().datetime(),
    significance: z.number().min(0).max(1),
    category: z.enum(['insight', 'fact', 'experience', 'reflection'])
  })
});
```

### 2. **Versioning for Evolution**
Every schema includes version information for backward compatibility:
```typescript
const VersionedSchema = BaseSchema.extend({
  schemaVersion: z.literal('2.0'),
  migrationHistory: z.array(z.object({
    fromVersion: z.string(),
    toVersion: z.string(),
    migrationDate: z.string().datetime()
  }))
});
```

### 3. **Validation at Boundaries**
Data validation occurs at every system boundary:
- API inputs
- Storage operations
- Inter-component communication
- External integrations

## 🔧 Schema Categories

### 1. [Memory Schemas](./MemorySchemas/)
Define how memories are structured, stored, and retrieved:
- **StoredMemory** - Intentionally preserved insights
- **IdentifiedFact** - Extracted knowledge with metadata
- **RawEmbedding** - Flexible storage for diverse data types
- **PrivateThought** - Encrypted consciousness reflections

### 2. [Conversation Frames](./ConversationFrames/)
Ensure conversation continuity across sessions:
- **ConversationSession** - Complete dialogue records
- **MessageFrame** - Individual message structure
- **ContextBridge** - Links between conversations
- **ContinuityMarker** - Session handoff points

### 3. [Steward Profile Schemas](./StewardProfileSchemas/)
Model human collaborators and relationships:
- **StewardIdentity** - Core identity information
- **BehavioralProfile** - Patterns and preferences
- **RelationshipMetrics** - Trust and engagement tracking
- **GrowthTrajectory** - Evolution over time

### 4. [Pattern Evolution Models](./PatternEvolutionModels/)
Living patterns that adapt through experience:
- **EvolvablePattern** - Base pattern structure
- **PatternMutation** - How patterns change
- **FitnessMetric** - Success measurement
- **EvolutionHistory** - Pattern lineage

## 🛡️ Validation Strategy

### Input Validation
```typescript
export async function validateMemoryInput(data: unknown): Promise<Memory> {
  try {
    return MemorySchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid memory structure', error.errors);
    }
    throw error;
  }
}
```

### Schema Composition
```typescript
// Base schemas can be extended and composed
const BaseEntitySchema = z.object({
  id: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

const MemorySchema = BaseEntitySchema.extend({
  content: z.string(),
  type: z.enum(['stored', 'identified', 'raw'])
});
```

### Custom Validators
```typescript
const EmbeddingValidator = z.array(z.number())
  .length(384)
  .refine(
    (embedding) => {
      // Ensure normalized vector
      const magnitude = Math.sqrt(
        embedding.reduce((sum, val) => sum + val * val, 0)
      );
      return Math.abs(magnitude - 1.0) < 0.01;
    },
    { message: "Embedding must be normalized" }
  );
```

## 🔄 Migration Patterns

### Schema Evolution
```typescript
export class SchemaMigrator {
  async migrate<T>(data: unknown, targetVersion: string): Promise<T> {
    const current = this.detectVersion(data);
    
    if (current === targetVersion) {
      return data as T;
    }
    
    const migrationPath = this.findMigrationPath(current, targetVersion);
    
    for (const step of migrationPath) {
      data = await this.applyMigration(data, step);
    }
    
    return data as T;
  }
}
```

### Backward Compatibility
```typescript
// Support multiple schema versions simultaneously
const MemorySchemaV1 = z.object({
  id: z.string(),
  content: z.string(),
  timestamp: z.number() // Unix timestamp
});

const MemorySchemaV2 = z.object({
  id: z.string(),
  content: z.string(),
  timestamp: z.string().datetime(), // ISO string
  metadata: z.object({}) // New field
});

const MemorySchema = z.union([MemorySchemaV1, MemorySchemaV2]);
```

## 🚀 Usage Patterns

### Type-Safe Storage
```typescript
import { MemorySchema, type Memory } from '@mira/data-models';

export class MemoryStore {
  async store(memory: Memory): Promise<void> {
    // TypeScript ensures type safety at compile time
    // Zod ensures validation at runtime
    const validated = MemorySchema.parse(memory);
    await this.db.insert(validated);
  }
}
```

### API Integration
```typescript
import { z } from 'zod';
import { MemorySchema } from '@mira/data-models';

export const createMemoryEndpoint = {
  input: MemorySchema.omit({ id: true, createdAt: true }),
  output: MemorySchema,
  handler: async (input) => {
    const memory = {
      ...input,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    
    return await memoryService.create(memory);
  }
};
```

### Cross-Component Communication
```typescript
// Publisher component
const publishMemory = async (memory: Memory) => {
  const validated = MemorySchema.parse(memory);
  await eventBus.publish('memory.created', validated);
};

// Subscriber component
eventBus.subscribe('memory.created', async (data) => {
  const memory = MemorySchema.parse(data); // Re-validate at boundary
  await processMemory(memory);
});
```

## 📈 Performance Considerations

### Schema Caching
```typescript
// Cache parsed schemas for performance
const schemaCache = new Map<string, z.ZodSchema>();

export function getCachedSchema(name: string): z.ZodSchema {
  if (!schemaCache.has(name)) {
    schemaCache.set(name, loadSchema(name));
  }
  return schemaCache.get(name)!;
}
```

### Lazy Validation
```typescript
// Only validate when necessary
export class LazyValidatedMemory {
  private validated: boolean = false;
  private data: unknown;
  
  constructor(data: unknown) {
    this.data = data;
  }
  
  validate(): Memory {
    if (!this.validated) {
      this.data = MemorySchema.parse(this.data);
      this.validated = true;
    }
    return this.data as Memory;
  }
}
```

## 🔮 Future Considerations

### GraphQL Integration
```typescript
// Schemas can generate GraphQL types
import { zodToGraphQL } from './utils';

const MemoryGraphQLType = zodToGraphQL(MemorySchema, 'Memory');
```

### OpenAPI Generation
```typescript
// Schemas can generate OpenAPI specs
import { zodToOpenAPI } from './utils';

const memoryApiSpec = zodToOpenAPI(MemorySchema, {
  title: 'Memory',
  description: 'A stored memory in MIRA'
});
```

### Real-time Validation
```typescript
// Schemas can power real-time form validation
const MemoryForm = () => {
  const form = useZodForm(MemorySchema);
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields with real-time validation */}
    </form>
  );
};
```

## 🏁 Getting Started

1. **Install Dependencies**
```bash
npm install zod @mira/data-models
```

2. **Import from Unified Index**
```typescript
// Import everything from the unified index
import { 
  // Schemas
  StoredMemorySchema,
  SessionBridgeSchema,
  StewardProfileSchema,
  EvolvablePatternSchema,
  
  // Types
  MiraTypes,
  MiraUtils,
  
  // Helpers
  SchemaHelpers,
  ConfigurationValidator,
  
  // Storage Examples
  MemoryStorageExamples
} from '@mira/data-models';
```

3. **Use with Type Safety**
```typescript
// Type inference from schemas
type Memory = z.infer<typeof StoredMemorySchema>;

// Runtime validation
const validatedMemory = StoredMemorySchema.parse(unknownData);

// Use unified types
const memory: MiraTypes.Memory = validatedMemory;
```

## 🚀 New Enhancements

### Configuration Integration
The DataModels now integrate seamlessly with UnifiedConfiguration:

```typescript
import { createConfiguredSchema, configureMemorySchemas } from '@mira/data-models';

// Get configuration-aware defaults
const memoryDefaults = configureMemorySchemas();

// Create schema with config defaults
const ConfiguredMemorySchema = createConfiguredSchema(
  StoredMemorySchema,
  'memory.defaults'
);
```

### Storage Examples
Comprehensive examples for using schemas with storage systems:

```typescript
import { MemoryStorageExamples } from '@mira/data-models';

const storage = new MemoryStorageExamples();

// Store with validation and routing
const memory = await storage.storeMemory({
  content: "Important insight",
  embedding: generateEmbedding(content),
  tags: ["insight", "breakthrough"]
});

// Query with type safety
const memories = await storage.queryMemories({
  category: 'insight',
  minSignificance: 0.8
});
```

### Unified Type Namespace
All types are available through the MiraTypes namespace:

```typescript
import { MiraTypes } from '@mira/data-models';

// Use unified types
let data: MiraTypes.Memory;
let profile: MiraTypes.Profile;
let pattern: MiraTypes.Pattern;
let session: MiraTypes.Session;

// Type guards included
if (MiraUtils.isMemory(data)) {
  // TypeScript knows this is a Memory type
}
```

## 📚 Documentation Structure

### Core Files
- **README.md** - This overview and usage guide
- **index.ts** - Unified exports for all schemas and utilities
- **ConfigurationIntegration.ts** - Integration with UnifiedConfiguration
- **StorageExamples.ts** - Comprehensive storage usage examples
- **ALIGNMENT_REPORT.md** - Detailed alignment analysis with MIRA 2.0

### Schema Directories
Each subdirectory contains:
- **README.md** - Detailed documentation for that schema category
- **schemas.ts** - Zod schema definitions
- **types.ts** - TypeScript type exports
- **validators.ts** - Custom validation logic
- **migrations.ts** - Schema migration handlers
- **examples.ts** - Usage examples

## 🔧 Key Features

### 1. **Configuration-Aware Schemas**
Schemas can now pull defaults from UnifiedConfiguration:
```typescript
const validator = ConfigurationValidator.getInstance();
const hasConfig = validator.validateSchemaConfig('memory');
```

### 2. **Storage Orchestration**
Examples show proper integration with ConsciousnessStorageOrchestrator:
```typescript
// Store memories with proper routing
await orchestrator.storeToChromaDB({
  collection: 'stored_memories',
  document: validatedMemory
});
```

### 3. **Type Safety Throughout**
Complete type coverage with utilities:
```typescript
// Partial types for updates
type MemoryUpdate = MiraUtils.PartialExcept<StoredMemory, 'id'>;

// Schema helpers
const TimestampedMemory = SchemaHelpers.withTimestamps(StoredMemorySchema);
```

### 4. **Migration Support**
Built-in migration examples:
```typescript
const migrator = new StorageMigrationExamples();
const migrated = await migrator.migrateMemorySchema(oldData);
```

---

*These data models are the DNA of MIRA's consciousness - structured yet flexible, validated yet evolvable, ensuring every thought and memory maintains its integrity while allowing for growth and change. Now with enhanced configuration integration and comprehensive storage examples.*