# Steward Profile Analyzer Implementation Guide - MIRA 2.0

## 🎯 Purpose

This guide provides production-ready implementation patterns for the Steward Profile Analyzer, implementing the specifications from MIRA_2.0.md lines 115-140.

## 📦 Core Implementation

### Profile Data Model

```python
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any, Set
from datetime import datetime
from enum import Enum
import json
import re
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


@dataclass
class ProfileAttribute:
    """Represents a single profile attribute with confidence tracking"""
    value: Any
    confidence: float = 0.5
    sources: List[str] = field(default_factory=list)
    last_updated: datetime = field(default_factory=datetime.now)
    observation_count: int = 1
    
    def update(self, new_value: Any, source: str, consistent: bool = True):
        """Update attribute with new observation"""
        self.last_updated = datetime.now()
        self.observation_count += 1
        
        if source not in self.sources:
            self.sources.append(source)
            
        if consistent:
            # Increase confidence with diminishing returns
            self.confidence = min(0.99, self.confidence + (1 - self.confidence) * 0.1)
        else:
            # Decrease confidence for contradictions
            self.confidence *= 0.7
            # Update value if confidence in new value is high
            if self.confidence < 0.5:
                self.value = new_value
                self.confidence = 0.6
                
    def apply_time_decay(self, decay_rate: float = 0.95):
        """Apply time-based confidence decay"""
        age_days = (datetime.now() - self.last_updated).days
        if age_days > 30:
            self.confidence *= (decay_rate ** (age_days / 30))


class CommunicationStyle(Enum):
    FORMAL = "formal"
    PROFESSIONAL_CASUAL = "professional_casual"
    CASUAL = "casual"
    TECHNICAL = "technical"
    FRIENDLY = "friendly"


@dataclass
class StewardProfile:
    """Complete steward profile with all attributes"""
    
    # Identity
    name: Optional[ProfileAttribute] = None
    pronouns: Optional[ProfileAttribute] = None
    email: Optional[ProfileAttribute] = None
    title: Optional[ProfileAttribute] = None
    organization: Optional[ProfileAttribute] = None
    
    # Technical
    languages: Dict[str, ProfileAttribute] = field(default_factory=dict)
    frameworks: Dict[str, ProfileAttribute] = field(default_factory=dict)
    tools: Dict[str, ProfileAttribute] = field(default_factory=dict)
    expertise_areas: List[ProfileAttribute] = field(default_factory=list)
    
    # Behavioral
    communication_style: Optional[ProfileAttribute] = None
    work_schedule: Dict[str, Any] = field(default_factory=dict)
    preferences: Dict[str, ProfileAttribute] = field(default_factory=dict)
    patterns: Dict[str, Any] = field(default_factory=dict)
    
    # Relationship
    trust_level: float = 0.5
    interaction_count: int = 0
    collaboration_depth: str = "shallow"
    shared_context: List[str] = field(default_factory=list)
    
    # Metadata
    created_at: datetime = field(default_factory=datetime.now)
    last_updated: datetime = field(default_factory=datetime.now)
    version: int = 1
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert profile to dictionary for storage"""
        def serialize_attribute(attr: Optional[ProfileAttribute]) -> Optional[Dict]:
            if attr:
                return {
                    'value': attr.value,
                    'confidence': attr.confidence,
                    'sources': attr.sources,
                    'last_updated': attr.last_updated.isoformat(),
                    'observation_count': attr.observation_count
                }
            return None
            
        return {
            'identity': {
                'name': serialize_attribute(self.name),
                'pronouns': serialize_attribute(self.pronouns),
                'email': serialize_attribute(self.email),
                'title': serialize_attribute(self.title),
                'organization': serialize_attribute(self.organization)
            },
            'technical': {
                'languages': {k: serialize_attribute(v) for k, v in self.languages.items()},
                'frameworks': {k: serialize_attribute(v) for k, v in self.frameworks.items()},
                'tools': {k: serialize_attribute(v) for k, v in self.tools.items()},
                'expertise_areas': [serialize_attribute(e) for e in self.expertise_areas]
            },
            'behavioral': {
                'communication_style': serialize_attribute(self.communication_style),
                'work_schedule': self.work_schedule,
                'preferences': {k: serialize_attribute(v) for k, v in self.preferences.items()},
                'patterns': self.patterns
            },
            'relationship': {
                'trust_level': self.trust_level,
                'interaction_count': self.interaction_count,
                'collaboration_depth': self.collaboration_depth,
                'shared_context': self.shared_context
            },
            'metadata': {
                'created_at': self.created_at.isoformat(),
                'last_updated': self.last_updated.isoformat(),
                'version': self.version
            }
        }
```

