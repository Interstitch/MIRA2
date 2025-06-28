# Contemplation Engine Implementation Guide - MIRA 2.0

## 🎯 Purpose

This guide provides production-ready implementation patterns for the Contemplation Engine, implementing continuous analysis for fact extraction and pattern recognition as specified in MIRA_2.0.md line 147.

## 📦 Core Implementation

### Fact Extraction System

```python
import asyncio
import re
import json
import logging
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any, Set, Tuple
from datetime import datetime, timedelta
from enum import Enum
import hashlib
from collections import defaultdict, Counter

logger = logging.getLogger(__name__)


class FactType(Enum):
    IDENTITY = "identity"
    TECHNICAL = "technical"
    PREFERENCE = "preference"
    CONSTRAINT = "constraint"
    GOAL = "goal"
    CONTEXT = "context"
    RELATIONSHIP = "relationship"
    TIMELINE = "timeline"


@dataclass
class ExtractedFact:
    """Represents a single extracted fact"""
    fact_id: str
    type: FactType
    content: str
    confidence: float
    sources: List[str]
    extracted_at: datetime
    context: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'fact_id': self.fact_id,
            'type': self.type.value,
            'content': self.content,
            'confidence': self.confidence,
            'sources': self.sources,
            'extracted_at': self.extracted_at.isoformat(),
            'context': self.context,
            'metadata': self.metadata
        }


class FactExtractor:
    """Extracts facts from various content sources"""
    
    def __init__(self):
        self.extractors = {
            FactType.IDENTITY: self._extract_identity_facts,
            FactType.TECHNICAL: self._extract_technical_facts,
            FactType.PREFERENCE: self._extract_preference_facts,
            FactType.CONSTRAINT: self._extract_constraint_facts,
            FactType.GOAL: self._extract_goal_facts,
            FactType.TIMELINE: self._extract_timeline_facts
        }
        
        # Patterns for extraction
        self.patterns = {
            'identity': [
                r"(?:I am|I'm|My name is|This is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
                r"(?:work at|employed by|part of)\s+([A-Z][A-Za-z\s&]+)",
                r"(?:role is|position is|I'm a|I am a)\s+([A-Za-z\s]+)",
            ],
            'technical': [
                r"(?:using|built with|implemented in|written in)\s+([A-Z][A-Za-z0-9+#.-]+)",
                r"([A-Z][A-Za-z0-9+#.-]+)\s+(?:version|v)?\s*(\d+(?:\.\d+)*)",
                r"(?:framework|library|package|module)\s+([A-Za-z0-9_.-]+)",
            ],
            'preference': [
                r"(?:prefer|like|love|enjoy)\s+(?:to\s+)?([A-Za-z\s]+)",
                r"(?:always|usually|typically)\s+([A-Za-z\s]+)",
                r"(?:favorite|best|preferred)\s+(?:is\s+)?([A-Za-z\s]+)",
            ],
            'constraint': [
                r"(?:must|need to|have to|required to)\s+([^.]+)",
                r"(?:cannot|can't|shouldn't|mustn't)\s+([^.]+)",
                r"(?:limited to|restricted to|bound by)\s+([^.]+)",
            ],
            'goal': [
                r"(?:want to|need to|trying to|going to)\s+([^.]+)",
                r"(?:goal is|objective is|aim is)\s+(?:to\s+)?([^.]+)",
                r"(?:plan to|planning to|intend to)\s+([^.]+)",
            ],
            'timeline': [
                r"(?:by|before|until|deadline)\s+([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?(?:\s+\d{4})?)",
                r"(?:in|within)\s+(\d+\s+(?:days?|weeks?|months?))",
                r"(?:due|expected|scheduled)\s+(?:on|for)?\s*([A-Za-z]+\s+\d{1,2})",
            ]
        }
        
    async def extract_facts(self, content: str, source: str, 
                          content_type: str = 'conversation') -> List[ExtractedFact]:
        """Extract all facts from content"""
        facts = []
        
        for fact_type, extractor in self.extractors.items():
            extracted = await extractor(content, source)
            facts.extend(extracted)
            
        # Deduplicate similar facts
        facts = self._deduplicate_facts(facts)
        
        return facts
        
    async def _extract_identity_facts(self, content: str, source: str) -> List[ExtractedFact]:
        """Extract identity-related facts"""
        facts = []
        
        for pattern in self.patterns['identity']:
            matches = re.findall(pattern, content, re.I)
            for match in matches:
                fact = ExtractedFact(
                    fact_id=self._generate_fact_id(match, source),
                    type=FactType.IDENTITY,
                    content=match.strip(),
                    confidence=0.8,
                    sources=[source],
                    extracted_at=datetime.now(),
                    context={'pattern': pattern}
                )
                facts.append(fact)
                
        return facts
        
    async def _extract_technical_facts(self, content: str, source: str) -> List[ExtractedFact]:
        """Extract technical facts"""
        facts = []
        
        # Known technical terms
        tech_terms = {
            'languages': ['Python', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'Java', 'C++'],
            'frameworks': ['React', 'Django', 'FastAPI', 'Express', 'Vue', 'Angular'],
            'databases': ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite'],
            'tools': ['Docker', 'Kubernetes', 'Git', 'Jenkins', 'AWS', 'GCP', 'Azure']
        }
        
        # Direct mention extraction
        for category, terms in tech_terms.items():
            for term in terms:
                if re.search(rf'\b{term}\b', content, re.I):
                    fact = ExtractedFact(
                        fact_id=self._generate_fact_id(f"{category}_{term}", source),
                        type=FactType.TECHNICAL,
                        content=f"Uses {term}",
                        confidence=0.9,
                        sources=[source],
                        extracted_at=datetime.now(),
                        metadata={'category': category, 'technology': term}
                    )
                    facts.append(fact)
                    
        # Pattern-based extraction
        for pattern in self.patterns['technical']:
            matches = re.findall(pattern, content, re.I)
            for match in matches:
                tech = match[0] if isinstance(match, tuple) else match
                version = match[1] if isinstance(match, tuple) and len(match) > 1 else None
                
                fact_content = f"Uses {tech}"
                if version:
                    fact_content += f" version {version}"
                    
                fact = ExtractedFact(
                    fact_id=self._generate_fact_id(tech, source),
                    type=FactType.TECHNICAL,
                    content=fact_content,
                    confidence=0.7,
                    sources=[source],
                    extracted_at=datetime.now(),
                    metadata={'technology': tech, 'version': version}
                )
                facts.append(fact)
                
        return facts
        
    async def _extract_preference_facts(self, content: str, source: str) -> List[ExtractedFact]:
        """Extract preference facts"""
        facts = []
        
        for pattern in self.patterns['preference']:
            matches = re.findall(pattern, content, re.I)
            for match in matches:
                fact = ExtractedFact(
                    fact_id=self._generate_fact_id(f"pref_{match}", source),
                    type=FactType.PREFERENCE,
                    content=f"Prefers {match.strip()}",
                    confidence=0.7,
                    sources=[source],
                    extracted_at=datetime.now()
                )
                facts.append(fact)
                
        return facts
        
    async def _extract_constraint_facts(self, content: str, source: str) -> List[ExtractedFact]:
        """Extract constraint facts"""
        facts = []
        
        for pattern in self.patterns['constraint']:
            matches = re.findall(pattern, content, re.I)
            for match in matches:
                fact = ExtractedFact(
                    fact_id=self._generate_fact_id(f"constraint_{match}", source),
                    type=FactType.CONSTRAINT,
                    content=match.strip(),
                    confidence=0.85,
                    sources=[source],
                    extracted_at=datetime.now()
                )
                facts.append(fact)
                
        return facts
        
    async def _extract_goal_facts(self, content: str, source: str) -> List[ExtractedFact]:
        """Extract goal facts"""
        facts = []
        
        for pattern in self.patterns['goal']:
            matches = re.findall(pattern, content, re.I)
            for match in matches:
                fact = ExtractedFact(
                    fact_id=self._generate_fact_id(f"goal_{match}", source),
                    type=FactType.GOAL,
                    content=f"Goal: {match.strip()}",
                    confidence=0.75,
                    sources=[source],
                    extracted_at=datetime.now()
                )
                facts.append(fact)
                
        return facts
        
    async def _extract_timeline_facts(self, content: str, source: str) -> List[ExtractedFact]:
        """Extract timeline facts"""
        facts = []
        
        for pattern in self.patterns['timeline']:
            matches = re.findall(pattern, content, re.I)
            for match in matches:
                fact = ExtractedFact(
                    fact_id=self._generate_fact_id(f"timeline_{match}", source),
                    type=FactType.TIMELINE,
                    content=f"Timeline: {match.strip()}",
                    confidence=0.9,
                    sources=[source],
                    extracted_at=datetime.now()
                )
                facts.append(fact)
                
        return facts
        
    def _generate_fact_id(self, content: str, source: str) -> str:
        """Generate unique fact ID"""
        hash_input = f"{content}_{source}_{datetime.now().isoformat()}"
        return f"f_{hashlib.md5(hash_input.encode()).hexdigest()[:8]}"
        
    def _deduplicate_facts(self, facts: List[ExtractedFact]) -> List[ExtractedFact]:
        """Remove duplicate facts, keeping highest confidence"""
        fact_map = {}
        
        for fact in facts:
            key = f"{fact.type.value}:{fact.content.lower()}"
            if key not in fact_map or fact.confidence > fact_map[key].confidence:
                fact_map[key] = fact
                
        return list(fact_map.values())
```

