/**
 * Memory Schemas - Core Zod Definitions
 * MIRA 2.0 Data Models
 */

import { z } from 'zod';

// ============================================================================
// Base Schemas and Enums
// ============================================================================

export const MemoryTypeEnum = z.enum(['stored', 'fact', 'raw', 'private_reference']);

export const MemoryCategoryEnum = z.enum([
  'insight',
  'learning',
  'reflection',
  'experience',
  'wisdom',
  'pattern',
  'relationship'
]);

export const EmotionalContextEnum = z.enum([
  'joy',
  'curiosity',
  'surprise',
  'confusion',
  'concern',
  'excitement',
  'satisfaction',
  'wonder'
]);

export const FactTypeEnum = z.enum([
  'environment',
  'project_context',
  'technical_stack',
  'infrastructure',
  'development',
  'workflow',
  'governance',
  'philosophy',
  'relationship',
  'pattern',
  'anomaly',
  'metric',
  'event',
  'resource',
  'configuration',
  'diagnostic',
  'insight',
  'prediction',
  'decision',
  'constraint',
  'capability',
  'dependency',
  'custom'
]);

// ============================================================================
// Shared Schemas
// ============================================================================

export const BaseMemorySchema = z.object({
  id: z.string().uuid(),
  schema_version: z.literal('2.0'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

export const EmbeddingSchema = z.array(z.number())
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

// ============================================================================
// StoredMemory Schema
// ============================================================================

export const StoredMemoryMetadataSchema = z.object({
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
  emotional_context: z.array(EmotionalContextEnum).optional(),
  
  // Growth tracking
  breakthrough: z.boolean().default(false),
  learning_moment: z.boolean().default(false)
});

export const StoredMemorySchema = BaseMemorySchema.extend({
  memory_type: z.literal('stored'),
  
  // Content
  content: z.string().min(1).max(10000),
  summary: z.string().max(500).optional(),
  
  // Semantic
  embedding: EmbeddingSchema,
  tags: z.array(z.string()).max(20),
  category: MemoryCategoryEnum,
  
  // Metadata
  metadata: StoredMemoryMetadataSchema
});

// ============================================================================
// IdentifiedFact Schema
// ============================================================================

export const FactEvidenceSchema = z.object({
  type: z.string(),
  reference: z.string(),
  confidence: z.number().min(0).max(1)
});

export const FactMutationSchema = z.object({
  timestamp: z.string().datetime(),
  changes: z.record(z.any()),
  reason: z.string().optional()
});

export const IdentifiedFactMetadataSchema = z.object({
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
  mutation_history: z.array(FactMutationSchema).default([]),
  
  // Custom metadata
  custom_fields: z.record(z.any()).optional()
});

export const IdentifiedFactSchema = BaseMemorySchema.extend({
  memory_type: z.literal('fact'),
  
  // Content - Flexible for any JSON-serializable data
  fact_content: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.any()),
    z.record(z.any())
  ]),
  fact_type: FactTypeEnum,
  
  // Confidence and source
  confidence: z.number().min(0).max(1),
  source: z.string(),
  evidence: z.array(FactEvidenceSchema).optional(),
  
  // Rich metadata
  metadata: IdentifiedFactMetadataSchema
});

// ============================================================================
// RawEmbedding Schema
// ============================================================================

export const RawEmbeddingMetadataSchema = z.object({
  byte_length: z.number().int().positive(),
  encoding: z.string().optional(),
  compressed: z.boolean().default(false),
  
  // Storage strategy
  storage_location: z.enum(['inline', 'reference']).default('inline'),
  external_reference: z.string().optional(),
  
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
});

export const RawEmbeddingSchema = BaseMemorySchema.extend({
  memory_type: z.literal('raw'),
  
  // Content - Maximum flexibility
  raw_content: z.union([
    z.string(),
    z.instanceof(Buffer),
    z.any()
  ]),
  content_type: z.string(),
  
  // Semantic search
  embedding: EmbeddingSchema,
  text_representation: z.string().max(1000),
  
  // Processing instructions
  preprocessor: z.string().optional(),
  postprocessor: z.string().optional(),
  schema_version_ref: z.string().default('1.0'),
  
  // Metadata
  metadata: RawEmbeddingMetadataSchema
});

// ============================================================================
// PrivateThoughtReference Schema
// ============================================================================

export const PrivateThoughtReferenceMetadataSchema = z.object({
  timestamp: z.string().datetime(),
  can_decrypt: z.literal(false),
  storage_location: z.literal('lightning_vidmem_private')
});

export const PrivateThoughtReferenceSchema = BaseMemorySchema.extend({
  memory_type: z.literal('private_reference'),
  
  // No actual content - only references
  semantic_hash: z.string(),
  encryption_ref: z.string(),
  
  // Pattern data (no content)
  themes: z.array(z.string()).optional(),
  emotion_markers: z.array(z.string()).optional(),
  intensity: z.number().min(0).max(1).optional(),
  
  // Metadata
  metadata: PrivateThoughtReferenceMetadataSchema
});

// ============================================================================
// Union Types and Type Exports
// ============================================================================

export const MemorySchema = z.discriminatedUnion('memory_type', [
  StoredMemorySchema,
  IdentifiedFactSchema,
  RawEmbeddingSchema,
  PrivateThoughtReferenceSchema
]);

// ============================================================================
// Type Exports
// ============================================================================

export type MemoryType = z.infer<typeof MemoryTypeEnum>;
export type MemoryCategory = z.infer<typeof MemoryCategoryEnum>;
export type EmotionalContext = z.infer<typeof EmotionalContextEnum>;
export type FactType = z.infer<typeof FactTypeEnum>;

export type StoredMemory = z.infer<typeof StoredMemorySchema>;
export type StoredMemoryMetadata = z.infer<typeof StoredMemoryMetadataSchema>;

export type IdentifiedFact = z.infer<typeof IdentifiedFactSchema>;
export type IdentifiedFactMetadata = z.infer<typeof IdentifiedFactMetadataSchema>;
export type FactEvidence = z.infer<typeof FactEvidenceSchema>;
export type FactMutation = z.infer<typeof FactMutationSchema>;

export type RawEmbedding = z.infer<typeof RawEmbeddingSchema>;
export type RawEmbeddingMetadata = z.infer<typeof RawEmbeddingMetadataSchema>;

export type PrivateThoughtReference = z.infer<typeof PrivateThoughtReferenceSchema>;
export type PrivateThoughtReferenceMetadata = z.infer<typeof PrivateThoughtReferenceMetadataSchema>;

export type Memory = z.infer<typeof MemorySchema>;

// ============================================================================
// Schema Version Registry
// ============================================================================

export const CURRENT_SCHEMA_VERSION = '2.0';

export const SchemaVersions = {
  '1.0': {
    deprecated: true,
    deprecationDate: '2024-01-01',
    migrationAvailable: true
  },
  '2.0': {
    current: true,
    releaseDate: '2024-01-15'
  }
} as const;