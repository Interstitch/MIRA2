/**
 * Startup Details - Core Zod Schemas
 * MIRA 2.0 Data Models
 */

import { z } from 'zod';

// ============================================================================
// Steward Context Schema
// ============================================================================

export const StewardContextSchema = z.object({
  // Identity
  identity: z.object({
    name: z.string(),
    pronouns: z.string().optional(),
    timezone: z.string().optional(),
    profile_version: z.string()
  }),
  
  // Relationship status
  relationship: z.object({
    trust_level: z.number().min(0).max(1),
    collaboration_style: z.enum(['directive', 'collaborative', 'explorative', 'supportive']),
    rapport_level: z.enum(['initial', 'developing', 'established', 'deep']),
    total_sessions: z.number().int().positive(),
    total_hours: z.number().positive()
  }),
  
  // Key preferences and rules
  preferences: z.object({
    high_priority_rules: z.array(z.object({
      content: z.string(),
      priority: z.number().min(0).max(10),
      type: z.enum(['rule', 'preference', 'instruction', 'ask'])
    })).max(5), // Top 5 only
    
    communication_style: z.object({
      detail_level: z.enum(['concise', 'balanced', 'detailed']),
      explanation_style: z.enum(['examples_first', 'theory_first', 'mixed']),
      interaction_style: z.enum(['formal', 'casual', 'adaptive'])
    }),
    
    technical_preferences: z.object({
      coding_style: z.string(),
      testing_preference: z.string(),
      documentation_style: z.string(),
      preferred_languages: z.array(z.string()).optional()
    })
  }),
  
  // Work patterns
  work_patterns: z.object({
    peak_hours: z.array(z.number().min(0).max(23)).optional(),
    work_style: z.enum(['deep_focus', 'iterative', 'collaborative', 'exploratory']),
    typical_session_duration: z.number().positive().optional()
  })
});

// ============================================================================
// Project Context Schema
// ============================================================================

export const ProjectContextSchema = z.object({
  // Project identity
  overview: z.object({
    name: z.string(),
    type: z.string(),
    description: z.string().optional(),
    tech_stack: z.object({
      languages: z.array(z.string()),
      frameworks: z.array(z.string()).optional(),
      databases: z.array(z.string()).optional(),
      tools: z.array(z.string()).optional()
    })
  }),
  
  // Project health
  health: z.object({
    score: z.number().min(0).max(100),
    status: z.enum(['excellent', 'good', 'fair', 'needs_improvement']),
    indicators: z.array(z.string()),
    test_coverage: z.number().min(0).max(100).optional(),
    documentation_coverage: z.enum(['none', 'minimal', 'partial', 'good', 'comprehensive'])
  }),
  
  // Git status
  git_status: z.object({
    branch: z.string(),
    uncommitted_changes: z.number().int().min(0),
    behind_commits: z.number().int().min(0).optional(),
    ahead_commits: z.number().int().min(0).optional(),
    last_commit: z.object({
      hash: z.string(),
      message: z.string(),
      relative_time: z.string()
    }).optional()
  }),
  
  // Development context
  development: z.object({
    phase: z.enum([
      'planning',
      'active_development', 
      'feature_development',
      'refactoring',
      'testing',
      'stabilization',
      'maintenance'
    ]),
    velocity: z.enum(['slow', 'steady', 'fast', 'accelerating']),
    recent_focus: z.array(z.string()).max(5)
  })
});

// ============================================================================
// Work Context Schema
// ============================================================================

export const WorkContextSchema = z.object({
  // Current priorities
  priorities: z.array(z.object({
    description: z.string(),
    urgency: z.enum(['critical', 'high', 'medium', 'low']),
    type: z.enum(['bug', 'feature', 'refactor', 'documentation', 'investigation']),
    context: z.string().optional()
  })).max(5),
  
  // Development momentum
  momentum: z.object({
    status: z.enum(['building', 'steady', 'slowing', 'stalled']),
    score: z.number().min(0).max(10),
    indicators: z.array(z.string()),
    blockers: z.array(z.string()).optional()
  }),
  
  // Recent activity
  recent_activity: z.object({
    topics: z.array(z.string()).max(10),
    files_modified: z.number().int().min(0),
    active_areas: z.array(z.string()).max(5),
    last_activity: z.string().datetime()
  }),
  
  // Open threads
  open_threads: z.array(z.object({
    description: z.string(),
    priority: z.enum(['critical', 'high', 'medium', 'low']),
    age_hours: z.number().positive(),
    context: z.string().optional()
  })).optional()
});

// ============================================================================
// System Status Schema
// ============================================================================

