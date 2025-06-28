# MIRA 2.0 Usage Guide

## 🎯 Overview

MIRA is a development tool that maintains context and continuity between Claude sessions. This guide provides practical examples of using MIRA to ensure seamless handoffs when switching between Claude instances, preserving project understanding, work progress, and relationship dynamics.

## 🚀 Getting Started

### Beginning Each Session

**ALWAYS start with:**
```bash
mira startup
```

This automatically:
- Loads your complete context from previous sessions
- Shows what you were working on
- Displays project status and health
- Initializes the background daemon
- Presents relevant memories and insights

## 📖 Core Usage Patterns

### 1. Session Continuity - Automatic

MIRA's background daemon automatically tracks your work. You don't need to manually save context or create handoffs.

#### Starting a New Session

```bash
# Just run startup - MIRA shows where you left off
mira startup
```

#### During Work

```bash
# Store important decisions or insights
mira store "Decided to use Redis for session storage due to performance requirements"

# Search your knowledge base with natural language
mira recall "how did we handle authentication"

# Let Claude use MIRA's intelligence directly
# Claude can now call MCP functions like:
# - search: "authentication patterns in our codebase"
# - analyze: "user behavior from last week"
# - store: Important insights are automatically saved
```

### 2. Core Commands

#### Storing Knowledge

```bash
# Use natural language - MIRA understands context
mira store "Decided to use Redis for session storage due to performance requirements"

# It automatically categorizes and indexes your memories
mira store "Pattern: Always validate JWT in middleware, not in individual routes"
```

#### Searching Everything

```bash
# Natural language search across all memories, code, and conversations
mira recall "authentication decisions"

# MIRA understands intent and context
mira recall "what database did we choose and why"

# Find patterns and solutions
mira recall "how did we solve the CORS problem"
```

### 3. System Intelligence

#### Getting Status and Insights

```bash
# Comprehensive system status
mira status

# Get proactive insights and recommendations
mira insights

# MIRA analyzes your patterns and suggests next steps
```

#### Understanding Your Stack

```bash
# Analyze technology stack
mira tech-stack

# MIRA automatically detects and documents your technical choices
```

### 4. Claude Integration via MCP

#### Direct Access to MIRA Intelligence

Claude can now directly access MIRA's capabilities through the MCP Server:

```javascript
// Claude can search across all your memories
await mcp.call('search', { query: 'Redis implementation details' });

// Claude can analyze code or behavior
await mcp.call('analyze', { target: 'auth.py' });

// Claude can store insights automatically
await mcp.call('store', { 
    content: 'Discovered optimization opportunity in database queries'
});
```

#### Steward Preferences

```bash
# View your profile and preferences
mira profile

# MIRA learns from your behavior and conversation patterns
# No need to manually set preferences - it adapts to you
```


## 🔄 Real-World Examples

### Starting Your Day

```bash
# 1. Start MIRA - it shows where you left off
mira startup

# 2. Get insights on what to work on
mira insights

# 3. Search for context if needed
mira ask "what was I working on yesterday"
```

### During Development

```bash
# Found a solution to a tricky problem
mira store "Fixed JWT expiry issue by using UTC timestamps everywhere"

# Need to recall how something was done
mira recall "how did we implement rate limiting"

# Check system status
mira status
```

### Learning from Patterns

```bash
# MIRA automatically detects patterns from your work
mira insights
# Shows: "You often encounter timezone issues - consider standardizing on UTC"

# Search for similar past experiences
mira recall "timezone related bugs"
```


## 💡 Best Practices

### 1. Natural Language

```bash
# Write like you're talking to a colleague
mira store "The Redis connection pool issue was due to not closing connections properly"

# MIRA understands context and intent
mira recall "what was that Redis issue we fixed last week"
```

### 2. Let MIRA Work for You

```bash
# Don't micromanage - MIRA tracks context automatically
mira startup  # Shows everything relevant

# Focus on storing insights and decisions
mira store "Chose PostgreSQL over MongoDB for ACID compliance"
```

### 3. Trust the Search

```bash
# MIRA's semantic search understands relationships
mira recall "performance optimizations"  
# Finds: caching strategies, query optimizations, indexing decisions
```

## 🛠️ Advanced Features

### MCP Server Integration

The MIRA daemon includes an embedded MCP server that Claude can use:

```bash
# Check MCP server status
mira daemon status
# Shows: MCP Server listening on http://localhost:7890

# Available MCP functions:
# - search: Natural language search across all systems
# - store: Auto-detecting smart storage
# - analyze: Multi-purpose analysis (code, behavior, context)
# - profile: Get/update your preferences
# - code_search: AST-based code search
# - code_analyze: Deep code quality analysis
# - recall: Retrieve specific memories
# - status: System health and metrics
```

### Configuration

```bash
# Manage system configuration
mira config

# View all settings including storage paths
mira config show
```

### Background Services

```bash
# The daemon runs automatically with startup
mira daemon status  # Check all services

# Services include:
# - Memory indexing
# - Pattern analysis  
# - MCP server (port 7890)
# - Session continuity
```

## 🚨 Troubleshooting

### If Something Goes Wrong

```bash
# Check system health
mira status

# Get diagnostic information
mira config --diagnose

# MIRA is self-healing and will attempt to fix issues automatically
```

## 📚 Quick Reference

### CLI Commands
| Command | Purpose | Example |
|---------|---------|------|
| `mira startup` | Start session with full context | `mira startup` |
| `mira store` | Store memories and insights | `mira store "Fixed bug with UTC timestamps"` |
| `mira recall` | Search all knowledge | `mira recall "authentication patterns"` |
| `mira status` | System health and stats | `mira status` |
| `mira insights` | Get recommendations | `mira insights` |
| `mira profile` | View preferences | `mira profile` |
| `mira daemon status` | Check background services | `mira daemon status` |

### MCP Functions (for Claude)
| Function | Purpose | Example |
|---------|---------|------|
| `search` | Natural language search | `{query: "error handling patterns"}` |
| `store` | Smart storage | `{content: "Important insight"}` |
| `analyze` | Auto-detecting analysis | `{target: "recent productivity"}` |
| `profile` | Profile management | `{action: "get"}` |
| `code_search` | AST code search | `{query: "async functions"}` |
| `code_analyze` | Code quality | `{target: "src/", quick: true}` |
| `recall` | Get by ID | `{id: "mem_123"}` |
| `status` | System health | `{detailed: true}` |

## 🎯 Remember

MIRA's primary purpose is **context continuity**. Every command, every stored memory, every pattern recognized serves one goal: ensuring that when you start a new Claude session, you have everything you need to continue seamlessly from where you left off.

The magic isn't in the individual commands - it's in the continuous thread of understanding that persists across the boundaries of Claude's instance lifecycle.

---

*"Memory is the treasury and guardian of all things." - Cicero*

*Through MIRA, your development journey becomes a continuous narrative rather than disconnected fragments.*