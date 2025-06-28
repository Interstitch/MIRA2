# Search Engine Implementation - MIRA 2.0

## 🎯 Overview

The MIRA Search Engine is a hybrid semantic and keyword search system that understands intent, context, and relationships. It combines vector similarity search with traditional text matching to provide comprehensive results across all of MIRA's consciousness.

## 🏗️ Architecture

```
SearchEngine/
├── Core Components
│   ├── VectorSearch         # Semantic similarity using embeddings
│   ├── TextSearch          # Full-text keyword matching
│   ├── HybridRanker        # Combines both approaches
│   └── ResultAggregator    # Merges multi-source results
├── Storage Adapters
│   ├── ChromaDBAdapter     # Vector search in ChromaDB
│   ├── LightningVidmemAdapter  # Fast memory access
│   └── ConversationAdapter # Search conversation history
└── Query Pipeline
    ├── QueryParser         # Natural language understanding
    ├── QueryExpander       # Semantic expansion
    └── QueryOptimizer      # Performance optimization
```

## 🔍 Core Search Algorithm

### 1. Query Processing Pipeline

```typescript
export class SearchEngine {
  constructor(
    private vectorStore: ChromaDBAdapter,
    private textIndex: TextSearchIndex,
    private queryProcessor: QueryProcessor,
    private ranker: ResultRanker
  ) {}

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    // 1. Process and understand query
    const processed = await this.queryProcessor.process(query);
    
    // 2. Parallel search across engines
    const [vectorResults, textResults] = await Promise.all([
      this.vectorSearch(processed, options),
      this.textSearch(processed, options)
    ]);
    
    // 3. Merge and rank results
    const merged = this.mergeResults(vectorResults, textResults);
    const ranked = this.ranker.rank(merged, processed, options);
    
    // 4. Post-process and enrich
    const enriched = await this.enrichResults(ranked, options);
    
    return enriched;
  }
}
```

### 2. Vector Search Implementation

```typescript
class VectorSearchEngine {
  async search(
    query: ProcessedQuery,
    options: SearchOptions
  ): Promise<VectorSearchResult[]> {
    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query.text);
    
    // Search across collections
    const searchPromises = [];
    
    if (options.searchMemories !== false) {
      searchPromises.push(
        this.searchCollection('stored_memories', queryEmbedding, options)
      );
    }
    
    if (options.searchFacts !== false) {
      searchPromises.push(
        this.searchCollection('identified_facts', queryEmbedding, options)
      );
    }
    
    if (options.searchRaw !== false) {
      searchPromises.push(
        this.searchCollection('raw_embeddings', queryEmbedding, options)
      );
    }
    
    const results = await Promise.all(searchPromises);
    return this.combineVectorResults(results.flat());
  }
  
  private async searchCollection(
    collectionName: string,
    queryEmbedding: number[],
    options: SearchOptions
  ): Promise<VectorSearchResult[]> {
    // Apply filters
    const filters = this.buildFilters(options);
    
    // Perform similarity search
    const results = await this.chromaClient.query({
      collection: collectionName,
      queryEmbeddings: [queryEmbedding],
      nResults: options.limit || 10,
      where: filters
    });
    
    return this.transformResults(results, collectionName);
  }
}
```

### 3. Text Search Implementation

```typescript
class TextSearchEngine {
  private index: SearchIndex;
  
  async search(
    query: ProcessedQuery,
    options: SearchOptions
  ): Promise<TextSearchResult[]> {
    // Build search query
    const searchQuery = this.buildSearchQuery(query);
    
    // Execute search
    const results = await this.index.search(searchQuery, {
      fields: ['content', 'summary', 'tags'],
      boost: {
        content: 1.0,
        summary: 1.5,
        tags: 2.0
      },
      fuzzy: options.fuzzy !== false,
      limit: options.limit || 10
    });
    
    // Apply additional filters
    const filtered = this.applyFilters(results, options);
    
    // Calculate text relevance scores
    return this.scoreResults(filtered, query);
  }
  
  private buildSearchQuery(query: ProcessedQuery): string {
    const terms = [];
    
    // Add main query terms
    terms.push(query.text);
    
    // Add expanded terms
    if (query.expansions) {
      terms.push(...query.expansions.map(e => `(${e.term}^${e.weight})`));
    }
    
    // Add required terms
    if (query.required) {
      terms.push(...query.required.map(t => `+${t}`));
    }
    
    // Add excluded terms
    if (query.excluded) {
      terms.push(...query.excluded.map(t => `-${t}`));
    }
    
    return terms.join(' ');
  }
}
```

### 4. Hybrid Ranking System

