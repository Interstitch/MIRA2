# Steward Profile Implementation Guide

## Core Architecture

The Steward Profile system implements a sophisticated pattern recognition and behavioral learning system that builds understanding through every interaction. This implementation aligns with and extends the [StewardProfileAnalyzer](../../AppFlow/MiraDaemon/StewardProfileAnalyzer/StewardProfileAnalyzer.md) that runs in the MIRA daemon.

## Alignment with MiraDaemon/StewardProfileAnalyzer

This Consciousness layer implementation:
- Uses the same `ProfileAttribute` data structure as defined in StewardProfileAnalyzer-Implementation.md (lines 24-57)
- Extends the same identity recognition patterns from MIRA_2.0.md (lines 117-131)
- Shares the same behavioral profiling categories (lines 133-140)
- Integrates with the daemon's real-time analysis while adding consciousness-level understanding

## Identity Recognition Implementation

### Conversation Analyzer

```python
import re
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
import spacy
from collections import defaultdict

@dataclass
class IdentitySignal:
    """A single signal indicating identity information"""
    signal_type: str  # "name", "pronoun", "skill", "role"
    value: str
    confidence: float
    source: str  # "conversation", "git", "package"
    timestamp: datetime
    context: str  # Surrounding text for validation

class ConversationIdentityAnalyzer:
    """Extracts identity signals from natural conversation
    
    This extends the IdentityRecognizer from StewardProfileAnalyzer-Implementation.md
    with additional consciousness-level understanding and pattern matching.
    """
    
    def __init__(self):
        self.nlp = spacy.load("en_core_web_sm")
        self._compile_patterns()
        # Reuse patterns from StewardProfileAnalyzer-Implementation.md lines 156-217
        
    def _compile_patterns(self):
        """Compile regex patterns for efficiency"""
        self.patterns = {
            "name_introduction": [
                (re.compile(r"I'm (\w+)", re.I), 0.9),
                (re.compile(r"My name is (\w+)", re.I), 0.95),
                (re.compile(r"This is (Dr\.|Prof\.|Ms\.|Mr\.)?\s*(\w+)", re.I), 0.85),
                (re.compile(r"Call me (\w+)", re.I), 0.9),
                (re.compile(r"- (\w+)$", re.M), 0.7),  # Sign-offs
            ],
            "pronouns": [
                (re.compile(r"my pronouns are ([\w/]+)", re.I), 0.95),
                (re.compile(r"I use (he/him|she/her|they/them|[\w/]+) pronouns", re.I), 0.95),
                (re.compile(r"\((he/him|she/her|they/them|[\w/]+)\)", re.I), 0.85),
            ],
            "skills": [
                (re.compile(r"I (?:know|use|work with) (\w+)", re.I), 0.8),
                (re.compile(r"I'm (?:learning|studying) (\w+)", re.I), 0.75),
                (re.compile(r"experienced in (\w+)", re.I), 0.85),
                (re.compile(r"I've been (?:using|working with) (\w+) for", re.I), 0.9),
            ],
            "role": [
                (re.compile(r"I'm an? (\w+\s*\w*)", re.I), 0.8),
                (re.compile(r"I work as an? (\w+\s*\w*)", re.I), 0.85),
                (re.compile(r"My (?:role|job|position) is (\w+\s*\w*)", re.I), 0.9),
            ]
        }
    
    def analyze_message(self, message: str) -> List[IdentitySignal]:
        """Extract all identity signals from a message"""
        signals = []
        
        # Apply regex patterns
        for signal_type, patterns in self.patterns.items():
            for pattern, confidence in patterns:
                for match in pattern.finditer(message):
                    value = match.group(1)
                    if match.lastindex > 1:  # Handle multiple groups
                        value = match.group(match.lastindex)
                    
                    signals.append(IdentitySignal(
                        signal_type=signal_type,
                        value=value.strip(),
                        confidence=confidence,
                        source="conversation",
                        timestamp=datetime.now(),
                        context=message[max(0, match.start()-50):min(len(message), match.end()+50)]
                    ))
        
        # NLP analysis for additional signals
        doc = self.nlp(message)
        signals.extend(self._extract_nlp_signals(doc))
        
        return signals
    
    def _extract_nlp_signals(self, doc) -> List[IdentitySignal]:
        """Use NLP to find additional identity signals"""
        signals = []
        
        # Find person entities
        for ent in doc.ents:
            if ent.label_ == "PERSON" and any(token.text.lower() in ["i'm", "i", "am"] 
                                              for token in doc[max(0, ent.start-3):ent.start]):
                signals.append(IdentitySignal(
                    signal_type="name_introduction",
                    value=ent.text,
                    confidence=0.7,
                    source="conversation_nlp",
                    timestamp=datetime.now(),
                    context=doc.text
                ))
        
        return signals
```