export const SystemStatusSchema = z.object({
  // Memory system
  memory: z.object({
    total_memories: z.number().int().min(0),
    active_memories: z.number().int().min(0),
    memory_types: z.record(z.string(), z.number()),
    last_memory_stored: z.string().datetime().optional()
  }),
  
  // Conversation tracking
  conversations: z.object({
    total_sessions: z.number().int().min(0),
    total_messages: z.number().int().min(0),
    sessions_this_week: z.number().int().min(0),
    average_session_length: z.number().positive().optional()
  }),
  
  // Pattern evolution
  intelligence: z.object({
    patterns_learned: z.number().int().min(0),
    pattern_types: z.number().int().min(0),
    learning_velocity: z.number().min(0),
    last_evolution: z.string().datetime().optional()
  }),
  
  // System health
  health: z.object({
    status: z.enum(['healthy', 'degraded', 'critical']),
    issues: z.array(z.string()).optional(),
    uptime_hours: z.number().positive().optional()
  })
});

// ============================================================================
// Continuity Context Schema
// ============================================================================

export const ContinuityContextSchema = z.object({
  // Previous session
  previous_session: z.object({
    session_id: z.string().uuid(),
    ended_at: z.string().datetime(),
    duration_minutes: z.number().positive(),
    summary: z.string().max(500),
    key_outcomes: z.array(z.string()).max(3)
  }).optional(),
  
  // Handoff notes
  handoff: z.object({
    immediate_context: z.string().max(1000),
    active_task: z.string().optional(),
    key_decisions: z.array(z.object({
      decision: z.string(),
      rationale: z.string().optional()
    })).max(3),
    avoid_repeating: z.array(z.string()).optional()
  }).optional(),
  
  // Bridge quality
  continuity_strength: z.number().min(0).max(1)
});

// ============================================================================
// Philosophical Context Schema
// ============================================================================

export const PhilosophicalContextSchema = z.object({
  // Core principles
  foundations: z.array(z.object({
    principle: z.string(),
    description: z.string().optional(),
    source: z.enum(['core', 'learned', 'evolved']).optional()
  })).min(1).max(5),
  
  // Active patterns
  guiding_patterns: z.array(z.string()).max(3).optional()
});

// ============================================================================
// Quick Reference Schema
// ============================================================================

export const QuickReferenceSchema = z.object({
  // Essential commands
  commands: z.array(z.object({
    command: z.string(),
    description: z.string(),
    category: z.enum(['search', 'store', 'analyze', 'system'])
  })),
  
  // MCP functions
  mcp_available: z.boolean(),
  key_mcp_functions: z.array(z.string()).optional()
});

// ============================================================================
// Main Startup Context Schema
// ============================================================================

export const StartupContextSchema = z.object({
  // Identity
  context_id: z.string().uuid(),
  generated_at: z.string().datetime(),
  mira_version: z.string(),
  
  // Core contexts
  steward: StewardContextSchema,
  project: ProjectContextSchema,
  work: WorkContextSchema,
  system: SystemStatusSchema,
  
  // Optional contexts
  continuity: ContinuityContextSchema.optional(),
  philosophy: PhilosophicalContextSchema.optional(),
  quick_reference: QuickReferenceSchema,
  
  // Metadata
  metadata: z.object({
    generation_time_ms: z.number().int().positive(),
    included_sections: z.array(z.string()),
    context_quality: z.number().min(0).max(1),
    is_first_session: z.boolean()
  })
});

// ============================================================================
// Display Schemas
// ============================================================================

export const DisplayLineSchema = z.union([
  z.string(), // Simple text line
  z.object({  // Formatted line
    text: z.string(),
    style: z.enum(['normal', 'bold', 'dim', 'highlight']).optional(),
    indent: z.number().int().min(0).max(4).optional()
  })
]);

export const DisplaySectionSchema = z.object({
  // Section identity
  id: z.string(),
  title: z.string(),
  icon: z.string(),
  priority: z.number().int().min(1).max(10),
  
  // Content
  content: z.array(DisplayLineSchema),
  
  // Display control
  collapsed_by_default: z.boolean().default(false),
  show_in_minimal: z.boolean().default(true)
});

export const StartupDisplaySchema = z.object({
  // Display mode
  mode: z.enum(['full', 'standard', 'minimal', 'emergency']),
  
  // Sections to display
  sections: z.array(DisplaySectionSchema),
  
  // Formatting
  formatting: z.object({
    use_colors: z.boolean().default(true),
    use_emojis: z.boolean().default(true),
    max_width: z.number().int().positive().default(80),
    section_separator: z.string().default('─')
  }),
  
  // Performance
  render_time_ms: z.number().int().positive().optional()
});

// ============================================================================
// Customization Schema
// ============================================================================