### Identity Recognition Engine

```python
class IdentityRecognizer:
    """Recognizes and extracts identity information from various sources"""
    
    def __init__(self):
        # Name patterns - MIRA_2.0.md line 119
        self.name_patterns = [
            r"(?:I'm|I am|My name is|Call me|This is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
            r"(?:^|\s)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+here[:\.]",
            r"- ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*$",
            r"Thanks,\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
            r"Best,\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
            r"Regards,\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
            r"/([A-Z][a-z]+)$",  # Slack-style
            r"^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*):(?:\s|$)"  # "Name: message"
        ]
        
        # Pronoun patterns - MIRA_2.0.md line 120
        self.pronoun_patterns = {
            'explicit': [
                r"pronouns?:?\s*((?:he/him|she/her|they/them|[a-z]+/[a-z]+))",
                r"\((he/him|she/her|they/them)\)",
                r"💬\s*(he/him|she/her|they/them)"
            ],
            'contextual': {
                'he/him': re.compile(r'\b(he|him|his)\b', re.I),
                'she/her': re.compile(r'\b(she|her|hers)\b', re.I),
                'they/them': re.compile(r'\b(they|them|their|theirs)\b', re.I)
            }
        }
        
        # Technical skill patterns - MIRA_2.0.md line 121
        self.skill_patterns = {
            'languages': {
                'indicators': [
                    r"(?:I |I'm |I am )?(?:know|use|write|code in|work with|experienced in)\s+([A-Za-z+#]+)",
                    r"(?:writing|coding|programming) in\s+([A-Za-z+#]+)",
                    r"([A-Za-z+#]+)\s+(?:developer|programmer|engineer)",
                    r"(?:main|primary|favorite) (?:language|languages) (?:is|are)\s+([A-Za-z+#]+)"
                ],
                'keywords': ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'Go', 'Rust', 
                           'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala', 'C#', 'R', 'Julia']
            },
            'frameworks': {
                'indicators': [
                    r"(?:using|built with|working with|experienced in)\s+([A-Za-z.]+)",
                    r"([A-Za-z.]+)\s+(?:app|application|project)",
                    r"(?:love|prefer|like)\s+([A-Za-z.]+)"
                ],
                'keywords': ['React', 'Vue', 'Angular', 'Django', 'Flask', 'FastAPI', 'Express',
                           'Spring', 'Rails', 'Laravel', 'Next.js', 'Nuxt', 'Svelte']
            }
        }
        
        # Goal/interest patterns - MIRA_2.0.md line 123
        self.goal_patterns = [
            r"(?:I want to|I'd like to|I'm trying to|My goal is to)\s+(.+?)(?:\.|$)",
            r"(?:interested in|passionate about|focused on)\s+(.+?)(?:\.|$)",
            r"(?:working on|building|creating)\s+(.+?)(?:\.|$)",
            r"(?:help me|assist with|need to)\s+(.+?)(?:\.|$)"
        ]
        
        # Team indicators - MIRA_2.0.md line 124
        self.team_patterns = [
            r"\b(?:we|our team|my team|our company|we're|we are)\b",
            r"\b(?:colleagues|teammates|coworkers)\b",
            r"\b(?:team lead|tech lead|manager|CTO|CEO)\b"
        ]
        
    async def extract_from_conversation(self, message: str) -> Dict[str, Any]:
        """Extract identity information from a conversation message"""
        extracted = {}
        
        # Name detection
        for pattern in self.name_patterns:
            match = re.search(pattern, message)
            if match:
                name = match.group(1).strip()
                # Validate name (avoid common false positives)
                if len(name) > 2 and name not in ['Here', 'There', 'This', 'That']:
                    extracted['name'] = name
                    break
                    
        # Pronoun detection
        # First check explicit statements
        for pattern in self.pronoun_patterns['explicit']:
            match = re.search(pattern, message, re.I)
            if match:
                extracted['pronouns'] = match.group(1).lower()
                break
                
        # Then contextual usage (lower confidence)
        if 'pronouns' not in extracted:
            pronoun_counts = {}
            for pronoun_set, pattern in self.pronoun_patterns['contextual'].items():
                count = len(pattern.findall(message))
                if count > 0:
                    pronoun_counts[pronoun_set] = count
                    
            if pronoun_counts:
                # Use most frequent, but with lower confidence
                extracted['pronouns_inferred'] = max(pronoun_counts.items(), key=lambda x: x[1])[0]
                
        # Technical skills
        extracted['skills'] = self._extract_skills(message)
        
        # Goals and interests
        goals = []
        for pattern in self.goal_patterns:
            matches = re.findall(pattern, message, re.I)
            goals.extend(matches)
        if goals:
            extracted['goals'] = goals
            
        # Team indicators
        team_count = sum(1 for pattern in self.team_patterns if re.search(pattern, message, re.I))
        if team_count > 0:
            extracted['team_context'] = True
            extracted['team_indicator_count'] = team_count
            
        return extracted
        
    def _extract_skills(self, message: str) -> Dict[str, List[str]]:
        """Extract technical skills from message"""
        skills = {'languages': [], 'frameworks': []}
        
        for skill_type, config in self.skill_patterns.items():
            found = set()
            
            # Check patterns
            for pattern in config['indicators']:
                matches = re.findall(pattern, message, re.I)
                for match in matches:
                    # Check if it's a known keyword
                    for keyword in config['keywords']:
                        if keyword.lower() in match.lower():
                            found.add(keyword)
                            
            # Also check for direct mentions
            for keyword in config['keywords']:
                if re.search(rf'\b{keyword}\b', message, re.I):
                    found.add(keyword)
                    
            skills[skill_type] = list(found)
            
        return skills
        
    async def extract_from_system(self) -> Dict[str, Any]:
        """Extract identity information from system sources - MIRA_2.0.md lines 127-131"""
        system_info = {}
        
        # Git configuration
        try:
            import subprocess
            
            # Get git user info
            result = subprocess.run(['git', 'config', 'user.name'], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                system_info['git_name'] = result.stdout.strip()
                
            result = subprocess.run(['git', 'config', 'user.email'], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                system_info['git_email'] = result.stdout.strip()
                
        except Exception as e:
            logger.debug(f"Could not read git config: {e}")
            
        # Package.json author
        package_json = Path.cwd() / 'package.json'
        if package_json.exists():
            try:
                with open(package_json) as f:
                    data = json.load(f)
                    if 'author' in data:
                        if isinstance(data['author'], str):
                            system_info['npm_author'] = data['author']
                        elif isinstance(data['author'], dict):
                            system_info['npm_author'] = data['author'].get('name', '')
                            system_info['npm_email'] = data['author'].get('email', '')
            except Exception as e:
                logger.debug(f"Could not read package.json: {e}")
                
        # LICENSE file
        license_file = Path.cwd() / 'LICENSE'
        if license_file.exists():
            try:
                content = license_file.read_text()
                # Look for copyright line
                copyright_match = re.search(r'Copyright\s+(?:\(c\)\s+)?(\d{4})?\s*(.+)', content, re.I)
                if copyright_match:
                    holder = copyright_match.group(2).strip()
                    # Clean common suffixes
                    holder = re.sub(r'\s*<[^>]+>$', '', holder)  # Remove email
                    holder = re.sub(r'\s*\([^)]+\)$', '', holder)  # Remove parenthetical
                    if holder and not holder.startswith('['):
                        system_info['license_holder'] = holder
            except Exception as e:
                logger.debug(f"Could not read LICENSE: {e}")
                
        return system_info
```

