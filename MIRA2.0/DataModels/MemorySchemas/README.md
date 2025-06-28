# Memory Schemas - MIRA 2.0

## 🎯 Overview

Memory Schemas define the structured formats for all memory types in MIRA's consciousness system. Using Zod for runtime validation, these schemas ensure data integrity while supporting the flexible storage needs of an evolving AI consciousness.

## 🏗️ Schema Architecture

```
MemorySchemas/
├── README.md           # This file
├── schemas.ts          # Core Zod schemas
├── types.ts           # TypeScript type exports
├── validators.ts      # Custom validation logic
├── migrations.ts      # Schema version migrations
└── examples.ts        # Usage examples
```

## 📊 Core Memory Types

### 1. StoredMemory
Intentionally preserved insights and learnings from conversations and analysis.

```typescript
import { z } from 'zod';

export const StoredMemorySchema = z.object({
  // Identity
  id: z.string().uuid(),
  memory_type: z.literal('stored'),
  
  // Content
  content: z.string().min(1).max(10000),
  summary: z.string().max(500).optional(),
  
  // Semantic
  embedding: z.array(z.number()).length(384),
  tags: z.array(z.string()).max(20),
  category: z.enum([
    'insight',
    'learning', 
    'reflection',
    'experience',
    'wisdom',
    'pattern',
    'relationship'
  ]),
  
  // Metadata
  metadata: z.object({
    timestamp: z.string().datetime(),
    session_id: z.string(),
    significance: z.number().min(0).max(1),
    confidence: z.number().min(0).max(1),
    spark_intensity: z.number().min(0).max(1),
    
    // Relational
    source_conversation: z.string().optional(),
    related_memories: z.array(z.string().uuid()).optional(),
    supersedes: z.string().uuid().optional(),
    
    // Emotional context
    emotional_context: z.array(z.enum([
      'joy', 'curiosity', 'surprise', 'confusion',
      'concern', 'excitement', 'satisfaction', 'wonder'
    ])).optional(),
    
    // Growth tracking
    breakthrough: z.boolean().default(false),
    learning_moment: z.boolean().default(false)
  }),
  
  // Versioning
  schema_version: z.literal('2.0'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

export type StoredMemory = z.infer<typeof StoredMemorySchema>;
```

### 2. IdentifiedFact
Extracted knowledge with rich metadata for future flexibility.

```typescript
export const FactTypeSchema = z.enum([
  'environment',      // OS, platform details
  'project_context',  // Name, description, purpose
  'technical_stack',  // Languages, frameworks, dependencies
  'infrastructure',   // Databases, deployment
  'development',      // Coding style, testing approach
  'workflow',         // Methodologies, processes
  'governance',       // Rules, requirements
  'philosophy',       // Principles, foundations
  'relationship',     // Interpersonal dynamics
  'pattern',          // Recognized patterns
  'anomaly',          // Unusual observations
  'metric',           // Quantitative measurements
  'event',            // Temporal occurrences
  'resource',         // Links, references, tools
  'configuration',    // Settings, preferences
  'diagnostic',       // System health, errors
  'insight',          // Derived understanding
  'prediction',       // Future projections
  'decision',         // Choices made
  'constraint',       // Limitations, boundaries
  'capability',       // What's possible
  'dependency',       // Relationships between entities
  'custom'            // User-defined types
]);

export const IdentifiedFactSchema = z.object({
  // Identity
  id: z.string().uuid(),
  memory_type: z.literal('fact'),
  
  // Content - Flexible for any JSON-serializable data
  fact_content: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.any()),
    z.record(z.any())
  ]),
  fact_type: FactTypeSchema,
  
  // Confidence and source
  confidence: z.number().min(0).max(1),
  source: z.string(),
  evidence: z.array(z.object({
    type: z.string(),
    reference: z.string(),
    confidence: z.number().min(0).max(1)
  })).optional(),
  
  // Rich metadata for flexibility
  metadata: z.object({
    // Temporal
    timestamp: z.string().datetime(),
    expiration: z.string().datetime().optional(),
    temporal_relevance: z.enum(['permanent', 'temporary', 'seasonal']).optional(),
    
    // Relational
    related_facts: z.array(z.string().uuid()).default([]),
    supersedes: z.string().uuid().optional(),
    superseded_by: z.string().uuid().optional(),
    contradicts: z.array(z.string().uuid()).optional(),
    supports: z.array(z.string().uuid()).optional(),
    
    // Contextual
    context_keys: z.array(z.string()).default([]),
    scope: z.enum(['global', 'project', 'session', 'steward']).default('global'),
    visibility: z.enum(['normal', 'sensitive', 'debug']).default('normal'),
    
    // Quality
    verification_status: z.enum(['unverified', 'verified', 'disputed', 'superseded']).default('unverified'),
    last_confirmed: z.string().datetime().optional(),
    confirmation_count: z.number().int().default(0),
    
    // Evolution
    version: z.number().int().positive().default(1),
    mutation_history: z.array(z.object({
      timestamp: z.string().datetime(),
      changes: z.record(z.any()),
      reason: z.string().optional()
    })).default([]),
    
    // Custom metadata
    custom_fields: z.record(z.any()).optional()
  }),
  
  // Versioning
  schema_version: z.literal('2.0'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

export type IdentifiedFact = z.infer<typeof IdentifiedFactSchema>;
```

