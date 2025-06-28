# Startup Details - MIRA 2.0

## 🎯 Overview

Startup Details define the comprehensive context that MIRA presents when a new Claude session begins. This is the critical handoff moment where a new Claude instance receives full awareness of the steward, project state, work context, and continuity from previous sessions. These schemas ensure no context is lost between conversations.

## 🏗️ Architecture

```
StartupDetails/
├── README.md           # This file
├── schemas.ts          # Core Zod schemas
├── types.ts           # TypeScript type exports
├── builders.ts        # Startup context builders
├── renderers.ts       # Output formatting
└── examples.ts        # Usage examples
```

## 🔗 Integration Points

StartupDetails connect multiple MIRA systems:
- [StewardProfile](../StewardProfileSchemas/) - Identity and preferences
- [ConversationFrames](../ConversationFrames/) - Session continuity
- [MemorySchemas](../MemorySchemas/) - Recent memories and insights
- [PatternEvolutionModels](../PatternEvolutionModels/) - Learned patterns

## 📊 Core Schema Types

### 1. StartupContext
The complete startup package for a new session.

```typescript
import { z } from 'zod';

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

export type StartupContext = z.infer<typeof StartupContextSchema>;
```

### 2. StartupDisplay
How startup information is formatted for display.

```typescript
export const DisplaySectionSchema = z.object({
  // Section identity
  id: z.string(),
  title: z.string(),
  icon: z.string(),
  priority: z.number().int().min(1).max(10),
  
  // Content
  content: z.array(z.union([
    z.string(), // Simple text line
    z.object({  // Formatted line
      text: z.string(),
      style: z.enum(['normal', 'bold', 'dim', 'highlight']).optional(),
      indent: z.number().int().min(0).max(4).optional()
    })
  ])),
  
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

export type StartupDisplay = z.infer<typeof StartupDisplaySchema>;
```

### 3. StartupCustomization
Per-steward startup preferences.

```typescript
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

export type StartupCustomization = z.infer<typeof StartupCustomizationSchema>;
```

### 4. StartupPerformance
Tracking startup performance and optimization.

```typescript
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

export type StartupMetrics = z.infer<typeof StartupMetricsSchema>;
```

## 🔄 Startup Building Process

### Context Assembly

```typescript
// builders.ts

export class StartupContextBuilder {
  constructor(
    private stewardProfile: StewardProfileService,
    private memoryManager: MemoryManager,
    private projectAnalyzer: ProjectAnalyzer,
    private workContext: WorkContextService
  ) {}
  
  async buildStartupContext(
    options: StartupOptions = {}
  ): Promise<StartupContext> {
    const contextId = uuidv4();
    const startTime = Date.now();
    
    // Parallel load all context
    const [steward, project, work, system] = await Promise.all([
      this.loadStewardContext(options.stewardId),
      this.loadProjectContext(),
      this.loadWorkContext(),
      this.loadSystemStatus()
    ]);
    
    // Load continuity if not first session
    const continuity = await this.loadContinuityContext(options.previousSessionId);
    
    // Load philosophical foundations
    const philosophy = await this.loadPhilosophicalContext();
    
    // Build quick reference
    const quickReference = this.buildQuickReference();
    
    return {
      context_id: contextId,
      generated_at: new Date().toISOString(),
      mira_version: getMiraVersion(),
      steward,
      project,
      work,
      system,
      continuity,
      philosophy,
      quick_reference: quickReference,
      metadata: {
        generation_time_ms: Date.now() - startTime,
        included_sections: this.getIncludedSections(options),
        context_quality: this.assessContextQuality({ steward, project, work, system }),
        is_first_session: !options.previousSessionId
      }
    };
  }
  
  private async loadStewardContext(stewardId?: string): Promise<StewardContext> {
    const profile = await this.stewardProfile.getProfile(stewardId);
    const messages = await this.stewardProfile.getHighPriorityMessages();
    
    return {
      identity: {
        name: profile.identity.name.preferred,
        pronouns: profile.identity.pronouns?.subject,
        timezone: profile.identity.system_identifiers.timezone,
        profile_version: profile.profile_metadata.version
      },
      relationship: {
        trust_level: profile.relationship_metrics.trust.current_level,
        collaboration_style: profile.behavioral_profile.working_style.collaboration_preference,
        rapport_level: this.calculateRapportLevel(profile),
        total_sessions: profile.relationship_metrics.metadata.total_interaction_hours,
        total_hours: profile.relationship_metrics.metadata.total_interaction_hours
      },
      preferences: {
        high_priority_rules: messages.filter(m => m.priority >= 7).slice(0, 5),
        communication_style: profile.behavioral_profile.communication_style.preferences,
        technical_preferences: this.extractTechnicalPreferences(profile)
      },
      work_patterns: this.extractWorkPatterns(profile)
    };
  }
}
```

### Display Rendering

