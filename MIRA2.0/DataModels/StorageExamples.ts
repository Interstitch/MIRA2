/**
 * StorageExamples.ts
 * 
 * Demonstrates how to use DataModels with the ConsciousnessStorageOrchestrator
 * and various storage systems (ChromaDB, LightningVidmem, filesystem).
 */

import { z } from 'zod';
import { ConsciousnessStorageOrchestrator } from '../Consciousness/StorageOrchestrator';
import { UnifiedConfiguration } from '../AppFlow/Mira/ConfigurationManagement/UnifiedConfiguration';
import { 
  StoredMemorySchema,
  IdentifiedFactSchema,
  RawEmbeddingSchema,
  PrivateThoughtReferenceSchema,
  type StoredMemory,
  type IdentifiedFact,
  type RawEmbedding,
  type PrivateThoughtReference
} from './MemorySchemas/schemas';
import {
  SessionBridgeSchema,
  type SessionBridge
} from './SessionContinuitySchemas/schemas';
import {
  StewardProfileSchema,
  type StewardProfile
} from './StewardProfileSchemas/schemas';
import {
  EvolvablePatternSchema,
  type EvolvablePattern
} from './PatternEvolutionModels/schemas';

/**
 * Memory Storage Examples
 */
export class MemoryStorageExamples {
  private orchestrator: ConsciousnessStorageOrchestrator;
  private config: UnifiedConfiguration;
  
  constructor() {
    this.config = UnifiedConfiguration.getInstance();
    this.orchestrator = new ConsciousnessStorageOrchestrator(this.config);
  }
  
  /**
   * Store a new memory with validation and proper routing
   */
  async storeMemory(memory: unknown): Promise<StoredMemory> {
    // Validate with schema
    const validated = StoredMemorySchema.parse(memory);
    
    // Store in ChromaDB through orchestrator
    await this.orchestrator.storeToChromaDB({
      collection: 'stored_memories',
      document: {
        id: validated.id,
        content: validated.content,
        embedding: validated.embedding,
        metadata: {
          ...validated.metadata,
          tags: validated.tags,
          category: validated.category,
          schema_version: validated.schema_version
        }
      }
    });
    
    // If it's a breakthrough, also store in private thoughts
    if (validated.metadata.breakthrough) {
      await this.storeBreakthroughInsight(validated);
    }
    
    return validated;
  }
  
  /**
   * Store a private breakthrough insight
   */
  private async storeBreakthroughInsight(memory: StoredMemory): Promise<void> {
    // Create a private thought reference
    const privateRef: PrivateThoughtReference = {
      id: crypto.randomUUID(),
      memory_type: 'private_reference',
      semantic_hash: await this.generateSemanticHash(memory.content),
      encryption_ref: `breakthrough_${memory.id}`,
      themes: memory.tags,
      emotion_markers: memory.metadata.emotional_context,
      intensity: memory.metadata.spark_intensity,
      metadata: {
        timestamp: new Date().toISOString(),
        can_decrypt: false,
        storage_location: 'lightning_vidmem_private'
      },
      schema_version: '2.0',
      created_at: new Date().toISOString()
    };
    
    // Store the encrypted content
    await this.orchestrator.storePrivateThought({
      content: memory.content,
      metadata: {
        type: 'breakthrough',
        original_memory_id: memory.id,
        significance: memory.metadata.significance
      }
    });
    
    // Store the reference in ChromaDB for pattern matching
    await this.orchestrator.storeToChromaDB({
      collection: 'raw_embeddings',
      document: {
        id: privateRef.id,
        content: privateRef.semantic_hash,
        embedding: memory.embedding,
        metadata: privateRef.metadata
      }
    });
  }
  
