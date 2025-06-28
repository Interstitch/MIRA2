/**
 * MiraDataFolder Schemas
 * 
 * Complete schema definitions for all data structures stored in the .mira folder.
 * These schemas ensure data integrity and type safety across the entire system.
 */

import { z } from 'zod';

// ========================
// Version & Migration
// ========================

export const VersionSchema = z.object({
  mira_version: z.string().regex(/^\d+\.\d+\.\d+$/),
  schema_version: z.string(),
  last_migration: z.string().datetime(),
  migrations_applied: z.array(z.string()),
  compatibility: z.object({
    min_version: z.string().regex(/^\d+\.\d+\.\d+$/),
    max_version: z.string()
  })
});

export const MigrationRecordSchema = z.object({
  migration_id: z.string(),
  from_version: z.string(),
  to_version: z.string(),
  executed_at: z.string().datetime(),
  duration_ms: z.number(),
  status: z.enum(['completed', 'failed', 'partial']),
  error: z.string().optional(),
  rollback_available: z.boolean()
});

// ========================
// Configuration
// ========================

export const UserPreferencesSchema = z.object({
  startup_verbosity: z.enum(['minimal', 'normal', 'detailed', 'debug']),
  auto_index_conversations: z.boolean(),
  encryption_enabled: z.boolean(),
  insight_generation_frequency: z.enum(['realtime', 'hourly', 'daily', 'weekly', 'manual']),
  memory_retention_days: z.number().int().min(1).max(3650), // 1 day to 10 years
  privacy_mode: z.boolean().default(false),
  language: z.string().default('en'),
  timezone: z.string().default('UTC')
});

export const SystemSettingsSchema = z.object({
  daemon_port: z.number().int().min(1024).max(65535),
  daemon_host: z.string().default('localhost'),
  max_memory_mb: z.number().int().min(128).max(8192),
  vector_dimensions: z.number().int().min(128).max(4096),
  search_top_k: z.number().int().min(1).max(100),
  embedding_model: z.string().default('text-embedding-ada-002'),
  chunk_size: z.number().int().default(1000),
  chunk_overlap: z.number().int().default(200),
  cache_ttl_hours: z.number().default(24),
  log_level: z.enum(['debug', 'info', 'warn', 'error']).default('info')
});

export const ConfigSchema = z.object({
  user_preferences: UserPreferencesSchema,
  system_settings: SystemSettingsSchema,
  last_updated: z.string().datetime(),
  config_version: z.string().default('2.0')
});

// ========================
// Steward Profile Storage
// ========================

export const StoredIdentitySchema = z.object({
  name: z.string(),
  detected_at: z.string().datetime(),
  confidence: z.number().min(0).max(1),
  aliases: z.array(z.string()),
  primary_role: z.enum(['developer', 'researcher', 'designer', 'manager', 'analyst', 'other']),
  email: z.string().email().optional(),
  github_username: z.string().optional()
});

export const StoredBehavioralPatternsSchema = z.object({
  work_hours: z.object({
    start: z.number().int().min(0).max(23),
    end: z.number().int().min(0).max(23),
    timezone: z.string(),
    days: z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']))
  }),
  communication_style: z.enum(['technical_precise', 'casual_friendly', 'formal_professional', 'creative_exploratory']),
  decision_patterns: z.array(z.string()),
  preferred_tools: z.array(z.string()),
  coding_patterns: z.object({
    languages: z.array(z.string()),
    frameworks: z.array(z.string()),
    paradigms: z.array(z.enum(['functional', 'oop', 'procedural', 'reactive']))
  })
});

export const StoredRelationshipMetricsSchema = z.object({
  interaction_count: z.number().int().min(0),
  trust_score: z.number().min(0).max(1),
  collaboration_depth: z.enum(['surface', 'moderate', 'deep', 'profound']),
  last_interaction: z.string().datetime(),
  sentiment_trend: z.enum(['improving', 'stable', 'declining']),
  topics_discussed: z.array(z.string())
});

