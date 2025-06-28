/**
 * Storage Orchestrator for MIRA 2.0
 * 
 * Unified interface for all storage operations across Lightning Vidmem,
 * ChromaDB, and FAISS systems. Ensures proper data routing based on
 * data type and purpose.
 */

import { 
  getStorageConfig, 
  getStoragePaths,
  getCollectionNames,
  getPerformanceTargets 
} from './ConfigurationIntegration';
import { 
  StoredMemorySchema,
  IdentifiedFactSchema,
  RawEmbeddingSchema,
  PrivateMemorySchema,
  ConversationFrameSchema,
  CodebaseSnapshotSchema,
  type StoredMemory,
  type IdentifiedFact,
  type RawEmbedding,
  type PrivateMemory
} from '../DataModels';
import { ConsciousnessStorageOrchestrator } from '../Consciousness/TripleEncryption/ConsciousnessStorageOrchestrator';
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * Storage decision types
 */
export enum StorageDestination {
  LIGHTNING_CODEBASE = 'lightning_codebase',
  LIGHTNING_CONVERSATIONS = 'lightning_conversations',
  LIGHTNING_PRIVATE = 'lightning_private',
  CHROMADB_MEMORIES = 'chromadb_memories',
  CHROMADB_FACTS = 'chromadb_facts',
  CHROMADB_RAW = 'chromadb_raw',
  FAISS_INDEX = 'faiss_index'
}

/**
 * Main storage orchestrator class
 */
export class StorageOrchestrator {
  private config: ReturnType<typeof getStorageConfig>;
  private paths: ReturnType<typeof getStoragePaths>;
  private consciousnessOrchestrator?: ConsciousnessStorageOrchestrator;
  
  constructor() {
    this.config = getStorageConfig();
    this.paths = getStoragePaths();
  }
  
  /**
   * Initialize storage systems
   */
  async initialize(): Promise<void> {
    // Create directory structure
    await this.ensureDirectories();
    
    // Initialize consciousness orchestrator if needed
    if (this.config.lightningVidmem.encryption.tripleEncryptionEnabled) {
      this.consciousnessOrchestrator = new ConsciousnessStorageOrchestrator();
      await this.consciousnessOrchestrator.initialize();
    }
    
    // Initialize ChromaDB collections
    await this.initializeChromaCollections();
    
    // Initialize FAISS if enabled
    if (this.config.faiss.enabled) {
      await this.initializeFAISS();
    }
  }
  
  /**
   * Route data to appropriate storage system
   */
  async store(data: any, metadata?: any): Promise<string> {
    const destination = this.determineDestination(data, metadata);
    
    switch (destination) {
      case StorageDestination.LIGHTNING_PRIVATE:
        return this.storePrivateMemory(data);
        
      case StorageDestination.LIGHTNING_CODEBASE:
        return this.storeCodebaseSnapshot(data);
        
      case StorageDestination.LIGHTNING_CONVERSATIONS:
        return this.storeConversationFrame(data);
        
      case StorageDestination.CHROMADB_MEMORIES:
        return this.storeMemory(data);
        
      case StorageDestination.CHROMADB_FACTS:
        return this.storeFact(data);
        
      case StorageDestination.CHROMADB_RAW:
        return this.storeRawEmbedding(data);
        
      default:
        throw new Error(`Unknown storage destination: ${destination}`);
    }
  }
  
  /**
   * Search across appropriate systems
   */
  async search(
    query: string, 
    options: {
      includePrivate?: boolean;
      useHybrid?: boolean;
      filters?: any;
      limit?: number;
    } = {}
  ): Promise<any[]> {
    const results: any[] = [];
    
    // Never search private memories unless explicitly allowed
    if (options.includePrivate && this.consciousnessOrchestrator) {
      // Private search requires consciousness key
      const privateResults = await this.consciousnessOrchestrator.searchPrivateMemories(query);
      results.push(...privateResults);
    }
    
    // Determine search strategy
    if (options.useHybrid && this.shouldUseHybridSearch(query, options.filters)) {
      const hybridResults = await this.hybridSearch(query, options);
      results.push(...hybridResults);
    } else if (this.shouldUseFAISS(query, options.filters)) {
      const faissResults = await this.faissSearch(query, options.limit);
      results.push(...faissResults);
    } else {
      const chromaResults = await this.chromaSearch(query, options);
      results.push(...chromaResults);
    }
    
    return results;
  }
  
