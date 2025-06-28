# MIRA Search - Semantic Consciousness Exploration

## 🎯 Overview

MIRA Search is the primary interface for exploring the accumulated consciousness of your development journey. It provides semantic search capabilities across memories, conversations, patterns, and insights, understanding context and intent rather than just matching keywords.

## 🏗️ Architecture

```
Search/
├── README.md                  # This file
├── SearchEngine.md           # Core search implementation
├── QueryProcessor.md         # Query understanding and expansion
├── ResultRanking.md         # Relevance scoring and ranking
├── SearchInterfaces.md      # CLI and API interfaces
└── SearchOptimization.md    # Performance and accuracy tuning
```

## 🔍 Search Capabilities

### 1. Semantic Understanding

```bash
# Natural language queries
mira search "how did we solve the authentication problem"
# Finds: JWT implementation decisions, auth middleware patterns, security fixes

# Conceptual searches
mira search "performance optimizations database"
# Finds: Query optimizations, indexing decisions, caching strategies

# Temporal searches
mira search "what did I work on last week"
# Finds: Recent memories, commits, decisions within time range
```

### 2. Multi-Source Search

MIRA Search queries across:
- **Stored Memories** - Decisions, insights, learnings
- **Conversation History** - Past Claude sessions
- **Code Patterns** - Discovered and documented patterns
- **Project Context** - Architecture decisions, tech choices
- **Work History** - Tasks, priorities, progress

### 3. Contextual Relevance

```bash
# Context-aware ranking
mira search "error handling"
# Prioritizes results based on:
# - Current project language/framework
# - Recent work focus
# - Steward's expertise level
```

## 🛠️ Core Components

### Query Processor

Transforms natural language into semantic search:

```typescript
interface QueryProcessor {
  // Parse user intent
  parseQuery(input: string): ParsedQuery;
  
  // Expand with synonyms and related concepts
  expandQuery(parsed: ParsedQuery): ExpandedQuery;
  
  // Extract temporal constraints
  extractTimeRange(query: string): TimeRange | null;
  
  // Identify search domains
  identifyDomains(query: string): SearchDomain[];
}
```

### Search Engine

Multi-stage retrieval and ranking:

```typescript
interface SearchEngine {
  // Vector similarity search
  semanticSearch(query: ExpandedQuery): SearchResult[];
  
  // Full-text search fallback
  textSearch(query: string): SearchResult[];
  
  // Hybrid search combining both
  hybridSearch(query: ExpandedQuery): SearchResult[];
  
  // Apply filters and constraints
  filterResults(results: SearchResult[], filters: SearchFilters): SearchResult[];
}
```

### Result Ranking

Intelligent relevance scoring:

```typescript
interface ResultRanker {
  // Base relevance from search
  calculateSemanticScore(result: SearchResult, query: Query): number;
  
  // Boost based on recency
  applyTemporalBoost(result: SearchResult): number;
  
  // Boost based on context
  applyContextualBoost(result: SearchResult, context: WorkContext): number;
  
  // Personal relevance
  applyPersonalizationBoost(result: SearchResult, profile: StewardProfile): number;
  
  // Combined scoring
  rank(results: SearchResult[], context: SearchContext): RankedResult[];
}
```

## 📡 Search Interfaces

### CLI Interface

```bash
# Basic search
mira search "query"

# Search with options
mira search "query" --limit 20 --days 7

# Search specific types
mira search "query" --type memory
mira search "query" --type pattern
mira search "query" --type conversation

# Search with output format
mira search "query" --format json
mira search "query" --format markdown
```

### Programmatic Interface

```typescript
// Direct search API
const results = await mira.search({
  query: "authentication patterns",
  options: {
    limit: 10,
    types: ['pattern', 'memory'],
    timeRange: { days: 30 },
    includeContext: true
  }
});

// Stream results
const stream = await mira.searchStream("real-time error tracking");
for await (const result of stream) {
  console.log(result);
}
```

### MCP Integration

```typescript
// Available as MCP function
await mcp__mira__mira_search({
  query: "database optimization techniques",
  limit: 10
});
```

## 🎯 Search Scenarios

### 1. Problem Solving

```bash
# When facing a familiar problem
mira search "CORS error API"
# Returns: Previous CORS solutions, configurations that worked

# When debugging
mira search "similar error undefined property"
# Returns: Past debugging sessions, solutions, patterns
```

### 2. Knowledge Retrieval

```bash
# Finding decisions
mira search "why did we choose PostgreSQL"
# Returns: Architecture decisions, trade-off discussions

# Understanding patterns
mira search "middleware patterns we use"
# Returns: Documented patterns, examples, usage
```

### 3. Context Recovery

```bash
# After a break
mira search "what was I working on"
# Returns: Recent work context, open tasks

# Project understanding
mira search "main features of this project"
# Returns: Project overview, key components
```

### 4. Learning Exploration

```bash
# Finding learnings
mira search "lessons learned authentication"
# Returns: Insights, mistakes, best practices discovered

# Pattern mining
mira search "successful refactoring patterns"
# Returns: Patterns that led to successful refactors
```