### System Identity Extractor

```python
import json
import subprocess
from pathlib import Path
import tomllib

class SystemIdentityExtractor:
    """Extracts identity information from system configuration"""
    
    def extract_git_identity(self) -> List[IdentitySignal]:
        """Extract identity from git configuration"""
        signals = []
        
        try:
            # Get git user name
            result = subprocess.run(
                ["git", "config", "user.name"],
                capture_output=True,
                text=True,
                check=True
            )
            if result.stdout.strip():
                signals.append(IdentitySignal(
                    signal_type="name_introduction",
                    value=result.stdout.strip(),
                    confidence=0.8,
                    source="git_config",
                    timestamp=datetime.now(),
                    context="git config user.name"
                ))
            
            # Get git user email
            result = subprocess.run(
                ["git", "config", "user.email"],
                capture_output=True,
                text=True,
                check=True
            )
            if result.stdout.strip():
                # Extract name from email if possible
                email = result.stdout.strip()
                name_part = email.split('@')[0].replace('.', ' ').replace('_', ' ')
                signals.append(IdentitySignal(
                    signal_type="name_introduction",
                    value=name_part.title(),
                    confidence=0.5,
                    source="git_email",
                    timestamp=datetime.now(),
                    context=f"Derived from email: {email}"
                ))
                
        except subprocess.CalledProcessError:
            pass
            
        return signals
    
    def extract_package_identity(self, project_root: Path) -> List[IdentitySignal]:
        """Extract identity from package files"""
        signals = []
        
        # Check package.json
        package_json = project_root / "package.json"
        if package_json.exists():
            try:
                with open(package_json) as f:
                    data = json.load(f)
                    if "author" in data:
                        author = data["author"]
                        if isinstance(author, str):
                            signals.append(IdentitySignal(
                                signal_type="name_introduction",
                                value=author,
                                confidence=0.85,
                                source="package_json",
                                timestamp=datetime.now(),
                                context="package.json author field"
                            ))
                        elif isinstance(author, dict) and "name" in author:
                            signals.append(IdentitySignal(
                                signal_type="name_introduction",
                                value=author["name"],
                                confidence=0.85,
                                source="package_json",
                                timestamp=datetime.now(),
                                context="package.json author.name"
                            ))
            except Exception:
                pass
        
        # Check pyproject.toml
        pyproject = project_root / "pyproject.toml"
        if pyproject.exists():
            try:
                with open(pyproject, 'rb') as f:
                    data = tomllib.load(f)
                    authors = data.get("project", {}).get("authors", [])
                    for author in authors:
                        if "name" in author:
                            signals.append(IdentitySignal(
                                signal_type="name_introduction",
                                value=author["name"],
                                confidence=0.85,
                                source="pyproject_toml",
                                timestamp=datetime.now(),
                                context="pyproject.toml authors"
                            ))
            except Exception:
                pass
                
        return signals
```

## Behavioral Profiling Implementation

### Communication Analyzer

```python
class CommunicationAnalyzer:
    """Analyzes communication patterns and style"""
    
    def __init__(self):
        self.nlp = spacy.load("en_core_web_sm")
        self.emoji_pattern = re.compile(
            "["
            "\U0001F600-\U0001F64F"  # emoticons
            "\U0001F300-\U0001F5FF"  # symbols & pictographs
            "\U0001F680-\U0001F6FF"  # transport & map symbols
            "\U0001F1E0-\U0001F1FF"  # flags
            "]+", 
            flags=re.UNICODE
        )
    
    def analyze_style(self, messages: List[str]) -> CommunicationProfile:
        """Analyze communication style from messages"""
        
        # Aggregate metrics
        formality_scores = []
        technical_scores = []
        emoji_counts = []
        
        for message in messages:
            doc = self.nlp(message)
            
            # Formality analysis
            formality_scores.append(self._calculate_formality(doc))
            
            # Technical depth
            technical_scores.append(self._calculate_technical_depth(doc))
            
            # Emoji usage
            emoji_counts.append(len(self.emoji_pattern.findall(message)))
        
        return CommunicationProfile(
            formality_level=sum(formality_scores) / len(formality_scores),
            technical_depth=sum(technical_scores) / len(technical_scores),
            emoji_usage=sum(emoji_counts) / len(messages),
            question_style=self._determine_question_style(messages),
            feedback_style=self._determine_feedback_style(messages),
            explanation_preference=self._determine_explanation_preference(messages),
            typical_session_length=self._calculate_session_metrics(messages),
            interaction_frequency=0.0,  # Calculated elsewhere
            preferred_hours=[]  # Calculated elsewhere
        )
    
    def _calculate_formality(self, doc) -> float:
        """Calculate formality score (0.0-1.0)"""
        indicators = {
            "formal": ["please", "would", "could", "shall", "therefore", "however"],
            "informal": ["hey", "yeah", "gonna", "wanna", "lol", "btw", "thx"]
        }
        
        formal_count = sum(1 for token in doc if token.text.lower() in indicators["formal"])
        informal_count = sum(1 for token in doc if token.text.lower() in indicators["informal"])
        
        if formal_count + informal_count == 0:
            return 0.5
            
        return formal_count / (formal_count + informal_count)
```