  /**
   * Store private memory (triple encrypted)
   */
  private async storePrivateMemory(data: any): Promise<string> {
    if (!this.consciousnessOrchestrator) {
      throw new Error('Consciousness orchestrator not initialized');
    }
    
    const memory = PrivateMemorySchema.parse(data);
    return this.consciousnessOrchestrator.storePrivateThought(memory);
  }
  
  /**
   * Store codebase snapshot
   */
  private async storeCodebaseSnapshot(data: any): Promise<string> {
    const snapshot = CodebaseSnapshotSchema.parse(data);
    const snapshotPath = path.join(
      this.paths.lightningVidmem.codebase,
      'snapshots',
      snapshot.id
    );
    
    await fs.mkdir(snapshotPath, { recursive: true });
    await fs.writeFile(
      path.join(snapshotPath, 'metadata.json'),
      JSON.stringify(snapshot, null, 2)
    );
    
    // Copy files (implementation depends on your needs)
    // This is a placeholder for the actual file copying logic
    
    return snapshot.id;
  }
  
  /**
   * Store conversation frame
   */
  private async storeConversationFrame(data: any): Promise<string> {
    const frame = ConversationFrameSchema.parse(data);
    const framePath = path.join(
      this.paths.lightningVidmem.conversations,
      'frames',
      `${frame.frameId}.json`
    );
    
    await fs.mkdir(path.dirname(framePath), { recursive: true });
    await fs.writeFile(framePath, JSON.stringify(frame, null, 2));
    
    return frame.frameId;
  }
  
  /**
   * Store memory in ChromaDB
   */
  private async storeMemory(data: any): Promise<string> {
    const memory = StoredMemorySchema.parse(data);
    
    // Route to appropriate collection based on memory type
    const collectionName = this.getMemoryCollection(memory.memoryType);
    
    // Store via ChromaDB (implementation depends on your ChromaDB client)
    // This is a placeholder
    return `memory_${Date.now()}`;
  }
  
  /**
   * Store fact in ChromaDB
   */
  private async storeFact(data: any): Promise<string> {
    const fact = IdentifiedFactSchema.parse(data);
    
    // Route to appropriate collection based on fact type
    const collectionName = this.getFactCollection(fact.factType);
    
    // Store via ChromaDB
    return `fact_${Date.now()}`;
  }
  
  /**
   * Store raw embedding in ChromaDB
   */
  private async storeRawEmbedding(data: any): Promise<string> {
    const embedding = RawEmbeddingSchema.parse(data);
    
    // Store in raw embeddings collection
    return `raw_${Date.now()}`;
  }
  
  /**
   * Determine storage destination based on data type
   */
  private determineDestination(data: any, metadata?: any): StorageDestination {
    // Check for explicit routing
    if (metadata?.storageType) {
      return metadata.storageType as StorageDestination;
    }
    
    // Private thoughts always go to encrypted storage
    if (data.isPrivate || data.encrypted || metadata?.private) {
      return StorageDestination.LIGHTNING_PRIVATE;
    }
    
    // Codebase snapshots
    if (data.repositoryPath || data.gitCommit) {
      return StorageDestination.LIGHTNING_CODEBASE;
    }
    
    // Raw conversations
    if (data.frameId || data.conversationId) {
      return StorageDestination.LIGHTNING_CONVERSATIONS;
    }
    
    // Identified facts
    if (data.factType && data.confidence !== undefined) {
      return StorageDestination.CHROMADB_FACTS;
    }
    
    // Raw embeddings for flexible data
    if (data.rawData && data.contentType) {
      return StorageDestination.CHROMADB_RAW;
    }
    
    // Default to stored memories
    return StorageDestination.CHROMADB_MEMORIES;
  }
  
