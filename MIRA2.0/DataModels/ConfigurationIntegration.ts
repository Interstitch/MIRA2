/**
 * ConfigurationIntegration.ts
 * 
 * Integrates DataModels with UnifiedConfiguration to provide
 * configuration-aware schemas with proper defaults and validation.
 */

import { z } from 'zod';
import { UnifiedConfiguration } from '../AppFlow/Mira/ConfigurationManagement/UnifiedConfiguration';

/**
 * Creates a configuration-aware schema that applies defaults from UnifiedConfiguration
 */
export function createConfiguredSchema<T extends z.ZodSchema>(
  schema: T,
  configPath: string
): T {
  const config = UnifiedConfiguration.getInstance();
  const schemaConfig = config.get(configPath);
  
  // Return original schema if no config found
  if (!schemaConfig) {
    return schema;
  }
  
  // Apply configuration defaults dynamically
  return schema.transform((data) => {
    return { ...schemaConfig, ...data };
  }) as T;
}

/**
 * Memory schema configuration integration
 */
export function configureMemorySchemas() {
  const config = UnifiedConfiguration.getInstance();
  const memoryConfig = config.get('memory', {
    defaultSignificance: 0.5,
    defaultConfidence: 0.7,
    retentionDays: 365,
    embeddingDimensions: 384,
    maxContentLength: 10000,
    maxTags: 20
  });
  
  return {
    // StoredMemory defaults
    storedMemory: {
      significance: memoryConfig.defaultSignificance,
      confidence: memoryConfig.defaultConfidence,
      retentionDays: memoryConfig.retentionDays,
      maxTags: memoryConfig.maxTags
    },
    
    // IdentifiedFact defaults
    identifiedFact: {
      defaultConfidence: 0.8,
      verificationThreshold: 0.9,
      expirationDays: memoryConfig.retentionDays * 2
    },
    
    // RawEmbedding defaults
    rawEmbedding: {
      dimensions: memoryConfig.embeddingDimensions,
      ttlSeconds: 86400, // 24 hours default
      compressionEnabled: true
    }
  };
}

/**
 * Pattern evolution configuration integration
 */
export function configurePatternSchemas() {
  const config = UnifiedConfiguration.getInstance();
  const patternConfig = config.get('consciousness.patternEvolution.geneticAlgorithm', {
    mutationRate: 0.15,
    crossoverRate: 0.7,
    populationSize: 100,
    selectionPressure: 0.8,
    eliteRatio: 0.1,
    minFitness: 0.3
  });
  
  return {
    // EvolvablePattern defaults
    evolvablePattern: {
      initialMutationRate: patternConfig.mutationRate,
      initialFitness: 0.5,
      minViableFitness: patternConfig.minFitness
    },
    
    // PatternMutation defaults
    patternMutation: {
      mutationTypes: ['trigger', 'action', 'threshold', 'combination'],
      mutationSeverity: 'moderate',
      preserveCore: true
    },
    
    // FitnessMetric defaults
    fitnessMetric: {
      successWeight: 0.6,
      efficiencyWeight: 0.3,
      eleganceWeight: 0.1
    }
  };
}

/**
 * Session continuity configuration integration
 */
export function configureSessionSchemas() {
  const config = UnifiedConfiguration.getInstance();
  const sessionConfig = config.get('daemon.services.sessionContinuity', {
    bridgeRetentionDays: 30,
    autoHandoff: true,
    preservePrivateContext: false,
    handoffTimeoutMinutes: 5
  });
  
  return {
    // SessionBridge defaults
    sessionBridge: {
      retentionDays: sessionConfig.bridgeRetentionDays,
      autoActivation: sessionConfig.autoHandoff,
      encryptSensitive: true
    },
    
    // HandoffInstructions defaults
    handoffInstructions: {
      maxOpenLoops: 10,
      priorityLevels: ['critical', 'important', 'normal', 'low'],
      defaultGreetingStyle: 'contextual'
    }
  };
}

/**
 * Steward profile configuration integration
 */