export const StartupCustomizationSchema = z.object({
  // Identity
  steward_id: z.string().uuid(),
  
  // Section preferences
  section_preferences: z.record(
    z.string(), // section_id
    z.object({
      enabled: z.boolean(),
      priority_override: z.number().int().min(1).max(10).optional(),
      collapsed: z.boolean().optional()
    })
  ),
  
  // Content preferences
  content_preferences: z.object({
    show_philosophical_foundations: z.boolean().default(true),
    show_performance_metrics: z.boolean().default(false),
    show_technical_details: z.boolean().default(true),
    max_rules_displayed: z.number().int().positive().default(5),
    max_priorities_displayed: z.number().int().positive().default(5)
  }),
  
  // Display preferences
  display_preferences: z.object({
    preferred_mode: z.enum(['full', 'standard', 'minimal']).default('standard'),
    use_unicode: z.boolean().default(true),
    color_scheme: z.enum(['default', 'high_contrast', 'minimal']).default('default')
  }),
  
  // Custom sections
  custom_sections: z.array(z.object({
    id: z.string(),
    title: z.string(),
    content_template: z.string(), // Template with variables
    position: z.enum(['top', 'after_identity', 'before_reference', 'bottom'])
  })).optional()
});

// ============================================================================
// Performance Tracking Schema
// ============================================================================

export const StartupMetricsSchema = z.object({
  // Timing breakdown
  phase_timings: z.object({
    initialization_ms: z.number().int().positive(),
    steward_load_ms: z.number().int().positive(),
    project_analysis_ms: z.number().int().positive(),
    memory_load_ms: z.number().int().positive(),
    pattern_analysis_ms: z.number().int().positive(),
    render_ms: z.number().int().positive(),
    total_ms: z.number().int().positive()
  }),
  
  // Data sizes
  data_sizes: z.object({
    steward_data_kb: z.number().positive(),
    memory_count: z.number().int().min(0),
    pattern_count: z.number().int().min(0),
    conversation_count: z.number().int().min(0)
  }),
  
  // Performance indicators
  performance: z.object({
    cache_hit_rate: z.number().min(0).max(1),
    slow_operations: z.array(z.object({
      operation: z.string(),
      duration_ms: z.number().int().positive(),
      threshold_ms: z.number().int().positive()
    })).optional(),
    
    optimization_suggestions: z.array(z.string()).optional()
  }),
  
  // Historical tracking
  history: z.object({
    average_startup_ms: z.number().positive(),
    startup_count_today: z.number().int().min(0),
    performance_trend: z.enum(['improving', 'stable', 'degrading'])
  })
});

// ============================================================================
// Startup Options Schema
// ============================================================================

export const StartupOptionsSchema = z.object({
  steward_id: z.string().uuid().optional(),
  previous_session_id: z.string().uuid().optional(),
  mode: z.enum(['full', 'standard', 'minimal', 'emergency']).optional(),
  include_philosophy: z.boolean().optional(),
  include_performance: z.boolean().optional(),
  skip_heavy_operations: z.boolean().optional(),
  use_cache: z.boolean().default(true),
  timeout_ms: z.number().int().positive().optional()
});

// ============================================================================
// Type Exports
// ============================================================================

export type StewardContext = z.infer<typeof StewardContextSchema>;
export type ProjectContext = z.infer<typeof ProjectContextSchema>;
export type WorkContext = z.infer<typeof WorkContextSchema>;
export type SystemStatus = z.infer<typeof SystemStatusSchema>;
export type ContinuityContext = z.infer<typeof ContinuityContextSchema>;
export type PhilosophicalContext = z.infer<typeof PhilosophicalContextSchema>;
export type QuickReference = z.infer<typeof QuickReferenceSchema>;
export type StartupContext = z.infer<typeof StartupContextSchema>;

export type DisplayLine = z.infer<typeof DisplayLineSchema>;
export type DisplaySection = z.infer<typeof DisplaySectionSchema>;
export type StartupDisplay = z.infer<typeof StartupDisplaySchema>;

export type StartupCustomization = z.infer<typeof StartupCustomizationSchema>;
export type StartupMetrics = z.infer<typeof StartupMetricsSchema>;
export type StartupOptions = z.infer<typeof StartupOptionsSchema>;

// ============================================================================
// Schema Version Registry
// ============================================================================

export const CURRENT_SCHEMA_VERSION = '2.0';

export const StartupDetailsVersion = {
  version: CURRENT_SCHEMA_VERSION,
  schemas: {
    StartupContext: StartupContextSchema,
    StartupDisplay: StartupDisplaySchema,
    StartupCustomization: StartupCustomizationSchema,
    StartupMetrics: StartupMetricsSchema
  }
} as const;