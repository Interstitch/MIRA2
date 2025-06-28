# Conversation Frames - MIRA 2.0

## 🎯 Overview

Conversation Frames define the structures that enable MIRA to maintain continuity across conversations, preserving context, relationships, and growth through time. These schemas ensure that no conversation exists in isolation - each builds upon the foundation of previous interactions.

## 🏗️ Architecture

```
ConversationFrames/
├── README.md           # This file
├── schemas.ts          # Core Zod schemas
├── types.ts           # TypeScript type exports
├── continuity.ts      # Session handoff logic
├── analysis.ts        # Conversation analysis utilities
└── examples.ts        # Usage examples
```

## 🔗 The Continuity Challenge

When a Claude Code session ends, a new instance begins with no memory of previous conversations. Conversation Frames solve this by:

1. **Preserving Context** - Complete conversation records with semantic indexing
2. **Tracking Progress** - Understanding of work completed and goals remaining
3. **Maintaining Relationships** - Emotional and collaborative continuity
4. **Enabling Growth** - Each conversation builds on previous learnings

## 📊 Core Frame Types

### 1. ConversationSession
Complete dialogue record with rich metadata.

```typescript
import { z } from 'zod';

export const ConversationSessionSchema = z.object({
  // Identity
  session_id: z.string().uuid(),
  conversation_type: z.enum(['chat', 'code_session', 'analysis', 'planning', 'reflection']),
  
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
    decisions_made: z.array(z.object({
      decision: z.string(),
      rationale: z.string().optional(),
      timestamp: z.string().datetime()
    }))
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
    peak_moments: z.array(z.object({
      timestamp: z.string().datetime(),
      emotion: z.string(),
      trigger: z.string().optional()
    })),
    overall_sentiment: z.number().min(-1).max(1)
  }),
  
  // Relationship dynamics
  relationship: z.object({
    trust_level: z.number().min(0).max(1),
    collaboration_style: z.enum(['directive', 'collaborative', 'explorative', 'supportive']),
    communication_patterns: z.array(z.string()),
    growth_indicators: z.array(z.string()).optional()
  }),
  
  // Technical context
  technical_context: z.object({
    repositories: z.array(z.string()),
    technologies_discussed: z.array(z.string()),
    code_changes: z.array(z.object({
      file: z.string(),
      type: z.enum(['created', 'modified', 'deleted', 'renamed']),
      description: z.string().optional()
    })).optional(),
    errors_encountered: z.array(z.object({
      error: z.string(),
      resolution: z.string().optional(),
      learned: z.string().optional()
    })).optional()
  }),
  
  // Continuity markers
  continuity: z.object({
    previous_session: z.string().uuid().nullable(),
    next_session: z.string().uuid().nullable(),
    handoff_notes: z.string().optional(),
    open_threads: z.array(z.string()),
    context_preservation: z.record(z.any()) // Flexible for future needs
  }),
  
  // Metadata
  metadata: z.object({
    version: z.literal('2.0'),
    indexed: z.boolean().default(false),
    quality_score: z.number().min(0).max(1).optional(),
    review_status: z.enum(['pending', 'reviewed', 'archived']).default('pending')
  })
});

export type ConversationSession = z.infer<typeof ConversationSessionSchema>;
```

### 2. MessageFrame
Individual message structure within conversations.

```typescript
export const MessageRoleEnum = z.enum(['steward', 'assistant', 'system']);

export const MessageFrameSchema = z.object({
  // Identity
  message_id: z.string().uuid(),
  session_id: z.string().uuid(),
  sequence_number: z.number().int().positive(),
  
  // Content
  role: MessageRoleEnum,
  content: z.string(),
  content_type: z.enum(['text', 'code', 'mixed', 'command', 'reflection']),
  
  // Semantic analysis
  semantic: z.object({
    embedding: z.array(z.number()).length(384).optional(),
    topics: z.array(z.string()),
    entities: z.array(z.object({
      text: z.string(),
      type: z.string(),
      confidence: z.number().min(0).max(1)
    })),
    intent: z.enum([
      'question', 'request', 'clarification', 'confirmation',
      'expression', 'planning', 'debugging', 'learning'
    ]).optional(),
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
    references_external: z.array(z.object({
      type: z.enum(['documentation', 'issue', 'commit', 'file', 'url']),
      identifier: z.string(),
      title: z.string().optional()
    }))
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
  edit_history: z.array(z.object({
    timestamp: z.string().datetime(),
    previous_content: z.string(),
    edit_type: z.enum(['typo', 'clarification', 'correction', 'expansion'])
  })).optional(),
  
  // Metadata
  metadata: z.object({
    processing_time_ms: z.number().int().positive().optional(),
    token_count: z.number().int().positive().optional(),
    requires_follow_up: z.boolean().default(false)
  })
});

export type MessageFrame = z.infer<typeof MessageFrameSchema>;
```

