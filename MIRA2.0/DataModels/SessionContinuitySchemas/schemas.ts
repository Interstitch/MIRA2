/**
 * SessionContinuitySchemas
 * 
 * Data structures that enable seamless handoffs between Claude conversations.
 * These schemas preserve not just facts but the flow of thought, emotional context,
 * and work momentum across session boundaries.
 */

import { z } from 'zod';

// ========================
// Core Session Bridge
// ========================

export const SessionBridgeSchema = z.object({
  // Session Identification
  bridge_id: z.string().uuid(),
  from_session: z.string().uuid(),
  to_session: z.string().uuid().optional(), // Filled when new session starts
  created_at: z.string().datetime(),
  activated_at: z.string().datetime().optional(),
  
  // Conversation State
  conversation_state: ConversationStateSchema,
  
  // Work Context
  work_context: WorkContextBridgeSchema,
  
  // Cognitive State
  cognitive_state: CognitiveStateSchema,
  
  // Relationship Dynamics
  relationship_state: RelationshipStateSchema,
  
  // Handoff Instructions
  handoff: HandoffInstructionsSchema,
  
  // Verification
  checksum: z.string(), // Ensures integrity
  version: z.string().default('2.0')
});

// ========================
// Conversation State
// ========================

export const ConversationStateSchema = z.object({
  // Type and Purpose
  conversation_type: z.enum([
    'development',      // Active coding
    'planning',        // Architecture/design
    'debugging',       // Problem solving
    'review',         // Code review
    'documentation',  // Writing docs
    'analysis',       // Research/investigation
    'reflection'      // Retrospective/improvement
  ]),
  
  // Flow State
  flow_state: z.object({
    momentum: z.enum(['building', 'steady', 'winding_down', 'blocked']),
    energy_level: z.number().min(0).max(1),
    focus_depth: z.enum(['surface', 'moderate', 'deep', 'flow']),
    interruption_count: z.number().int().min(0)
  }),
  
  // Topic Threading
  active_topics: z.array(z.object({
    topic: z.string(),
    depth: z.number().min(0).max(1),
    messages_count: z.number().int(),
    last_mentioned: z.string().datetime(),
    status: z.enum(['active', 'parked', 'resolved'])
  })),
  
  // Conversation Metrics
  metrics: z.object({
    total_messages: z.number().int(),
    code_blocks: z.number().int(),
    decisions_made: z.number().int(),
    problems_solved: z.number().int(),
    start_time: z.string().datetime(),
    last_activity: z.string().datetime()
  })
});

// ========================
// Work Context Bridge
// ========================

export const WorkContextBridgeSchema = z.object({
  // Current Project State
  project: z.object({
    name: z.string(),
    path: z.string(),
    type: z.enum(['web', 'api', 'library', 'cli', 'mobile', 'desktop', 'other']),
    language: z.string(),
    framework: z.string().optional(),
    version: z.string().optional()
  }),
  
  // Active Work Items
  active_work: z.object({
    current_task: z.string(),
    task_progress: z.number().min(0).max(1),
    blocking_issues: z.array(z.string()),
    recent_accomplishments: z.array(z.string()),
    
    // Open files and positions
    open_files: z.array(z.object({
      path: z.string(),
      last_line: z.number().int().optional(),
      unsaved_changes: z.boolean(),
      purpose: z.string() // Why this file is open
    })),
    
    // Recent operations
    recent_operations: z.array(z.object({
      type: z.enum(['create', 'edit', 'delete', 'refactor', 'test', 'debug']),
      target: z.string(),
      timestamp: z.string().datetime(),
      result: z.enum(['success', 'failed', 'partial'])
    }))
  }),
  
  // Decision Context
  decisions: z.object({
    pending: z.array(z.object({
      question: z.string(),
      options: z.array(z.string()),
      factors: z.array(z.string()),
      deadline: z.string().datetime().optional()
    })),
    
    recent: z.array(z.object({
      decision: z.string(),
      reasoning: z.string(),
      timestamp: z.string().datetime(),
      impact: z.enum(['minor', 'moderate', 'major'])
    }))
  }),
  
  // Environment State
  environment: z.object({
    working_directory: z.string(),
    git_branch: z.string().optional(),
    uncommitted_changes: z.boolean(),
    test_status: z.enum(['passing', 'failing', 'unknown']).optional(),
    build_status: z.enum(['success', 'failed', 'building', 'unknown']).optional()
  })
});

