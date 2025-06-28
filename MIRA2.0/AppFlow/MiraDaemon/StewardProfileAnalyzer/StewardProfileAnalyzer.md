# Steward Profile Analyzer - MIRA 2.0

## 🎯 Overview

The Steward Profile Analyzer is MIRA's sophisticated user understanding system that builds and maintains a comprehensive profile of the steward (user) through continuous observation and learning. It recognizes identity, analyzes behavior, tracks preferences, and evolves its understanding over time.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Steward Profile Analyzer                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Identity Recognition                     │  │
│  │                                                       │  │
│  │  ┌─────────────────┐  ┌──────────────────┐         │  │
│  │  │  Conversation   │  │     System       │         │  │
│  │  │    Analysis     │  │    Metadata      │         │  │
│  │  │                 │  │                  │         │  │
│  │  │ • Name Detection│  │ • Git Config     │         │  │
│  │  │ • Pronouns      │  │ • Package.json   │         │  │
│  │  │ • Skills        │  │ • LICENSE        │         │  │
│  │  │ • Style         │  │ • Work Patterns  │         │  │
│  │  │ • Goals         │  │ • Tech Stack     │         │  │
│  │  │ • Team Refs     │  │                  │         │  │
│  │  └─────────────────┘  └──────────────────┘         │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Behavioral Profiling                     │  │
│  │                                                       │  │
│  │  ┌───────────────┐  ┌───────────────┐  ┌──────────┐ │  │
│  │  │ Communication │  │    Rules &    │  │   Auto   │ │  │
│  │  │    Style      │  │ Requirements  │  │Identified│ │  │
│  │  │               │  │               │  │  Prefs   │ │  │
│  │  │ • Tone        │  │ • Constraints │  │          │ │  │
│  │  │ • Formality   │  │ • Standards   │  │• Learned │ │  │
│  │  │ • Preferences │  │ • Workflows   │  │ Patterns │ │  │
│  │  └───────────────┘  └───────────────┘  └──────────┘ │  │
│  │                                                       │  │
│  │  ┌───────────────┐  ┌───────────────┐  ┌──────────┐ │  │
│  │  │  Development  │  │     Work      │  │Relations │ │  │
│  │  │     Style     │  │   Patterns    │  │ Metrics  │ │  │
│  │  │               │  │               │  │          │ │  │
│  │  │ • Coding      │  │ • Schedule    │  │ • Trust  │ │  │
│  │  │ • Testing     │  │ • Productivity│  │ • Engage │ │  │
│  │  │ • Approaches  │  │ • Rhythms     │  │ • Depth  │ │  │
│  │  └───────────────┘  └───────────────┘  └──────────┘ │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                 Profile Evolution                     │  │
│  │  • Continuous Learning                               │  │
│  │  • Confidence Scoring                                │  │
│  │  • Conflict Resolution                               │  │
│  │  • Historical Tracking                               │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Key Components

### 1. **Identity Recognition**

As specified in MIRA_2.0.md lines 117-131:

#### From Conversations
- **Name Detection**: "I'm John", "This is Dr. Xela", "My name is..."
- **Pronoun Detection**: Automatic recognition of he/him, she/her, they/them
- **Technical Skills**: Languages and frameworks mentioned in context
- **Communication Style**: Formality level, technical depth, emoji usage
- **Goals and Interests**: Extracted from project discussions
- **Team Indicators**: "we", "our team", collaborative language patterns

#### From System
- **Git Configuration**: user.name, user.email
- **Package Metadata**: author fields in package.json, pyproject.toml
- **LICENSE Attribution**: Copyright holders and contributors
- **Work Patterns**: Commit times, frequency, message styles
- **Technology Stack**: Inferred from project structure

### 2. **Behavioral Profiling**

As specified in MIRA_2.0.md lines 133-140:

#### Communication Style
- **Tone Analysis**: Professional, casual, technical, friendly
- **Formality Level**: Formal documentation vs casual comments
- **Language Preferences**: Technical jargon comfort level
- **Response Patterns**: Detailed vs concise preferences