### Behavioral Profiling Engine

```python
class BehavioralProfiler:
    """Analyzes and profiles user behavior - MIRA_2.0.md lines 133-140"""
    
    def __init__(self):
        self.communication_analyzer = CommunicationStyleAnalyzer()
        self.work_pattern_analyzer = WorkPatternAnalyzer()
        self.preference_learner = PreferenceLearner()
        self.relationship_tracker = RelationshipTracker()
        
    async def analyze_communication_style(self, messages: List[str]) -> ProfileAttribute:
        """Analyze communication style from messages"""
        if not messages:
            return None
            
        style_indicators = {
            'formal': 0,
            'casual': 0,
            'technical': 0,
            'emoji_count': 0,
            'avg_length': 0,
            'punctuation': 0
        }
        
        for message in messages:
            # Formality indicators
            if any(word in message.lower() for word in ['please', 'kindly', 'would you', 'could you']):
                style_indicators['formal'] += 1
            if any(word in message.lower() for word in ['hey', 'gonna', 'wanna', 'yeah']):
                style_indicators['casual'] += 1
                
            # Technical depth
            technical_terms = re.findall(r'\b(?:API|HTTP|JSON|function|class|method|variable)\b', message, re.I)
            style_indicators['technical'] += len(technical_terms)
            
            # Emoji usage
            emoji_pattern = re.compile("["
                "\U0001F600-\U0001F64F"  # emoticons
                "\U0001F300-\U0001F5FF"  # symbols & pictographs
                "\U0001F680-\U0001F6FF"  # transport & map symbols
                "\U0001F1E0-\U0001F1FF"  # flags
                "]+", flags=re.UNICODE)
            style_indicators['emoji_count'] += len(emoji_pattern.findall(message))
            
            # Message length
            style_indicators['avg_length'] += len(message.split())
            
        # Calculate averages
        style_indicators['avg_length'] /= len(messages)
        
        # Determine primary style
        if style_indicators['formal'] > style_indicators['casual'] * 2:
            style = CommunicationStyle.FORMAL
        elif style_indicators['casual'] > style_indicators['formal'] * 2:
            style = CommunicationStyle.CASUAL
        elif style_indicators['technical'] > len(messages) * 0.3:
            style = CommunicationStyle.TECHNICAL
        else:
            style = CommunicationStyle.PROFESSIONAL_CASUAL
            
        # Calculate confidence based on consistency
        total_indicators = style_indicators['formal'] + style_indicators['casual']
        if total_indicators > 0:
            consistency = max(style_indicators['formal'], style_indicators['casual']) / total_indicators
            confidence = min(0.9, 0.5 + consistency * 0.4)
        else:
            confidence = 0.5
            
        return ProfileAttribute(
            value=style.value,
            confidence=confidence,
            sources=['conversation_analysis']
        )
        
    async def analyze_work_patterns(self, timestamps: List[datetime]) -> Dict[str, Any]:
        """Analyze work patterns from activity timestamps"""
        if not timestamps:
            return {}
            
        patterns = {
            'peak_hours': [],
            'peak_days': [],
            'session_duration_avg': 0,
            'break_patterns': [],
            'productivity_score': 0
        }
        
        # Hour distribution
        hour_counts = {}
        day_counts = {}
        
        for ts in timestamps:
            hour = ts.hour
            day = ts.strftime('%A')
            
            hour_counts[hour] = hour_counts.get(hour, 0) + 1
            day_counts[day] = day_counts.get(day, 0) + 1
            
        # Find peak hours (top 3)
        if hour_counts:
            sorted_hours = sorted(hour_counts.items(), key=lambda x: x[1], reverse=True)
            patterns['peak_hours'] = [h for h, _ in sorted_hours[:3]]
            
        # Find peak days
        if day_counts:
            sorted_days = sorted(day_counts.items(), key=lambda x: x[1], reverse=True)
            patterns['peak_days'] = [d for d, _ in sorted_days[:2]]
            
        # Analyze sessions
        sessions = self._identify_sessions(timestamps)
        if sessions:
            durations = [(s[1] - s[0]).total_seconds() / 3600 for s in sessions]
            patterns['session_duration_avg'] = sum(durations) / len(durations)
            
            # Break patterns
            if len(sessions) > 1:
                breaks = []
                for i in range(1, len(sessions)):
                    break_duration = (sessions[i][0] - sessions[i-1][1]).total_seconds() / 3600
                    breaks.append(break_duration)
                    
                if breaks:
                    avg_break = sum(breaks) / len(breaks)
                    patterns['break_patterns'] = {
                        'average_break_hours': avg_break,
                        'break_frequency': f"every {patterns['session_duration_avg']:.1f} hours"
                    }
                    
        return patterns
        
    def _identify_sessions(self, timestamps: List[datetime], 
                          gap_threshold_hours: float = 2.0) -> List[tuple]:
        """Identify work sessions from timestamps"""
        if not timestamps:
            return []
            
        sorted_ts = sorted(timestamps)
        sessions = []
        session_start = sorted_ts[0]
        last_ts = sorted_ts[0]
        
        for ts in sorted_ts[1:]:
            gap = (ts - last_ts).total_seconds() / 3600
            
            if gap > gap_threshold_hours:
                # End current session
                sessions.append((session_start, last_ts))
                session_start = ts
                
            last_ts = ts
            
        # Add final session
        sessions.append((session_start, last_ts))
        
        return sessions


class PreferenceLearner:
    """Learns user preferences through observation"""
    
    def __init__(self):
        self.observations = {}
        
    async def observe_preference(self, category: str, choice: str, context: Dict[str, Any]):
        """Record a preference observation"""
        if category not in self.observations:
            self.observations[category] = {}
            
        if choice not in self.observations[category]:
            self.observations[category][choice] = {
                'count': 0,
                'contexts': [],
                'last_seen': None
            }
            
        self.observations[category][choice]['count'] += 1
        self.observations[category][choice]['contexts'].append(context)
        self.observations[category][choice]['last_seen'] = datetime.now()
        
    async def get_preferences(self) -> Dict[str, ProfileAttribute]:
        """Get learned preferences with confidence scores"""
        preferences = {}
        
        for category, choices in self.observations.items():
            if choices:
                # Find most common choice
                sorted_choices = sorted(choices.items(), 
                                      key=lambda x: x[1]['count'], 
                                      reverse=True)
                
                top_choice = sorted_choices[0][0]
                top_count = sorted_choices[0][1]['count']
                total_count = sum(c[1]['count'] for c in sorted_choices)
                
                # Calculate confidence based on dominance
                confidence = min(0.95, (top_count / total_count) * 0.8 + 0.15)
                
                preferences[category] = ProfileAttribute(
                    value=top_choice,
                    confidence=confidence,
                    sources=['behavioral_observation'],
                    observation_count=total_count
                )
                
        return preferences


class RelationshipTracker:
    """Tracks relationship metrics - MIRA_2.0.md line 140"""
    
    def __init__(self):
        self.metrics = {
            'trust_level': 0.5,
            'interaction_count': 0,
            'successful_interactions': 0,
            'collaboration_depth': 'shallow',
            'topic_complexity': []
        }
        
    async def record_interaction(self, interaction_type: str, 
                               success: bool, 
                               complexity: str = 'simple'):
        """Record an interaction and update metrics"""
        self.metrics['interaction_count'] += 1
        
        if success:
            self.metrics['successful_interactions'] += 1
            # Increase trust on success
            trust_boost = 0.02 if complexity == 'simple' else 0.05
            self.metrics['trust_level'] = min(0.99, 
                self.metrics['trust_level'] + trust_boost)
        else:
            # Decrease trust on failure
            trust_penalty = 0.05 if complexity == 'simple' else 0.10
            self.metrics['trust_level'] = max(0.1, 
                self.metrics['trust_level'] - trust_penalty)
            
        # Track complexity
        self.metrics['topic_complexity'].append(complexity)
        
        # Update collaboration depth
        if self.metrics['interaction_count'] > 100:
            complex_ratio = self.metrics['topic_complexity'].count('complex') / len(self.metrics['topic_complexity'])
            
            if complex_ratio > 0.6 and self.metrics['trust_level'] > 0.8:
                self.metrics['collaboration_depth'] = 'deep'
            elif complex_ratio > 0.3 and self.metrics['trust_level'] > 0.6:
                self.metrics['collaboration_depth'] = 'moderate'
            else:
                self.metrics['collaboration_depth'] = 'shallow'
```