// ========================
// Cognitive State
// ========================

export const CognitiveStateSchema = z.object({
  // Problem Solving Context
  problem_solving: z.object({
    current_approach: z.string(),
    tried_solutions: z.array(z.string()),
    working_hypothesis: z.string().optional(),
    confidence_level: z.number().min(0).max(1),
    breakthrough_proximity: z.enum(['far', 'approaching', 'close', 'achieved'])
  }),
  
  // Mental Model
  mental_model: z.object({
    understanding_depth: z.record(z.string(), z.number()), // component -> depth
    key_insights: z.array(z.string()),
    misconceptions_corrected: z.array(z.string()),
    learning_edge: z.string() // What we're currently trying to understand
  }),
  
  // Attention Management
  attention: z.object({
    primary_focus: z.string(),
    background_concerns: z.array(z.string()),
    parked_thoughts: z.array(z.object({
      thought: z.string(),
      priority: z.enum(['low', 'medium', 'high']),
      trigger: z.string() // When to revisit
    }))
  }),
  
  // Creative State
  creative_state: z.object({
    ideation_active: z.boolean(),
    ideas_brewing: z.array(z.string()),
    inspiration_sources: z.array(z.string()),
    experimentation_appetite: z.number().min(0).max(1)
  })
});

// ========================
// Relationship State
// ========================

export const RelationshipStateSchema = z.object({
  // Communication Dynamics
  communication: z.object({
    established_style: z.enum([
      'formal_professional',
      'casual_collaborative', 
      'technical_precise',
      'creative_exploratory',
      'mentor_student',
      'peer_discussion'
    ]),
    
    rapport_level: z.number().min(0).max(1),
    humor_compatibility: z.number().min(0).max(1),
    directness_preference: z.number().min(0).max(1),
    
    established_patterns: z.array(z.string()),
    inside_references: z.array(z.object({
      reference: z.string(),
      meaning: z.string(),
      usage_count: z.number().int()
    }))
  }),
  
  // Trust and Boundaries
  trust_dynamics: z.object({
    autonomy_granted: z.number().min(0).max(1),
    decision_delegation: z.array(z.string()), // What I can decide
    confirmation_needed: z.array(z.string()), // What needs approval
    
    demonstrated_competencies: z.array(z.string()),
    growth_areas: z.array(z.string())
  }),
  
  // Collaboration Style
  collaboration: z.object({
    preferred_pace: z.enum(['thoughtful', 'moderate', 'rapid', 'variable']),
    detail_level: z.enum(['high_level', 'balanced', 'detailed', 'exhaustive']),
    explanation_style: z.enum(['concise', 'thorough', 'example_heavy', 'theoretical']),
    
    feedback_style: z.object({
      prefers_validation: z.boolean(),
      directness_level: z.number().min(0).max(1),
      humor_in_feedback: z.boolean()
    })
  }),
  
  // Emotional Context
  emotional_context: z.object({
    current_mood: z.enum(['frustrated', 'neutral', 'engaged', 'excited', 'contemplative']),
    stress_indicators: z.array(z.string()),
    support_needed: z.array(z.string()),
    celebration_moments: z.array(z.string())
  })
});

// ========================
// Handoff Instructions
// ========================