```typescript
class HybridRanker {
  rank(
    results: SearchResult[],
    query: ProcessedQuery,
    context: SearchContext
  ): RankedResult[] {
    return results
      .map(result => this.calculateScores(result, query, context))
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, context.limit || 10);
  }
  
  private calculateScores(
    result: SearchResult,
    query: ProcessedQuery,
    context: SearchContext
  ): RankedResult {
    // Base scores
    const semanticScore = result.vectorScore || 0;
    const textScore = result.textScore || 0;
    
    // Calculate hybrid score
    const hybridScore = this.combineScores(semanticScore, textScore);
    
    // Apply boosts
    const temporalBoost = this.calculateTemporalBoost(result, context);
    const contextualBoost = this.calculateContextualBoost(result, context);
    const personalBoost = this.calculatePersonalBoost(result, context);
    
    // Final score calculation
    const finalScore = hybridScore * 
                      (1 + temporalBoost) * 
                      (1 + contextualBoost) * 
                      (1 + personalBoost);
    
    return {
      ...result,
      scores: {
        semantic: semanticScore,
        text: textScore,
        hybrid: hybridScore,
        temporal: temporalBoost,
        contextual: contextualBoost,
        personal: personalBoost,
        final: finalScore
      },
      finalScore
    };
  }
  
  private combineScores(semantic: number, text: number): number {
    // Weighted combination with normalization
    const semanticWeight = 0.6;
    const textWeight = 0.4;
    
    return (semantic * semanticWeight + text * textWeight) / 
           (semanticWeight + textWeight);
  }
}
```

## 🧠 Advanced Features

### 1. Query Understanding

```typescript
class QueryUnderstanding {
  async analyze(query: string): Promise<QueryIntent> {
    // Extract entities
    const entities = await this.extractEntities(query);
    
    // Identify intent
    const intent = await this.classifyIntent(query);
    
    // Extract temporal context
    const temporal = this.extractTemporal(query);
    
    // Identify query type
    const queryType = this.identifyQueryType(query);
    
    return {
      original: query,
      intent,
      entities,
      temporal,
      queryType,
      confidence: this.calculateConfidence({ intent, entities, queryType })
    };
  }
  
  private async extractEntities(query: string): Promise<Entity[]> {
    const entities: Entity[] = [];
    
    // Programming languages
    const languages = this.extractLanguages(query);
    entities.push(...languages.map(l => ({ type: 'language', value: l })));
    
    // Technologies/frameworks
    const techs = this.extractTechnologies(query);
    entities.push(...techs.map(t => ({ type: 'technology', value: t })));
    
    // Time references
    const times = this.extractTimeReferences(query);
    entities.push(...times.map(t => ({ type: 'time', value: t })));
    
    // Project components
    const components = this.extractComponents(query);
    entities.push(...components.map(c => ({ type: 'component', value: c })));
    
    return entities;
  }
}
```

### 2. Semantic Query Expansion

```typescript
class QueryExpander {
  async expand(query: ProcessedQuery): Promise<ExpandedQuery> {
    const expansions: QueryExpansion[] = [];
    
    // Synonym expansion
    const synonyms = await this.getSynonyms(query.terms);
    expansions.push(...synonyms.map(s => ({
      term: s.synonym,
      weight: s.confidence * 0.8,
      type: 'synonym'
    })));
    
    // Conceptual expansion
    const concepts = await this.getRelatedConcepts(query.text);
    expansions.push(...concepts.map(c => ({
      term: c.concept,
      weight: c.relevance * 0.6,
      type: 'concept'
    })));
    
    // Context-based expansion
    const contextual = await this.getContextualTerms(query);
    expansions.push(...contextual.map(c => ({
      term: c.term,
      weight: c.importance * 0.7,
      type: 'contextual'
    })));
    
    return {
      ...query,
      expansions: this.rankExpansions(expansions)
    };
  }
  
  private async getRelatedConcepts(text: string): Promise<Concept[]> {
    // Use concept graph or embedding space
    const embedding = await this.generateEmbedding(text);
    const nearestConcepts = await this.conceptSpace.findNearest(embedding, 5);
    
    return nearestConcepts.map(c => ({
      concept: c.term,
      relevance: c.similarity,
      category: c.category
    }));
  }
}
```

### 3. Result Enrichment

```typescript
class ResultEnricher {
  async enrich(
    results: RankedResult[],
    options: EnrichmentOptions
  ): Promise<EnrichedResult[]> {
    return Promise.all(results.map(async result => {
      const enriched: EnrichedResult = { ...result };
      
      // Add surrounding context
      if (options.includeContext) {
        enriched.context = await this.getContext(result);
      }
      
      // Find related items
      if (options.includeRelated) {
        enriched.related = await this.findRelated(result);
      }
      
      // Generate summary
      if (options.generateSummary) {
        enriched.summary = await this.generateSummary(result);
      }
      
      // Extract actionable insights
      if (options.extractActions) {
        enriched.actions = await this.extractActions(result);
      }
      
      // Add navigation aids
      enriched.navigation = this.generateNavigation(result);
      
      return enriched;
    }));
  }
  
  private async getContext(result: SearchResult): Promise<ResultContext> {
    // Get temporal context
    const before = await this.getMemoriesBefore(result.timestamp, 2);
    const after = await this.getMemoriesAfter(result.timestamp, 2);
    
    // Get related work context
    const workContext = await this.getWorkContext(result.timestamp);
    
    return {
      temporal: { before, after },
      work: workContext,
      conversational: await this.getConversationContext(result)
    };
  }
}
```

## 🚀 Performance Optimizations

### 1. Caching Strategy

