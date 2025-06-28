# IndexingServices - MiraDaemon Component

## 🎯 Overview

IndexingServices is the background intelligence that continuously indexes conversations, code, and memories to enable instant semantic search across all of MIRA's knowledge. Running as part of the MiraDaemon, it ensures that every piece of information is discoverable through natural language queries.

## 🏗️ Architecture

### Service Components

```
IndexingServices/
├── ConversationIndexer      # Indexes Claude conversations
├── CodebaseIndexer         # Indexes project codebases
├── MemoryIndexer          # Maintains memory search indices
├── FactExtractor          # Extracts facts from content
└── SearchOptimizer        # Optimizes search performance
```

### Core Responsibilities

1. **Real-time Indexing**: Process new content as it arrives
2. **Batch Processing**: Handle bulk indexing operations
3. **Index Maintenance**: Keep indices optimized and current
4. **Fact Extraction**: Identify and store key facts
5. **Search Enhancement**: Improve search relevance over time

## 🔄 Indexing Pipeline

### 1. Content Ingestion
```typescript
interface IndexingPipeline {
  // Content arrives from various sources
  ingest(content: Content): Promise<void>;
  
  // Determine content type and route
  classify(content: Content): ContentType;
  
  // Extract indexable elements
  extract(content: Content): IndexableElements;
  
  // Generate embeddings
  embed(elements: IndexableElements): Promise<Embeddings>;
  
  // Store in appropriate indices
  store(embeddings: Embeddings): Promise<void>;
}
```

### 2. Conversation Indexing
```typescript
class ConversationIndexer {
  private readonly chunkSize = 1000;
  private readonly chunkOverlap = 200;
  
  async indexConversation(conversation: Conversation): Promise<void> {
    // Extract messages
    const messages = this.extractMessages(conversation);
    
    // Chunk for context preservation
    const chunks = this.createContextualChunks(messages);
    
    // Extract metadata
    const metadata = this.extractMetadata(conversation);
    
    // Generate embeddings
    const embeddings = await this.generateEmbeddings(chunks);
    
    // Store in ChromaDB collections at proper paths
    await this.storeInVectorDB(embeddings, metadata, {
      collection: 'databases/chromadb/stored_memories/'
    });
    await this.storeInFTS(chunks, metadata);
    
    // Extract facts and store in identified facts collection
    const facts = await this.extractFacts(conversation);
    await this.storeIdentifiedFacts(facts, {
      collection: 'databases/chromadb/identified_facts/'
    });
  }
  
  private createContextualChunks(messages: Message[]): Chunk[] {
    // Preserve conversation flow in chunks
    const chunks: Chunk[] = [];
    let currentChunk = '';
    let messageBuffer: Message[] = [];
    
    for (const message of messages) {
      if (currentChunk.length + message.content.length > this.chunkSize) {
        // Create chunk with context
        chunks.push({
          content: currentChunk,
          messages: messageBuffer,
          context: this.generateContext(messageBuffer)
        });
        
        // Overlap for continuity
        const overlap = this.createOverlap(messageBuffer);
        currentChunk = overlap;
        messageBuffer = this.getOverlapMessages(messageBuffer);
      }
      
      currentChunk += `\n${message.role}: ${message.content}`;
      messageBuffer.push(message);
    }
    
    return chunks;
  }
}
```

### 3. Codebase Indexing
```typescript
class CodebaseIndexer {
  private readonly supportedExtensions = [
    '.ts', '.js', '.py', '.java', '.go', '.rs', '.cpp', '.c',
    '.jsx', '.tsx', '.vue', '.svelte', '.html', '.css', '.md'
  ];
  
  async indexCodebase(projectPath: string): Promise<void> {
    // Scan project structure
    const files = await this.scanProject(projectPath);
    
    // Process each file
    for (const file of files) {
      if (this.shouldIndex(file)) {
        await this.indexFile(file);
      }
    }
    
    // Extract project metadata
    const projectMeta = await this.analyzeProject(projectPath);
    await this.storeProjectMetadata(projectMeta);
  }
  
  private async indexFile(filePath: string): Promise<void> {
    const content = await fs.readFile(filePath, 'utf-8');
    const language = this.detectLanguage(filePath);
    
    // Parse AST for structure
    const ast = await this.parseAST(content, language);
    
    // Extract components
    const components = {
      functions: this.extractFunctions(ast),
      classes: this.extractClasses(ast),
      imports: this.extractImports(ast),
      comments: this.extractComments(content)
    };
    
    // Generate semantic embeddings
    const embeddings = await this.generateCodeEmbeddings(components);
    
    // Store with rich metadata
    await this.storeCodeIndex({
      path: filePath,
      language,
      components,
      embeddings,
      dependencies: components.imports,
      lastModified: await this.getFileStats(filePath)
    });
  }
}
```