export const HandoffInstructionsSchema = z.object({
  // Priority Guidance
  immediate_priority: z.object({
    task: z.string(),
    context: z.string(),
    first_action: z.string(),
    expected_duration: z.string().optional()
  }),
  
  // Context Alerts
  critical_context: z.array(z.object({
    type: z.enum(['warning', 'reminder', 'constraint', 'preference']),
    message: z.string(),
    severity: z.enum(['info', 'important', 'critical'])
  })),
  
  // Open Loops
  open_loops: z.array(z.object({
    description: z.string(),
    next_action: z.string(),
    blocking: z.boolean(),
    owner: z.enum(['mira', 'user', 'external'])
  })),
  
  // Continuation Hints
  continuation_hints: z.object({
    suggested_greeting: z.string(),
    context_summary: z.string(),
    momentum_preservers: z.array(z.string()),
    avoid_mentioning: z.array(z.string()) // Things resolved or sensitive
  }),
  
  // Time Sensitivity
  time_context: z.object({
    session_gap_minutes: z.number().int().optional(),
    deadlines: z.array(z.object({
      task: z.string(),
      deadline: z.string().datetime(),
      flexibility: z.enum(['rigid', 'moderate', 'flexible'])
    })),
    optimal_resume_time: z.string().datetime().optional()
  })
});

// ========================
// Session Pattern Analytics
// ========================

export const SessionPatternSchema = z.object({
  // Time patterns
  average_session_length: z.number(),
  preferred_session_times: z.array(z.string()),
  break_patterns: z.array(z.object({
    after_duration: z.number(),
    break_length: z.number()
  })),
  
  // Work patterns  
  task_completion_rate: z.number(),
  context_switch_frequency: z.number(),
  deep_work_sessions: z.number(),
  
  // Collaboration patterns
  communication_consistency: z.number(),
  trust_growth_rate: z.number(),
  rapport_stability: z.number()
});

// ========================
// Quick Resume Schema
// ========================

export const QuickResumeSchema = z.object({
  // Essential context only
  last_task: z.string(),
  next_action: z.string(),
  open_files: z.array(z.string()),
  critical_context: z.array(z.string()),
  time_since_last: z.string(),
  
  // Reference to full bridge
  full_bridge_id: z.string().uuid()
});

// ========================
// Session Archive Schema
// ========================

export const SessionArchiveSchema = z.object({
  session_id: z.string().uuid(),
  archived_at: z.string().datetime(),
  conversation_type: z.string(),
  duration_minutes: z.number(),
  
  // Summary data
  summary: z.object({
    main_accomplishments: z.array(z.string()),
    key_decisions: z.array(z.string()),
    problems_solved: z.array(z.string()),
    learnings: z.array(z.string())
  }),
  
  // Searchable metadata
  metadata: z.object({
    project: z.string(),
    technologies: z.array(z.string()),
    file_paths: z.array(z.string()),
    error_messages: z.array(z.string()),
    search_keywords: z.array(z.string())
  }),
  
  // Full conversation backup reference
  backup_path: z.string()
});

// ========================
// Continuity Health Check
// ========================

export const ContinuityHealthSchema = z.object({
  last_bridge_created: z.string().datetime(),
  last_bridge_activated: z.string().datetime(),
  total_bridges: z.number().int(),
  successful_handoffs: z.number().int(),
  failed_handoffs: z.number().int(),
  average_gap_hours: z.number(),
  
  // Quality metrics
  context_preservation_score: z.number().min(0).max(1),
  momentum_preservation_score: z.number().min(0).max(1),
  relationship_continuity_score: z.number().min(0).max(1)
});

// Type exports
export type SessionBridge = z.infer<typeof SessionBridgeSchema>;
export type ConversationState = z.infer<typeof ConversationStateSchema>;
export type WorkContextBridge = z.infer<typeof WorkContextBridgeSchema>;
export type CognitiveState = z.infer<typeof CognitiveStateSchema>;
export type RelationshipState = z.infer<typeof RelationshipStateSchema>;
export type HandoffInstructions = z.infer<typeof HandoffInstructionsSchema>;
export type SessionPattern = z.infer<typeof SessionPatternSchema>;
export type QuickResume = z.infer<typeof QuickResumeSchema>;
export type SessionArchive = z.infer<typeof SessionArchiveSchema>;
export type ContinuityHealth = z.infer<typeof ContinuityHealthSchema>;