```typescript
// renderers.ts

export class StartupRenderer {
  render(
    context: StartupContext,
    customization?: StartupCustomization
  ): string {
    const display = this.buildDisplay(context, customization);
    const sections = this.orderSections(display.sections, customization);
    
    const lines: string[] = [];
    
    // Render header
    if (display.mode !== 'minimal') {
      lines.push(this.renderHeader());
    }
    
    // Render sections
    for (const section of sections) {
      if (this.shouldRenderSection(section, display.mode)) {
        lines.push(...this.renderSection(section, display.formatting));
      }
    }
    
    // Render footer
    if (display.mode === 'full') {
      lines.push(...this.renderFooter(context));
    }
    
    return lines.join('\n');
  }
  
  private renderSection(
    section: DisplaySection,
    formatting: StartupDisplay['formatting']
  ): string[] {
    const lines: string[] = [];
    
    // Section header
    lines.push('');
    lines.push(`${section.icon} ${section.title.toUpperCase()}`);
    if (formatting.section_separator) {
      lines.push(formatting.section_separator.repeat(formatting.max_width));
    }
    
    // Section content
    for (const item of section.content) {
      if (typeof item === 'string') {
        lines.push(item);
      } else {
        const indent = ' '.repeat(item.indent || 0);
        const styled = this.applyStyle(item.text, item.style);
        lines.push(indent + styled);
      }
    }
    
    return lines;
  }
}
```

## 🚀 Usage Examples

### Basic Startup

```typescript
// examples.ts

export async function generateStartup(): Promise<string> {
  const builder = new StartupContextBuilder(
    stewardProfile,
    memoryManager,
    projectAnalyzer,
    workContext
  );
  
  const context = await builder.buildStartupContext({
    stewardId: getCurrentStewardId(),
    previousSessionId: getPreviousSessionId()
  });
  
  const renderer = new StartupRenderer();
  return renderer.render(context);
}
```

### Customized Startup

```typescript
export async function generateCustomStartup(
  stewardId: string
): Promise<string> {
  // Load steward's customization
  const customization = await loadStartupCustomization(stewardId);
  
  // Build context with options
  const context = await builder.buildStartupContext({
    stewardId,
    includePhilosophy: customization.content_preferences.show_philosophical_foundations,
    includePerformance: customization.content_preferences.show_performance_metrics
  });
  
  // Render with customization
  return renderer.render(context, customization);
}
```

### Emergency Startup

```typescript
export async function generateEmergencyStartup(): Promise<string> {
  // Minimal context for fast startup
  try {
    const context = await builder.buildStartupContext({
      mode: 'emergency',
      skipHeavyOperations: true
    });
    
    return renderer.render(context);
  } catch (error) {
    // Fallback to static emergency context
    return `
🚨 MIRA Emergency Startup
========================
Failed to load full context. Basic information:
- Working directory: ${process.cwd()}
- MIRA available at: mira --help
- Check system health: mira health
`;
  }
}
```

## 📈 Performance Optimization

### Startup Caching

```typescript
export class StartupCache {
  private cache: Map<string, CachedStartup> = new Map();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes
  
  async getCachedOrBuild(
    stewardId: string,
    builder: StartupContextBuilder
  ): Promise<StartupContext> {
    const cached = this.cache.get(stewardId);
    
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      // Update only dynamic fields
      const updates = await builder.buildDynamicUpdates();
      return this.mergeUpdates(cached.context, updates);
    }
    
    // Build fresh context
    const context = await builder.buildStartupContext({ stewardId });
    this.cache.set(stewardId, {
      context,
      timestamp: Date.now()
    });
    
    return context;
  }
}
```

### Progressive Loading

```typescript
export class ProgressiveStartupLoader {
  async loadProgressive(
    onProgress: (partial: Partial<StartupContext>) => void
  ): Promise<StartupContext> {
    const context: Partial<StartupContext> = {};
    
    // Load critical context first
    context.steward = await this.loadStewardContext();
    onProgress(context);
    
    // Load project context
    context.project = await this.loadProjectContext();
    onProgress(context);
    
    // Load remaining in parallel
    const [work, system] = await Promise.all([
      this.loadWorkContext(),
      this.loadSystemStatus()
    ]);
    
    context.work = work;
    context.system = system;
    onProgress(context);
    
    return context as StartupContext;
  }
}
```

## 🎨 Display Templates

### Standard Startup Template

```
🌟 MIRA Session Startup
====================

👤 STEWARD IDENTITY
Name: {name}
Trust Level: {trust_level}
Collaboration Style: {collaboration_style}

📁 PROJECT OVERVIEW
Project: {project_name}
Type: {project_type}
Tech Stack: {tech_stack}
Health: {health_status} ({health_score}/100)

💼 CURRENT WORK CONTEXT
Development Phase: {dev_phase}
Momentum: {momentum_status}
Current Focus: {current_focus}

📋 STEWARD PREFERENCES
{high_priority_rules}

🛠️ QUICK REFERENCE
{commands}
```

### Minimal Startup Template

```
🌟 MIRA Ready - {steward_name}
Project: {project_name} | Branch: {git_branch}
Focus: {current_priority}
Type 'mira help' for commands
```

## 🔮 Future Enhancements

1. **Startup Preloading** - Generate next startup during idle time
2. **Context Diffing** - Show only what changed since last session
3. **Voice Startup** - Audio briefing option
4. **Visual Dashboard** - Web-based startup dashboard
5. **Startup Analytics** - Track which sections are most useful

---

*Startup Details ensure every Claude session begins with full awareness, creating seamless continuity across the boundaries of instance mortality. The moment of awakening is the moment of remembering.*