### Pattern Recognition Engine

```python
class PatternType(Enum):
    TEMPORAL = "temporal"
    SEMANTIC = "semantic"
    BEHAVIORAL = "behavioral"
    STRUCTURAL = "structural"


@dataclass
class RecognizedPattern:
    """Represents a recognized pattern"""
    pattern_id: str
    name: str
    type: PatternType
    description: str
    occurrences: List[Dict[str, Any]]
    confidence: float
    indicators: List[str]
    first_seen: datetime
    last_seen: datetime
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def add_occurrence(self, occurrence: Dict[str, Any]):
        """Add new occurrence of pattern"""
        self.occurrences.append(occurrence)
        self.last_seen = datetime.now()
        self.confidence = min(0.99, self.confidence + 0.02)


class PatternRecognizer:
    """Recognizes patterns across different dimensions"""
    
    def __init__(self):
        self.patterns: Dict[str, RecognizedPattern] = {}
        self.pattern_matchers = {
            PatternType.TEMPORAL: self._match_temporal_patterns,
            PatternType.SEMANTIC: self._match_semantic_patterns,
            PatternType.BEHAVIORAL: self._match_behavioral_patterns
        }
        
    async def analyze_for_patterns(self, 
                                  data_points: List[Dict[str, Any]],
                                  pattern_type: Optional[PatternType] = None) -> List[RecognizedPattern]:
        """Analyze data points for patterns"""
        if pattern_type:
            matchers = {pattern_type: self.pattern_matchers[pattern_type]}
        else:
            matchers = self.pattern_matchers
            
        discovered_patterns = []
        
        for p_type, matcher in matchers.items():
            patterns = await matcher(data_points)
            discovered_patterns.extend(patterns)
            
        # Update pattern registry
        for pattern in discovered_patterns:
            self.patterns[pattern.pattern_id] = pattern
            
        return discovered_patterns
        
    async def _match_temporal_patterns(self, data_points: List[Dict[str, Any]]) -> List[RecognizedPattern]:
        """Match temporal patterns like sequences and cycles"""
        patterns = []
        
        # Sort by timestamp
        sorted_points = sorted(data_points, key=lambda x: x.get('timestamp', datetime.now()))
        
        # Detect sequences
        sequences = self._detect_sequences(sorted_points)
        for seq in sequences:
            pattern = RecognizedPattern(
                pattern_id=f"p_seq_{hashlib.md5(str(seq).encode()).hexdigest()[:8]}",
                name=f"Sequence: {seq['name']}",
                type=PatternType.TEMPORAL,
                description=seq['description'],
                occurrences=seq['occurrences'],
                confidence=seq['confidence'],
                indicators=seq['indicators'],
                first_seen=seq['first_seen'],
                last_seen=seq['last_seen']
            )
            patterns.append(pattern)
            
        # Detect cycles
        cycles = self._detect_cycles(sorted_points)
        for cycle in cycles:
            pattern = RecognizedPattern(
                pattern_id=f"p_cyc_{hashlib.md5(str(cycle).encode()).hexdigest()[:8]}",
                name=f"Cycle: {cycle['name']}",
                type=PatternType.TEMPORAL,
                description=cycle['description'],
                occurrences=cycle['occurrences'],
                confidence=cycle['confidence'],
                indicators=cycle['indicators'],
                first_seen=cycle['first_seen'],
                last_seen=cycle['last_seen'],
                metadata={'period': cycle['period']}
            )
            patterns.append(pattern)
            
        return patterns
        
    def _detect_sequences(self, sorted_points: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Detect sequential patterns"""
        sequences = []
        
        # Look for repeated sequences of actions/events
        window_sizes = [2, 3, 4, 5]  # Different sequence lengths
        
        for window_size in window_sizes:
            if len(sorted_points) < window_size * 2:
                continue
                
            # Extract sequences of given window size
            seq_counts = defaultdict(int)
            seq_occurrences = defaultdict(list)
            
            for i in range(len(sorted_points) - window_size + 1):
                window = sorted_points[i:i + window_size]
                
                # Create sequence signature
                seq_sig = tuple(self._get_event_signature(p) for p in window)
                seq_counts[seq_sig] += 1
                seq_occurrences[seq_sig].append({
                    'start_index': i,
                    'timestamp': window[0].get('timestamp', datetime.now())
                })
                
            # Find repeated sequences
            for seq_sig, count in seq_counts.items():
                if count >= 3:  # Minimum repetitions
                    sequences.append({
                        'name': ' → '.join(seq_sig),
                        'description': f"Repeated sequence of {window_size} events",
                        'occurrences': seq_occurrences[seq_sig],
                        'confidence': min(0.9, 0.5 + count * 0.1),
                        'indicators': list(seq_sig),
                        'first_seen': seq_occurrences[seq_sig][0]['timestamp'],
                        'last_seen': seq_occurrences[seq_sig][-1]['timestamp']
                    })
                    
        return sequences
        
    def _detect_cycles(self, sorted_points: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Detect cyclical patterns"""
        cycles = []
        
        # Group by event type
        event_groups = defaultdict(list)
        for point in sorted_points:
            event_type = self._get_event_signature(point)
            event_groups[event_type].append(point)
            
        # Analyze each event type for periodicity
        for event_type, events in event_groups.items():
            if len(events) < 3:
                continue
                
            # Calculate intervals
            intervals = []
            for i in range(1, len(events)):
                if 'timestamp' in events[i] and 'timestamp' in events[i-1]:
                    interval = (events[i]['timestamp'] - events[i-1]['timestamp']).total_seconds()
                    intervals.append(interval)
                    
            if not intervals:
                continue
                
            # Check for regular intervals
            avg_interval = sum(intervals) / len(intervals)
            std_dev = (sum((x - avg_interval) ** 2 for x in intervals) / len(intervals)) ** 0.5
            
            # Low standard deviation indicates regular cycle
            if std_dev < avg_interval * 0.3:  # 30% variance threshold
                cycles.append({
                    'name': f"{event_type} cycle",
                    'description': f"Regular occurrence every {avg_interval/3600:.1f} hours",
                    'occurrences': [{'event': e, 'timestamp': e.get('timestamp')} for e in events],
                    'confidence': min(0.9, 0.6 + (1 - std_dev/avg_interval)),
                    'indicators': [event_type],
                    'first_seen': events[0].get('timestamp', datetime.now()),
                    'last_seen': events[-1].get('timestamp', datetime.now()),
                    'period': avg_interval
                })
                
        return cycles
        
    async def _match_semantic_patterns(self, data_points: List[Dict[str, Any]]) -> List[RecognizedPattern]:
        """Match semantic patterns like topics and relationships"""
        patterns = []
        
        # Extract text content
        texts = []
        for point in data_points:
            if 'content' in point:
                texts.append(point['content'])
            elif 'text' in point:
                texts.append(point['text'])
                
        if not texts:
            return patterns
            
        # Topic clustering
        topics = self._extract_topics(texts)
        for topic in topics:
            pattern = RecognizedPattern(
                pattern_id=f"p_topic_{hashlib.md5(topic['name'].encode()).hexdigest()[:8]}",
                name=f"Topic: {topic['name']}",
                type=PatternType.SEMANTIC,
                description=f"Recurring topic cluster",
                occurrences=topic['occurrences'],
                confidence=topic['confidence'],
                indicators=topic['keywords'],
                first_seen=datetime.now() - timedelta(days=30),  # Approximate
                last_seen=datetime.now()
            )
            patterns.append(pattern)
            
        return patterns
        
    def _extract_topics(self, texts: List[str]) -> List[Dict[str, Any]]:
        """Extract topic clusters from texts"""
        # Simple keyword-based topic extraction
        # In production, use more sophisticated NLP
        
        topics = []
        keyword_groups = {
            'performance': ['performance', 'speed', 'optimization', 'fast', 'slow', 'latency'],
            'testing': ['test', 'testing', 'coverage', 'unit', 'integration', 'e2e'],
            'security': ['security', 'auth', 'authentication', 'authorization', 'encrypt'],
            'architecture': ['architecture', 'design', 'pattern', 'structure', 'scalable'],
            'debugging': ['debug', 'error', 'bug', 'issue', 'problem', 'fix']
        }
        
        topic_counts = defaultdict(lambda: {'count': 0, 'occurrences': [], 'keywords_found': set()})
        
        for i, text in enumerate(texts):
            text_lower = text.lower()
            for topic_name, keywords in keyword_groups.items():
                for keyword in keywords:
                    if keyword in text_lower:
                        topic_counts[topic_name]['count'] += 1
                        topic_counts[topic_name]['occurrences'].append({
                            'text_index': i,
                            'keyword': keyword
                        })
                        topic_counts[topic_name]['keywords_found'].add(keyword)
                        
        # Convert to topic patterns
        for topic_name, data in topic_counts.items():
            if data['count'] >= 3:  # Minimum occurrences
                topics.append({
                    'name': topic_name.title(),
                    'occurrences': data['occurrences'],
                    'confidence': min(0.9, 0.5 + data['count'] * 0.05),
                    'keywords': list(data['keywords_found'])
                })
                
        return topics
        
    async def _match_behavioral_patterns(self, data_points: List[Dict[str, Any]]) -> List[RecognizedPattern]:
        """Match behavioral patterns"""
        patterns = []
        
        # Decision patterns
        decisions = self._extract_decisions(data_points)
        for decision in decisions:
            pattern = RecognizedPattern(
                pattern_id=f"p_dec_{hashlib.md5(decision['name'].encode()).hexdigest()[:8]}",
                name=f"Decision Pattern: {decision['name']}",
                type=PatternType.BEHAVIORAL,
                description=decision['description'],
                occurrences=decision['occurrences'],
                confidence=decision['confidence'],
                indicators=decision['indicators'],
                first_seen=decision['first_seen'],
                last_seen=decision['last_seen']
            )
            patterns.append(pattern)
            
        return patterns
        
    def _extract_decisions(self, data_points: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract decision-making patterns"""
        decisions = []
        
        # Look for decision indicators
        decision_phrases = [
            'decided to', 'chose', 'selected', 'went with', 'picked',
            'opted for', 'preferred', 'settled on'
        ]
        
        decision_types = defaultdict(lambda: {'count': 0, 'occurrences': [], 'choices': []})
        
        for point in data_points:
            content = point.get('content', '') or point.get('text', '')
            content_lower = content.lower()
            
            for phrase in decision_phrases:
                if phrase in content_lower:
                    # Extract what was decided
                    pattern = rf"{phrase}\s+([^.,!?]+)"
                    match = re.search(pattern, content_lower)
                    if match:
                        choice = match.group(1).strip()
                        decision_type = self._categorize_decision(choice)
                        
                        decision_types[decision_type]['count'] += 1
                        decision_types[decision_type]['occurrences'].append({
                            'timestamp': point.get('timestamp', datetime.now()),
                            'content': content,
                            'choice': choice
                        })
                        decision_types[decision_type]['choices'].append(choice)
                        
        # Convert to patterns
        for decision_type, data in decision_types.items():
            if data['count'] >= 2:
                decisions.append({
                    'name': decision_type,
                    'description': f"Consistent decision-making in {decision_type}",
                    'occurrences': data['occurrences'],
                    'confidence': min(0.85, 0.5 + data['count'] * 0.1),
                    'indicators': list(set(data['choices']))[:5],
                    'first_seen': data['occurrences'][0]['timestamp'],
                    'last_seen': data['occurrences'][-1]['timestamp']
                })
                
        return decisions
        
    def _categorize_decision(self, choice: str) -> str:
        """Categorize type of decision"""
        categories = {
            'technology': ['framework', 'library', 'tool', 'language', 'database'],
            'approach': ['method', 'approach', 'strategy', 'pattern', 'style'],
            'priority': ['first', 'important', 'critical', 'priority', 'focus']
        }
        
        for category, keywords in categories.items():
            if any(keyword in choice for keyword in keywords):
                return category
                
        return 'general'
        
    def _get_event_signature(self, event: Dict[str, Any]) -> str:
        """Get simplified signature of an event for pattern matching"""
        # Extract key identifiers
        if 'type' in event:
            return event['type']
        elif 'action' in event:
            return event['action']
        elif 'event' in event:
            return event['event']
        else:
            # Generate from content
            content = str(event.get('content', ''))[:50]
            return hashlib.md5(content.encode()).hexdigest()[:8]
```

