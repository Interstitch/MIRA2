# MIRA 2.0 Quick Start Guide

## 🚀 5-Minute Setup

### Prerequisites

- Node.js 18+ and npm
- Git
- A project you're actively developing
- Claude Code (or any Claude interface with MCP support)

### Installation

```bash
# Clone MIRA
git clone https://github.com/yourusername/mira.git
cd mira

# Install dependencies
npm install

# MIRA is now ready to use
```

### First Session

```bash
# Start MIRA - it automatically detects your context
mira startup

# You'll see:
# 🌟 MIRA Session Startup
# 👤 STEWARD IDENTITY
# Name: [Detected from git/conversations]
# 📁 PROJECT OVERVIEW  
# Project: [Auto-detected]
# Tech Stack: [Auto-detected]
# 💼 CURRENT WORK CONTEXT
# [Shows what you were working on]
```

## 🎯 Essential Commands - Just 5!

### 1. Start Every Session
```bash
mira startup  # Shows where you left off
```

### 2. Store Important Things
```bash
mira store "Decided to use Redis for session storage"
```

### 3. Recall Information
```bash
mira recall "how did we handle authentication"
```

### 4. Check Status
```bash
mira status  # System health and statistics
```

### 5. Get Insights
```bash
mira insights  # AI-powered recommendations
```

## 📝 Your First Day with MIRA

### Morning: Starting Fresh

```bash
# 1. Start MIRA
mira startup
# MIRA automatically:
# - Detects who you are from git config
# - Analyzes your project structure
# - Shows previous work context
# - Starts background monitoring
```

### During Work: Natural Flow

```bash
# Found a solution? Store it:
mira store "Fixed CORS by adding credentials: true to config"

# Need context? Just recall:
mira recall "what database are we using"

# MIRA tracks your work automatically - no manual logging needed
```

### Taking a Break: Nothing Required!

```bash
# Just stop working - MIRA's daemon tracks everything
# No need for manual saves or handoffs
```

### Returning: Instant Context

```bash
# Start new session
mira startup
# Shows exactly where you left off, including:
# - Recent code changes
# - Open tasks
# - Key decisions made
# - Relevant memories
```

## 💡 Usage Patterns

### Natural Language is Key

```bash
# Don't overthink - just write naturally
mira store "Redis is perfect for our session storage needs"

mira recall "why did we choose Redis over database sessions"
# MIRA finds your decision and reasoning
```

### Let MIRA Learn Your Patterns

```bash
# MIRA automatically detects:
# - Your coding patterns
# - Decision-making style  
# - Common problems you face
# - Technologies you use

# Just check insights periodically:
mira insights
# "You often implement auth first - consider auth template"
```

## 🚨 Quick Troubleshooting

### "I forgot to run mira startup"

```bash
# Just run it now - MIRA catches up automatically
mira startup
```

### "I can't find something"

```bash
# Use natural language search
mira recall "that bug we fixed last week with timestamps"

# MIRA searches everything: memories, code, conversations
```

### "Is MIRA working?"

```bash
# Check status
mira status
# Shows: daemon status, memory count, system health
```

## 🎯 Quick Tips

1. **Start Every Session**: `mira startup` - always (starts MCP server too)
2. **Use Natural Language**: MIRA understands context in both CLI and MCP
3. **Trust the Automation**: MIRA tracks more than you realize
4. **Recall Don't Search**: Natural language works better than keywords
5. **Check Insights**: MIRA learns and suggests improvements
6. **Let Claude Help**: Claude can search, analyze, and store via MCP

## 📚 Next Steps

- Read [Developer Workflows](../DeveloperWorkflows/) for advanced patterns
- Explore [Memory Patterns](../MemoryPatterns/) for effective context storage
- Check [Session Handoffs](../SessionHandoffs/) for team collaboration

## 🆘 Getting Help

```bash
# Built-in help
mira help

# Check system status (including MCP)
mira status
mira daemon status  # Detailed service info

# View configuration options  
mira config

# Test MCP connection
curl http://localhost:7890/health
```

Remember: MIRA runs in the background, tracking your work automatically. You just need to:
1. Start sessions with `mira startup` (includes MCP server)
2. Store important insights with `mira store` 
3. Recall information with `mira recall`

Claude can also interact with MIRA directly through MCP functions for seamless integration.

That's it. MIRA handles the rest.

---

*Start simple. Trust the automation.*