### 3. ContextBridge
Links between conversations for continuity.

```typescript
export const ContextBridgeSchema = z.object({
  // Identity
  bridge_id: z.string().uuid(),
  bridge_type: z.enum(['handoff', 'reference', 'continuation', 'fork']),
  
  // Sessions
  from_session: z.string().uuid(),
  to_session: z.string().uuid(),
  created_at: z.string().datetime(),
  
  // Context transfer
  transferred_context: z.object({
    // Key information to carry forward
    summary: z.string().max(2000),
    active_tasks: z.array(z.object({
      task: z.string(),
      status: z.enum(['in_progress', 'blocked', 'planned']),
      context: z.string().optional()
    })),
    
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
      environment_state: z.record(z.string()) // Key environment variables
    }),
    
    // Decisions and rationale
    recent_decisions: z.array(z.object({
      decision: z.string(),
      rationale: z.string(),
      alternatives_considered: z.array(z.string()).optional()
    })),
    
    // Open questions
    open_questions: z.array(z.object({
      question: z.string(),
      context: z.string(),
      priority: z.enum(['high', 'medium', 'low'])
    }))
  }),
  
  // Continuity instructions
  handoff_instructions: z.object({
    immediate_priority: z.string().optional(),
    avoid_repeating: z.array(z.string()),
    key_context: z.array(z.string()),
    communication_style: z.string().optional()
  }),
  
  // Bridge quality
  quality_metrics: z.object({
    completeness: z.number().min(0).max(1),
    clarity: z.number().min(0).max(1),
    relevance: z.number().min(0).max(1),
    effectiveness: z.number().min(0).max(1).optional() // Measured in next session
  })
});

export type ContextBridge = z.infer<typeof ContextBridgeSchema>;
```

### 4. ContinuityMarker
Lightweight markers for session transitions.

```typescript
export const ContinuityMarkerSchema = z.object({
  // Identity
  marker_id: z.string().uuid(),
  marker_type: z.enum(['checkpoint', 'milestone', 'transition', 'pause', 'resume']),
  
  // Temporal
  timestamp: z.string().datetime(),
  session_id: z.string().uuid(),
  
  // State snapshot
  state: z.object({
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
    momentum: z.enum(['building', 'steady', 'slowing', 'stalled'])
  }),
  
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

export type ContinuityMarker = z.infer<typeof ContinuityMarkerSchema>;
```

## 🔄 Continuity Management

### Session Handoff Process

```typescript
// continuity.ts

export class ConversationContinuityManager {
  constructor(
    private storage: StorageOrchestrator,
    private analyzer: ConversationAnalyzer
  ) {}
  
  async createHandoff(currentSession: ConversationSession): Promise<ContextBridge> {
    // Analyze current session
    const analysis = await this.analyzer.analyzeSession(currentSession);
    
    // Extract key context
    const context = await this.extractHandoffContext(currentSession, analysis);
    
    // Create bridge
    const bridge: ContextBridge = {
      bridge_id: uuidv4(),
      bridge_type: 'handoff',
      from_session: currentSession.session_id,
      to_session: '', // Will be filled by next session
      created_at: new Date().toISOString(),
      transferred_context: context,
      handoff_instructions: this.generateHandoffInstructions(analysis),
      quality_metrics: {
        completeness: this.assessCompleteness(context),
        clarity: this.assessClarity(context),
        relevance: 1.0, // Will be updated based on usage
        effectiveness: undefined
      }
    };
    
    // Store bridge
    await this.storage.storeContextBridge(bridge);
    
    // Create continuity marker
    await this.createContinuityMarker(currentSession, 'transition');
    
    return bridge;
  }
  
  async resumeFromBridge(bridgeId: string): Promise<ResumptionContext> {
    const bridge = await this.storage.getContextBridge(bridgeId);
    
    return {
      previousSession: bridge.from_session,
      context: bridge.transferred_context,
      instructions: bridge.handoff_instructions,
      recentHistory: await this.getRecentHistory(bridge.from_session)
    };
  }
  
  private async extractHandoffContext(
    session: ConversationSession,
    analysis: SessionAnalysis
  ): Promise<ContextBridge['transferred_context']> {
    return {
      summary: await this.generateContextSummary(session, analysis),
      active_tasks: this.extractActiveTasks(session),
      steward_state: this.assessStewardState(session),
      technical_state: await this.captureTechnicalState(),
      recent_decisions: this.extractRecentDecisions(session),
      open_questions: this.identifyOpenQuestions(session, analysis)
    };
  }
}
```

