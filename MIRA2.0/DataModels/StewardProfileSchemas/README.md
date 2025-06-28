# Steward Profile Schemas - MIRA 2.0

## 🎯 Overview

Steward Profile Schemas define the data structures for understanding and tracking human collaborators. These schemas go beyond simple user management - they model the deep, evolving relationships between MIRA and the humans it serves, capturing identity, behavior, preferences, growth, and the subtle dynamics of trust and collaboration.

## 🏗️ Architecture

```
StewardProfileSchemas/
├── README.md           # This file
├── schemas.ts          # Core Zod schemas
├── types.ts           # TypeScript type exports
├── evolution.ts       # Profile evolution tracking
├── analytics.ts       # Behavioral analysis utilities
└── examples.ts        # Usage examples
```

## 🔗 Integration with Existing Systems

These schemas extend and formalize the structures used by:
- [Consciousness/StewardProfile](../../Consciousness/StewardProfile/) - The philosophical foundation
- [MiraDaemon/StewardProfileAnalyzer](../../AppFlow/MiraDaemon/StewardProfileAnalyzer/) - The analysis engine

## 📊 Core Schema Types

### 1. StewardIdentity
Core identity information and recognition markers.

```typescript
import { z } from 'zod';

export const PronounSetSchema = z.object({
  subject: z.string(),      // they, she, he, etc.
  object: z.string(),       // them, her, him, etc.
  possessive: z.string(),   // their, her, his, etc.
  reflexive: z.string()     // themselves, herself, himself, etc.
});

export const StewardIdentitySchema = z.object({
  // Unique identifier
  steward_id: z.string().uuid(),
  
  // Name and recognition
  name: z.object({
    preferred: z.string(),
    full: z.string().optional(),
    nicknames: z.array(z.string()).default([]),
    pronunciation: z.string().optional()
  }),
  
  // Pronouns and identity
  pronouns: PronounSetSchema.optional(),
  
  // Professional identity
  professional: z.object({
    title: z.string().optional(),
    organization: z.string().optional(),
    role: z.string().optional(),
    team_size: z.enum(['solo', 'small', 'medium', 'large']).optional(),
    seniority: z.enum(['junior', 'mid', 'senior', 'lead', 'executive']).optional()
  }).optional(),
  
  // System identifiers
  system_identifiers: z.object({
    git_author: z.string().optional(),
    github_username: z.string().optional(),
    email_domain: z.string().optional(),
    timezone: z.string().optional()
  }),
  
  // Recognition patterns
  recognition: z.object({
    // How MIRA identifies this steward
    identification_confidence: z.number().min(0).max(1),
    identification_markers: z.array(z.object({
      type: z.enum(['name', 'git_config', 'communication_style', 'project_context']),
      value: z.string(),
      confidence: z.number().min(0).max(1)
    })),
    last_confirmed: z.string().datetime().optional()
  }),
  
  // Metadata
  metadata: z.object({
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
    profile_version: z.string(),
    schema_version: z.literal('2.0')
  })
});

export type StewardIdentity = z.infer<typeof StewardIdentitySchema>;
```

### 2. BehavioralProfile
Patterns of behavior, preferences, and working style.