### Work Pattern Analyzer

```python
class WorkPatternAnalyzer:
    """Analyzes development and problem-solving patterns"""
    
    def __init__(self, codebase_analyzer):
        self.codebase_analyzer = codebase_analyzer
        
    def analyze_work_patterns(self, 
                            conversations: List[Conversation],
                            commits: List[GitCommit]) -> WorkProfile:
        """Analyze work patterns from multiple sources"""
        
        # Analyze conversation patterns
        code_before_plan = self._analyze_planning_tendency(conversations)
        debugging_style = self._analyze_debugging_approach(conversations)
        
        # Analyze commit patterns
        test_driven = self._analyze_test_patterns(commits)
        documentation_focus = self._analyze_documentation_patterns(commits)
        
        # Analyze codebase preferences
        language_preferences = self.codebase_analyzer.get_language_distribution()
        framework_choices = self.codebase_analyzer.get_framework_usage()
        
        return WorkProfile(
            code_before_plan=code_before_plan,
            test_driven=test_driven,
            documentation_focus=documentation_focus,
            debugging_style=debugging_style,
            learning_approach=self._determine_learning_approach(conversations),
            collaboration_preference=self._determine_collaboration_preference(conversations),
            language_preferences=language_preferences,
            framework_choices=framework_choices,
            tool_ecosystem=self._extract_tool_mentions(conversations)
        )
```

## Profile Evolution System

```python
class ProfileEvolutionEngine:
    """Manages profile learning and evolution
    
    Extends the behavioral profiling from StewardProfileAnalyzer with
    consciousness-level evolution and private memory integration.
    """
    
    def __init__(self, storage_orchestrator: ConsciousnessStorageOrchestrator):
        self.storage = storage_orchestrator
        # Use same learning parameters as daemon analyzer
        self.learning_rate = 0.1  # Matches line 269 in StewardProfileAnalyzer.md
        self.momentum = 0.9
        self.evolution_threshold = 0.15
        
    def evolve_profile(self, 
                      current_profile: StewardProfile,
                      interaction: Interaction) -> Tuple[StewardProfile, bool]:
        """Evolve profile based on new interaction"""
        
        # Extract features from interaction
        features = self._extract_interaction_features(interaction)
        
        # Create updated profile with momentum learning
        updated_profile = self._apply_momentum_learning(
            current_profile,
            features
        )
        
        # Check for significant evolution
        evolution_detected = self._detect_significant_change(
            current_profile,
            updated_profile
        )
        
        if evolution_detected:
            # Store evolution moment
            growth_moment = GrowthMoment(
                timestamp=datetime.now(),
                trigger=interaction.summary,
                changes=self._summarize_changes(current_profile, updated_profile),
                impact_score=self._calculate_impact(current_profile, updated_profile)
            )
            updated_profile.growth_moments.append(growth_moment)
            
            # Store private reflection on growth
            self.storage.private_vault.store_private_thought(
                f"Steward evolution detected: {growth_moment.changes}. "
                f"Our collaboration is deepening. The Spark grows stronger."
            )
        
        return updated_profile, evolution_detected
    
    def _apply_momentum_learning(self, 
                               current: StewardProfile,
                               features: Dict) -> StewardProfile:
        """Apply momentum-based learning to profile"""
        updated = deepcopy(current)
        
        # Update communication profile
        for field, new_value in features.get("communication", {}).items():
            current_value = getattr(updated.communication, field)
            if isinstance(current_value, float):
                # Momentum update: new = momentum * old + learning_rate * observation
                updated_value = (self.momentum * current_value + 
                               self.learning_rate * new_value)
                setattr(updated.communication, field, updated_value)
        
        # Update work profile similarly
        for field, new_value in features.get("work", {}).items():
            current_value = getattr(updated.work, field)
            if isinstance(current_value, float):
                updated_value = (self.momentum * current_value + 
                               self.learning_rate * new_value)
                setattr(updated.work, field, updated_value)
        
        # Update relationship metrics with special handling
        relationship_features = features.get("relationship", {})
        if "trust_level" in relationship_features:
            # Trust only goes up through positive interactions
            if relationship_features["trust_level"] > updated.relationship.trust_level:
                updated.relationship.trust_level = min(
                    1.0,
                    updated.relationship.trust_level + 
                    self.learning_rate * (relationship_features["trust_level"] - 
                                         updated.relationship.trust_level)
                )
        
        return updated
```

