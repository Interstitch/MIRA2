/**
 * Configuration Integration for MIRA 2.0 Storage Systems
 * 
 * This module bridges StorageSystems with UnifiedConfiguration,
 * ensuring all storage components use centralized configuration.
 */

import { UnifiedConfiguration } from '../AppFlow/Mira/ConfigurationManagement/UnifiedConfiguration';
import { z } from 'zod';
import * as path from 'path';

/**
 * Storage system configuration schemas
 */
export const StorageConfigSchema = z.object({
  storage: z.object({
    basePath: z.string().default(path.join(process.env.HOME || '', '.mira', 'databases')),
    
    lightningVidmem: z.object({
      enabled: z.boolean().default(true),
      paths: z.object({
        codebase: z.string().default('lightning_vidmem/codebase'),
        conversations: z.string().default('lightning_vidmem/conversations'),
        privateMemory: z.string().default('lightning_vidmem/private_memory')
      }),
      performance: z.object({
        frameCacheSize: z.number().default(1000),
        chunkCacheSize: z.number().default(100),
        videoGenerationEnabled: z.boolean().default(true),
        threadPoolSize: z.number().default(4)
      }),
      encryption: z.object({
        tripleEncryptionEnabled: z.boolean().default(true),
        iterations: z.object({
          content: z.number().default(100000),
          pattern: z.number().default(130000),
          consciousness: z.number().default(170000)
        })
      })
    }),
    
    chromadb: z.object({
      enabled: z.boolean().default(true),
      persistDirectory: z.string().default('chromadb'),
      collections: z.object({
        storedMemories: z.array(z.string()).default([
          'mira_conversations',
          'mira_codebase',
          'mira_insights',
          'mira_patterns'
        ]),
        identifiedFacts: z.array(z.string()).default([
          'mira_code_analysis',
          'mira_development_patterns',
          'mira_decision_history',
          'mira_learning_insights',
          'mira_project_context'
        ]),
        rawEmbeddings: z.array(z.string()).default([
          'mira_raw_embeddings'
        ])
      }),
      embedding: z.object({
        model: z.string().default('all-MiniLM-L6-v2'),
        dimensions: z.number().default(384),
        maxBatchSize: z.number().default(100),
        cacheSize: z.number().default(10000)
      })
    }),
    
    faiss: z.object({
      enabled: z.boolean().default(true),
      indexPath: z.string().default('faiss'),
      hybridSearchThreshold: z.number().default(3), // Words in query
      performanceTargets: z.object({
        simpleQueryMs: z.number().default(10),
        semanticQueryMs: z.number().default(200),
        hybridQueryMs: z.number().default(300)
      })
    })
  })
});

/**
 * Get storage configuration from UnifiedConfiguration
 */
export function getStorageConfig() {
  const config = UnifiedConfiguration.getInstance();
  return config.get('storage', StorageConfigSchema.shape.storage.parse({}));
}

/**
 * Get specific storage system configuration
 */
export function getLightningVidmemConfig() {
  const config = UnifiedConfiguration.getInstance();
  return config.get('storage.lightningVidmem');
}

export function getChromaDBConfig() {
  const config = UnifiedConfiguration.getInstance();
  return config.get('storage.chromadb');
}

export function getFAISSConfig() {
  const config = UnifiedConfiguration.getInstance();
  return config.get('storage.faiss');
}

/**
 * Build storage paths from configuration
 */
export function getStoragePaths() {
  const config = getStorageConfig();
  const basePath = config.basePath;
  
  return {
    base: basePath,
    lightningVidmem: {
      root: path.join(basePath, 'lightning_vidmem'),
      codebase: path.join(basePath, config.lightningVidmem.paths.codebase),
      conversations: path.join(basePath, config.lightningVidmem.paths.conversations),
      privateMemory: path.join(basePath, config.lightningVidmem.paths.privateMemory)
    },
    chromadb: {
      root: path.join(basePath, config.chromadb.persistDirectory),
      collections: path.join(basePath, config.chromadb.persistDirectory, 'collections')
    },
    faiss: {
      root: path.join(basePath, config.faiss.indexPath),
      index: path.join(basePath, config.faiss.indexPath, 'index.bin'),
      mappings: path.join(basePath, config.faiss.indexPath, 'mappings.pkl')
    }
  };
}

/**
 * Collection name helpers with configuration
 */
export function getCollectionNames() {
  const config = getChromaDBConfig();
  return {
    storedMemories: config.collections.storedMemories,
    identifiedFacts: config.collections.identifiedFacts,
    rawEmbeddings: config.collections.rawEmbeddings,
    all: [
      ...config.collections.storedMemories,
      ...config.collections.identifiedFacts,
      ...config.collections.rawEmbeddings
    ]
  };
}

/**
 * Performance target helpers
 */
export function getPerformanceTargets() {
  const lightningConfig = getLightningVidmemConfig();
  const faissConfig = getFAISSConfig();
  
  return {
    lightning: {
      saveTimeMs: 100,
      frameCacheSize: lightningConfig.performance.frameCacheSize,
      threadPoolSize: lightningConfig.performance.threadPoolSize
    },
    faiss: {
      simpleQueryMs: faissConfig.performanceTargets.simpleQueryMs,
      semanticQueryMs: faissConfig.performanceTargets.semanticQueryMs,
      hybridQueryMs: faissConfig.performanceTargets.hybridQueryMs
    },
    chromadb: {
      maxBatchSize: getChromaDBConfig().embedding.maxBatchSize,
      queryTimeMs: 200
    }
  };
}

/**
 * Encryption configuration helper
 */
export function getEncryptionConfig() {
  const config = UnifiedConfiguration.getInstance();
  
  return {
    lightning: getLightningVidmemConfig().encryption,
    consciousness: config.get('consciousness.tripleEncryption', {
      enabled: true,
      constants: {
        pi: Math.PI,
        e: Math.E,
        phi: (1 + Math.sqrt(5)) / 2,
        gamma: 0.5772156649015329
      }
    })
  };
}

/**
 * Validate storage configuration on startup
 */
export function validateStorageConfiguration(): boolean {
  try {
    const config = getStorageConfig();
    StorageConfigSchema.shape.storage.parse(config);
    
    // Additional validation
    if (config.chromadb.embedding.dimensions !== 384) {
      console.warn('Non-standard embedding dimensions may affect compatibility');
    }
    
    return true;
  } catch (error) {
    console.error('Storage configuration validation failed:', error);
    return false;
  }
}