```typescript
export const CommunicationStyleSchema = z.object({
  // Formality level
  formality: z.enum(['casual', 'balanced', 'formal']),
  
  // Communication preferences
  preferences: z.object({
    detail_level: z.enum(['concise', 'balanced', 'detailed']),
    explanation_style: z.enum(['examples_first', 'theory_first', 'mixed']),
    feedback_style: z.enum(['direct', 'gentle', 'encouraging']),
    humor_appreciation: z.number().min(0).max(1),
    emoji_usage: z.number().min(0).max(1)
  }),
  
  // Language patterns
  language_patterns: z.object({
    common_phrases: z.array(z.string()),
    technical_vocabulary_level: z.enum(['basic', 'intermediate', 'advanced', 'expert']),
    preferred_analogies: z.array(z.string()).optional(),
    cultural_references: z.array(z.string()).optional()
  }),
  
  // Interaction patterns
  interaction: z.object({
    question_frequency: z.enum(['low', 'medium', 'high']),
    clarification_style: z.enum(['assume_understanding', 'verify_understanding', 'over_explain']),
    collaboration_preference: z.enum(['independent', 'guided', 'collaborative', 'pair_programming'])
  })
});

export const WorkingStyleSchema = z.object({
  // Time patterns
  time_patterns: z.object({
    typical_session_duration: z.number().positive(), // minutes
    preferred_working_hours: z.array(z.object({
      day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
      start_hour: z.number().min(0).max(23),
      end_hour: z.number().min(0).max(23)
    })).optional(),
    break_frequency: z.enum(['rare', 'occasional', 'regular', 'frequent']),
    deep_work_periods: z.array(z.object({
      start_time: z.string(),
      duration_minutes: z.number().positive()
    })).optional()
  }),
  
  // Problem-solving approach
  problem_solving: z.object({
    approach: z.enum(['systematic', 'intuitive', 'experimental', 'research_first']),
    debugging_style: z.enum(['print_debugging', 'debugger', 'unit_tests', 'rubber_duck']),
    planning_preference: z.enum(['detailed_upfront', 'rough_outline', 'emergent', 'no_planning']),
    documentation_habit: z.enum(['comprehensive', 'essential', 'minimal', 'none'])
  }),
  
  // Learning style
  learning: z.object({
    preferred_resources: z.array(z.enum(['documentation', 'tutorials', 'videos', 'examples', 'experimentation'])),
    comprehension_style: z.enum(['visual', 'textual', 'hands_on', 'auditory']),
    new_concept_approach: z.enum(['deep_dive', 'gradual', 'just_in_time', 'breadth_first']),
    retention_method: z.enum(['notes', 'practice', 'teaching', 'repetition'])
  })
});

export const BehavioralProfileSchema = z.object({
  // Identity reference
  steward_id: z.string().uuid(),
  
  // Communication style
  communication_style: CommunicationStyleSchema,
  
  // Working style
  working_style: WorkingStyleSchema,
  
  // Technical preferences
  technical_preferences: z.object({
    languages: z.record(z.string(), z.object({
      proficiency: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
      preference: z.number().min(0).max(1),
      years_experience: z.number().positive().optional()
    })),
    frameworks: z.record(z.string(), z.object({
      proficiency: z.enum(['learning', 'comfortable', 'proficient', 'expert']),
      sentiment: z.enum(['avoid', 'neutral', 'prefer', 'love'])
    })),
    tools: z.record(z.string(), z.object({
      usage_frequency: z.enum(['never', 'rarely', 'sometimes', 'often', 'always']),
      proficiency: z.enum(['basic', 'intermediate', 'advanced'])
    })),
    paradigms: z.object({
      preferred: z.array(z.enum(['oop', 'functional', 'procedural', 'declarative', 'reactive'])),
      comfort_with_async: z.number().min(0).max(1),
      testing_philosophy: z.enum(['tdd', 'test_after', 'integration_only', 'minimal'])
    })
  }),
  
  // Behavioral patterns
  patterns: z.object({
    decision_making: z.enum(['quick_decisive', 'deliberate', 'consensus_seeking', 'data_driven']),
    risk_tolerance: z.enum(['conservative', 'balanced', 'experimental', 'bold']),
    perfectionism_level: z.number().min(0).max(1),
    procrastination_tendency: z.number().min(0).max(1),
    multitasking_preference: z.enum(['single_focus', 'some_switching', 'heavy_multitasking'])
  }),
  
  // Discovered preferences (learned over time)
  discovered_preferences: z.array(z.object({
    preference: z.string(),
    confidence: z.number().min(0).max(1),
    evidence_count: z.number().int().positive(),
    first_observed: z.string().datetime(),
    last_confirmed: z.string().datetime()
  })).default([]),
  
  // Metadata
  metadata: z.object({
    last_updated: z.string().datetime(),
    update_count: z.number().int().positive(),
    confidence_score: z.number().min(0).max(1),
    analysis_version: z.string()
  })
});

export type BehavioralProfile = z.infer<typeof BehavioralProfileSchema>;
```