export function configureStewardSchemas() {
  const config = UnifiedConfiguration.getInstance();
  const stewardConfig = config.get('consciousness.stewardProfile', {
    trustDecayRate: 0.01,
    recognitionThreshold: 0.85,
    learningRate: 0.1,
    momentum: 0.9,
    privacyLevel: 'balanced'
  });
  
  return {
    // StewardIdentity defaults
    stewardIdentity: {
      recognitionThreshold: stewardConfig.recognitionThreshold,
      confidenceRequired: 0.8,
      aliasLimit: 5
    },
    
    // BehavioralProfile defaults
    behavioralProfile: {
      learningRate: stewardConfig.learningRate,
      momentum: stewardConfig.momentum,
      minObservations: 10
    },
    
    // RelationshipMetrics defaults
    relationshipMetrics: {
      trustDecayRate: stewardConfig.trustDecayRate,
      initialTrust: 0.5,
      maxTrust: 1.0
    }
  };
}

/**
 * Helper to create a schema with configuration-based validation
 */
export function withConfigValidation<T extends z.ZodSchema>(
  schema: T,
  configPath: string,
  validationRules?: (config: any) => z.ZodSchema
): T {
  const config = UnifiedConfiguration.getInstance();
  const configValue = config.get(configPath);
  
  if (!configValue || !validationRules) {
    return schema;
  }
  
  // Apply additional validation based on configuration
  const configValidation = validationRules(configValue);
  return schema.and(configValidation) as T;
}

/**
 * Example usage of configuration-aware schemas
 */
export const ConfiguredStoredMemorySchema = z.object({
  id: z.string().uuid(),
  memory_type: z.literal('stored'),
  content: z.string().min(1).max(
    configureMemorySchemas().storedMemory.maxContentLength || 10000
  ),
  embedding: z.array(z.number()).length(
    configureMemorySchemas().rawEmbedding.dimensions
  ),
  tags: z.array(z.string()).max(
    configureMemorySchemas().storedMemory.maxTags
  ),
  metadata: z.object({
    timestamp: z.string().datetime(),
    significance: z.number().min(0).max(1).default(
      configureMemorySchemas().storedMemory.significance
    ),
    confidence: z.number().min(0).max(1).default(
      configureMemorySchemas().storedMemory.confidence
    )
  })
});

/**
 * Configuration validator for runtime checks
 */
export class ConfigurationValidator {
  private static instance: ConfigurationValidator;
  private config: UnifiedConfiguration;
  
  private constructor() {
    this.config = UnifiedConfiguration.getInstance();
  }
  
  static getInstance(): ConfigurationValidator {
    if (!ConfigurationValidator.instance) {
      ConfigurationValidator.instance = new ConfigurationValidator();
    }
    return ConfigurationValidator.instance;
  }
  
  /**
   * Validates that required configuration exists for schemas
   */
  validateSchemaConfig(schemaType: string): boolean {
    const requiredPaths = {
      memory: ['memory.defaultSignificance', 'memory.retentionDays'],
      pattern: ['consciousness.patternEvolution.geneticAlgorithm'],
      session: ['daemon.services.sessionContinuity'],
      steward: ['consciousness.stewardProfile']
    };
    
    const paths = requiredPaths[schemaType] || [];
    return paths.every(path => this.config.get(path) !== undefined);
  }
  
  /**
   * Gets configuration with fallback defaults
   */
  getConfigWithDefaults(path: string, defaults: any): any {
    const configValue = this.config.get(path);
    return { ...defaults, ...configValue };
  }
}

/**
 * Export configuration-aware schema factory
 */
export function createSchemaWithConfig<T>(
  baseSchema: z.ZodSchema<T>,
  configPath: string,
  defaults?: Partial<T>
): z.ZodSchema<T> {
  const validator = ConfigurationValidator.getInstance();
  const config = validator.getConfigWithDefaults(configPath, defaults || {});
  
  // Create a new schema that includes configuration defaults
  return baseSchema.transform((data) => {
    // Apply configuration defaults for undefined fields
    const result = { ...data };
    
    Object.keys(config).forEach(key => {
      if (result[key] === undefined && config[key] !== undefined) {
        result[key] = config[key];
      }
    });
    
    return result;
  }) as z.ZodSchema<T>;
}