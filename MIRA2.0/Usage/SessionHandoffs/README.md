# Session Handoffs Guide - MIRA 2.0

## 🎯 Overview

MIRA automatically maintains context between Claude sessions, eliminating the need for manual handoff documents. This guide explains how the automatic handoff system works and how to optimize it for your workflow.

## 🔄 Automatic Session Continuity

### How It Works

```bash
# Session 1 - Morning work
mira startup
# Work happens... MIRA tracks everything automatically

# Session 2 - Afternoon (new Claude instance)  
mira startup
# MIRA automatically shows:
# - What you were working on
# - Recent decisions and changes
# - Current branch and git status
# - Unfinished tasks
# - Relevant memories and context
```

### What MIRA Tracks Automatically

1. **Code Changes**
   - Files edited
   - Git commits and messages
   - Branch switches
   - Uncommitted changes

2. **Decisions & Insights**
   - Stored memories (`mira store` commands)
   - Architecture decisions
   - Bug fixes and solutions
   - Learning moments

3. **Work Patterns**
   - Time spent on files
   - Error messages encountered
   - Commands executed
   - Search queries

4. **Project Context**
   - Technology stack changes
   - Dependency updates
   - Configuration modifications
   - Documentation updates

## 📝 Enhancing Automatic Handoffs

### Store Key Decisions

While MIRA tracks everything, explicitly storing important decisions helps:

```bash
# Store why you made a choice
mira store "Switched from JWT to session cookies for better security and simpler logout"

# Store solutions to tricky problems
mira store "Fixed memory leak by properly cleaning up event listeners in useEffect"

# Store architectural insights
mira store "Separating read/write models improved performance by 40%"
```

### Natural Handoff Points

```bash
# Before lunch/break
mira store "Working on user auth - next: implement password reset flow"

# End of day
mira store "Completed API endpoints, tomorrow: add frontend integration"

# Before switching tasks
mira store "Pausing refactor at UserService - all tests passing"
```

## 🤝 Team Handoffs

### Sharing Context with Teammates

```bash
# Export current context
mira export --format team
# Creates: mira-context-2024-01-20.json

# Import teammate's context
mira import colleague-context.json

# Merge contexts
mira sync
```

### Collaborative Patterns

```bash
# When pairing
mira store "Pairing with Alex - implemented caching strategy for user profiles"

# Code review context
mira store "PR #234 - Added rate limiting, reviewer suggested Redis instead of memory"

# Handoff to specific person
mira store "For Sarah: Database migration scripts are in /migrations, run in order"
```

## 🚀 Claude-to-Claude Handoffs

### Seamless Transitions

When switching between Claude instances:

```javascript
// Claude Instance 1
await mcp.call('store', {
    content: 'Implemented user profiles API - remaining: add avatar upload',
    metadata: { handoff: true, status: 'in-progress' }
});

// Claude Instance 2 (later)
const context = await mcp.call('search', {
    query: 'current work in progress'
});
// Automatically finds the handoff and continues
```

### MCP-Powered Continuity

```javascript
// Claude can check recent work
const recent = await mcp.call('analyze', {
    target: 'work from last session'
});

// Get specific handoff information
const handoffs = await mcp.call('search', {
    query: 'handoff notes and unfinished tasks'
});

// Check project status
const status = await mcp.call('status', {
    detailed: true
});
```

## 📊 Handoff Information Structure

### Automatic Context Display

When you run `mira startup`, you see:

```
🌟 MIRA Session Startup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 STEWARD IDENTITY
├─ Name: Dr. Jane Smith
├─ Last Session: 2 hours ago
└─ Trust Level: High

📁 PROJECT OVERVIEW
├─ Project: awesome-api
├─ Language: TypeScript
├─ Framework: Express.js
└─ Database: PostgreSQL

💼 CURRENT WORK CONTEXT
├─ Branch: feature/user-profiles
├─ Changed Files: 5
├─ Last Commit: "Add user profile schema"
└─ Uncommitted: src/api/users.ts

🎯 RECENT DECISIONS
├─ "Chose Redis for session storage"
├─ "Implemented soft deletes for users"
└─ "Added rate limiting to API"

📝 UNFINISHED TASKS
├─ Implement avatar upload
├─ Add email verification
└─ Write tests for new endpoints

🧠 RELEVANT MEMORIES
├─ "Authentication uses JWT with refresh tokens"
├─ "File uploads go to S3 bucket 'app-uploads'"
└─ "API rate limit: 100 requests per minute"
```

## 💡 Best Practices

### 1. Natural Language Notes

```bash
# Write like you're talking to your future self
mira store "The webpack config is tricky - see comments in webpack.config.js"

# Not like a robot
# Bad: "webpack.config.js - modified - babel-loader"
```

### 2. Context Over Details

```bash
# Good - Provides context
mira store "Disabled CORS for local dev after 2 hours of debugging - remember to re-enable"

# Less helpful - No context
mira store "CORS disabled"
```

### 3. Progressive Detail

```bash
# Quick note when switching
mira store "Debugging payment webhook - seems like timestamp mismatch"

# Detailed when solved
mira store "Fixed webhook bug: Stripe sends timestamps in seconds, we expected milliseconds"
```

## 🔧 Configuration

### Customize Handoff Display

```json
// ~/.mira/config/settings.json
{
  "handoff": {
    "showLastNDecisions": 5,
    "showUncommittedChanges": true,
    "includeTimeTracking": true,
    "maxMemoriesToShow": 10
  }
}
```

### Session Continuity Settings

```json
{
  "continuity": {
    "bridgeRetentionDays": 30,
    "autoExportOnExit": false,
    "trackCommandHistory": true,
    "preserveSearchQueries": true
  }
}
```

## 🚨 Troubleshooting

### Missing Context

```bash
# If context seems incomplete
mira status --verbose

# Manually trigger context rebuild
mira daemon rebuild-context

# Check session bridges
mira debug session-bridges
```

### Sync Issues

```bash
# Force sync with daemon
mira sync --force

# Check daemon health
mira daemon status

# View recent session activity
mira history --sessions
```

## 📚 Advanced Handoff Patterns

### Project Milestones

```bash
# Mark significant points
mira store "MILESTONE: User authentication complete - all tests passing"

# Easy to find later
mira recall "project milestones"
```

### Problem-Solution Pairs

```bash
# Document problems when found
mira store "PROBLEM: Users can't login with email containing +"

# Document solutions when implemented
mira store "SOLUTION: URL-encode email parameter in login request"

# Creates searchable knowledge
mira recall "login problems and solutions"
```

### Learning Chains

```bash
# Build on previous knowledge
mira store "TIL: React.memo prevents re-renders"
mira store "UPDATE: React.memo only does shallow comparison"
mira store "GOTCHA: React.memo doesn't work with non-primitive props without custom comparator"

# Find learning progressions
mira recall "React optimization learnings"
```

## 🎯 Key Principles

1. **Automatic is Default** - MIRA handles most handoff needs automatically
2. **Enhance, Don't Duplicate** - Store insights, not what MIRA already tracks
3. **Natural Language** - Write for humans (including future you)
4. **Context is King** - Why matters more than what
5. **Trust the System** - MIRA captures more than you realize

## 🔮 Future Sessions

When you return to a project after time away:

```bash
# See everything relevant
mira startup

# Get a broader view
mira recall "project history and major decisions"

# Analyze patterns
mira insights
# Shows: "You typically start with auth - here's your auth pattern"
```

---

*MIRA turns the ephemeral nature of Claude sessions into a continuous development experience. Every session builds on the last, creating an ever-growing foundation of knowledge and context.*