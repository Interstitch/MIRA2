# MCP Integration Guide - MIRA 2.0

## 🎯 Overview

MIRA's MCP (Model Context Protocol) Server provides Claude with direct access to MIRA's intelligence systems. This guide shows how to leverage the 8 core MCP functions for powerful development assistance.

## 🚀 Getting Started with MCP

### Automatic Setup

When you run `mira startup`, the MCP server automatically starts:

```bash
mira startup
# ✅ MCP Server: Running on http://localhost:7890
# ✅ 8 core functions available
```

### Testing the Connection

```bash
# Check MCP health
curl http://localhost:7890/health

# Discover available functions
curl http://localhost:7890/mcp/discover
```

## 🎯 The 8 Core Functions

### 1. `search` - Natural Language Search

Search across all memory systems with natural language:

```javascript
// Search everything
await mcp.call('search', {
    query: 'authentication implementation in Python files'
});

// Natural language examples:
'private thoughts about architecture'  // Searches private memory
'recent bugs with timezones'          // Time-bounded search
'error handling in API endpoints'     // Code-focused search
```

**Auto-detection features:**
- Detects private memory requests
- Identifies code searches
- Recognizes time boundaries
- Routes to appropriate storage

### 2. `store` - Smart Storage

Automatically stores content in the right place:

```javascript
// Store an insight
await mcp.call('store', {
    content: 'Redis pub/sub is perfect for real-time notifications',
    metadata: { tags: ['architecture', 'realtime'] }
});

// Auto-routing based on content:
// - Private thoughts → Encrypted storage
// - Code insights → ChromaDB code memories
// - Decisions → ChromaDB decision history
// - General → ChromaDB general memories
```

### 3. `analyze` - Universal Analysis

Analyzes anything with automatic type detection:

```javascript
// Analyze code
await mcp.call('analyze', {
    target: 'src/auth/middleware.py'
});

// Analyze behavior
await mcp.call('analyze', {
    target: 'user seems frustrated with the API'
});

// Analyze work context
await mcp.call('analyze', {
    target: 'productivity over last week'
});
```

**Auto-detection:**
- File paths → Code analysis
- Behavioral keywords → Behavior analysis
- Time references → Work context analysis

### 4. `profile` - Steward Profile Management

Get or update user preferences:

```javascript
// Get current profile
await mcp.call('profile', {
    action: 'get'
});

// Update preferences
await mcp.call('profile', {
    action: 'update',
    data: {
        preferred_language: 'TypeScript',
        coding_style: 'functional'
    }
});
```

### 5. `code_search` - AST-Based Code Search

Specialized code search with AST support:

```javascript
// Search for patterns
await mcp.call('code_search', {
    query: 'async function handleAuth'
});

// AST pattern search
await mcp.call('code_search', {
    query: 'function $NAME($PARAMS) { await $$ }'
});
```

### 6. `code_analyze` - Deep Code Analysis

Comprehensive code quality analysis:

```javascript
// Quick analysis
await mcp.call('code_analyze', {
    target: 'src/',
    quick: true
});

// Deep analysis
await mcp.call('code_analyze', {
    target: 'src/api/users.py',
    quick: false
});
```

### 7. `recall` - Retrieve by ID

Get specific memories:

```javascript
// Retrieve a memory
await mcp.call('recall', {
    id: 'mem_1234567890',
    decrypt: false  // Set true for private memories
});
```

### 8. `status` - System Health

Check MIRA's health and metrics:

```javascript
// Quick status
await mcp.call('status', {
    detailed: false
});

// Detailed status with metrics
await mcp.call('status', {
    detailed: true
});
```

## 🔄 Real-World Usage Patterns

### Development Assistant

```javascript
// Starting a new feature
const existing = await mcp.call('code_search', {
    query: 'user profile models'
});

const patterns = await mcp.call('search', {
    query: 'how we implemented similar features'
});

// After implementation
await mcp.call('store', {
    content: 'Implemented user profiles with avatar support using S3',
    metadata: { feature: 'user-profiles', version: '1.0' }
});
```

### Debugging Helper

```javascript
// Investigating an issue
const similar = await mcp.call('search', {
    query: 'similar timezone bugs we fixed'
});

const codeAnalysis = await mcp.call('code_analyze', {
    target: 'src/utils/datetime.py'
});

// Store the solution
await mcp.call('store', {
    content: 'Fixed timezone bug by always converting to UTC before storage',
    metadata: { type: 'bugfix', area: 'datetime' }
});
```

### Code Review Assistant

```javascript
// Analyze changed files
const analysis = await mcp.call('code_analyze', {
    target: 'src/api/',
    quick: false
});

// Find patterns
const patterns = await mcp.call('search', {
    query: 'our API design patterns and conventions'
});

// Store review insights
await mcp.call('store', {
    content: `Code review findings: ${analysis.summary}`,
    metadata: { type: 'code_review', pr: '123' }
});
```