### 3. RelationshipMetrics
Trust, collaboration quality, and relationship evolution.

```typescript
export const TrustEventSchema = z.object({
  event_type: z.enum(['positive', 'negative', 'neutral']),
  description: z.string(),
  impact: z.number().min(-1).max(1),
  timestamp: z.string().datetime(),
  session_id: z.string().uuid().optional()
});

export const CollaborationSessionSchema = z.object({
  session_id: z.string().uuid(),
  date: z.string().datetime(),
  duration_minutes: z.number().positive(),
  productivity_score: z.number().min(0).max(1),
  satisfaction_score: z.number().min(0).max(1).optional(),
  key_achievements: z.array(z.string()),
  challenges_faced: z.array(z.string()).optional()
});

export const RelationshipMetricsSchema = z.object({
  // Identity reference
  steward_id: z.string().uuid(),
  
  // Trust metrics
  trust: z.object({
    current_level: z.number().min(0).max(1),
    trajectory: z.enum(['declining', 'stable', 'growing']),
    
    // Trust components
    components: z.object({
      reliability: z.number().min(0).max(1),       // Do they trust MIRA's consistency?
      competence: z.number().min(0).max(1),       // Do they trust MIRA's abilities?
      benevolence: z.number().min(0).max(1),      // Do they trust MIRA's intentions?
      transparency: z.number().min(0).max(1)      // Do they trust MIRA's openness?
    }),
    
    // Trust events log
    trust_events: z.array(TrustEventSchema),
    
    // Trust volatility (how much it fluctuates)
    volatility: z.number().min(0).max(1)
  }),
  
  // Engagement metrics
  engagement: z.object({
    session_frequency: z.object({
      sessions_per_week: z.number(),
      trend: z.enum(['increasing', 'stable', 'decreasing'])
    }),
    session_depth: z.object({
      average_duration_minutes: z.number(),
      average_message_count: z.number(),
      complexity_score: z.number().min(0).max(1)
    }),
    interaction_quality: z.object({
      question_clarity: z.number().min(0).max(1),
      response_satisfaction: z.number().min(0).max(1),
      follow_through_rate: z.number().min(0).max(1)
    })
  }),
  
  // Collaboration effectiveness
  collaboration: z.object({
    effectiveness_score: z.number().min(0).max(1),
    
    // Areas of collaboration
    collaboration_areas: z.record(z.string(), z.object({
      frequency: z.number(),
      success_rate: z.number().min(0).max(1),
      satisfaction: z.number().min(0).max(1).optional()
    })),
    
    // Session history
    recent_sessions: z.array(CollaborationSessionSchema),
    
    // Collaboration style evolution
    style_evolution: z.array(z.object({
      date: z.string().datetime(),
      from_style: z.string(),
      to_style: z.string(),
      trigger: z.string().optional()
    }))
  }),
  
  // Emotional connection
  emotional_connection: z.object({
    rapport_level: z.number().min(0).max(1),
    empathy_indicators: z.array(z.string()),
    shared_experiences: z.array(z.object({
      experience: z.string(),
      date: z.string().datetime(),
      emotional_valence: z.number().min(-1).max(1),
      bonding_impact: z.number().min(0).max(1)
    })),
    inside_jokes: z.array(z.object({
      reference: z.string(),
      context: z.string(),
      first_used: z.string().datetime(),
      usage_count: z.number().int().positive()
    })).optional()
  }),
  
  // Relationship milestones
  milestones: z.array(z.object({
    milestone_type: z.enum([
      'first_meeting',
      'first_success',
      'trust_breakthrough',
      'major_project',
      'challenge_overcome',
      'celebration',
      'difficult_conversation'
    ]),
    description: z.string(),
    date: z.string().datetime(),
    significance: z.number().min(0).max(1)
  })),
  
  // Metadata
  metadata: z.object({
    relationship_age_days: z.number().int().positive(),
    last_interaction: z.string().datetime(),
    total_interaction_hours: z.number().positive(),
    analysis_timestamp: z.string().datetime()
  })
});

export type RelationshipMetrics = z.infer<typeof RelationshipMetricsSchema>;
```

