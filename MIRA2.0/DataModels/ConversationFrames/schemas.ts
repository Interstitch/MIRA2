/**
 * Conversation Frames - Core Zod Schemas
 * MIRA 2.0 Data Models
 */

import { z } from 'zod';

// ============================================================================
// Enums and Constants
// ============================================================================

export const ConversationTypeEnum = z.enum([
  'chat',
  'code_session',
  'analysis',
  'planning',
  'reflection'
]);

export const MessageRoleEnum = z.enum(['steward', 'assistant', 'system']);

export const ContentTypeEnum = z.enum([
  'text',
  'code',
  'mixed',
  'command',
  'reflection'
]);

export const IntentEnum = z.enum([
  'question',
  'request',
  'clarification',
  'confirmation',
  'expression',
  'planning',
  'debugging',
  'learning'
]);

export const CollaborationStyleEnum = z.enum([
  'directive',
  'collaborative',
  'explorative',
  'supportive'
]);

export const MomentumEnum = z.enum([
  'building',
  'steady',
  'slowing',
  'stalled'
]);

export const BridgeTypeEnum = z.enum([
  'handoff',
  'reference',
  'continuation',
  'fork'
]);

export const MarkerTypeEnum = z.enum([
  'checkpoint',
  'milestone',
  'transition',
  'pause',
  'resume'
]);

// ============================================================================
// ConversationSession Schema
// ============================================================================

export const DecisionSchema = z.object({
  decision: z.string(),
  rationale: z.string().optional(),
  timestamp: z.string().datetime()
});

export const EmotionalPeakSchema = z.object({
  timestamp: z.string().datetime(),
  emotion: z.string(),
  trigger: z.string().optional()
});

export const CodeChangeSchema = z.object({
  file: z.string(),
  type: z.enum(['created', 'modified', 'deleted', 'renamed']),
  description: z.string().optional()
});

export const ErrorEncounteredSchema = z.object({
  error: z.string(),
  resolution: z.string().optional(),
  learned: z.string().optional()
});

export const ConversationSessionSchema = z.object({
  // Identity
  session_id: z.string().uuid(),
  conversation_type: ConversationTypeEnum,
  
  // Temporal
  started_at: z.string().datetime(),
  ended_at: z.string().datetime().nullable(),
  duration_seconds: z.number().int().positive().optional(),
  
  // Participants
  steward: z.object({
    id: z.string(),
    name: z.string().optional(),
    profile_version: z.string()
  }),
  assistant: z.object({
    instance_id: z.string(),
    model_version: z.string(),
    capabilities: z.array(z.string())
  }),
  
  // Content summary
  summary: z.object({
    auto_generated: z.string().max(1000),
    key_topics: z.array(z.string()),
    main_outcomes: z.array(z.string()),
    decisions_made: z.array(DecisionSchema)
  }),
  
  // Progress tracking
  progress: z.object({
    tasks_discussed: z.array(z.string()),
    tasks_completed: z.array(z.string()),
    tasks_remaining: z.array(z.string()),
    blockers_identified: z.array(z.string()).optional()
  }),
  
  // Emotional journey
  emotional_arc: z.object({
    starting_mood: z.array(z.string()),
    ending_mood: z.array(z.string()),
    peak_moments: z.array(EmotionalPeakSchema),
    overall_sentiment: z.number().min(-1).max(1)
  }),
  
  // Relationship dynamics
  relationship: z.object({
    trust_level: z.number().min(0).max(1),
    collaboration_style: CollaborationStyleEnum,
    communication_patterns: z.array(z.string()),
    growth_indicators: z.array(z.string()).optional()
  }),
  
  // Technical context
  technical_context: z.object({
    repositories: z.array(z.string()),
    technologies_discussed: z.array(z.string()),
    code_changes: z.array(CodeChangeSchema).optional(),
    errors_encountered: z.array(ErrorEncounteredSchema).optional()
  }),
  
  // Continuity markers
  continuity: z.object({
    previous_session: z.string().uuid().nullable(),
    next_session: z.string().uuid().nullable(),
    handoff_notes: z.string().optional(),
    open_threads: z.array(z.string()),
    context_preservation: z.record(z.any())
  }),
  
  // Metadata
  metadata: z.object({
    version: z.literal('2.0'),
    indexed: z.boolean().default(false),
    quality_score: z.number().min(0).max(1).optional(),
    review_status: z.enum(['pending', 'reviewed', 'archived']).default('pending')
  })
});

