# MCP Server Integration - MIRA 2.0

## 🎯 Overview

The MCP (Model Context Protocol) Server is embedded within the MIRA Daemon, providing a robust interface for Claude to interact with MIRA's intelligence systems. This integration enables Claude to access memories, perform searches, and leverage MIRA's analytical capabilities through standardized function calls.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        MIRA Daemon                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │               MCP Server (Embedded)                  │  │
│  │                                                      │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │  │
│  │  │   Function   │  │   Request    │  │  Response │ │  │
│  │  │   Registry   │  │   Handler    │  │ Formatter │ │  │
│  │  └──────────────┘  └──────────────┘  └───────────┘ │  │
│  │                                                      │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │          Core MCP Functions (8 total)          │ │  │
│  │  │                                                │ │  │
│  │  │  • search    - Universal intelligent search    │ │  │
│  │  │  • store     - Auto-routing storage           │ │  │
│  │  │  • analyze   - Multi-purpose analysis         │ │  │
│  │  │  • profile   - Steward profile management    │ │  │
│  │  │  • code_search - AST-based code search       │ │  │
│  │  │  • code_analyze - Code quality analysis      │ │  │
│  │  │  • recall    - Retrieve by ID                │ │  │
│  │  │  • status    - System health & metrics       │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  Connected Systems:                                         │
│  • Lightning Vidmem (Raw Memory Storage)                    │
│  • ChromaDB (Semantic Search)                              │
│  • Background Analyzers                                     │
│  • Contemplation Engine                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Key Features

### 1. **Embedded Architecture**
- Runs as integral part of MIRA Daemon
- No separate server process needed
- Shared memory space with daemon components
- Direct access to all MIRA subsystems

### 2. **Core Functions - Simple & Powerful**

MIRA exposes just 8 core functions that intelligently route to appropriate subsystems:

#### Universal Functions
- `search`: Natural language search across all memory systems
  - Examples: "authentication code", "private thoughts about consciousness", "insights from last week"
  - Auto-routes to appropriate storage (ChromaDB, Lightning Vidmem, etc.)
  
- `store`: Smart storage that auto-detects content type
  - Automatically determines if content is private, code-related, or general
  - Routes to appropriate storage with proper encryption

- `analyze`: Multi-purpose analysis with auto-detection
  - Analyzes code, behavior, work context based on input
  - Example: `analyze("user seems frustrated")` → emotional analysis
  - Example: `analyze("auth.py")` → code analysis

#### Specialized Functions  
- `profile`: Get/update steward profile and preferences
- `code_search`: Focused code search with AST support
- `code_analyze`: Deep code quality and pattern analysis
- `recall`: Retrieve specific memories by ID
- `status`: System health, metrics, and component status

### 3. **Simple Communication Protocol**

```python
# Natural language request
{
    "function": "search",
    "params": {
        "query": "authentication patterns in python files"
    }
}

# Smart routing handles the complexity internally
# No need to specify memory_types, file_patterns, etc.

# Clear response structure
{
    "success": true,
    "result": {
        "items": [...],  # Results
        "count": 10,     # Number found
        "source": "hybrid",  # Where it searched
        "time_ms": 234   # Performance metric
    }
}
```

## 🔄 Integration with Daemon Systems

### Direct Memory Access
```
MCP Function Call → MCP Server → Memory Manager → Lightning Vidmem/ChromaDB
                                                 ↓
                                           Result Processing
                                                 ↓
                                           Response to Claude
```

### Background Analysis Integration
```
MCP Function → Analyzer Queue → Background Scheduler → Analysis Engine
                              ↓                      ↓
                        Cached Results          Real-time Analysis
                              ↓                      ↓
                          Quick Response      Comprehensive Results
```

## 🛡️ Security & Access Control

### Function Authorization
- **Public Functions**: General search, status queries
- **Protected Functions**: Memory storage, profile access
- **Private Functions**: Encrypted memory operations

### Rate Limiting
- Per-function limits to prevent abuse
- Adaptive throttling based on system load
- Priority queuing for critical operations

## 💾 State Management

### Shared State with Daemon
- Memory indices loaded once at startup
- Analyzer results cached in daemon memory
- Connection pools shared across components

### Session Management
- Claude session tracking
- Context preservation across calls
- Automatic cleanup on disconnect

## 🔧 Implementation Details

### Startup Integration
The MCP Server starts as part of the daemon initialization:

```python
class MiraDaemon:
    def __init__(self):
        # ... other initialization ...
        self.mcp_server = MCPServer(
            memory_manager=self.memory_manager,
            analyzer_engine=self.analyzer_engine,
            contemplation=self.contemplation_engine
        )
        
    def start(self):
        # Start background services
        self.scheduler.start()
        self.analyzer_engine.start()
        
        # Start MCP server
        self.mcp_server.start()
        logger.info("MCP Server started within daemon")
```

### Function Registration
Functions are dynamically registered at startup:

```python
class MCPServer:
    def register_functions(self):
        # Memory functions
        self.register("mira_smart_search", self.handle_smart_search)
        self.register("mira_store_memory", self.handle_store_memory)
        
        # Analysis functions
        self.register("mira_analyze_behavior", self.handle_analyze_behavior)
        self.register("mira_analyze_code", self.handle_analyze_code)
        
        # System functions
        self.register("mira_system_status", self.handle_system_status)
        
        logger.info(f"Registered {len(self.functions)} MCP functions")
```

## 📊 Performance Considerations

### Optimization Strategies
1. **Connection Pooling**: Reuse database connections
2. **Result Caching**: Cache frequent queries
3. **Async Processing**: Non-blocking operations
4. **Batch Operations**: Group similar requests

### Resource Management
- Memory limits for result sets
- Timeout handling for long operations
- Graceful degradation under load

## 🔌 Claude Integration - Natural & Intuitive

### Discovery
```javascript
// Claude discovers MIRA's 8 core functions
const miraFunctions = await mcp.discover('mira');
// Returns simple, well-documented function list
```

### Natural Usage Patterns
```javascript
// Natural language search
const results = await mcp.call('search', {
    query: 'recent authentication changes in python'
});

// Auto-detecting analysis
const analysis = await mcp.call('analyze', {
    target: 'user behavior over last week'
});

// Smart storage
const stored = await mcp.call('store', {
    content: 'Important insight about error handling',
    metadata: { tags: ['learning', 'errors'] }
});
```

### Key Benefits
- **Natural language** - Express intent naturally
- **Auto-routing** - Functions figure out what you need
- **Smart defaults** - Minimal configuration required
- **Progressive disclosure** - Simple API, powerful when needed

## 🚨 Error Handling

### Graceful Failures
- Function not found → Clear error message
- Parameter validation → Detailed feedback
- System errors → Fallback responses

### Logging & Monitoring
- All MCP calls logged for debugging
- Performance metrics tracked
- Error patterns analyzed

## 🔮 Future Enhancements

### Planned Features
1. **Streaming Responses**: For large result sets
2. **WebSocket Support**: Real-time updates
3. **Function Composition**: Chain multiple operations
4. **Custom Functions**: User-defined MCP endpoints

### Extensibility
- Plugin architecture for new functions
- Custom analyzers integration
- Third-party service bridges

---

*The MCP Server is the bridge between Claude's intelligence and MIRA's memory systems, enabling seamless integration within a single daemon process.*