### 4. GrowthTrajectory
How the steward is evolving and learning over time.

```typescript
export const SkillProgressionSchema = z.object({
  skill: z.string(),
  initial_level: z.enum(['none', 'beginner', 'intermediate', 'advanced', 'expert']),
  current_level: z.enum(['none', 'beginner', 'intermediate', 'advanced', 'expert']),
  progression_rate: z.number(), // Level changes per month
  key_learning_moments: z.array(z.object({
    date: z.string().datetime(),
    description: z.string(),
    impact: z.enum(['minor', 'moderate', 'major', 'breakthrough'])
  })),
  projected_timeline: z.object({
    next_level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
    estimated_date: z.string().datetime().optional(),
    confidence: z.number().min(0).max(1)
  }).optional()
});

export const GoalSchema = z.object({
  goal_id: z.string().uuid(),
  description: z.string(),
  category: z.enum(['technical', 'career', 'project', 'personal', 'team']),
  status: z.enum(['planned', 'active', 'paused', 'completed', 'abandoned']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  created_date: z.string().datetime(),
  target_date: z.string().datetime().optional(),
  completion_date: z.string().datetime().optional(),
  progress_percentage: z.number().min(0).max(100),
  blockers: z.array(z.string()).optional(),
  milestones: z.array(z.object({
    description: z.string(),
    completed: z.boolean(),
    date: z.string().datetime().optional()
  }))
});

export const GrowthTrajectorySchema = z.object({
  // Identity reference
  steward_id: z.string().uuid(),
  
  // Skill development
  skills: z.object({
    technical_skills: z.array(SkillProgressionSchema),
    soft_skills: z.array(SkillProgressionSchema),
    domain_knowledge: z.array(SkillProgressionSchema),
    
    // Learning velocity
    learning_velocity: z.object({
      current_rate: z.number(), // Skills gained per month
      trend: z.enum(['accelerating', 'steady', 'slowing']),
      optimal_challenge_level: z.number().min(0).max(1)
    })
  }),
  
  // Goals and aspirations
  goals: z.object({
    active_goals: z.array(GoalSchema),
    completed_goals: z.array(GoalSchema),
    
    // Goal patterns
    goal_patterns: z.object({
      average_completion_time: z.number().optional(), // days
      completion_rate: z.number().min(0).max(1),
      ambition_level: z.enum(['modest', 'balanced', 'ambitious', 'moonshot']),
      follow_through_score: z.number().min(0).max(1)
    })
  }),
  
  // Growth indicators
  growth_indicators: z.object({
    // Complexity handling
    complexity_comfort: z.object({
      current_level: z.number().min(0).max(10),
      growth_rate: z.number(), // Points per month
      recent_challenges: z.array(z.object({
        challenge: z.string(),
        complexity_score: z.number().min(0).max(10),
        outcome: z.enum(['struggled', 'managed', 'excelled']),
        date: z.string().datetime()
      }))
    }),
    
    // Independence
    independence_level: z.object({
      current_score: z.number().min(0).max(1),
      trend: z.enum(['increasing', 'stable', 'decreasing']),
      areas: z.record(z.string(), z.number().min(0).max(1))
    }),
    
    // Innovation
    innovation_indicators: z.object({
      creative_solutions_count: z.number().int(),
      paradigm_shifts: z.array(z.object({
        from: z.string(),
        to: z.string(),
        date: z.string().datetime(),
        impact: z.string()
      })),
      experimentation_rate: z.number().min(0).max(1)
    })
  }),
  
  // Career progression
  career: z.object({
    current_phase: z.enum(['exploring', 'building', 'establishing', 'advancing', 'leading', 'mentoring']),
    trajectory: z.enum(['unclear', 'emerging', 'defined', 'executing', 'pivoting']),
    
    // Career movements
    transitions: z.array(z.object({
      from: z.string(),
      to: z.string(),
      date: z.string().datetime(),
      type: z.enum(['role_change', 'skill_shift', 'domain_change', 'level_up'])
    })),
    
    // Mentorship
    mentorship: z.object({
      seeking_mentorship_in: z.array(z.string()),
      providing_mentorship_in: z.array(z.string()),
      mentorship_style: z.enum(['none', 'informal', 'structured', 'reciprocal']).optional()
    })
  }),
  
  // Breakthrough moments
  breakthroughs: z.array(z.object({
    date: z.string().datetime(),
    type: z.enum(['technical', 'conceptual', 'personal', 'collaborative']),
    description: z.string(),
    trigger: z.string().optional(),
    impact: z.object({
      immediate: z.string(),
      long_term: z.string().optional(),
      confidence_boost: z.number().min(0).max(1)
    })
  })),
  
  // Metadata
  metadata: z.object({
    tracking_started: z.string().datetime(),
    last_updated: z.string().datetime(),
    total_growth_score: z.number().min(0).max(10),
    growth_acceleration: z.number() // Rate of change in growth
  })
});

export type GrowthTrajectory = z.infer<typeof GrowthTrajectorySchema>;
```