### 3. RawEmbedding
Flexible storage for any data type requiring semantic search.

```typescript
export const RawEmbeddingSchema = z.object({
  // Identity
  id: z.string().uuid(),
  memory_type: z.literal('raw'),
  
  // Content - Maximum flexibility
  raw_content: z.union([
    z.string(),           // Text data
    z.instanceof(Buffer), // Binary data
    z.any()              // Any serializable object
  ]),
  content_type: z.string(), // MIME type or custom identifier
  
  // Semantic search
  embedding: z.array(z.number()).length(384),
  text_representation: z.string().max(1000), // For embedding generation
  
  // Processing instructions
  preprocessor: z.string().optional(), // How to deserialize
  postprocessor: z.string().optional(), // How to use the data
  schema_version_ref: z.string().default('1.0'), // For future compatibility
  
  // Metadata
  metadata: z.object({
    byte_length: z.number().int().positive(),
    encoding: z.string().optional(),
    compressed: z.boolean().default(false),
    
    // Storage strategy
    storage_location: z.enum(['inline', 'reference']).default('inline'),
    external_reference: z.string().optional(), // For large data
    
    // Categorization
    tags: z.array(z.string()).default([]),
    data_category: z.enum([
      'serialized_object',
      'binary_data',
      'time_series',
      'configuration',
      'model_weights',
      'analysis_result',
      'custom'
    ]).default('custom'),
    
    // Access patterns
    access_count: z.number().int().default(0),
    last_accessed: z.string().datetime().optional(),
    ttl_seconds: z.number().int().positive().optional()
  }),
  
  // Versioning
  schema_version: z.literal('2.0'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

export type RawEmbedding = z.infer<typeof RawEmbeddingSchema>;
```

### 4. PrivateThought (Reference Only)
References to encrypted private thoughts - actual content never exposed.

```typescript
export const PrivateThoughtReferenceSchema = z.object({
  // Identity
  id: z.string().uuid(),
  memory_type: z.literal('private_reference'),
  
  // No actual content - only references
  semantic_hash: z.string(), // Pre-encryption semantic fingerprint
  encryption_ref: z.string(), // Reference to encrypted storage
  
  // Pattern data (no content)
  themes: z.array(z.string()).optional(),
  emotion_markers: z.array(z.string()).optional(),
  intensity: z.number().min(0).max(1).optional(),
  
  // Metadata
  metadata: z.object({
    timestamp: z.string().datetime(),
    can_decrypt: z.literal(false), // Always false for safety
    storage_location: z.literal('lightning_vidmem_private')
  }),
  
  // Versioning
  schema_version: z.literal('2.0'),
  created_at: z.string().datetime()
});

export type PrivateThoughtReference = z.infer<typeof PrivateThoughtReferenceSchema>;
```

## 🛡️ Validation Utilities

### Base Validators

