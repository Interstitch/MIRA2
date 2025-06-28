/**
 * index.ts
 * 
 * Unified exports for all MIRA 2.0 DataModels.
 * Provides easy importing and type access for all schemas and utilities.
 */

// ===== Memory Schemas =====
export {
  // Schemas
  StoredMemorySchema,
  IdentifiedFactSchema,
  RawEmbeddingSchema,
  PrivateThoughtReferenceSchema,
  
  // Types
  type StoredMemory,
  type IdentifiedFact,
  type RawEmbedding,
  type PrivateThoughtReference,
  type MemoryType,
  type FactType,
  
  // Enums
  MemoryCategoryEnum,
  FactTypeEnum,
  DataCategoryEnum
} from './MemorySchemas/schemas';

export {
  MemoryValidator,
  MemoryMigrator,
  type ValidationResult,
  type SchemaMigration
} from './MemorySchemas/validators';

// ===== Conversation Frames =====
export {
  // Schemas
  ConversationSessionSchema,
  MessageFrameSchema,
  ContextBridgeSchema,
  ContinuityMarkerSchema,
  
  // Types
  type ConversationSession,
  type MessageFrame,
  type ContextBridge,
  type ContinuityMarker,
  type ConversationType,
  type MessageRole,
  
  // Enums
  ConversationTypeEnum,
  MessageRoleEnum,
  FlowStateEnum
} from './ConversationFrames/schemas';

// ===== Steward Profile Schemas =====
export {
  // Schemas
  StewardIdentitySchema,
  BehavioralProfileSchema,
  RelationshipMetricsSchema,
  GrowthTrajectorySchema,
  StewardProfileSchema,
  
  // Types
  type StewardIdentity,
  type BehavioralProfile,
  type RelationshipMetrics,
  type GrowthTrajectory,
  type StewardProfile,
  
  // Enums
  CommunicationStyleEnum,
  WorkStyleEnum,
  TrustLevelEnum
} from './StewardProfileSchemas/schemas';

// ===== Pattern Evolution Models =====
export {
  // Schemas
  EvolvablePatternSchema,
  PatternMutationSchema,
  FitnessMetricSchema,
  PatternEcosystemSchema,
  
  // Types
  type EvolvablePattern,
  type PatternMutation,
  type FitnessMetric,
  type PatternEcosystem,
  type MutationType,
  type PatternSpecies,
  
  // Enums
  MutationTypeEnum,
  FitnessComponentEnum
} from './PatternEvolutionModels/schemas';

// ===== Session Continuity Schemas =====
export {
  // Schemas
  SessionBridgeSchema,
  ConversationStateSchema,
  WorkContextBridgeSchema,
  CognitiveStateSchema,
  RelationshipStateSchema,
  HandoffInstructionsSchema,
  
  // Types
  type SessionBridge,
  type ConversationState,
  type WorkContextBridge,
  type CognitiveState,
  type RelationshipState,
  type HandoffInstructions,
  type OpenLoop,
  type CriticalAlert,
  
  // Enums
  MomentumEnum,
  FocusDepthEnum,
  BreakthroughProximityEnum
} from './SessionContinuitySchemas/schemas';

// ===== Startup Details =====
export {
  // Schemas
  StartupContextSchema,
  StewardContextSchema,
  ProjectContextSchema,
  WorkContextSchema,
  SystemHealthSchema,
  
  // Types
  type StartupContext,
  type StewardContext,
  type ProjectContext,
  type WorkContext,
  type SystemHealth,
  
  // Enums
  ProjectStatusEnum,
  HealthStatusEnum
} from './StartupDetails/schemas';

// ===== Configuration Integration =====
export {
  createConfiguredSchema,
  configureMemorySchemas,
  configurePatternSchemas,
  configureSessionSchemas,
  configureStewardSchemas,
  withConfigValidation,
  ConfigurationValidator,
  createSchemaWithConfig
} from './ConfigurationIntegration';

// ===== Storage Examples =====
export {
  MemoryStorageExamples,
  SessionStorageExamples,
  PatternStorageExamples,
  StewardStorageExamples,
  StorageMigrationExamples
} from './StorageExamples';