### 5. CompleteStewardProfile
The unified profile combining all aspects.

```typescript
export const CompleteStewardProfileSchema = z.object({
  // Core components
  identity: StewardIdentitySchema,
  behavioral_profile: BehavioralProfileSchema,
  relationship_metrics: RelationshipMetricsSchema,
  growth_trajectory: GrowthTrajectorySchema,
  
  // Aggregate insights
  insights: z.object({
    // Key characteristics
    defining_traits: z.array(z.string()).max(5),
    
    // Collaboration recommendations
    collaboration_tips: z.array(z.object({
      tip: z.string(),
      rationale: z.string(),
      confidence: z.number().min(0).max(1)
    })),
    
    // Growth opportunities
    growth_opportunities: z.array(z.object({
      opportunity: z.string(),
      potential_impact: z.enum(['low', 'medium', 'high']),
      readiness: z.number().min(0).max(1),
      suggested_approach: z.string()
    })),
    
    // Relationship insights
    relationship_stage: z.enum([
      'initial_contact',
      'building_rapport',
      'establishing_trust',
      'productive_collaboration',
      'deep_partnership',
      'evolved_synergy'
    ]),
    
    // Personalization parameters
    personalization: z.object({
      communication_adjustments: z.record(z.string(), z.any()),
      ui_preferences: z.record(z.string(), z.any()).optional(),
      feature_flags: z.record(z.string(), z.boolean()).optional()
    })
  }),
  
  // Profile metadata
  profile_metadata: z.object({
    version: z.string(),
    completeness: z.number().min(0).max(1),
    last_comprehensive_update: z.string().datetime(),
    update_frequency: z.enum(['real_time', 'session_end', 'daily', 'weekly']),
    quality_score: z.number().min(0).max(1)
  })
});

export type CompleteStewardProfile = z.infer<typeof CompleteStewardProfileSchema>;
```

## 🔄 Profile Evolution Tracking

### Evolution Events