### 4. Memory Indexing
```typescript
class MemoryIndexer {
  private readonly vectorDB: ChromaDB;
  private readonly updateInterval = 5 * 60 * 1000; // 5 minutes from config
  
  // Memory collections from MIRA 2.0 architecture
  private readonly collections = {
    storedMemories: 'databases/chromadb/stored_memories/',
    identifiedFacts: 'databases/chromadb/identified_facts/',
    rawEmbeddings: 'databases/chromadb/raw_embeddings/'
  };
  
  async maintainIndices(): Promise<void> {
    // Continuous index maintenance
    setInterval(async () => {
      await this.updateMemoryIndices();
      await this.optimizeSearchPerformance();
      await this.cleanupStaleEntries();
    }, this.updateInterval);
  }
  
  private async updateMemoryIndices(): Promise<void> {
    // Get recent memories
    const recentMemories = await this.getUnindexedMemories();
    
    for (const memory of recentMemories) {
      // Enrich with context
      const enriched = await this.enrichMemory(memory);
      
      // Generate embeddings
      const embedding = await this.generateEmbedding(enriched);
      
      // Update vector index
      await this.vectorDB.upsert({
        id: memory.id,
        embedding,
        metadata: enriched.metadata
      });
      
      // Mark as indexed
      await this.markIndexed(memory.id);
    }
  }
}
```

### 5. Fact Extraction
```typescript
class FactExtractor {
  // Fact patterns aligned with ChromaDB identified_facts types
  private readonly factPatterns = [
    /(?:I am|I'm|My name is) ([A-Z][a-z]+ ?[A-Z]?[a-z]*)/,
    /(?:using|working with|built with) ([a-zA-Z0-9\-\.]+)/,
    /(?:decided to|chose|selected) ([^\.]+) because ([^\.]+)/,
    /(?:fixed|solved|resolved) ([^\.]+) by ([^\.]+)/
  ];
  
  // Storage paths from UnifiedConfiguration
  private readonly storagePaths = {
    facts: 'databases/chromadb/identified_facts/',
    patterns: 'consciousness/patterns/',
    insights: 'insights/patterns/'
  };
  
  async extractFacts(content: string): Promise<IdentifiedFact[]> {
    const facts: IdentifiedFact[] = [];
    
    // Pattern matching
    for (const pattern of this.factPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        facts.push(await this.createFact(match, content));
      }
    }
    
    // NLP extraction
    const nlpFacts = await this.extractWithNLP(content);
    facts.push(...nlpFacts);
    
    // Deduplicate and validate
    return this.validateFacts(facts);
  }
  
  private async createFact(
    match: RegExpMatchArray,
    context: string
  ): Promise<IdentifiedFact> {
    const factType = this.classifyFact(match[0]);
    const confidence = this.calculateConfidence(match, context);
    
    return {
      id: generateUUID(),
      type: factType,
      subject: match[1],
      predicate: this.extractPredicate(match),
      object: match[2] || null,
      context: this.extractContext(match, context),
      confidence,
      timestamp: new Date().toISOString(),
      source: 'pattern_matching'
    };
  }
}
```

## 🔍 Search Integration