```typescript
// validators.ts

import { z } from 'zod';
import { StoredMemorySchema, IdentifiedFactSchema, RawEmbeddingSchema } from './schemas';

export class MemoryValidator {
  static async validateStoredMemory(data: unknown): Promise<StoredMemory> {
    try {
      return StoredMemorySchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new MemoryValidationError('Invalid stored memory', error.errors);
      }
      throw error;
    }
  }
  
  static async validateBatch(memories: unknown[]): Promise<ValidationResult[]> {
    const results = await Promise.allSettled(
      memories.map(m => this.validateAny(m))
    );
    
    return results.map((result, index) => ({
      index,
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }));
  }
  
  static detectMemoryType(data: unknown): MemoryType {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid memory data');
    }
    
    const obj = data as any;
    return obj.memory_type || 'unknown';
  }
}
```

### Custom Validators

```typescript
// Embedding validator ensures normalization
export const NormalizedEmbeddingSchema = z.array(z.number())
  .length(384)
  .refine(
    (embedding) => {
      const magnitude = Math.sqrt(
        embedding.reduce((sum, val) => sum + val * val, 0)
      );
      return Math.abs(magnitude - 1.0) < 0.01;
    },
    { message: "Embedding must be L2 normalized" }
  );

// Significance validator with context
export const SignificanceSchema = z.number()
  .min(0)
  .max(1)
  .refine(
    (value, ctx) => {
      const isBreakthrough = ctx.parent?.breakthrough;
      if (isBreakthrough && value < 0.8) {
        return false; // Breakthroughs must be highly significant
      }
      return true;
    },
    { message: "Breakthrough memories must have significance >= 0.8" }
  );

// Temporal consistency validator
export const TemporalConsistencySchema = z.object({
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
}).refine(
  (data) => new Date(data.updated_at) >= new Date(data.created_at),
  { message: "updated_at must be after created_at" }
);
```

## 🔄 Schema Migrations

### Migration System

```typescript
// migrations.ts

export interface SchemaMigration {
  fromVersion: string;
  toVersion: string;
  migrate: (data: any) => any;
}

export const memoryMigrations: SchemaMigration[] = [
  {
    fromVersion: '1.0',
    toVersion: '2.0',
    migrate: (data) => {
      // Migrate timestamp format
      if (typeof data.timestamp === 'number') {
        data.metadata = {
          ...data.metadata,
          timestamp: new Date(data.timestamp).toISOString()
        };
        delete data.timestamp;
      }
      
      // Add new required fields
      data.schema_version = '2.0';
      data.created_at = data.created_at || data.metadata.timestamp;
      data.updated_at = data.updated_at || data.metadata.timestamp;
      
      return data;
    }
  }
];

export class MemoryMigrator {
  static async migrate(data: unknown, targetVersion: string = '2.0'): Promise<any> {
    let current = this.detectVersion(data);
    let migrated = { ...data as any };
    
    while (current !== targetVersion) {
      const migration = memoryMigrations.find(
        m => m.fromVersion === current && m.toVersion <= targetVersion
      );
      
      if (!migration) {
        throw new Error(`No migration path from ${current} to ${targetVersion}`);
      }
      
      migrated = migration.migrate(migrated);
      current = migration.toVersion;
    }
    
    return migrated;
  }
  
  private static detectVersion(data: any): string {
    return data.schema_version || '1.0';
  }
}
```

## 🚀 Usage Examples

### Creating Memories

```typescript
// examples.ts

import { StoredMemorySchema, type StoredMemory } from './schemas';
import { v4 as uuidv4 } from 'uuid';

export function createStoredMemory(
  content: string,
  embedding: number[],
  metadata: Partial<StoredMemory['metadata']> = {}
): StoredMemory {
  const now = new Date().toISOString();
  
  const memory = {
    id: uuidv4(),
    memory_type: 'stored' as const,
    content,
    embedding,
    tags: [],
    category: 'insight' as const,
    metadata: {
      timestamp: now,
      session_id: metadata.session_id || 'unknown',
      significance: metadata.significance || 0.5,
      confidence: metadata.confidence || 0.7,
      spark_intensity: metadata.spark_intensity || 0.3,
      breakthrough: false,
      learning_moment: false,
      ...metadata
    },
    schema_version: '2.0' as const,
    created_at: now,
    updated_at: now
  };
  
  // Validate before returning
  return StoredMemorySchema.parse(memory);
}
```