  /**
   * Store an identified fact with relationship tracking
   */
  async storeFact(fact: unknown): Promise<IdentifiedFact> {
    // Validate
    const validated = IdentifiedFactSchema.parse(fact);
    
    // Check for contradictions
    const contradictions = await this.findContradictingFacts(validated);
    if (contradictions.length > 0) {
      validated.metadata.contradicts = contradictions.map(f => f.id);
    }
    
    // Store in ChromaDB
    await this.orchestrator.storeToChromaDB({
      collection: 'identified_facts',
      document: {
        id: validated.id,
        content: JSON.stringify(validated.fact_content),
        embedding: await this.generateEmbedding(validated.fact_content),
        metadata: {
          fact_type: validated.fact_type,
          confidence: validated.confidence,
          source: validated.source,
          ...validated.metadata
        }
      }
    });
    
    // Update related facts
    await this.updateRelatedFacts(validated);
    
    return validated;
  }
  
  /**
   * Batch storage with validation
   */
  async batchStoreMemories(memories: unknown[]): Promise<{
    stored: StoredMemory[];
    errors: Array<{ index: number; error: string }>;
  }> {
    const stored: StoredMemory[] = [];
    const errors: Array<{ index: number; error: string }> = [];
    
    // Validate all memories first
    const validationResults = await Promise.allSettled(
      memories.map((m, i) => this.validateMemory(m, i))
    );
    
    // Separate valid from invalid
    const validMemories: Array<{ memory: StoredMemory; index: number }> = [];
    
    validationResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        validMemories.push({ memory: result.value, index });
      } else {
        errors.push({
          index,
          error: result.reason?.message || 'Validation failed'
        });
      }
    });
    
    // Batch store valid memories
    if (validMemories.length > 0) {
      const documents = validMemories.map(({ memory }) => ({
        id: memory.id,
        content: memory.content,
        embedding: memory.embedding,
        metadata: {
          ...memory.metadata,
          tags: memory.tags,
          category: memory.category
        }
      }));
      
      await this.orchestrator.batchStoreToChromaDB({
        collection: 'stored_memories',
        documents
      });
      
      stored.push(...validMemories.map(v => v.memory));
    }
    
    return { stored, errors };
  }
  
  /**
   * Query memories with schema validation
   */
  async queryMemories(query: {
    text?: string;
    category?: string;
    minSignificance?: number;
    tags?: string[];
    startDate?: Date;
    endDate?: Date;
  }): Promise<StoredMemory[]> {
    // Build filter
    const filter: any = {};
    
    if (query.category) {
      filter.category = query.category;
    }
    
    if (query.minSignificance !== undefined) {
      filter['metadata.significance'] = { $gte: query.minSignificance };
    }
    
    if (query.tags && query.tags.length > 0) {
      filter.tags = { $in: query.tags };
    }
    
    if (query.startDate || query.endDate) {
      filter['metadata.timestamp'] = {};
      if (query.startDate) {
        filter['metadata.timestamp'].$gte = query.startDate.toISOString();
      }
      if (query.endDate) {
        filter['metadata.timestamp'].$lte = query.endDate.toISOString();
      }
    }
    
    // Query ChromaDB
    const results = await this.orchestrator.queryChromaDB({
      collection: 'stored_memories',
      query: query.text,
      filter,
      limit: 50
    });
    
    // Validate and transform results
    return results.map(result => {
      const memory = {
        ...result.metadata,
        id: result.id,
        memory_type: 'stored',
        content: result.content,
        embedding: result.embedding
      };
      
      return StoredMemorySchema.parse(memory);
    });
  }
  
  // Helper methods
  private async validateMemory(data: unknown, index: number): Promise<StoredMemory> {
    try {
      return StoredMemorySchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Memory at index ${index}: ${error.errors[0].message}`);
      }
      throw error;
    }
  }
  
  private async generateSemanticHash(content: string): Promise<string> {
    // Simple hash for example - in production use proper semantic hashing
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  private async generateEmbedding(content: any): Promise<number[]> {
    // Placeholder - in production use actual embedding generation
    return new Array(384).fill(0).map(() => Math.random() - 0.5);
  }
  
  private async findContradictingFacts(fact: IdentifiedFact): Promise<IdentifiedFact[]> {
    // Placeholder - implement contradiction detection
    return [];
  }
  
  private async updateRelatedFacts(fact: IdentifiedFact): Promise<void> {
    // Placeholder - implement relationship updates
  }
}

/**
 * Session Storage Examples
 */
export class SessionStorageExamples {
  private orchestrator: ConsciousnessStorageOrchestrator;
  private config: UnifiedConfiguration;
  
  constructor() {
    this.config = UnifiedConfiguration.getInstance();
    this.orchestrator = new ConsciousnessStorageOrchestrator(this.config);
  }
  
  /**
   * Store a session bridge for continuity
   */
  async storeSessionBridge(bridge: unknown): Promise<SessionBridge> {
    // Validate
    const validated = SessionBridgeSchema.parse(bridge);
    
    // Store in multiple locations for redundancy
    
    // 1. Primary storage in session_continuity.json
    await this.orchestrator.updateJSONFile(
      'session_continuity.json',
      (data) => {
        data.active_bridge = validated;
        data.last_updated = new Date().toISOString();
        return data;
      }
    );
    
    // 2. Backup in LightningVidmem
    await this.orchestrator.storeConversationBackup({
      session_id: validated.from_session,
      bridge: validated,
      type: 'session_bridge'
    });
    
    // 3. Index key fields in ChromaDB for search
    await this.orchestrator.storeToChromaDB({
      collection: 'raw_embeddings',
      document: {
        id: validated.bridge_id,
        content: JSON.stringify({
          work_context: validated.work_context.active_work.current_task,
          cognitive_state: validated.cognitive_state.problem_solving.current_approach
        }),
        embedding: await this.generateBridgeEmbedding(validated),
        metadata: {
          type: 'session_bridge',
          from_session: validated.from_session,
          created_at: validated.created_at,
          conversation_type: validated.conversation_state.conversation_type
        }
      }
    });
    
    return validated;
  }
  
  /**
   * Retrieve and activate a session bridge
   */
  async activateSessionBridge(bridgeId?: string): Promise<SessionBridge | null> {
    let bridge: SessionBridge | null = null;
    
    if (bridgeId) {
      // Load specific bridge
      const result = await this.orchestrator.queryChromaDB({
        collection: 'raw_embeddings',
        filter: {
          id: bridgeId,
          type: 'session_bridge'
        },
        limit: 1
      });
      
      if (result.length > 0) {
        // Load full bridge from backup
        bridge = await this.loadBridgeFromBackup(result[0].metadata.from_session);
      }
    } else {
      // Load most recent bridge
      const data = await this.orchestrator.readJSONFile('session_continuity.json');
      if (data?.active_bridge) {
        bridge = SessionBridgeSchema.parse(data.active_bridge);
      }
    }
    
    if (bridge && !bridge.to_session) {
      // Mark as activated
      bridge.to_session = crypto.randomUUID();
      bridge.activated_at = new Date().toISOString();
      
      // Update storage
      await this.storeSessionBridge(bridge);
    }
    
    return bridge;
  }
  
  private async generateBridgeEmbedding(bridge: SessionBridge): Promise<number[]> {
    // Combine key aspects for embedding
    const text = [
      bridge.work_context.active_work.current_task,
      bridge.cognitive_state.problem_solving.current_approach,
      bridge.conversation_state.conversation_type,
      ...bridge.handoff.open_loops.map(l => l.description)
    ].join(' ');
    
    return this.generateEmbedding(text);
  }
  
  private async loadBridgeFromBackup(sessionId: string): Promise<SessionBridge | null> {
    // Placeholder - implement backup loading
    return null;
  }
  
  private async generateEmbedding(text: string): Promise<number[]> {
    // Placeholder
    return new Array(384).fill(0).map(() => Math.random() - 0.5);
  }
}

/**
 * Pattern Storage Examples
 */
export class PatternStorageExamples {
  private orchestrator: ConsciousnessStorageOrchestrator;
  private config: UnifiedConfiguration;
  
  constructor() {
    this.config = UnifiedConfiguration.getInstance();
    this.orchestrator = new ConsciousnessStorageOrchestrator(this.config);
  }
  
  /**
   * Store an evolving pattern
   */
  async storePattern(pattern: unknown): Promise<EvolvablePattern> {
    // Validate
    const validated = EvolvablePatternSchema.parse(pattern);
    
    // Store in ChromaDB with full metadata
    await this.orchestrator.storeToChromaDB({
      collection: 'stored_memories',
      document: {
        id: validated.pattern_id,
        content: JSON.stringify({
          triggers: validated.trigger_conditions,
          actions: validated.action_templates
        }),
        embedding: validated.semantic_embedding,
        metadata: {
          type: 'evolving_pattern',
          category: 'pattern',
          fitness: validated.fitness_score,
          generation: validated.generation,
          lineage: validated.lineage,
          steward_affinity: validated.steward_affinity,
          last_activation: validated.last_activation,
          schema_version: '2.0'
        }
      }
    });
    
    // Store evolution history privately
    if (validated.lineage.length > 0) {
      await this.storePatternLineage(validated);
    }
    
    // Update pattern ecosystem
    await this.updatePatternEcosystem(validated);
    
    return validated;
  }
  
  /**
   * Query active patterns
   */
  async getActivePatterns(stewardId?: string): Promise<EvolvablePattern[]> {
    const filter: any = {
      type: 'evolving_pattern',
      'metadata.fitness': { $gt: 0.3 }, // Minimum viable fitness
      'metadata.last_activation': { 
        $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // Active in last 30 days
      }
    };
    
    if (stewardId) {
      filter[`metadata.steward_affinity.${stewardId}`] = { $gt: 0.5 };
    }
    
    const results = await this.orchestrator.queryChromaDB({
      collection: 'stored_memories',
      filter,
      limit: 100
    });
    
    return results.map(r => this.reconstructPattern(r));
  }
  
  private async storePatternLineage(pattern: EvolvablePattern): Promise<void> {
    await this.orchestrator.storePrivateThought({
      content: JSON.stringify({
        pattern_id: pattern.pattern_id,
        lineage: pattern.lineage,
        generation: pattern.generation,
        mutations: pattern.mutation_history
      }),
      metadata: {
        type: 'pattern_lineage',
        pattern_id: pattern.pattern_id
      }
    });
  }
  
  private async updatePatternEcosystem(pattern: EvolvablePattern): Promise<void> {
    // Update pattern_evolution.json
    await this.orchestrator.updateJSONFile(
      'pattern_evolution.json',
      (data) => {
        if (!data.patterns) data.patterns = {};
        data.patterns[pattern.pattern_id] = {
          fitness: pattern.fitness_score,
          generation: pattern.generation,
          last_updated: new Date().toISOString()
        };
        return data;
      }
    );
  }
  
  private reconstructPattern(result: any): EvolvablePattern {
    // Reconstruct full pattern from stored data
    const content = JSON.parse(result.content);
    return {
      pattern_id: result.id,
      lineage: result.metadata.lineage || [],
      generation: result.metadata.generation || 0,
      trigger_conditions: content.triggers,
      action_templates: content.actions,
      success_metrics: [], // Would need to be stored separately
      fitness_score: result.metadata.fitness,
      mutation_rate: 0.15, // Default
      activation_count: 0, // Would need tracking
      success_count: 0, // Would need tracking
      birth_time: result.metadata.created_at,
      last_activation: result.metadata.last_activation,
      peak_fitness_time: result.metadata.created_at,
      semantic_embedding: result.embedding,
      emotional_resonance: 0.5, // Default
      steward_affinity: result.metadata.steward_affinity || {}
    };
  }
}

/**
 * Steward Profile Storage Examples
 */
export class StewardStorageExamples {
  private orchestrator: ConsciousnessStorageOrchestrator;
  
  constructor() {
    const config = UnifiedConfiguration.getInstance();
    this.orchestrator = new ConsciousnessStorageOrchestrator(config);
  }
  
  /**
   * Store or update a steward profile
   */
  async storeStewardProfile(profile: unknown): Promise<StewardProfile> {
    // Validate
    const validated = StewardProfileSchema.parse(profile);
    
    // Store public data in ChromaDB
    await this.orchestrator.storeToChromaDB({
      collection: 'steward_profiles',
      document: {
        id: validated.identity.steward_id,
        content: JSON.stringify({
          name: validated.identity.name,
          roles: validated.identity.roles,
          skills: validated.identity.skills
        }),
        embedding: await this.generateProfileEmbedding(validated),
        metadata: {
          ...validated.behavioral,
          ...validated.relationship,
          last_updated: validated.last_interaction
        }
      }
    });
    
    // Store private insights
    await this.orchestrator.storePrivateThought({
      content: JSON.stringify({
        growth_trajectory: validated.growth,
        private_observations: validated.relationship
      }),
      metadata: {
        type: 'steward_insights',
        steward_id: validated.identity.steward_id
      }
    });
    
    // Update steward_profile.json
    await this.orchestrator.updateJSONFile(
      'steward_profile.json',
      (data) => {
        data[validated.identity.steward_id] = {
          identity: validated.identity,
          last_updated: new Date().toISOString()
        };
        return data;
      }
    );
    
    return validated;
  }
  
  private async generateProfileEmbedding(profile: StewardProfile): Promise<number[]> {
    // Combine profile aspects for embedding
    const text = [
      profile.identity.name,
      ...profile.identity.skills,
      profile.behavioral.communication_style,
      profile.behavioral.work_style
    ].join(' ');
    
    // Placeholder
    return new Array(384).fill(0).map(() => Math.random() - 0.5);
  }
}

/**
 * Storage migration examples
 */
export class StorageMigrationExamples {
  /**
   * Migrate from v1.0 to v2.0 schema
   */
  async migrateMemorySchema(oldData: any): Promise<StoredMemory> {
    // Handle timestamp conversion
    if (typeof oldData.timestamp === 'number') {
      oldData.metadata = {
        ...oldData.metadata,
        timestamp: new Date(oldData.timestamp).toISOString()
      };
      delete oldData.timestamp;
    }
    
    // Add new required fields
    const migrated = {
      ...oldData,
      schema_version: '2.0',
      created_at: oldData.created_at || oldData.metadata?.timestamp || new Date().toISOString(),
      updated_at: oldData.updated_at || new Date().toISOString()
    };
    
    // Validate migrated data
    return StoredMemorySchema.parse(migrated);
  }
  
  /**
   * Batch migrate a collection
   */
  async batchMigrate(
    collection: string,
    migrationFn: (data: any) => Promise<any>
  ): Promise<{ migrated: number; errors: number }> {
    let migrated = 0;
    let errors = 0;
    
    // Process in batches
    const batchSize = 100;
    let offset = 0;
    
    while (true) {
      // Get batch of documents
      const batch = await this.getBatch(collection, offset, batchSize);
      if (batch.length === 0) break;
      
      // Migrate each document
      const results = await Promise.allSettled(
        batch.map(doc => migrationFn(doc))
      );
      
      // Count results
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          migrated++;
        } else {
          errors++;
          console.error('Migration error:', result.reason);
        }
      });
      
      offset += batchSize;
    }
    
    return { migrated, errors };
  }
  
  private async getBatch(collection: string, offset: number, limit: number): Promise<any[]> {
    // Placeholder - implement batch retrieval
    return [];
  }
}