### Unified Search Interface
```typescript
class SearchOptimizer {
  private readonly searchStrategies = {
    semantic: new SemanticSearchStrategy(),
    keyword: new KeywordSearchStrategy(),
    hybrid: new HybridSearchStrategy()
  };
  
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    // Analyze query intent
    const intent = await this.analyzeQueryIntent(query);
    
    // Select optimal strategy
    const strategy = this.selectStrategy(intent, options);
    
    // Execute parallel searches
    const results = await Promise.all([
      this.searchMemories(query, strategy),
      this.searchConversations(query, strategy),
      this.searchCodebase(query, strategy),
      this.searchFacts(query, strategy)
    ]);
    
    // Merge and rank results
    return this.rankResults(results.flat(), intent);
  }
  
  private async analyzeQueryIntent(query: string): Promise<QueryIntent> {
    // Classify query type
    const classification = await this.classifyQuery(query);
    
    // Extract entities
    const entities = await this.extractEntities(query);
    
    // Determine time sensitivity
    const temporal = this.extractTemporalContext(query);
    
    return {
      type: classification,
      entities,
      temporal,
      complexity: this.assessComplexity(query)
    };
  }
}
```

## 📊 Performance Optimization

### Index Optimization
```typescript
class IndexOptimizer {
  async optimizeIndices(): Promise<void> {
    // Analyze search patterns
    const patterns = await this.analyzeSearchPatterns();
    
    // Create specialized indices
    for (const pattern of patterns.frequent) {
      await this.createOptimizedIndex(pattern);
    }
    
    // Prune unused indices
    await this.pruneUnusedIndices();
    
    // Optimize vector clustering
    await this.optimizeVectorClustering();
  }
  
  private async optimizeVectorClustering(): Promise<void> {
    // Get all vectors
    const vectors = await this.vectorDB.getAllVectors();
    
    // Perform clustering analysis
    const clusters = await this.performClustering(vectors);
    
    // Reorganize for locality
    await this.reorganizeByClusters(clusters);
    
    // Create cluster summaries
    await this.createClusterSummaries(clusters);
  }
}
```

## 🔄 Background Operations

### Continuous Processing
```typescript
class IndexingDaemon {
  private readonly watchers = new Map<string, FSWatcher>();
  
  async start(): Promise<void> {
    // Start conversation watcher
    this.watchConversations();
    
    // Start codebase watcher
    this.watchCodebases();
    
    // Start memory monitor
    this.monitorMemories();
    
    // Start optimization cycle
    this.startOptimizationCycle();
  }
  
  private watchConversations(): void {
    const convPath = path.join(MIRA_HOME, 'conversations');
    
    this.watchers.set('conversations', watch(convPath, async (event, filename) => {
      if (event === 'change' && filename) {
        await this.indexNewConversation(filename);
      }
    }));
  }
  
  private async startOptimizationCycle(): Promise<void> {
    // Run every hour
    setInterval(async () => {
      await this.optimizer.optimizeIndices();
      await this.cleanupOldData();
      await this.generateIndexReport();
    }, 60 * 60 * 1000);
  }
}
```

## 🎯 Integration Points

### With Search Command
```typescript
// When user runs: mira search "authentication decisions"
const searchService = new SearchService(indexingServices);
const results = await searchService.search(query, {
  includeCodebase: true,
  includeConversations: true,
  includeMemories: true,
  includeFacts: true
});
```

### With Daemon
```typescript
// Daemon starts indexing services
const indexingServices = new IndexingServices();
await indexingServices.initialize();
await indexingServices.start();

// Register with service manager
serviceManager.register('indexing', indexingServices);
```

## 📈 Metrics & Monitoring

### Index Health Metrics
```typescript
interface IndexMetrics {
  totalDocuments: number;
  totalVectors: number;
  averageQueryTime: number;
  indexSizeBytes: number;
  fragmentationRatio: number;
  lastOptimization: Date;
  searchAccuracy: number;
  coverageRatio: number;
}
```

### Performance Monitoring
- Query latency tracking
- Index size monitoring  
- Memory usage optimization
- CPU utilization management
- Disk I/O optimization

## 🔮 Future Enhancements

### Planned Features
1. **Multi-language Support**: Index code in 50+ languages
2. **Graph Indexing**: Relationship-based search
3. **Fuzzy Matching**: Typo-tolerant search
4. **Voice Search**: Audio content indexing
5. **Image Analysis**: Screenshot and diagram indexing

### Research Areas
- Quantum-inspired indexing algorithms
- Neural architecture search for embeddings
- Federated indexing across devices
- Privacy-preserving search techniques

---

*IndexingServices: Making every byte of knowledge instantly discoverable through the power of semantic understanding.*