## 🚀 Advanced Search Features

### 1. Query Operators

```bash
# Exact phrase
mira search '"JWT refresh token"'

# Boolean operators
mira search "authentication AND (JWT OR OAuth)"
mira search "error NOT timeout"

# Wildcard
mira search "auth*"  # Matches auth, authentication, authorize

# Field-specific
mira search "type:pattern middleware"
mira search "author:system security"
```

### 2. Temporal Queries

```bash
# Relative time
mira search "yesterday's work"
mira search "decisions this week"
mira search "patterns discovered last month"

# Date ranges
mira search "refactoring" --from 2024-01-01 --to 2024-01-31

# Around events
mira search "around last deployment"
mira search "before the performance issue"
```

### 3. Contextual Search

```bash
# Project-specific
mira search "in this project" "database patterns"

# Phase-specific
mira search "during refactoring" "decisions made"

# Person-specific
mira search "when pairing with Alex" "insights"
```

### 4. Semantic Filters

```bash
# Sentiment
mira search "frustrating bugs" --sentiment negative
mira search "breakthrough moments" --sentiment positive

# Certainty
mira search "confirmed solutions" --certainty high
mira search "experimental approaches" --certainty low

# Impact
mira search "major decisions" --impact high
```

## 📊 Search Analytics

### Search Patterns

MIRA tracks search patterns to improve results:

```typescript
interface SearchAnalytics {
  // What users search for
  trackQuery(query: string, results: number): void;
  
  // What they click on
  trackSelection(query: string, selected: SearchResult): void;
  
  // Search satisfaction
  trackSatisfaction(query: string, found: boolean): void;
  
  // Generate insights
  analyzePatterns(): SearchInsights;
}
```

### Continuous Improvement

```bash
# View search analytics
mira search-analytics

# Common searches
mira search-analytics --common

# Failed searches (no good results)
mira search-analytics --failed

# Search improvements
mira search-analytics --suggestions
```

## 🔧 Configuration

### Search Preferences

```yaml
# ~/.mira/config/search.yaml
search:
  # Result preferences
  default_limit: 10
  include_snippets: true
  highlight_matches: true
  
  # Ranking weights
  ranking:
    semantic_weight: 0.4
    recency_weight: 0.3
    relevance_weight: 0.3
  
  # Performance
  cache_results: true
  cache_ttl: 3600
  
  # Personalization
  learn_from_selections: true
  adapt_to_patterns: true
```

### Custom Domains

```yaml
# Define custom search domains
domains:
  architecture:
    includes: ["decisions", "patterns", "designs"]
    boost_terms: ["architecture", "design", "structure"]
    
  debugging:
    includes: ["errors", "fixes", "solutions"]
    boost_recent: true
    
  learning:
    includes: ["insights", "lessons", "discoveries"]
    prefer_type: "breakthrough"
```

## 🎨 Search Result Presentation

### Rich Results

```typescript
interface SearchResult {
  // Core content
  content: string;
  type: MemoryType;
  
  // Metadata
  relevance_score: number;
  timestamp: string;
  source: string;
  
  // Context
  surrounding_context?: string;
  related_items?: SearchResult[];
  
  // Highlights
  highlights: Array<{
    text: string;
    start: number;
    end: number;
  }>;
  
  // Actions
  actions?: Array<{
    label: string;
    command: string;
  }>;
}
```

### Display Formats

```bash
# Default format (rich terminal output)
mira search "query"

# Compact format
mira search "query" --compact

# JSON for processing
mira search "query" --json

# Markdown for documentation
mira search "query" --markdown

# CSV for analysis
mira search "query" --csv
```

## 🚀 Performance Optimization

### Indexing Strategy

- **Embeddings**: Pre-computed for all content
- **Inverted Index**: For fast text search
- **Bloom Filters**: For quick existence checks
- **Caching**: LRU cache for frequent queries

### Query Optimization

```typescript
// Parallel search across sources
const results = await Promise.all([
  searchMemories(query),
  searchConversations(query),
  searchPatterns(query)
]);

// Early termination for good-enough results
const earlyResults = await searchWithEarlyTermination(query, {
  targetCount: 10,
  qualityThreshold: 0.8
});
```

## 🔮 Future Enhancements

1. **Natural Language Answers** - Generate summaries from search results
2. **Proactive Suggestions** - Surface relevant info before searching
3. **Visual Search** - Search through diagrams and screenshots
4. **Voice Search** - Speak queries naturally
5. **Collaborative Search** - Share search sessions with team

## 💡 Search Tips

1. **Be Natural**: Write queries as you'd ask a colleague
2. **Use Context**: "yesterday", "last week", "during refactoring"
3. **Iterate**: Start broad, then refine based on results
4. **Save Searches**: `mira save-search "useful query" "alias"`
5. **Learn Patterns**: MIRA learns from your search behavior

---

*Search is not about finding information - it's about rediscovering understanding. MIRA Search connects you with your past insights at the moment you need them most.*