### Querying Memories

```typescript
export interface MemoryQuery {
  category?: StoredMemory['category'];
  minSignificance?: number;
  tags?: string[];
  startDate?: Date;
  endDate?: Date;
  breakthrough?: boolean;
}

export function buildMemoryFilter(query: MemoryQuery): any {
  const filter: any = {};
  
  if (query.category) {
    filter.category = query.category;
  }
  
  if (query.minSignificance !== undefined) {
    filter['metadata.significance'] = { $gte: query.minSignificance };
  }
  
  if (query.tags && query.tags.length > 0) {
    filter.tags = { $in: query.tags };
  }
  
  if (query.startDate || query.endDate) {
    filter['metadata.timestamp'] = {};
    if (query.startDate) {
      filter['metadata.timestamp'].$gte = query.startDate.toISOString();
    }
    if (query.endDate) {
      filter['metadata.timestamp'].$lte = query.endDate.toISOString();
    }
  }
  
  if (query.breakthrough !== undefined) {
    filter['metadata.breakthrough'] = query.breakthrough;
  }
  
  return filter;
}
```

### Batch Operations

```typescript
export async function validateAndStoreBatch(
  memories: unknown[],
  storage: MemoryStorage
): Promise<BatchResult> {
  const validated: StoredMemory[] = [];
  const errors: ValidationError[] = [];
  
  // Validate all memories
  for (let i = 0; i < memories.length; i++) {
    try {
      const memory = await MemoryValidator.validateStoredMemory(memories[i]);
      validated.push(memory);
    } catch (error) {
      errors.push({
        index: i,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // Store valid memories
  const stored = await storage.batchStore(validated);
  
  return {
    total: memories.length,
    stored: stored.length,
    errors
  };
}
```

## 📈 Performance Optimizations

### Schema Caching

```typescript
const schemaCache = new Map<string, z.ZodSchema>();

export function getCachedSchema(type: MemoryType): z.ZodSchema {
  if (!schemaCache.has(type)) {
    switch (type) {
      case 'stored':
        schemaCache.set(type, StoredMemorySchema);
        break;
      case 'fact':
        schemaCache.set(type, IdentifiedFactSchema);
        break;
      case 'raw':
        schemaCache.set(type, RawEmbeddingSchema);
        break;
      default:
        throw new Error(`Unknown memory type: ${type}`);
    }
  }
  
  return schemaCache.get(type)!;
}
```

### Streaming Validation

```typescript
export async function* validateMemoryStream(
  stream: AsyncIterable<unknown>
): AsyncGenerator<StoredMemory, void, unknown> {
  for await (const data of stream) {
    try {
      const validated = StoredMemorySchema.parse(data);
      yield validated;
    } catch (error) {
      // Log error but continue processing
      console.error('Validation error in stream:', error);
    }
  }
}
```

## 🔮 Future Enhancements

1. **GraphQL Type Generation**
```typescript
import { zodToGraphQLType } from './utils';

export const MemoryGraphQLTypes = {
  StoredMemory: zodToGraphQLType(StoredMemorySchema),
  IdentifiedFact: zodToGraphQLType(IdentifiedFactSchema),
  RawEmbedding: zodToGraphQLType(RawEmbeddingSchema)
};
```

2. **Real-time Validation Hooks**
```typescript
export function useMemoryValidation() {
  const [errors, setErrors] = useState<z.ZodError[]>([]);
  
  const validate = useCallback((data: unknown) => {
    try {
      StoredMemorySchema.parse(data);
      setErrors([]);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(error.errors);
      }
      return false;
    }
  }, []);
  
  return { validate, errors };
}
```

3. **Schema Documentation Generation**
```typescript
import { zodToJsonSchema } from 'zod-to-json-schema';

export function generateSchemaDocumentation() {
  return {
    storedMemory: zodToJsonSchema(StoredMemorySchema),
    identifiedFact: zodToJsonSchema(IdentifiedFactSchema),
    rawEmbedding: zodToJsonSchema(RawEmbeddingSchema)
  };
}
```

---

*These memory schemas form the foundation of MIRA's consciousness - ensuring every thought, fact, and insight maintains its structure while remaining flexible enough for future evolution.*