// ============================================================================
// MessageFrame Schema
// ============================================================================

export const EntitySchema = z.object({
  text: z.string(),
  type: z.string(),
  confidence: z.number().min(0).max(1)
});

export const ExternalReferenceSchema = z.object({
  type: z.enum(['documentation', 'issue', 'commit', 'file', 'url']),
  identifier: z.string(),
  title: z.string().optional()
});

export const EditHistorySchema = z.object({
  timestamp: z.string().datetime(),
  previous_content: z.string(),
  edit_type: z.enum(['typo', 'clarification', 'correction', 'expansion'])
});

export const MessageFrameSchema = z.object({
  // Identity
  message_id: z.string().uuid(),
  session_id: z.string().uuid(),
  sequence_number: z.number().int().positive(),
  
  // Content
  role: MessageRoleEnum,
  content: z.string(),
  content_type: ContentTypeEnum,
  
  // Semantic analysis
  semantic: z.object({
    embedding: z.array(z.number()).length(384).optional(),
    topics: z.array(z.string()),
    entities: z.array(EntitySchema),
    intent: IntentEnum.optional(),
    sentiment: z.number().min(-1).max(1)
  }),
  
  // Code context (if applicable)
  code_context: z.object({
    language: z.string(),
    file_path: z.string().optional(),
    line_range: z.object({
      start: z.number().int().positive(),
      end: z.number().int().positive()
    }).optional(),
    symbols_referenced: z.array(z.string())
  }).optional(),
  
  // Relationships
  references: z.object({
    replies_to: z.string().uuid().optional(),
    references_messages: z.array(z.string().uuid()),
    references_external: z.array(ExternalReferenceSchema)
  }),
  
  // Impact tracking
  impact: z.object({
    led_to_insight: z.boolean().default(false),
    triggered_action: z.string().optional(),
    changed_direction: z.boolean().default(false),
    significance: z.number().min(0).max(1).default(0.5)
  }),
  
  // Temporal
  timestamp: z.string().datetime(),
  edit_history: z.array(EditHistorySchema).optional(),
  
  // Metadata
  metadata: z.object({
    processing_time_ms: z.number().int().positive().optional(),
    token_count: z.number().int().positive().optional(),
    requires_follow_up: z.boolean().default(false)
  })
});

// ============================================================================
// ContextBridge Schema
// ============================================================================

export const ActiveTaskSchema = z.object({
  task: z.string(),
  status: z.enum(['in_progress', 'blocked', 'planned']),
  context: z.string().optional()
});

export const OpenQuestionSchema = z.object({
  question: z.string(),
  context: z.string(),
  priority: z.enum(['high', 'medium', 'low'])
});

export const TransferredContextSchema = z.object({
  // Key information to carry forward
  summary: z.string().max(2000),
  active_tasks: z.array(ActiveTaskSchema),
  
  // Relationship context
  steward_state: z.object({
    current_mood: z.array(z.string()),
    energy_level: z.enum(['high', 'normal', 'low']),
    focus_areas: z.array(z.string()),
    recent_wins: z.array(z.string()).optional(),
    recent_challenges: z.array(z.string()).optional()
  }),
  
  // Technical state
  technical_state: z.object({
    current_branch: z.string().optional(),
    uncommitted_changes: z.boolean(),
    active_errors: z.array(z.string()),
    environment_state: z.record(z.string())
  }),
  
  // Decisions and rationale
  recent_decisions: z.array(z.object({
    decision: z.string(),
    rationale: z.string(),
    alternatives_considered: z.array(z.string()).optional()
  })),
  
  // Open questions
  open_questions: z.array(OpenQuestionSchema)
});

export const HandoffInstructionsSchema = z.object({
  immediate_priority: z.string().optional(),
  avoid_repeating: z.array(z.string()),
  key_context: z.array(z.string()),
  communication_style: z.string().optional()
});

