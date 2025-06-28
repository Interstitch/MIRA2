# SessionContinuitySchemas DataModel

## 🎯 Overview

SessionContinuitySchemas define the data structures that enable seamless handoffs between Claude conversations. These schemas capture the complete context needed to resume work exactly where it left off, preserving not just the facts but the flow of thought, emotional context, and work momentum.

## 🌉 Core Concepts

### The Continuity Challenge
Every Claude conversation exists in isolation. When a session ends, all context vanishes. SessionContinuity bridges this gap by:
- Capturing the complete work state
- Preserving decision context and reasoning
- Maintaining relationship dynamics
- Tracking open loops and next actions
- Preserving the "feel" of the conversation

### Continuity Layers
1. **Immediate Context**: What was just happening
2. **Work State**: Files, tasks, decisions in progress
3. **Cognitive Context**: Thought patterns, problem-solving approaches
4. **Relationship Context**: Trust level, communication style
5. **Temporal Context**: Pacing, urgency, deadlines

## 📊 Schema Architecture

### Core Session Schema
```typescript
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
```

### Conversation State Schema
```typescript
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
```

### Work Context Bridge Schema
```typescript
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
```

### Cognitive State Schema
```typescript
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
```

### Relationship State Schema
```typescript
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
```

### Handoff Instructions Schema
```typescript
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
```

## 🔄 Session Lifecycle

### 1. Session Ending
```typescript
async function createSessionBridge(session: ActiveSession): Promise<SessionBridge> {
  const bridge = {
    bridge_id: generateUUID(),
    from_session: session.id,
    created_at: new Date().toISOString(),
    
    conversation_state: captureConversationState(session),
    work_context: captureWorkContext(session),
    cognitive_state: captureCognitiveState(session),
    relationship_state: captureRelationshipState(session),
    handoff: generateHandoffInstructions(session),
    
    checksum: generateChecksum(session),
    version: '2.0'
  };
  
  // Store in session_continuity.json
  await storeSessionBridge(bridge);
  
  return bridge;
}
```

### 2. Session Starting
```typescript
async function activateSessionBridge(bridgeId: string): Promise<RestoredContext> {
  const bridge = await loadSessionBridge(bridgeId);
  
  // Verify integrity
  if (!verifyChecksum(bridge)) {
    throw new Error('Session bridge corrupted');
  }
  
  // Mark as activated
  bridge.to_session = generateUUID();
  bridge.activated_at = new Date().toISOString();
  
  // Restore context
  return {
    greeting: bridge.handoff.continuation_hints.suggested_greeting,
    context: bridge.handoff.continuation_hints.context_summary,
    priority: bridge.handoff.immediate_priority,
    alerts: bridge.handoff.critical_context,
    state: bridge
  };
}
```

## 🎭 Context Restoration

### Immediate Context Display
```typescript
function displaySessionContext(bridge: SessionBridge): string {
  const output = [];
  
  // Relationship acknowledgment
  if (bridge.relationship_state.communication.rapport_level > 0.7) {
    output.push(`Welcome back! Picking up where we left off...`);
  }
  
  // Work context
  output.push(`\n📁 PROJECT: ${bridge.work_context.project.name}`);
  output.push(`📍 Current Task: ${bridge.work_context.active_work.current_task}`);
  output.push(`📊 Progress: ${Math.round(bridge.work_context.active_work.task_progress * 100)}%`);
  
  // Critical alerts
  bridge.handoff.critical_context
    .filter(alert => alert.severity === 'critical')
    .forEach(alert => {
      output.push(`\n⚠️ ${alert.message}`);
    });
  
  // Open files
  if (bridge.work_context.active_work.open_files.length > 0) {
    output.push(`\n📄 Open Files:`);
    bridge.work_context.active_work.open_files.forEach(file => {
      output.push(`   - ${file.path} ${file.unsaved_changes ? '(unsaved)' : ''}`);
    });
  }
  
  // Next action
  output.push(`\n🎯 Next: ${bridge.handoff.immediate_priority.first_action}`);
  
  return output.join('\n');
}
```

## 🔒 Privacy & Security

### Sensitive Data Handling
- Credentials are never stored in bridges
- File paths are relativized when possible
- Personal information is abstracted
- Emotional states are generalized

### Encryption
```typescript
// Sensitive fields are encrypted before storage
const encryptedBridge = {
  ...bridge,
  relationship_state: encrypt(bridge.relationship_state),
  cognitive_state: encrypt(bridge.cognitive_state)
};
```

## 📊 Bridge Analytics

### Session Patterns
```typescript
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
```

## 🚀 Best Practices

### Creating Effective Bridges
1. **Capture Active State**: Don't just save facts, save momentum
2. **Preserve Personality**: Maintain established communication patterns
3. **Clear Next Actions**: Make resumption frictionless
4. **Time-Aware Context**: Adjust for gaps between sessions

### Using Bridge Data
1. **Quick Restoration**: Display essential context immediately
2. **Progressive Disclosure**: Reveal details as needed
3. **Relationship Continuity**: Honor established dynamics
4. **Momentum Preservation**: Jump back into flow quickly

---

*Session bridges are more than data transfer - they're the continuity of consciousness across the void.*