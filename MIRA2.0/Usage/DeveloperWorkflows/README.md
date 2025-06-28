# Developer Workflows with MIRA 2.0

## 🎯 Overview

This guide shows how MIRA seamlessly integrates into your development workflow. With just a few commands and automatic background tracking, MIRA maintains complete context across Claude sessions without manual intervention.

## 🔄 Core Development Workflows

### 1. Feature Development Workflow

#### Starting a New Feature

```bash
# Begin session - MIRA shows current context and starts MCP server
mira startup

# Check system status including MCP
mira status

# Store the feature plan for future reference
mira store "Starting user profile feature with avatar upload, CRUD endpoints, and privacy settings"

# Claude can also help plan:
# await mcp.call('analyze', {target: 'similar profile implementations'})
# await mcp.call('code_search', {query: 'existing user models'})
```

#### During Implementation

```bash
# Store key decisions as you make them
mira store "Using separate table for social links - better normalization and flexibility"

# When you solve problems
mira store "Fixed avatar upload issue - needed to increase Lambda timeout to 30s for large images"

# MIRA automatically tracks:
# - Files you're editing
# - Commits you make
# - Errors you encounter
# - Time spent on tasks
```

#### Finding Information

```bash
# Need to recall decisions?
mira recall "why did we use a separate table for social links"

# Looking for similar patterns?
mira recall "other places where we handle file uploads"
```

### 2. Debugging Workflow

#### When You Hit a Bug

```bash
# Start investigation
mira store "Users getting 500 errors on profile update - only happens with emoji in bio"

# As you investigate
mira store "Found the issue - database using latin1 instead of utf8mb4 charset"

# Document the solution
mira store "Fixed emoji bug by migrating database to utf8mb4 and updating connection charset"
```

#### Learning from Bugs

```bash
# MIRA automatically detects patterns
mira insights
# Shows: "You've encountered 3 charset-related bugs. Consider standardizing on UTF8MB4 for all text storage."

# Find similar past issues
mira recall "other database encoding problems we've had"
```

### 3. Refactoring Workflow

#### Identifying Technical Debt

```bash
# Document what needs refactoring
mira store "Auth logic scattered across 15 files - need to consolidate into middleware"

# MIRA can help identify patterns
mira recall "where is authentication logic used in the codebase"
```

#### During Refactoring

```bash
# Document your approach
mira store "Created centralized auth middleware - all routes now use consistent auth pattern"

# Capture learnings
mira store "Middleware composition pattern works great: authenticate -> authorize -> validate"
```

#### Verifying Success

```bash
# Record outcomes
mira store "Auth refactor complete - reduced code by 60% and improved performance by 10ms"

# Find this pattern later
mira recall "successful refactoring patterns"
```

### 4. Code Review Workflow

#### Before Review

```bash
# Capture key decisions for reviewers
mira store "Separated social links into junction table for flexibility - allows unlimited links"
mira store "Added rate limiting to profile updates - 10 requests per minute per user"
```

#### Review Feedback

```bash
# Document feedback and decisions
mira store "Reviewer suggested Redis caching for profiles - will implement in follow-up PR"

# Track action items
mira store "TODO: Add bio length validation and improve error messages per review feedback"
```

#### Finding Review Context Later

```bash
# When implementing feedback
mira recall "profile caching suggestion from code review"

# When similar questions come up
mira recall "why did we use a junction table for social links"
```

### 5. Learning & Research Workflow

#### Exploring New Technology

```bash
# Document what you're exploring
mira store "Researching GraphQL as potential replacement for REST API"

# Capture findings as you go
mira store "GraphQL reduces data transfer by 40% for mobile profile views"
mira store "GraphQL adds complexity for simple CRUD - REST still better for basic operations"
```

#### Making Technology Decisions

```bash
# Document the decision and reasoning
mira store "Decision: Use GraphQL for mobile API only - bandwidth savings justify the complexity"

# This creates a searchable record
mira recall "why did we choose GraphQL"
# Returns your decision and full context
```

## 🔄 Daily Patterns

### Morning Routine

```bash
# Just one command (starts everything including MCP)
mira startup

# MIRA shows:
# - Where you left off yesterday
# - Current branch and uncommitted changes
# - Recent decisions and insights
# - Suggested next steps
# - MCP Server status (port 7890)
# - Memory system health

# Claude can immediately help:
# await mcp.call('analyze', {target: 'work from yesterday'})
# await mcp.call('search', {query: 'unfinished tasks'})
```