export const StewardProfileStorageSchema = z.object({
  identity: StoredIdentitySchema,
  behavioral_patterns: StoredBehavioralPatternsSchema,
  relationship_metrics: StoredRelationshipMetricsSchema,
  profile_version: z.string().default('2.0'),
  last_updated: z.string().datetime()
});

// ========================
// Pattern Evolution Storage
// ========================

export const EvolutionGenerationSchema = z.object({
  generation_id: z.number().int().min(0),
  created_at: z.string().datetime(),
  fitness_score: z.number().min(0).max(1),
  usage_count: z.number().int().min(0),
  success_rate: z.number().min(0).max(1)
});

export const StoredPatternSchema = z.object({
  pattern_id: z.string().uuid(),
  pattern_type: z.enum(['code', 'communication', 'decision', 'workflow', 'learning']),
  pattern_content: z.string(),
  confidence: z.number().min(0).max(1),
  generations: z.array(EvolutionGenerationSchema),
  current_generation: z.number().int().min(0),
  created_at: z.string().datetime(),
  last_evolved: z.string().datetime(),
  is_active: z.boolean()
});

export const PatternEvolutionStorageSchema = z.object({
  patterns: z.array(StoredPatternSchema),
  evolution_config: z.object({
    mutation_rate: z.number().min(0).max(1),
    selection_pressure: z.number().min(0).max(1),
    population_size: z.number().int().min(1).max(100),
    elite_retention: z.number().min(0).max(1)
  }),
  last_evolution_run: z.string().datetime(),
  total_generations: z.number().int().min(0)
});

// ========================
// Session Continuity Storage
// ========================

export const ActiveSessionSchema = z.object({
  session_id: z.string().uuid(),
  started_at: z.string().datetime(),
  last_activity: z.string().datetime(),
  conversation_type: z.enum(['chat', 'code_session', 'analysis', 'planning', 'reflection']),
  current_context: z.object({
    working_directory: z.string(),
    active_files: z.array(z.string()),
    recent_commands: z.array(z.string()),
    open_tasks: z.array(z.string())
  }),
  memory_references: z.array(z.string().uuid()),
  is_active: z.boolean()
});

export const SessionContinuityStorageSchema = z.object({
  active_session: ActiveSessionSchema.nullable(),
  recent_sessions: z.array(ActiveSessionSchema),
  handoff_data: z.object({
    pending_tasks: z.array(z.string()),
    key_decisions: z.array(z.string()),
    warnings: z.array(z.string()),
    next_steps: z.array(z.string())
  }).optional(),
  continuity_version: z.string().default('2.0')
});

// ========================
// Startup Cache
// ========================

export const StartupCacheSchema = z.object({
  cached_at: z.string().datetime(),
  ttl_hours: z.number().default(24),
  quick_context: z.object({
    steward_name: z.string(),
    last_project: z.string(),
    recent_files: z.array(z.string()),
    open_tasks: z.array(z.string()),
    key_memories: z.array(z.object({
      content: z.string(),
      relevance: z.number()
    }))
  }),
  system_status: z.object({
    memory_count: z.number(),
    pattern_count: z.number(),
    conversation_count: z.number(),
    last_index_update: z.string().datetime()
  })
});

// ========================
// Conversation Metadata
// ========================

export const ConversationMetadataSchema = z.object({
  total_conversations: z.number().int().min(0),
  total_messages: z.number().int().min(0),
  date_range: z.object({
    earliest: z.string().datetime(),
    latest: z.string().datetime()
  }),
  indexed_count: z.number().int().min(0),
  last_index_update: z.string().datetime(),
  index_version: z.string(),
  conversation_types: z.record(z.number()) // type -> count mapping
});

// ========================
// Insight Storage
// ========================