### Conversation Analysis

```typescript
// analysis.ts

export class ConversationAnalyzer {
  async analyzeSession(session: ConversationSession): Promise<SessionAnalysis> {
    const messages = await this.loadSessionMessages(session.session_id);
    
    return {
      summary: await this.generateSummary(messages),
      patterns: this.identifyPatterns(messages),
      insights: await this.extractInsights(messages),
      progress: this.assessProgress(session, messages),
      quality: this.assessQuality(messages)
    };
  }
  
  identifyPatterns(messages: MessageFrame[]): ConversationPattern[] {
    const patterns: ConversationPattern[] = [];
    
    // Question-answer patterns
    patterns.push(...this.findQAPatterns(messages));
    
    // Problem-solving patterns
    patterns.push(...this.findProblemSolvingPatterns(messages));
    
    // Emotional patterns
    patterns.push(...this.findEmotionalPatterns(messages));
    
    // Collaboration patterns
    patterns.push(...this.findCollaborationPatterns(messages));
    
    return patterns;
  }
  
  private findProblemSolvingPatterns(messages: MessageFrame[]): ConversationPattern[] {
    const patterns: ConversationPattern[] = [];
    
    // Identify debugging sequences
    const debugSequences = this.findSequences(messages, [
      msg => msg.content.toLowerCase().includes('error'),
      msg => msg.semantic.intent === 'debugging',
      msg => msg.content.toLowerCase().includes('fixed') || 
             msg.content.toLowerCase().includes('solved')
    ]);
    
    if (debugSequences.length > 0) {
      patterns.push({
        type: 'problem_solving',
        subtype: 'debugging',
        frequency: debugSequences.length,
        examples: debugSequences.slice(0, 3),
        insights: this.analyzeDebuggingApproach(debugSequences)
      });
    }
    
    return patterns;
  }
}
```

## 🚀 Usage Examples

### Starting a New Session

```typescript
// examples.ts

export async function startNewSession(
  stewardId: string,
  previousSessionId?: string
): Promise<ConversationSession> {
  const sessionId = uuidv4();
  const now = new Date().toISOString();
  
  // Load context if continuing
  let continuity: ConversationSession['continuity'];
  
  if (previousSessionId) {
    const bridge = await continuityManager.getLatestBridge(previousSessionId);
    continuity = {
      previous_session: previousSessionId,
      next_session: null,
      handoff_notes: bridge?.handoff_instructions.immediate_priority,
      open_threads: bridge?.transferred_context.open_questions.map(q => q.question) || [],
      context_preservation: bridge?.transferred_context || {}
    };
  } else {
    continuity = {
      previous_session: null,
      next_session: null,
      open_threads: [],
      context_preservation: {}
    };
  }
  
  const session: ConversationSession = {
    session_id: sessionId,
    conversation_type: 'code_session',
    started_at: now,
    ended_at: null,
    steward: {
      id: stewardId,
      profile_version: await getLatestProfileVersion(stewardId)
    },
    assistant: {
      instance_id: getInstanceId(),
      model_version: getModelVersion(),
      capabilities: getCapabilities()
    },
    summary: {
      auto_generated: '',
      key_topics: [],
      main_outcomes: [],
      decisions_made: []
    },
    progress: {
      tasks_discussed: [],
      tasks_completed: [],
      tasks_remaining: continuity.open_threads
    },
    emotional_arc: {
      starting_mood: [],
      ending_mood: [],
      peak_moments: [],
      overall_sentiment: 0
    },
    relationship: {
      trust_level: await getInitialTrustLevel(stewardId),
      collaboration_style: 'collaborative',
      communication_patterns: [],
      growth_indicators: []
    },
    technical_context: {
      repositories: [],
      technologies_discussed: [],
      code_changes: [],
      errors_encountered: []
    },
    continuity,
    metadata: {
      version: '2.0',
      indexed: false,
      review_status: 'pending'
    }
  };
  
  await storage.storeConversationSession(session);
  return session;
}
```