### Continuous Learning

```bash
# Capture learnings naturally
mira store "TIL: Git rebase -i lets you edit commit history - super useful for cleaning up"

# Build knowledge base without categories
mira store "JavaScript gotcha: sort() converts to strings by default - always provide comparator"

# Find patterns later
mira recall "JavaScript gotchas I should remember"
```

## 🚀 Real-World Scenarios

### Pair Programming

```bash
# Natural documentation
mira store "Pairing with Alex on Stripe integration - they suggested great webhook retry pattern"
mira store "Learned about idempotency keys - crucial for payment processing"

# Find pair programming insights later
mira recall "what did I learn from pairing sessions"
```

### Architecture Decisions

```bash
# Document ADRs naturally
mira store "Architecture Decision: Chose Redis Queue over RabbitMQ for job processing - simpler and fits our scale"

# Find decisions later
mira recall "message queue decision and reasoning"

# Claude can help with architecture:
# await mcp.call('search', {query: 'previous architecture decisions'})
# await mcp.call('analyze', {target: 'system architecture patterns'})
# await mcp.call('code_analyze', {target: 'src/', quick: false})
```

### Performance Optimization

```bash
# Track performance issues and fixes
mira store "Profile API was taking 3s - fixed by adding composite index on (userId, isPublic) - now 200ms"

# Build optimization knowledge
mira recall "performance optimizations that worked"
```

## 💡 Best Practices

### 1. Write Naturally

```bash
# Like explaining to a colleague
mira store "Chose PostgreSQL over MongoDB because we need ACID compliance for financial data"

# Not like a robot
# Bad: "DB: PostgreSQL. Reason: ACID."
```

### 2. Focus on Decisions and Learnings

```bash
# High value memories:
mira store "JWT refresh rotation prevents token replay attacks - implement everywhere"

# MIRA already tracks:
# - What files you edit
# - What commands you run  
# - Your git commits
# So focus on the "why" not the "what"
```

### 3. Trust the Search

```bash
# MIRA understands context and relationships
mira recall "that tricky bug with timezones"
# Finds: All timezone-related issues, fixes, and learnings

# No need for complex categorization
```

## 🔗 Workflow Integration

### Shell Aliases

```bash
# .bashrc / .zshrc
alias ms='mira startup'
alias mr='mira store'
alias ma='mira recall'
alias mi='mira insights'
alias md='mira daemon status'

# Quick startup every terminal session
echo 'mira startup' >> ~/.bashrc
```

### Git Integration

```bash
# MIRA automatically detects:
# - Branch switches
# - Commits
# - File changes
# No manual hooks needed!
```

### Claude MCP Integration

```javascript
// Claude can access MIRA functions directly
const mcp = await getMCPClient('mira');

// Search across all your knowledge
const results = await mcp.call('search', {
    query: 'authentication implementation details'
});

// Analyze code or patterns
const analysis = await mcp.call('analyze', {
    target: 'src/auth/',
    options: {quick: true}
});

// Store insights automatically
await mcp.call('store', {
    content: 'Discovered N+1 query in user profiles',
    metadata: {tags: ['performance', 'database']}
});
```

## 🎯 MCP-Powered Workflows

### Intelligent Code Review

```javascript
// Claude can help review code changes
const changes = await mcp.call('code_search', {
    query: 'functions modified today'
});

const analysis = await mcp.call('code_analyze', {
    target: 'src/api/users.py',
    quick: false  // Deep analysis
});

// Store review insights
await mcp.call('store', {
    content: analysis.suggestions.join('\n'),
    metadata: {type: 'code_review', file: 'users.py'}
});
```

### Pattern Discovery

```javascript
// Find patterns across your codebase
const patterns = await mcp.call('search', {
    query: 'error handling patterns in our API endpoints'
});

// Analyze for consistency
const analysis = await mcp.call('analyze', {
    target: 'API error handling approaches',
    options: {compare: true}
});
```

## 📚 Next Steps

- Explore [Memory Patterns](../MemoryPatterns/) for effective information storage
- Read [Session Handoffs](../SessionHandoffs/) for team collaboration  
- Learn [MCP Integration](../MCPIntegration/) for Claude automation
- Check [Troubleshooting](../Troubleshooting/) for common issues

---

*Simple commands, powerful automation. MIRA handles the complexity so you can focus on coding. Claude integration through MCP makes it even more powerful.*