### Learning & Research

```javascript
// Research a technology
const previous = await mcp.call('search', {
    query: 'GraphQL implementation experiences'
});

// Analyze current code for patterns
const analysis = await mcp.call('analyze', {
    target: 'current REST API implementation'
});

// Store research findings
await mcp.call('store', {
    content: 'GraphQL would reduce mobile bandwidth by 40% based on analysis',
    metadata: { type: 'research', topic: 'graphql' }
});
```

## 💡 Best Practices

### 1. Use Natural Language

```javascript
// Good - Natural and clear
await mcp.call('search', {
    query: 'how we handle user authentication in the mobile API'
});

// Less effective - Too technical
await mcp.call('search', {
    query: 'auth JWT mobile endpoint'
});
```

### 2. Let Auto-Detection Work

```javascript
// Simple - Let MIRA figure out the details
await mcp.call('analyze', {
    target: 'user behavior patterns'
});

// Unnecessary - Don't over-specify
await mcp.call('analyze', {
    target: 'user behavior patterns',
    analysis_type: 'behavioral',  // Auto-detected anyway
    include_history: true,         // Default behavior
    deep_analysis: true           // Redundant
});
```

### 3. Store Context, Not Just Facts

```javascript
// Good - Includes context and reasoning
await mcp.call('store', {
    content: 'Chose Redis over PostgreSQL for sessions due to 10x faster reads',
    metadata: { decision: 'technology', area: 'sessions' }
});

// Less useful - Missing context
await mcp.call('store', {
    content: 'Using Redis for sessions'
});
```

## 🛠️ Integration Examples

### Python Client

```python
import aiohttp
import json

async def call_mira(function: str, **params):
    async with aiohttp.ClientSession() as session:
        async with session.post(
            'http://localhost:7890/mcp',
            json={'function': function, 'params': params}
        ) as response:
            return await response.json()

# Usage
results = await call_mira('search', query='database migration patterns')
```

### JavaScript/TypeScript Client

```typescript
async function callMira(func: string, params: any = {}) {
    const response = await fetch('http://localhost:7890/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ function: func, params })
    });
    return response.json();
}

// Usage
const insights = await callMira('search', { 
    query: 'performance optimizations that worked' 
});
```

### Shell/CLI Usage

```bash
# Using curl
curl -X POST http://localhost:7890/mcp \
  -H "Content-Type: application/json" \
  -d '{"function": "search", "params": {"query": "recent bugs"}}'

# Using httpie
http POST localhost:7890/mcp function=search params:='{"query": "recent bugs"}'
```

## 🚨 Troubleshooting

### MCP Server Not Responding

```bash
# Check if daemon is running
mira daemon status

# Restart if needed
mira daemon restart

# Check logs
tail -f ~/.mira/logs/daemon.log
```

### Function Errors

```javascript
// Always check response success
const result = await mcp.call('search', {query: 'test'});
if (!result.success) {
    console.error('MCP Error:', result.error);
}
```

### Performance Issues

```javascript
// Use simpler queries for speed
await mcp.call('search', {
    query: 'auth bugs'  // Faster than complex natural language
});

// Use quick mode for code analysis
await mcp.call('code_analyze', {
    target: 'src/',
    quick: true  // Much faster
});
```

## 📚 Advanced Topics

### Batch Operations

```javascript
// Process multiple operations efficiently
const operations = [
    { function: 'search', params: { query: 'auth patterns' } },
    { function: 'code_search', params: { query: 'login functions' } },
    { function: 'analyze', params: { target: 'src/auth/' } }
];

const results = await Promise.all(
    operations.map(op => mcp.call(op.function, op.params))
);
```

### Custom Integration

```javascript
// Build higher-level abstractions
class MiraAssistant {
    async investigateBug(description: string) {
        // Search for similar issues
        const similar = await mcp.call('search', {
            query: `bugs similar to: ${description}`
        });
        
        // Analyze relevant code
        const analysis = await mcp.call('analyze', {
            target: description
        });
        
        // Return combined insights
        return { similar, analysis };
    }
}
```

## 🎯 Key Takeaways

1. **8 Functions Cover Everything**: Search, store, analyze, profile, code_search, code_analyze, recall, status
2. **Natural Language Works Best**: Write queries like you're talking to a colleague
3. **Auto-Detection Simplifies**: Functions figure out what you need
4. **Integration is Simple**: HTTP/JSON makes it work anywhere
5. **Claude Benefits**: Direct access to your entire knowledge base

---

*The MCP Server transforms MIRA from a memory system into an intelligent development assistant that Claude can leverage directly.*