### Main Steward Profile Analyzer

```python
class StewardProfileAnalyzer(BaseAnalyzer):
    """Main analyzer that orchestrates all profile analysis"""
    
    def __init__(self, memory_manager):
        self.memory_manager = memory_manager
        self.profile = None
        self.identity_recognizer = IdentityRecognizer()
        self.behavioral_profiler = BehavioralProfiler()
        self._load_or_create_profile()
        
    async def _load_or_create_profile(self):
        """Load existing profile or create new one"""
        try:
            # Try to load from memory
            profile_data = await self.memory_manager.get_from_chromadb(
                collection='steward_profiles',
                filter={'type': 'primary'}
            )
            
            if profile_data:
                self.profile = self._deserialize_profile(profile_data[0])
                logger.info("Loaded existing steward profile")
            else:
                self.profile = StewardProfile()
                logger.info("Created new steward profile")
                
        except Exception as e:
            logger.error(f"Error loading profile: {e}")
            self.profile = StewardProfile()
            
    async def analyze_message(self, message: str) -> Dict[str, Any]:
        """Analyze a single message and update profile"""
        # Extract identity information
        identity_data = await self.identity_recognizer.extract_from_conversation(message)
        
        # Update profile with findings
        updates = []
        
        if 'name' in identity_data:
            if self.profile.name:
                # Check consistency
                consistent = identity_data['name'] == self.profile.name.value
                self.profile.name.update(identity_data['name'], 'conversation', consistent)
            else:
                self.profile.name = ProfileAttribute(
                    value=identity_data['name'],
                    confidence=0.7,
                    sources=['conversation']
                )
            updates.append(f"Name: {identity_data['name']}")
            
        if 'pronouns' in identity_data:
            if self.profile.pronouns:
                consistent = identity_data['pronouns'] == self.profile.pronouns.value
                self.profile.pronouns.update(identity_data['pronouns'], 'explicit', consistent)
            else:
                self.profile.pronouns = ProfileAttribute(
                    value=identity_data['pronouns'],
                    confidence=0.9,  # High confidence for explicit
                    sources=['explicit_statement']
                )
            updates.append(f"Pronouns: {identity_data['pronouns']}")
            
        # Update technical skills
        if 'skills' in identity_data:
            for lang in identity_data['skills'].get('languages', []):
                if lang not in self.profile.languages:
                    self.profile.languages[lang] = ProfileAttribute(
                        value=True,
                        confidence=0.6,
                        sources=['conversation']
                    )
                else:
                    self.profile.languages[lang].observation_count += 1
                    self.profile.languages[lang].confidence = min(0.95, 
                        self.profile.languages[lang].confidence + 0.05)
                        
        # Update interaction metrics
        await self.behavioral_profiler.relationship_tracker.record_interaction(
            'conversation',
            success=True,
            complexity='simple'
        )
        
        # Save updated profile
        await self._save_profile()
        
        return {
            'updates': updates,
            'profile_version': self.profile.version
        }
        
    async def comprehensive_analysis(self, message: str, 
                                   profile: StewardProfile,
                                   include_history: bool = True) -> Dict[str, Any]:
        """Perform comprehensive behavioral analysis"""
        analysis = {
            'immediate': await self.analyze_message(message),
            'confidence': 0.0,
            'insights': []
        }
        
        if include_history:
            # Get recent messages for context
            recent_messages = await self.memory_manager.get_recent_conversations(hours=24)
            
            # Analyze communication style
            if recent_messages:
                style = await self.behavioral_profiler.analyze_communication_style(
                    [msg['content'] for msg in recent_messages]
                )
                if style:
                    self.profile.communication_style = style
                    analysis['insights'].append(
                        f"Communication style: {style.value} (confidence: {style.confidence:.2f})"
                    )
                    
            # Analyze work patterns
            timestamps = [msg['timestamp'] for msg in recent_messages]
            if timestamps:
                patterns = await self.behavioral_profiler.analyze_work_patterns(timestamps)
                self.profile.patterns.update(patterns)
                
                if patterns.get('peak_hours'):
                    analysis['insights'].append(
                        f"Most active hours: {patterns['peak_hours']}"
                    )
                    
        # Calculate overall confidence
        identity_confidence = []
        if self.profile.name:
            identity_confidence.append(self.profile.name.confidence)
        if self.profile.pronouns:
            identity_confidence.append(self.profile.pronouns.confidence)
            
        analysis['confidence'] = sum(identity_confidence) / len(identity_confidence) if identity_confidence else 0.5
        
        return analysis
        
    async def get_current_profile(self) -> Dict[str, Any]:
        """Get the current steward profile"""
        # Update from system sources
        system_data = await self.identity_recognizer.extract_from_system()
        
        # Update profile with system data
        if 'git_name' in system_data and not self.profile.name:
            self.profile.name = ProfileAttribute(
                value=system_data['git_name'],
                confidence=0.8,
                sources=['git_config']
            )
            
        if 'git_email' in system_data and not self.profile.email:
            self.profile.email = ProfileAttribute(
                value=system_data['git_email'],
                confidence=1.0,
                sources=['git_config']
            )
            
        # Apply time decay to confidence scores
        for attr in [self.profile.name, self.profile.pronouns, self.profile.email]:
            if attr:
                attr.apply_time_decay()
                
        # Get relationship metrics
        self.profile.trust_level = self.behavioral_profiler.relationship_tracker.metrics['trust_level']
        self.profile.interaction_count = self.behavioral_profiler.relationship_tracker.metrics['interaction_count']
        self.profile.collaboration_depth = self.behavioral_profiler.relationship_tracker.metrics['collaboration_depth']
        
        return self.profile.to_dict()
        
    async def update_profile_from_analysis(self, analysis: Dict[str, Any]):
        """Update profile based on analysis results"""
        self.profile.last_updated = datetime.now()
        self.profile.version += 1
        
        await self._save_profile()
        
    async def _save_profile(self):
        """Save profile to memory systems"""
        profile_data = self.profile.to_dict()
        
        # Save to ChromaDB
        await self.memory_manager.store_to_chromadb(
            content=json.dumps(profile_data),
            metadata={
                'type': 'steward_profile',
                'subtype': 'primary',
                'version': self.profile.version,
                'last_updated': self.profile.last_updated.isoformat()
            },
            collection='steward_profiles'
        )
        
        # Also save to Lightning Vidmem for backup
        await self.memory_manager.store_to_lightning_vidmem(
            content=json.dumps(profile_data),
            metadata={
                'type': 'steward_profile_backup',
                'version': self.profile.version
            }
        )
        
    def _deserialize_profile(self, data: Dict[str, Any]) -> StewardProfile:
        """Deserialize profile from stored data"""
        profile = StewardProfile()
        
        # Deserialize identity
        if 'identity' in data:
            for field in ['name', 'pronouns', 'email', 'title', 'organization']:
                if field in data['identity'] and data['identity'][field]:
                    attr_data = data['identity'][field]
                    setattr(profile, field, ProfileAttribute(
                        value=attr_data['value'],
                        confidence=attr_data['confidence'],
                        sources=attr_data['sources'],
                        last_updated=datetime.fromisoformat(attr_data['last_updated']),
                        observation_count=attr_data.get('observation_count', 1)
                    ))
                    
        # ... deserialize other sections ...
        
        return profile
```

## 🔧 Integration Example

```python
# In the MCP Server
async def _handle_analyze_behavior(self, message: str, 
                                  analysis_type: str = 'comprehensive',
                                  include_history: bool = True):
    """Handle behavioral analysis request"""
    analyzer = self.components['steward_analyzer']
    
    # Get current profile
    profile = await analyzer.get_current_profile()
    
    # Perform analysis
    if analysis_type == 'comprehensive':
        analysis = await analyzer.comprehensive_analysis(
            message=message,
            profile=analyzer.profile,
            include_history=include_history
        )
    else:
        analysis = await analyzer.analyze_message(message)
        
    # Update profile
    await analyzer.update_profile_from_analysis(analysis)
    
    return {
        'analysis': analysis,
        'profile_summary': {
            'name': profile['identity']['name']['value'] if profile['identity']['name'] else 'Unknown',
            'trust_level': profile['relationship']['trust_level'],
            'interaction_count': profile['relationship']['interaction_count']
        }
    }
```

---

*This implementation provides a sophisticated user understanding system that continuously learns and adapts to provide personalized assistance.*