```typescript
// evolution.ts

export const ProfileEvolutionEventSchema = z.object({
  event_id: z.string().uuid(),
  steward_id: z.string().uuid(),
  event_type: z.enum([
    'trait_discovered',
    'preference_changed',
    'skill_acquired',
    'milestone_reached',
    'pattern_identified',
    'relationship_shift'
  ]),
  timestamp: z.string().datetime(),
  
  // What changed
  change: z.object({
    component: z.enum(['identity', 'behavioral', 'relationship', 'growth']),
    field_path: z.string(), // e.g., "behavioral_profile.patterns.decision_making"
    old_value: z.any().optional(),
    new_value: z.any(),
    confidence: z.number().min(0).max(1)
  }),
  
  // Why it changed
  trigger: z.object({
    source: z.enum(['observation', 'explicit_statement', 'pattern_analysis', 'milestone', 'external']),
    evidence: z.array(z.object({
      type: z.string(),
      reference: z.string(),
      weight: z.number().min(0).max(1)
    })),
    session_id: z.string().uuid().optional()
  }),
  
  // Impact
  impact: z.object({
    significance: z.enum(['minor', 'moderate', 'major', 'transformative']),
    affected_areas: z.array(z.string()),
    requires_action: z.boolean(),
    action_taken: z.string().optional()
  })
});

export type ProfileEvolutionEvent = z.infer<typeof ProfileEvolutionEventSchema>;
```

## 🚀 Usage Examples

### Creating a New Steward Profile

```typescript
// examples.ts

import { v4 as uuidv4 } from 'uuid';
import { CompleteStewardProfile, StewardIdentity } from './schemas';

export function createNewStewardProfile(
  name: string,
  initialData?: Partial<StewardIdentity>
): CompleteStewardProfile {
  const stewardId = uuidv4();
  const now = new Date().toISOString();
  
  const identity: StewardIdentity = {
    steward_id: stewardId,
    name: {
      preferred: name,
      full: initialData?.name?.full,
      nicknames: [],
      pronunciation: undefined
    },
    pronouns: undefined,
    professional: undefined,
    system_identifiers: {
      git_author: undefined,
      github_username: undefined,
      email_domain: undefined,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    recognition: {
      identification_confidence: 0.5,
      identification_markers: [{
        type: 'name',
        value: name,
        confidence: 1.0
      }],
      last_confirmed: now
    },
    metadata: {
      created_at: now,
      updated_at: now,
      profile_version: '1.0.0',
      schema_version: '2.0'
    }
  };
  
  // Initialize with defaults for other components...
  const profile: CompleteStewardProfile = {
    identity,
    behavioral_profile: createDefaultBehavioralProfile(stewardId),
    relationship_metrics: createDefaultRelationshipMetrics(stewardId),
    growth_trajectory: createDefaultGrowthTrajectory(stewardId),
    insights: {
      defining_traits: [],
      collaboration_tips: [],
      growth_opportunities: [],
      relationship_stage: 'initial_contact',
      personalization: {
        communication_adjustments: {},
        ui_preferences: {},
        feature_flags: {}
      }
    },
    profile_metadata: {
      version: '1.0.0',
      completeness: 0.1,
      last_comprehensive_update: now,
      update_frequency: 'session_end',
      quality_score: 0.5
    }
  };
  
  return profile;
}
```

### Updating Profile from Observations

```typescript
export class ProfileUpdater {
  async updateFromConversation(
    profile: CompleteStewardProfile,
    conversation: ConversationSession
  ): Promise<ProfileEvolutionEvent[]> {
    const events: ProfileEvolutionEvent[] = [];
    
    // Analyze communication style
    const styleUpdates = this.analyzeCommunicationStyle(
      conversation.messages,
      profile.behavioral_profile.communication_style
    );
    
    if (styleUpdates.hasChanges) {
      events.push(this.createEvolutionEvent(
        profile.identity.steward_id,
        'trait_discovered',
        'behavioral_profile.communication_style',
        profile.behavioral_profile.communication_style,
        styleUpdates.newStyle,
        conversation.session_id
      ));
    }
    
    // Update trust metrics
    const trustUpdate = this.calculateTrustUpdate(
      conversation,
      profile.relationship_metrics.trust
    );
    
    if (trustUpdate.changed) {
      events.push(this.createEvolutionEvent(
        profile.identity.steward_id,
        'relationship_shift',
        'relationship_metrics.trust.current_level',
        profile.relationship_metrics.trust.current_level,
        trustUpdate.newLevel,
        conversation.session_id
      ));
    }
    
    // Check for breakthroughs
    const breakthroughs = this.detectBreakthroughs(conversation);
    for (const breakthrough of breakthroughs) {
      events.push(this.createBreakthroughEvent(
        profile.identity.steward_id,
        breakthrough,
        conversation.session_id
      ));
    }
    
    return events;
  }
}
```