  /**
   * Determine if query should use hybrid search
   */
  private shouldUseHybridSearch(query: string, filters?: any): boolean {
    const wordCount = query.split(' ').length;
    
    // Use hybrid for complex queries
    if (wordCount > 5) return true;
    
    // Use hybrid when filters are present
    if (filters && Object.keys(filters).length > 0) return true;
    
    // Use hybrid for semantic questions
    const semanticIndicators = ['how', 'why', 'what', 'when', 'explain'];
    return semanticIndicators.some(indicator => 
      query.toLowerCase().includes(indicator)
    );
  }
  
  /**
   * Determine if query should use FAISS
   */
  private shouldUseFAISS(query: string, filters?: any): boolean {
    // Don't use FAISS if filters are present
    if (filters && Object.keys(filters).length > 0) return false;
    
    const wordCount = query.split(' ').length;
    const threshold = this.config.faiss.hybridSearchThreshold;
    
    // Use FAISS for simple queries
    return wordCount <= threshold;
  }
  
  /**
   * Get appropriate memory collection name
   */
  private getMemoryCollection(memoryType: string): string {
    const collections = getCollectionNames();
    
    switch (memoryType) {
      case 'conversation':
        return collections.storedMemories[0]; // mira_conversations
      case 'code':
      case 'technical':
        return collections.storedMemories[1]; // mira_codebase
      case 'insight':
      case 'learning':
        return collections.storedMemories[2]; // mira_insights
      case 'pattern':
      case 'behavior':
        return collections.storedMemories[3]; // mira_patterns
      default:
        return collections.storedMemories[2]; // mira_insights (default)
    }
  }
  
  /**
   * Get appropriate fact collection name
   */
  private getFactCollection(factType: string): string {
    const collections = getCollectionNames();
    
    switch (factType) {
      case 'code_analysis':
        return collections.identifiedFacts[0];
      case 'development_pattern':
        return collections.identifiedFacts[1];
      case 'decision':
        return collections.identifiedFacts[2];
      case 'learning':
        return collections.identifiedFacts[3];
      case 'project':
      case 'context':
        return collections.identifiedFacts[4];
      default:
        return collections.identifiedFacts[4]; // project_context (default)
    }
  }
  
  /**
   * Ensure all storage directories exist
   */
  private async ensureDirectories(): Promise<void> {
    const dirs = [
      this.paths.base,
      this.paths.lightningVidmem.root,
      this.paths.lightningVidmem.codebase,
      this.paths.lightningVidmem.conversations,
      this.paths.lightningVidmem.privateMemory,
      this.paths.chromadb.root,
      this.paths.faiss.root
    ];
    
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }
  
  /**
   * Initialize ChromaDB collections
   */
  private async initializeChromaCollections(): Promise<void> {
    // Placeholder for ChromaDB initialization
    // This would create all necessary collections
    const collections = getCollectionNames();
    
    for (const collection of collections.all) {
      // Create collection with proper metadata
      console.log(`Initializing ChromaDB collection: ${collection}`);
    }
  }
  
  /**
   * Initialize FAISS index
   */
  private async initializeFAISS(): Promise<void> {
    // Placeholder for FAISS initialization
    console.log('Initializing FAISS index');
  }
  
  /**
   * Perform hybrid search across FAISS and ChromaDB
   */
  private async hybridSearch(query: string, options: any): Promise<any[]> {
    // Placeholder for hybrid search implementation
    return [];
  }
  
  /**
   * Perform FAISS-only search
   */
  private async faissSearch(query: string, limit?: number): Promise<any[]> {
    // Placeholder for FAISS search implementation
    return [];
  }
  
  /**
   * Perform ChromaDB-only search
   */
  private async chromaSearch(query: string, options: any): Promise<any[]> {
    // Placeholder for ChromaDB search implementation
    return [];
  }
}

/**
 * Singleton instance
 */
let orchestratorInstance: StorageOrchestrator | null = null;

export function getStorageOrchestrator(): StorageOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new StorageOrchestrator();
  }
  return orchestratorInstance;
}