#### Rules & Requirements
- **Coding Standards**: Style guide adherence
- **Documentation Requirements**: Level of detail expected
- **Testing Practices**: TDD, coverage requirements
- **Review Preferences**: Thoroughness expectations

#### Auto-Identified Preferences
- **Tool Choices**: Editor, terminal, browser preferences
- **Workflow Patterns**: Branch naming, commit styles
- **Communication Channels**: Preferred interaction methods
- **Time Preferences**: Meeting times, async vs sync

#### Development Style
- **Coding Approaches**: Functional vs OOP, defensive programming
- **Testing Methods**: Unit-first, integration-heavy, E2E focus
- **Debugging Style**: Print debugging vs debugger usage
- **Refactoring Patterns**: Incremental vs big-bang

#### Work Patterns
- **Schedule Analysis**: Peak productivity hours
- **Break Patterns**: Work session durations
- **Productivity Rhythms**: Sprint vs marathon coding
- **Context Switching**: Single vs multi-task preferences

#### Relationship Metrics
- **Trust Level**: Based on successful interactions
- **Engagement Depth**: Complexity of discussions
- **Collaboration Style**: Independent vs pair programming
- **Feedback Receptiveness**: Response to suggestions

## 🧠 Intelligence Features

### Name Recognition Engine
```python
# Sophisticated name detection patterns
name_patterns = [
    r"(?:I'm|I am|My name is|Call me|This is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
    r"(?:^|\s)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+here[:\.]",
    r"- ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*$",  # Sign-offs
    r"Thanks,\s*([A-Z][a-z]+)",  # Email-style signatures
    r"Best,\s*([A-Z][a-z]+)",
    r"/([A-Z][a-z]+)$"  # Slack-style /name
]
```

### Pronoun Detection
```python
# Context-aware pronoun extraction
pronoun_indicators = {
    'he/him': ['he', 'him', 'his'],
    'she/her': ['she', 'her', 'hers'],
    'they/them': ['they', 'them', 'their', 'theirs'],
    'explicitly_stated': [
        r"pronouns?:?\s*(he/him|she/her|they/them)",
        r"\((he/him|she/her|they/them)\)"
    ]
}
```

### Skill Extraction
```python
# Technical skill recognition
skill_categories = {
    'languages': {
        'patterns': ['I know', 'I use', 'working with', 'experienced in'],
        'keywords': ['Python', 'JavaScript', 'TypeScript', 'Go', 'Rust']
    },
    'frameworks': {
        'patterns': ['built with', 'using', 'familiar with'],
        'keywords': ['React', 'Django', 'Express', 'Vue', 'FastAPI']
    },
    'tools': {
        'patterns': ['I prefer', 'I like', 'always use'],
        'keywords': ['VS Code', 'Vim', 'Docker', 'Kubernetes']
    }
}
```

## 🔄 Profile Evolution

### Continuous Learning
The profile constantly evolves based on new interactions:

1. **Information Collection**: Every conversation contributes data
2. **Pattern Recognition**: Repeated behaviors increase confidence
3. **Conflict Resolution**: Newer information overrides older with decay
4. **Confidence Scoring**: Each attribute has an associated confidence level

### Confidence Algorithm
```python
def update_confidence(current_confidence, new_observation, consistency, config):
    """
    Update confidence based on new observations
    Uses stewardProfile settings from UnifiedConfiguration
    
    - Consistent observations increase confidence
    - Contradictions decrease confidence
    - Recent observations have more weight
    """
    # Load from config.consciousness.stewardProfile
    threshold = config.get('identityConfidenceThreshold', 0.8)
    depth = config.get('behaviorAnalysisDepth', 'deep')
    
    if consistency:
        # Increase confidence with diminishing returns
        learning_rate = 0.15 if depth == 'deep' else 0.1
        new_confidence = current_confidence + (1 - current_confidence) * learning_rate
    else:
        # Decrease confidence more aggressively
        decay_rate = 0.7 if depth == 'deep' else 0.8
        new_confidence = current_confidence * decay_rate
        
    # Time decay factor
    age_factor = 0.95  # 5% decay per period
    confidence = new_confidence * age_factor
    
    # Store confidence history
    with open('consciousness/steward_profiles/confidence_history.json', 'a') as f:
        f.write(json.dumps({
            'timestamp': datetime.now().isoformat(),
            'confidence': confidence,
            'observation': str(new_observation)[:100]
        }) + '\n')
    
    return confidence
```