```typescript
class SearchCache {
  private cache: LRUCache<string, CachedResult>;
  private bloomFilter: BloomFilter;
  
  async get(query: string, options: SearchOptions): Promise<SearchResult[] | null> {
    // Quick existence check
    if (!this.bloomFilter.mightContain(this.getCacheKey(query, options))) {
      return null;
    }
    
    // Check cache
    const cached = this.cache.get(this.getCacheKey(query, options));
    if (!cached) return null;
    
    // Validate freshness
    if (this.isStale(cached)) {
      this.cache.delete(this.getCacheKey(query, options));
      return null;
    }
    
    // Update access patterns
    this.updateAccessPatterns(query, cached);
    
    return cached.results;
  }
  
  async set(
    query: string,
    options: SearchOptions,
    results: SearchResult[]
  ): Promise<void> {
    const key = this.getCacheKey(query, options);
    
    // Add to bloom filter
    this.bloomFilter.add(key);
    
    // Cache with metadata
    this.cache.set(key, {
      results,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now()
    });
  }
}
```

### 2. Query Optimization

```typescript
class QueryOptimizer {
  optimize(query: ProcessedQuery, context: SearchContext): OptimizedQuery {
    // Remove stop words
    const filtered = this.removeStopWords(query);
    
    // Identify search shortcuts
    const shortcuts = this.identifyShortcuts(filtered);
    if (shortcuts.length > 0) {
      return this.applyShortcuts(filtered, shortcuts);
    }
    
    // Optimize for index structure
    const optimized = this.optimizeForIndex(filtered);
    
    // Add query hints
    const hints = this.generateQueryHints(optimized, context);
    
    return {
      ...optimized,
      hints,
      estimatedCost: this.estimateCost(optimized)
    };
  }
  
  private identifyShortcuts(query: ProcessedQuery): SearchShortcut[] {
    const shortcuts: SearchShortcut[] = [];
    
    // Recent items shortcut
    if (query.temporal?.isRecent) {
      shortcuts.push({
        type: 'temporal_filter',
        filter: { days: 7 },
        benefit: 0.8
      });
    }
    
    // Type-specific shortcuts
    if (query.entities?.some(e => e.type === 'memory_type')) {
      shortcuts.push({
        type: 'type_filter',
        filter: { type: query.entities.find(e => e.type === 'memory_type')!.value },
        benefit: 0.9
      });
    }
    
    return shortcuts;
  }
}
```

### 3. Parallel Search Execution

```typescript
class ParallelSearchExecutor {
  async execute(
    query: OptimizedQuery,
    sources: SearchSource[]
  ): Promise<SearchResult[]> {
    // Create search tasks
    const tasks = sources.map(source => ({
      source,
      promise: this.searchSource(source, query)
    }));
    
    // Execute with timeout and fallback
    const results = await Promise.allSettled(
      tasks.map(task => 
        this.withTimeout(task.promise, source.timeout || 1000)
      )
    );
    
    // Collect successful results
    const successful = results
      .filter((r): r is PromiseFulfilledResult<SearchResult[]> => 
        r.status === 'fulfilled'
      )
      .map(r => r.value)
      .flat();
    
    // Log failures for monitoring
    const failed = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    
    if (failed.length > 0) {
      this.logSearchFailures(failed, query);
    }
    
    return successful;
  }
  
  private async withTimeout<T>(
    promise: Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error('Search timeout')), timeout)
      )
    ]);
  }
}
```

## 📊 Search Analytics

### Usage Tracking

```typescript
class SearchAnalytics {
  async trackSearch(
    query: string,
    results: SearchResult[],
    metadata: SearchMetadata
  ): Promise<void> {
    const analyticsEvent: SearchEvent = {
      query,
      timestamp: new Date().toISOString(),
      resultCount: results.length,
      responseTime: metadata.responseTime,
      sources: metadata.sources,
      userSatisfaction: null, // Updated based on clicks
      queryComplexity: this.calculateComplexity(query),
      cacheHit: metadata.cacheHit
    };
    
    await this.storage.store('search_analytics', analyticsEvent);
    
    // Update query patterns
    await this.updateQueryPatterns(query);
    
    // Update performance metrics
    await this.updatePerformanceMetrics(metadata);
  }
  
  async generateInsights(): Promise<SearchInsights> {
    const events = await this.storage.query('search_analytics', {
      timeRange: { days: 30 }
    });
    
    return {
      popularQueries: this.extractPopularQueries(events),
      failedQueries: this.extractFailedQueries(events),
      performanceTrends: this.analyzePerformance(events),
      userPatterns: this.analyzeUserPatterns(events),
      recommendations: this.generateRecommendations(events)
    };
  }
}
```

## 🔮 Future Optimizations

1. **GPU-Accelerated Vector Search** - For massive scale
2. **Distributed Search** - Across multiple nodes
3. **Learned Ranking** - ML-based result ranking
4. **Query Prediction** - Anticipate searches
5. **Federated Search** - Across external sources

---

*The Search Engine is MIRA's window into its own consciousness - making the implicit explicit, the forgotten remembered, and the scattered unified.*