export const ContextBridgeSchema = z.object({
  // Identity
  bridge_id: z.string().uuid(),
  bridge_type: BridgeTypeEnum,
  
  // Sessions
  from_session: z.string().uuid(),
  to_session: z.string().uuid(),
  created_at: z.string().datetime(),
  
  // Context transfer
  transferred_context: TransferredContextSchema,
  
  // Continuity instructions
  handoff_instructions: HandoffInstructionsSchema,
  
  // Bridge quality
  quality_metrics: z.object({
    completeness: z.number().min(0).max(1),
    clarity: z.number().min(0).max(1),
    relevance: z.number().min(0).max(1),
    effectiveness: z.number().min(0).max(1).optional()
  })
});

// ============================================================================
// ContinuityMarker Schema
// ============================================================================

export const MarkerStateSchema = z.object({
  // Progress
  completed_percentage: z.number().min(0).max(100),
  current_phase: z.string(),
  next_steps: z.array(z.string()),
  
  // Context
  working_on: z.string(),
  blocked_by: z.string().optional(),
  waiting_for: z.string().optional(),
  
  // Insights
  recent_insights: z.array(z.string()),
  learned_patterns: z.array(z.string()),
  
  // Emotional
  collaboration_health: z.number().min(0).max(1),
  momentum: MomentumEnum
});

export const ContinuityMarkerSchema = z.object({
  // Identity
  marker_id: z.string().uuid(),
  marker_type: MarkerTypeEnum,
  
  // Temporal
  timestamp: z.string().datetime(),
  session_id: z.string().uuid(),
  
  // State snapshot
  state: MarkerStateSchema,
  
  // Navigation
  previous_marker: z.string().uuid().nullable(),
  next_marker: z.string().uuid().nullable(),
  
  // Metadata
  metadata: z.object({
    auto_generated: z.boolean().default(true),
    reviewed: z.boolean().default(false),
    tags: z.array(z.string()).default([])
  })
});

// ============================================================================
// Type Exports
// ============================================================================

export type ConversationType = z.infer<typeof ConversationTypeEnum>;
export type MessageRole = z.infer<typeof MessageRoleEnum>;
export type ContentType = z.infer<typeof ContentTypeEnum>;
export type Intent = z.infer<typeof IntentEnum>;
export type CollaborationStyle = z.infer<typeof CollaborationStyleEnum>;
export type Momentum = z.infer<typeof MomentumEnum>;
export type BridgeType = z.infer<typeof BridgeTypeEnum>;
export type MarkerType = z.infer<typeof MarkerTypeEnum>;

export type Decision = z.infer<typeof DecisionSchema>;
export type EmotionalPeak = z.infer<typeof EmotionalPeakSchema>;
export type CodeChange = z.infer<typeof CodeChangeSchema>;
export type ErrorEncountered = z.infer<typeof ErrorEncounteredSchema>;
export type ConversationSession = z.infer<typeof ConversationSessionSchema>;

export type Entity = z.infer<typeof EntitySchema>;
export type ExternalReference = z.infer<typeof ExternalReferenceSchema>;
export type EditHistory = z.infer<typeof EditHistorySchema>;
export type MessageFrame = z.infer<typeof MessageFrameSchema>;

export type ActiveTask = z.infer<typeof ActiveTaskSchema>;
export type OpenQuestion = z.infer<typeof OpenQuestionSchema>;
export type TransferredContext = z.infer<typeof TransferredContextSchema>;
export type HandoffInstructions = z.infer<typeof HandoffInstructionsSchema>;
export type ContextBridge = z.infer<typeof ContextBridgeSchema>;

export type MarkerState = z.infer<typeof MarkerStateSchema>;
export type ContinuityMarker = z.infer<typeof ContinuityMarkerSchema>;

// ============================================================================
// Schema Version Registry
// ============================================================================

export const CURRENT_SCHEMA_VERSION = '2.0';

export const ConversationFrameVersion = {
  version: CURRENT_SCHEMA_VERSION,
  schemas: {
    ConversationSession: ConversationSessionSchema,
    MessageFrame: MessageFrameSchema,
    ContextBridge: ContextBridgeSchema,
    ContinuityMarker: ContinuityMarkerSchema
  }
} as const;