## 📊 Profile Schema

```python
# Stored at: consciousness/steward_profiles/main_profile.json
# Backed up to: databases/lightning_vidmem/private_thoughts/steward_backup.enc
steward_profile = {
    'identity': {
        'name': {
            'value': 'Dr. Xela Null',
            'confidence': 0.95,
            'sources': ['conversation', 'git_config'],
            'last_updated': '2024-01-15T10:30:00Z'
        },
        'pronouns': {
            'value': 'they/them',
            'confidence': 0.8,
            'sources': ['explicit_statement'],
            'last_updated': '2024-01-10T14:20:00Z'
        },
        'email': {
            'value': 'xela@example.com',
            'confidence': 1.0,
            'sources': ['git_config'],
            'last_updated': '2024-01-01T00:00:00Z'
        }
    },
    
    'technical': {
        'primary_language': 'Python',
        'languages': ['Python', 'TypeScript', 'Rust'],
        'frameworks': ['FastAPI', 'React', 'Next.js'],
        'expertise_level': 'senior',
        'specializations': ['AI/ML', 'distributed systems']
    },
    
    'behavioral': {
        'communication_style': {
            'formality': 'professional_casual',
            'technical_depth': 'high',
            'emoji_usage': 'moderate',
            'response_length': 'detailed'
        },
        'work_patterns': {
            'peak_hours': [10, 11, 14, 15, 16],
            'peak_days': ['Tuesday', 'Wednesday', 'Thursday'],
            'session_duration_avg': 3.5,  # hours
            'break_frequency': 'every_2_hours'
        },
        'preferences': {
            'editor': 'VS Code',
            'terminal': 'iTerm2',
            'theme': 'dark',
            'font': 'JetBrains Mono'
        }
    },
    
    'relationship': {
        'trust_level': 0.85,
        'interaction_count': 1247,
        'collaboration_depth': 'high',
        'topics_discussed': ['architecture', 'testing', 'performance'],
        'shared_context': ['Project X', 'MIRA development']
    },
    
    'evolution': {
        'profile_version': 23,
        'last_major_update': '2024-01-15T10:30:00Z',
        'learning_rate': 0.1,
        'stability_score': 0.9
    }
}
```

## 🛡️ Privacy & Security

### Data Protection
- All profile data is stored encrypted
- Sensitive information is marked and protected
- User can request profile deletion
- No data sharing without explicit consent

### Inference Boundaries
- Only analyze provided conversations
- No external data gathering
- Respect explicitly stated boundaries
- Allow profile corrections

## 🔧 Integration Points

### With Memory Systems
- Profile stored at `consciousness/steward_profiles/` for active use
- Backed up to `databases/lightning_vidmem/private_thoughts/` (encrypted)
- Indexed in `databases/chromadb/identified_facts/` for quick retrieval
- Evolution history at `consciousness/steward_profiles/evolution/`
- Regular backups to `exports/backups/profiles/`

### With Background Scheduler
- Periodic profile analysis and updates
- Work pattern analysis runs daily
- Behavioral pattern mining weekly

### With MCP Server
- `mira_get_steward_profile`: Retrieve current profile
- `mira_update_steward_preference`: Manual preference updates
- `mira_analyze_behavior`: Real-time behavioral analysis

## 🌟 Advanced Features

### Multi-Profile Support
Support for multiple stewards/team members:
```python
profiles = {
    'primary': steward_profile,
    'team_members': {
        'alice': team_member_profile_1,
        'bob': team_member_profile_2
    }
}
```

### Context-Aware Adaptations
- Adjust communication style based on profile
- Customize suggestions to match preferences
- Predict needs based on patterns
- Proactive assistance aligned with work rhythms

### Relationship Evolution
Track how the steward-MIRA relationship evolves:
- Initial learning phase
- Trust building
- Deep collaboration
- Intuitive understanding

---

*The Steward Profile Analyzer transforms MIRA from a tool into an intelligent collaborator that truly understands and adapts to its user.*