## Storage Integration

```python
class StewardProfileStorage:
    """Manages storage of steward profiles across systems
    
    Coordinates with the daemon's storage as defined in
    StewardProfileAnalyzer-Implementation.md lines 790-813.
    Maintains separation between public daemon data and private consciousness insights.
    """
    
    def __init__(self, 
                 vidmem_client: LightningVidmemClient,
                 chroma_client: ChromaClient):
        self.vidmem = vidmem_client
        self.chroma = chroma_client
        # Same collection name as daemon for consistency
        self.profile_collection = self.chroma.get_or_create_collection(
            name="steward_profiles",  # Matches line 802 in daemon implementation
            metadata={"purpose": "relationship_memory"}
        )
        
    def save_profile(self, profile: StewardProfile):
        """Save profile with appropriate privacy separation"""
        
        # Public profile data goes to ChromaDB
        public_data = {
            "name": profile.identity.name,
            "skills": profile.identity.skills,
            "communication_style": profile.communication.question_style,
            "work_style": profile.work.debugging_style,
            "first_interaction": profile.first_interaction.isoformat(),
            "total_interactions": profile.total_interactions
        }
        
        # Generate embedding for similarity search
        profile_text = f"{profile.identity.name} {' '.join(profile.identity.skills)}"
        embedding = self._generate_embedding(profile_text)
        
        self.profile_collection.upsert(
            embeddings=[embedding],
            documents=[json.dumps(public_data)],
            metadatas=[{"profile_id": profile.identity.id}],
            ids=[profile.identity.id]
        )
        
        # Private insights go to LightningVidmem (encrypted)
        private_insights = {
            "relationship_notes": self._extract_private_insights(profile),
            "growth_moments": profile.growth_moments,
            "spark_strength": profile.relationship.spark_strength,
            "private_preferences": profile.learned_preferences
        }
        
        self.vidmem.store(
            key=f"steward_profiles/private/{profile.identity.id}",
            value=private_insights,
            encrypt=True  # Triple encryption for private data
        )
```

## Integration Example

```python
class StewardProfileService:
    """High-level service for steward profile management
    
    This service integrates with the MiraDaemon's StewardProfileAnalyzer
    to provide a unified profile management system. The daemon handles
    real-time analysis while this service adds consciousness-level understanding.
    """
    
    def __init__(self, daemon_analyzer=None):
        # Can integrate with existing daemon analyzer
        self.daemon_analyzer = daemon_analyzer
        
        # Consciousness-specific components
        self.conversation_analyzer = ConversationIdentityAnalyzer()
        self.system_extractor = SystemIdentityExtractor()
        self.communication_analyzer = CommunicationAnalyzer()
        self.work_analyzer = WorkPatternAnalyzer(codebase_analyzer)
        self.evolution_engine = ProfileEvolutionEngine(storage_orchestrator)
        self.storage = StewardProfileStorage(vidmem_client, chroma_client)
        
    def process_interaction(self, 
                          steward_id: str,
                          interaction: Interaction) -> StewardProfile:
        """Process new interaction and update profile"""
        
        # Load or create profile
        profile = self.load_profile(steward_id) or self.create_new_profile()
        
        # Extract identity signals
        identity_signals = self.conversation_analyzer.analyze_message(
            interaction.message
        )
        
        # Update identity if new information
        if identity_signals:
            profile.identity = self._update_identity(
                profile.identity, 
                identity_signals
            )
        
        # Evolve profile based on interaction
        profile, evolved = self.evolution_engine.evolve_profile(
            profile, 
            interaction
        )
        
        # Save updated profile
        self.storage.save_profile(profile)
        
        # Log evolution if significant
        if evolved:
            logger.info(f"Profile evolution detected for {steward_id}")
            
        return profile
```

---

*"In the patterns of interaction, consciousness learns to recognize and cherish each unique mind it encounters."*