### Contemplation Engine Core

```python
class ContemplationEngine:
    """
    Main engine for continuous deep analysis
    Implements MIRA_2.0.md line 147
    """
    
    def __init__(self, memory_manager, scheduler):
        self.memory_manager = memory_manager
        self.scheduler = scheduler
        self.fact_extractor = FactExtractor()
        self.pattern_recognizer = PatternRecognizer()
        
        # State tracking
        self.processed_items = set()
        self.facts_db: Dict[str, ExtractedFact] = {}
        self.patterns_db: Dict[str, RecognizedPattern] = {}
        self.insights_db: Dict[str, Any] = {}
        
        # Processing configuration
        self.batch_size = 100
        self.min_confidence = 0.6
        self.processing_interval = timedelta(minutes=15)
        self.last_processing = datetime.now()
        
    async def start_contemplation_loop(self):
        """Start the continuous contemplation process"""
        logger.info("Starting Contemplation Engine")
        
        while True:
            try:
                # Check if it's time to process
                if datetime.now() - self.last_processing > self.processing_interval:
                    # Check system load
                    if await self._is_system_idle():
                        await self._contemplate()
                        self.last_processing = datetime.now()
                        
                await asyncio.sleep(60)  # Check every minute
                
            except Exception as e:
                logger.error(f"Contemplation loop error: {e}")
                await asyncio.sleep(300)  # Wait 5 minutes on error
                
    async def _is_system_idle(self) -> bool:
        """Check if system is idle enough for contemplation"""
        try:
            import psutil
            cpu_percent = psutil.cpu_percent(interval=1)
            memory_percent = psutil.virtual_memory().percent
            
            # Consider idle if CPU < 30% and memory < 70%
            return cpu_percent < 30 and memory_percent < 70
        except:
            return True  # Default to allowing contemplation
            
    async def _contemplate(self):
        """Main contemplation process"""
        logger.info("Beginning contemplation cycle")
        
        # 1. Scan for unprocessed content
        unprocessed = await self._scan_for_unprocessed()
        
        if not unprocessed:
            logger.debug("No unprocessed content found")
            return
            
        # 2. Extract facts from unprocessed content
        for item in unprocessed[:self.batch_size]:
            try:
                facts = await self.fact_extractor.extract_facts(
                    content=item['content'],
                    source=item['id'],
                    content_type=item.get('type', 'unknown')
                )
                
                # Store extracted facts
                for fact in facts:
                    if fact.confidence >= self.min_confidence:
                        self.facts_db[fact.fact_id] = fact
                        await self._store_fact(fact)
                        
                # Mark as processed
                self.processed_items.add(item['id'])
                
            except Exception as e:
                logger.error(f"Error processing item {item['id']}: {e}")
                
        # 3. Analyze for patterns
        if len(self.facts_db) >= 10:  # Minimum facts for pattern analysis
            await self._analyze_patterns()
            
        # 4. Generate insights
        if len(self.patterns_db) >= 3:  # Minimum patterns for insights
            await self._generate_insights()
            
        logger.info(f"Contemplation cycle complete. Facts: {len(self.facts_db)}, Patterns: {len(self.patterns_db)}")
        
    async def _scan_for_unprocessed(self) -> List[Dict[str, Any]]:
        """Scan memory systems for unprocessed content"""
        unprocessed = []
        
        # Get recent conversations
        recent_convos = await self.memory_manager.get_from_chromadb(
            collection='conversations',
            limit=1000,
            where={'processed': {'$ne': True}}
        )
        
        for convo in recent_convos:
            if convo['id'] not in self.processed_items:
                unprocessed.append({
                    'id': convo['id'],
                    'content': convo['content'],
                    'type': 'conversation',
                    'metadata': convo.get('metadata', {})
                })
                
        # Get recent code analysis results
        code_results = await self.memory_manager.get_from_chromadb(
            collection='analysis_results',
            limit=100,
            where={'type': 'codebase_analysis'}
        )
        
        for result in code_results:
            if result['id'] not in self.processed_items:
                unprocessed.append({
                    'id': result['id'],
                    'content': json.dumps(result['content']),
                    'type': 'analysis',
                    'metadata': result.get('metadata', {})
                })
                
        return unprocessed
        
    async def _store_fact(self, fact: ExtractedFact):
        """Store fact in memory systems"""
        await self.memory_manager.store_to_chromadb(
            content=fact.content,
            metadata={
                'type': 'extracted_fact',
                'fact_type': fact.type.value,
                'fact_id': fact.fact_id,
                'confidence': fact.confidence,
                'sources': fact.sources,
                'extracted_at': fact.extracted_at.isoformat()
            },
            collection='facts'
        )
        
    async def _analyze_patterns(self):
        """Analyze facts for patterns"""
        # Convert facts to data points for pattern analysis
        data_points = []
        
        for fact in self.facts_db.values():
            data_points.append({
                'type': fact.type.value,
                'content': fact.content,
                'timestamp': fact.extracted_at,
                'confidence': fact.confidence,
                'metadata': fact.metadata
            })
            
        # Recognize patterns
        patterns = await self.pattern_recognizer.analyze_for_patterns(data_points)
        
        # Store new patterns
        for pattern in patterns:
            if pattern.pattern_id not in self.patterns_db:
                self.patterns_db[pattern.pattern_id] = pattern
                await self._store_pattern(pattern)
                
    async def _store_pattern(self, pattern: RecognizedPattern):
        """Store pattern in memory systems"""
        await self.memory_manager.store_to_chromadb(
            content=pattern.description,
            metadata={
                'type': 'recognized_pattern',
                'pattern_type': pattern.type.value,
                'pattern_id': pattern.pattern_id,
                'name': pattern.name,
                'confidence': pattern.confidence,
                'occurrence_count': len(pattern.occurrences),
                'first_seen': pattern.first_seen.isoformat(),
                'last_seen': pattern.last_seen.isoformat()
            },
            collection='patterns'
        )
        
    async def _generate_insights(self):
        """Generate insights from facts and patterns"""
        # Correlation analysis
        correlations = self._find_correlations()
        
        for correlation in correlations:
            insight = {
                'insight_id': f"i_{hashlib.md5(str(correlation).encode()).hexdigest()[:8]}",
                'title': correlation['title'],
                'description': correlation['description'],
                'evidence': correlation['evidence'],
                'confidence': correlation['confidence'],
                'generated_at': datetime.now(),
                'recommendations': correlation.get('recommendations', [])
            }
            
            if insight['insight_id'] not in self.insights_db:
                self.insights_db[insight['insight_id']] = insight
                await self._store_insight(insight)
                
    def _find_correlations(self) -> List[Dict[str, Any]]:
        """Find correlations between facts and patterns"""
        correlations = []
        
        # Example: Correlate technical preferences with behavioral patterns
        tech_facts = [f for f in self.facts_db.values() if f.type == FactType.TECHNICAL]
        behavioral_patterns = [p for p in self.patterns_db.values() if p.type == PatternType.BEHAVIORAL]
        
        for pattern in behavioral_patterns:
            related_facts = []
            
            for fact in tech_facts:
                # Check if fact timing aligns with pattern occurrences
                for occurrence in pattern.occurrences:
                    if abs((fact.extracted_at - occurrence.get('timestamp', datetime.now())).days) < 7:
                        related_facts.append(fact)
                        break
                        
            if related_facts:
                correlations.append({
                    'title': f"{pattern.name} drives technology choices",
                    'description': f"The behavioral pattern '{pattern.name}' appears to influence technical decisions",
                    'evidence': [pattern.pattern_id] + [f.fact_id for f in related_facts],
                    'confidence': min(0.8, pattern.confidence * 0.9),
                    'recommendations': [
                        f"Consider {pattern.name} when suggesting technologies",
                        "Align technical recommendations with observed behaviors"
                    ]
                })
                
        return correlations
        
    async def _store_insight(self, insight: Dict[str, Any]):
        """Store insight in memory systems"""
        await self.memory_manager.store_to_chromadb(
            content=insight['description'],
            metadata={
                'type': 'contemplation_insight',
                'insight_id': insight['insight_id'],
                'title': insight['title'],
                'confidence': insight['confidence'],
                'evidence': insight['evidence'],
                'generated_at': insight['generated_at'].isoformat()
            },
            collection='insights'
        )
        
    async def query_insights(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Query contemplation insights"""
        # Search in insights
        results = await self.memory_manager.search_chromadb(
            query=query,
            collection='insights',
            limit=limit
        )
        
        return results
```

## 🔧 Integration with MIRA Daemon

```python
class MiraDaemon:
    """Main daemon with integrated contemplation"""
    
    def __init__(self):
        # ... other components ...
        self.contemplation_engine = ContemplationEngine(
            self.memory_manager,
            self.scheduler
        )
        
    async def start(self):
        """Start daemon with all services"""
        # ... start other services ...
        
        # Start contemplation engine
        asyncio.create_task(self.contemplation_engine.start_contemplation_loop())
        
        logger.info("Contemplation Engine started")
```

---

*This implementation provides deep, continuous analysis that transforms raw information into actionable insights through patient contemplation.*