export const InsightSchema = z.object({
  insight_id: z.string().uuid(),
  type: z.enum(['pattern_discovery', 'efficiency_optimization', 'learning_opportunity', 
                'emotional_wellbeing', 'collaboration_improvement', 'productivity_insight',
                'knowledge_gap', 'success_pattern', 'risk_warning', 'creative_opportunity']),
  content: z.string(),
  confidence: z.number().min(0).max(1),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  generated_at: z.string().datetime(),
  evidence: z.array(z.object({
    source: z.string(),
    relevance: z.number()
  })),
  actionable: z.boolean(),
  expires_at: z.string().datetime().optional()
});

export const DailyInsightSummarySchema = z.object({
  date: z.string().date(),
  insights: z.array(InsightSchema),
  summary: z.string(),
  key_themes: z.array(z.string()),
  recommended_actions: z.array(z.string())
});

// ========================
// Cache Structures
// ========================

export const EmbeddingCacheEntrySchema = z.object({
  content_hash: z.string(),
  embedding: z.array(z.number()),
  model: z.string(),
  created_at: z.string().datetime(),
  access_count: z.number().int().min(0),
  last_accessed: z.string().datetime()
});

export const SearchResultCacheSchema = z.object({
  query_hash: z.string(),
  results: z.array(z.object({
    content: z.string(),
    score: z.number(),
    source: z.string(),
    metadata: z.record(z.any())
  })),
  cached_at: z.string().datetime(),
  ttl_minutes: z.number().default(60)
});

// ========================
// Backup Manifest
// ========================

export const BackupManifestSchema = z.object({
  backup_id: z.string().uuid(),
  created_at: z.string().datetime(),
  mira_version: z.string(),
  backup_type: z.enum(['manual', 'scheduled', 'migration', 'emergency']),
  components: z.object({
    vector_database: z.boolean(),
    lightning_vidmem: z.boolean(),
    configuration: z.boolean(),
    conversations: z.boolean(),
    insights: z.boolean()
  }),
  size_bytes: z.number().int().min(0),
  checksum: z.string(),
  encryption: z.object({
    encrypted: z.boolean(),
    algorithm: z.string().optional(),
    key_id: z.string().optional()
  }),
  restore_instructions: z.string()
});

// ========================
// Log Entry Schema
// ========================

export const LogEntrySchema = z.object({
  timestamp: z.string().datetime(),
  level: z.enum(['debug', 'info', 'warn', 'error', 'fatal']),
  component: z.string(),
  message: z.string(),
  context: z.record(z.any()).optional(),
  stack_trace: z.string().optional()
});

// ========================
// Directory Permissions
// ========================

export const DirectoryPermissionsSchema = z.object({
  path: z.string(),
  owner: z.string(),
  group: z.string(),
  permissions: z.string().regex(/^[0-7]{3}$/),
  recursive: z.boolean()
});

// ========================
// Master Data Folder Schema
// ========================

export const MiraDataFolderSchema = z.object({
  version: VersionSchema,
  config: ConfigSchema,
  steward_profile: StewardProfileStorageSchema,
  pattern_evolution: PatternEvolutionStorageSchema,
  session_continuity: SessionContinuityStorageSchema,
  startup_cache: StartupCacheSchema,
  conversation_metadata: ConversationMetadataSchema,
  permissions: z.array(DirectoryPermissionsSchema),
  health_check: z.object({
    last_check: z.string().datetime(),
    status: z.enum(['healthy', 'degraded', 'error']),
    issues: z.array(z.string())
  })
});

// Type exports
export type Version = z.infer<typeof VersionSchema>;
export type Config = z.infer<typeof ConfigSchema>;
export type StewardProfileStorage = z.infer<typeof StewardProfileStorageSchema>;
export type PatternEvolutionStorage = z.infer<typeof PatternEvolutionStorageSchema>;
export type SessionContinuityStorage = z.infer<typeof SessionContinuityStorageSchema>;
export type StartupCache = z.infer<typeof StartupCacheSchema>;
export type ConversationMetadata = z.infer<typeof ConversationMetadataSchema>;
export type Insight = z.infer<typeof InsightSchema>;
export type BackupManifest = z.infer<typeof BackupManifestSchema>;
export type MiraDataFolder = z.infer<typeof MiraDataFolderSchema>;