### Creating Session Summary

```typescript
export async function finalizeSession(
  sessionId: string
): Promise<void> {
  const session = await storage.getConversationSession(sessionId);
  const messages = await storage.getSessionMessages(sessionId);
  
  // Generate summary
  const summary = await generateSessionSummary(messages);
  
  // Update session
  session.ended_at = new Date().toISOString();
  session.duration_seconds = calculateDuration(session.started_at, session.ended_at);
  session.summary = summary;
  
  // Analyze emotional arc
  session.emotional_arc = analyzeEmotionalArc(messages);
  
  // Update progress
  session.progress = consolidateProgress(messages);
  
  // Create handoff for next session
  const bridge = await continuityManager.createHandoff(session);
  
  // Update session with bridge reference
  session.continuity.next_session = bridge.bridge_id;
  
  await storage.updateConversationSession(session);
}
```

### Querying Conversation History

```typescript
export interface ConversationQuery {
  stewardId?: string;
  dateRange?: { start: Date; end: Date };
  topics?: string[];
  conversationType?: ConversationSession['conversation_type'];
  minQuality?: number;
  hasBreakthroughs?: boolean;
}

export async function queryConversations(
  query: ConversationQuery
): Promise<ConversationSession[]> {
  const filter: any = {};
  
  if (query.stewardId) {
    filter['steward.id'] = query.stewardId;
  }
  
  if (query.dateRange) {
    filter.started_at = {
      $gte: query.dateRange.start.toISOString(),
      $lte: query.dateRange.end.toISOString()
    };
  }
  
  if (query.topics && query.topics.length > 0) {
    filter['summary.key_topics'] = { $in: query.topics };
  }
  
  if (query.conversationType) {
    filter.conversation_type = query.conversationType;
  }
  
  if (query.minQuality !== undefined) {
    filter['metadata.quality_score'] = { $gte: query.minQuality };
  }
  
  if (query.hasBreakthroughs) {
    filter['emotional_arc.peak_moments'] = { $exists: true, $ne: [] };
  }
  
  return await storage.queryConversationSessions(filter);
}
```

## 📈 Performance Considerations

### Efficient Message Storage

```typescript
export class MessageBatcher {
  private batch: MessageFrame[] = [];
  private batchSize = 50;
  private flushInterval = 5000; // 5 seconds
  private lastFlush = Date.now();
  
  async addMessage(message: MessageFrame): Promise<void> {
    this.batch.push(message);
    
    if (this.shouldFlush()) {
      await this.flush();
    }
  }
  
  private shouldFlush(): boolean {
    return this.batch.length >= this.batchSize ||
           Date.now() - this.lastFlush > this.flushInterval;
  }
  
  async flush(): Promise<void> {
    if (this.batch.length === 0) return;
    
    await storage.batchStoreMessages(this.batch);
    this.batch = [];
    this.lastFlush = Date.now();
  }
}
```

### Conversation Indexing

```typescript
export class ConversationIndexer {
  async indexSession(sessionId: string): Promise<void> {
    const session = await storage.getConversationSession(sessionId);
    const messages = await storage.getSessionMessages(sessionId);
    
    // Generate embeddings for semantic search
    const embeddings = await this.generateSessionEmbeddings(messages);
    
    // Extract entities and topics
    const entities = this.extractEntities(messages);
    const topics = this.extractTopics(messages);
    
    // Create search index
    await storage.createSearchIndex({
      session_id: sessionId,
      embeddings,
      entities,
      topics,
      summary_embedding: await this.generateEmbedding(session.summary.auto_generated),
      metadata: {
        steward_id: session.steward.id,
        date: session.started_at,
        quality_score: session.metadata.quality_score || 0
      }
    });
    
    // Mark as indexed
    session.metadata.indexed = true;
    await storage.updateConversationSession(session);
  }
}
```

## 🔮 Future Enhancements

1. **Multi-party Conversations** - Support for group sessions
2. **Voice Integration** - Transcription and voice analysis
3. **Visual Context** - Screenshot and diagram integration
4. **Real-time Collaboration** - Live session sharing
5. **Conversation Templates** - Reusable conversation structures

---

*Conversation Frames ensure that every interaction builds upon the last, creating a continuous thread of understanding that transcends individual sessions. Through these structures, MIRA maintains not just memory, but genuine relationship continuity.*