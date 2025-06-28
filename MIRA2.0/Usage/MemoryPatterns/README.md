# Memory Patterns Guide - MIRA 2.0

## 🎯 Overview

This guide explores effective patterns for storing and retrieving memories in MIRA. Learn how to build a knowledge base that grows more valuable over time.

## 🧠 Understanding MIRA's Memory Systems

### Three-Layer Architecture

1. **Lightning Vidmem** - Raw preservation
   - Conversation history
   - Code snapshots
   - Private encrypted thoughts

2. **ChromaDB** - Semantic intelligence
   - Searchable insights
   - Tagged decisions
   - Cross-referenced knowledge

3. **FAISS** - Speed layer
   - Quick lookups
   - Similarity matching
   - Performance optimization

### What to Store vs What's Automatic

**MIRA Automatically Tracks:**
- File changes and git commits
- Commands executed
- Time spent on tasks
- Error messages
- Branch switches

**You Should Store:**
- Decisions and reasoning
- Solutions to problems
- Insights and learnings
- Architecture choices
- "Aha!" moments

## 📝 Effective Memory Patterns

### 1. Decision-Reasoning Pattern

Store both the decision and why you made it:

```bash
# Pattern: DECISION + BECAUSE + CONTEXT
mira store "Chose PostgreSQL over MongoDB because we need ACID compliance for financial transactions and strong consistency guarantees"

# Searchable later by:
# - "database decision"
# - "PostgreSQL vs MongoDB"  
# - "financial transactions"
# - "ACID compliance"
```

### 2. Problem-Solution Pattern

Document problems and their solutions together:

```bash
# When you encounter a problem
mira store "PROBLEM: Jest tests failing with 'Cannot find module' errors for TypeScript paths"

# When you solve it
mira store "SOLUTION: Added moduleNameMapper to jest.config.js to resolve TypeScript path aliases"

# Creates knowledge pair
mira recall "Jest module resolution issues"
# Returns both problem and solution
```

### 3. Learning Progression Pattern

Build knowledge incrementally:

```bash
# Initial discovery
mira store "TIL: useMemo prevents expensive recalculations in React"

# Deeper understanding
mira store "UPDATE: useMemo only helps if dependencies actually change less often than renders"

# Practical application
mira store "APPLIED: Used useMemo for markdown parsing - reduced render time by 80%"

# Find complete learning journey
mira recall "useMemo learnings and applications"
```

### 4. Context Chain Pattern

Link related memories:

```bash
# Start of investigation
mira store "Investigating slow API response times - users reporting 5+ second delays"

# Discovery
mira store "Found N+1 query in user profile endpoint - loading related data in loop"

# Solution
mira store "Fixed N+1 by using eager loading with includes() - response time now 200ms"

# Retrieve full context
mira recall "API performance investigation"
```

### 5. Pattern Recognition

Document recurring patterns:

```bash
# First occurrence
mira store "Bug: Timezone issue - server returns UTC but client expects local time"

# Second occurrence  
mira store "Another timezone bug - this time in scheduled jobs using server local time"

# Pattern emerges
mira store "PATTERN: All timezone bugs come from mixing UTC and local time - standardize on UTC everywhere"

# MIRA learns
mira insights
# "You've encountered 3 timezone-related issues. Consider UTC-only policy."
```

## 🔍 Retrieval Patterns

### Natural Language Queries

```bash
# Conversational queries work best
mira recall "that tricky bug we fixed last week with the payment webhook"

# MIRA understands context
mira recall "how did we handle authentication in the mobile app"

# Time-based queries
mira recall "decisions made this sprint about database schema"
```

### Semantic Search Power

```bash
# MIRA finds related concepts
mira recall "performance optimizations"
# Returns: caching strategies, database indexes, query optimization, etc.

# Cross-domain connections
mira recall "security considerations"  
# Returns: auth decisions, CORS setup, SQL injection fixes, etc.
```

### MCP-Enhanced Retrieval

```javascript
// Claude can search with context
const memories = await mcp.call('search', {
    query: 'similar problems to current CORS issue'
});

// Analyze patterns
const patterns = await mcp.call('analyze', {
    target: 'recurring authentication bugs'
});
```

## 💎 High-Value Memory Types

### 1. Architectural Decisions

```bash
mira store "Architecture: Chose microservices over monolith to allow independent scaling of payment processing"

mira store "API Design: RESTful for public API, GraphQL for mobile to reduce bandwidth"
```

### 2. Performance Discoveries