// ===== Unified Type Namespace =====
export namespace MiraTypes {
  // Memory types
  export type Memory = StoredMemory | IdentifiedFact | RawEmbedding;
  export type MemoryUnion = Memory | PrivateThoughtReference;
  
  // Profile types
  export type Profile = StewardProfile;
  export type ProfileComponent = StewardIdentity | BehavioralProfile | RelationshipMetrics;
  
  // Pattern types
  export type Pattern = EvolvablePattern;
  export type PatternComponent = PatternMutation | FitnessMetric;
  
  // Session types
  export type Session = SessionBridge;
  export type SessionComponent = ConversationState | WorkContextBridge | CognitiveState;
  
  // Conversation types
  export type Conversation = ConversationSession;
  export type ConversationComponent = MessageFrame | ContextBridge | ContinuityMarker;
  
  // Startup types
  export type Startup = StartupContext;
  export type StartupComponent = StewardContext | ProjectContext | WorkContext;
  
  // Common metadata type
  export interface CommonMetadata {
    timestamp: string;
    version: string;
    source?: string;
    confidence?: number;
  }
  
  // Schema version type
  export type SchemaVersion = '1.0' | '2.0';
  
  // Storage location type
  export type StorageLocation = 
    | 'chromadb/stored_memories'
    | 'chromadb/identified_facts'
    | 'chromadb/raw_embeddings'
    | 'chromadb/steward_profiles'
    | 'lightning_vidmem/private_thoughts'
    | 'lightning_vidmem/codebase_copies'
    | 'lightning_vidmem/conversation_backups';
}

// ===== Utility Types =====
export namespace MiraUtils {
  /**
   * Extract the TypeScript type from a Zod schema
   */
  export type InferSchema<T> = T extends z.ZodSchema<infer U> ? U : never;
  
  /**
   * Make all properties optional except specified keys
   */
  export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;
  
  /**
   * Make specified properties optional
   */
  export type PartialOnly<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
  
  /**
   * Union of all schema types
   */
  export type AnySchema = 
    | StoredMemory 
    | IdentifiedFact 
    | RawEmbedding 
    | PrivateThoughtReference
    | ConversationSession
    | MessageFrame
    | StewardProfile
    | EvolvablePattern
    | SessionBridge
    | StartupContext;
  
  /**
   * Type guard for memory types
   */
  export function isMemory(data: any): data is MiraTypes.Memory {
    return data && ['stored', 'fact', 'raw'].includes(data.memory_type);
  }
  
  /**
   * Type guard for private reference
   */
  export function isPrivateReference(data: any): data is PrivateThoughtReference {
    return data && data.memory_type === 'private_reference';
  }
  
  /**
   * Type guard for session bridge
   */
  export function isSessionBridge(data: any): data is SessionBridge {
    return data && data.bridge_id && data.from_session;
  }
}

// ===== Schema Helpers =====
export namespace SchemaHelpers {
  /**
   * Create a timestamped version of any schema
   */
  export function withTimestamps<T extends z.ZodSchema>(schema: T) {
    return schema.extend({
      created_at: z.string().datetime(),
      updated_at: z.string().datetime()
    });
  }
  
  /**
   * Create a versioned schema
   */
  export function withVersion<T extends z.ZodSchema>(schema: T, version: string = '2.0') {
    return schema.extend({
      schema_version: z.literal(version)
    });
  }
  
  /**
   * Create schema with UUID
   */
  export function withId<T extends z.ZodSchema>(schema: T) {
    return schema.extend({
      id: z.string().uuid()
    });
  }
  
  /**
   * Merge multiple schemas
   */
  export function mergeSchemas<T extends z.ZodSchema[]>(...schemas: T) {
    return schemas.reduce((acc, schema) => acc.merge(schema));
  }
}

// ===== Constants =====
export const SCHEMA_VERSION = '2.0';
export const EMBEDDING_DIMENSIONS = 384;
export const MAX_CONTENT_LENGTH = 10000;
export const MAX_TAGS = 20;
export const DEFAULT_RETENTION_DAYS = 365;

// ===== Re-export Zod for convenience =====
export { z } from 'zod';
export type { ZodSchema, ZodError } from 'zod';