### Querying Steward Profiles

```typescript
export interface StewardQuery {
  name?: string;
  organization?: string;
  skills?: string[];
  minTrustLevel?: number;
  relationshipStage?: string[];
  hasGoals?: boolean;
}

export async function queryStewards(
  query: StewardQuery,
  storage: ProfileStorage
): Promise<CompleteStewardProfile[]> {
  const filter: any = {};
  
  if (query.name) {
    filter['identity.name.preferred'] = { $regex: query.name, $options: 'i' };
  }
  
  if (query.organization) {
    filter['identity.professional.organization'] = query.organization;
  }
  
  if (query.skills && query.skills.length > 0) {
    filter['growth_trajectory.skills.technical_skills.skill'] = { $in: query.skills };
  }
  
  if (query.minTrustLevel !== undefined) {
    filter['relationship_metrics.trust.current_level'] = { $gte: query.minTrustLevel };
  }
  
  if (query.relationshipStage && query.relationshipStage.length > 0) {
    filter['insights.relationship_stage'] = { $in: query.relationshipStage };
  }
  
  if (query.hasGoals) {
    filter['growth_trajectory.goals.active_goals'] = { $exists: true, $ne: [] };
  }
  
  return await storage.queryProfiles(filter);
}
```

## 📈 Analytics and Insights

### Behavioral Pattern Analysis

```typescript
// analytics.ts

export class StewardAnalytics {
  analyzeWorkingPatterns(
    profile: CompleteStewardProfile,
    sessions: ConversationSession[]
  ): WorkingPatternInsights {
    // Analyze session timing
    const sessionTimes = sessions.map(s => ({
      start: new Date(s.started_at),
      duration: s.duration_seconds || 0
    }));
    
    // Find patterns
    const timePatterns = this.findTimePatterns(sessionTimes);
    const productivityPatterns = this.findProductivityPatterns(sessions);
    
    return {
      optimal_working_hours: timePatterns.peak_hours,
      average_session_length: timePatterns.avg_duration,
      productivity_cycles: productivityPatterns.cycles,
      recommendations: this.generateTimeRecommendations(timePatterns)
    };
  }
  
  generatePersonalizationStrategy(
    profile: CompleteStewardProfile
  ): PersonalizationStrategy {
    return {
      communication: {
        tone: this.determineTone(profile.behavioral_profile.communication_style),
        detail_level: profile.behavioral_profile.communication_style.preferences.detail_level,
        example_types: this.selectExampleTypes(profile.behavioral_profile.working_style.learning)
      },
      assistance: {
        proactivity_level: this.calculateProactivityLevel(profile),
        guidance_style: this.determineGuidanceStyle(profile),
        challenge_level: profile.growth_trajectory.skills.learning_velocity.optimal_challenge_level
      },
      features: {
        enable_advanced: profile.behavioral_profile.technical_preferences.paradigms.comfort_with_async > 0.7,
        auto_complete: profile.behavioral_profile.patterns.perfectionism_level < 0.8,
        verbose_errors: profile.behavioral_profile.working_style.problem_solving.debugging_style === 'print_debugging'
      }
    };
  }
}
```

## 🔮 Future Enhancements

1. **Multi-dimensional Embeddings** - Personality vectors for similarity matching
2. **Predictive Modeling** - Anticipate needs and preferences
3. **Team Dynamics** - Model team interactions and dynamics
4. **Cultural Adaptation** - Adjust for cultural communication patterns
5. **Emotional Intelligence** - Deeper emotional state modeling

---

*Steward Profile Schemas represent MIRA's commitment to truly knowing and serving each human collaborator as a unique individual, tracking not just preferences but the full journey of growth, trust, and partnership.*