```bash
mira store "Performance: Adding index on (user_id, created_at) reduced query from 2s to 50ms"

mira store "Optimization: Lazy loading images saved 3MB on initial page load"
```

### 3. Debugging Wisdom

```bash
mira store "Debug trick: Chrome preserves logs across redirects with 'Preserve log' checkbox"

mira store "Gotcha: console.log() in production React gets stripped but console.error() doesn't"
```

### 4. Team Knowledge

```bash
mira store "Team convention: All API endpoints must have rate limiting - use @RateLimit decorator"

mira store "Deployment note: Always run migrations before deploying new code - learned the hard way"
```

### 5. External Integration Insights

```bash
mira store "Stripe webhook: Must respond with 200 within 20 seconds or Stripe retries"

mira store "AWS S3: Presigned URLs expire based on IAM role session, not just time parameter"
```

## 🎨 Memory Organization Patterns

### Tagging Through Natural Language

```bash
# Tags emerge from content
mira store "Redis cache invalidation bug fixed - was using wrong key pattern"
# Automatically tagged: redis, cache, bug, fix

# Explicit categorization when helpful
mira store "SECURITY: Always validate file uploads - check type, size, and scan for malware"
# Extra emphasis on security category
```

### Temporal Markers

```bash
# Phase markers
mira store "PRE-LAUNCH: Database can handle 10k concurrent users based on load test"

# Milestone markers
mira store "v2.0 RELEASE: Switched to PostgreSQL, added Redis cache, 10x performance improvement"
```

### Relationship Markers

```bash
# Related to specific features
mira store "User Profile Feature: Avatar uploads use S3 with 5MB limit and image optimization"

# Related to external systems
mira store "Stripe Integration: Webhook endpoint must be idempotent - check event ID"
```

## 🚀 Advanced Patterns

### 1. Hypothesis-Result Pattern

```bash
# Hypothesis
mira store "HYPOTHESIS: Moving image processing to background job will improve API response time"

# Result
mira store "RESULT: API response improved from 3s to 200ms, background job takes 2-5s"
```

### 2. Before-After Pattern

```bash
# Document state changes
mira store "BEFORE: Login used JWT stored in localStorage - vulnerable to XSS"
mira store "AFTER: Login uses httpOnly cookies with CSRF tokens - much more secure"
```

### 3. Cost-Benefit Pattern

```bash
# Document tradeoffs
mira store "TRADEOFF: Chose denormalized schema - faster reads but complex updates. Worth it for 10:1 read/write ratio"
```

## 🔮 Building Long-Term Value

### Knowledge Compounding

```bash
# Early memory
mira store "Learning Docker - containers are like lightweight VMs"

# Later refinement
mira store "Docker insight: Containers share host kernel, that's why they're lighter than VMs"

# Practical application
mira store "Docker win: Multi-stage builds reduced our image size from 2GB to 200MB"

# Knowledge compounds over time
mira recall "Docker journey"
# Shows progression from basics to mastery
```

### Pattern Library

```bash
# Build reusable patterns
mira store "Auth Pattern: Always use middleware for auth, never check in individual routes"

mira store "Error Pattern: Catch errors at router level, return consistent format"

mira store "Testing Pattern: Test behavior not implementation - focus on user outcomes"

# Reference patterns later
mira recall "established patterns for new features"
```

## 📊 Memory Metrics

### What Makes a Good Memory

1. **Searchable** - Uses natural language
2. **Contextual** - Includes why, not just what
3. **Actionable** - Can guide future decisions
4. **Connected** - Links to related concepts

### Memory Quality Examples

```bash
# Excellent - Full context, searchable, actionable
mira store "Chose AWS SQS over RabbitMQ for job queue because it's managed, scales automatically, and integrates with our existing AWS services. Cost is $0.40 per million messages."

# Good - Clear problem and solution
mira store "Fixed memory leak by removing event listeners in useEffect cleanup function"

# Okay - Useful but lacks context  
mira store "Using Redis for sessions"

# Poor - Too vague
mira store "Fixed bug"
```

## 🎯 Best Practices

1. **Write for Future You** - Include context you'll need in 6 months
2. **Natural Over Structured** - Let MIRA handle organization
3. **Connect Ideas** - Reference related decisions/problems
4. **Progressive Enhancement** - Build on previous memories
5. **Trust the Search** - MIRA finds connections you might miss

---

*Great memories compound over time. Each insight builds on the last, creating an ever-growing foundation of wisdom that makes you more effective with every session.*