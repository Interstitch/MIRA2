# MCP Server Implementation Guide - MIRA 2.0

## 🎯 Purpose

This guide provides production-ready implementation patterns for the MCP Server embedded within the MIRA Daemon, enabling Claude to interact with MIRA's intelligence systems.

## 📦 Core Implementation

### MCP Server Base Class

```python
import asyncio
import json
import logging
from typing import Dict, Any, Callable, Optional, List
from dataclasses import dataclass
from datetime import datetime
import traceback
from functools import wraps
import inspect

logger = logging.getLogger(__name__)


@dataclass
class MCPFunction:
    """Represents a registered MCP function"""
    name: str
    handler: Callable
    description: str
    parameters: Dict[str, Any]
    requires_auth: bool = False
    rate_limit: int = 60  # calls per minute
    cache_ttl: int = 0  # seconds to cache results


class MCPServer:
    """
    Model Context Protocol Server embedded in MIRA Daemon.
    Handles function registration, request routing, and response formatting.
    """
    
    def __init__(self, daemon_components: Dict[str, Any]):
        self.components = daemon_components
        self.functions: Dict[str, MCPFunction] = {}
        self.call_stats: Dict[str, List[datetime]] = {}
        self.cache: Dict[str, Any] = {}
        self._running = False
        
        # Register all functions
        self._register_all_functions()
        
    def _register_all_functions(self):
        """Register all MCP functions"""
        # Memory functions
        self._register_memory_functions()
        
        # Analysis functions
        self._register_analysis_functions()
        
        # Code intelligence functions
        self._register_code_functions()
        
        # System functions
        self._register_system_functions()
        
        logger.info(f"Registered {len(self.functions)} MCP functions")
        
    def register(self, name: str, handler: Callable, description: str, 
                 parameters: Dict[str, Any], **kwargs):
        """Register a function with the MCP server"""
        self.functions[name] = MCPFunction(
            name=name,
            handler=handler,
            description=description,
            parameters=parameters,
            **kwargs
        )
        
    async def handle_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Handle incoming MCP request"""
        try:
            # Extract request details
            function_name = request.get('function')
            parameters = request.get('parameters', {})
            
            # Validate function exists
            if function_name not in self.functions:
                return self._error_response(f"Unknown function: {function_name}")
                
            func = self.functions[function_name]
            
            # Check rate limits
            if not self._check_rate_limit(function_name, func.rate_limit):
                return self._error_response("Rate limit exceeded")
                
            # Check cache
            cache_key = f"{function_name}:{json.dumps(parameters, sort_keys=True)}"
            if func.cache_ttl > 0 and cache_key in self.cache:
                cached = self.cache[cache_key]
                if datetime.now().timestamp() - cached['timestamp'] < func.cache_ttl:
                    return cached['response']
                    
            # Validate parameters
            validation_error = self._validate_parameters(parameters, func.parameters)
            if validation_error:
                return self._error_response(validation_error)
                
            # Execute function
            if asyncio.iscoroutinefunction(func.handler):
                result = await func.handler(**parameters)
            else:
                result = func.handler(**parameters)
                
            # Format response
            response = self._success_response(result)
            
            # Cache if needed
            if func.cache_ttl > 0:
                self.cache[cache_key] = {
                    'response': response,
                    'timestamp': datetime.now().timestamp()
                }
                
            return response
            
        except Exception as e:
            logger.error(f"Error handling MCP request: {e}")
            logger.error(traceback.format_exc())
            return self._error_response(str(e))
            
    def _validate_parameters(self, provided: Dict[str, Any], 
                           schema: Dict[str, Any]) -> Optional[str]:
        """Validate parameters against schema"""
        required = schema.get('required', [])
        properties = schema.get('properties', {})
        
        # Check required parameters
        for param in required:
            if param not in provided:
                return f"Missing required parameter: {param}"
                
        # Validate types
        for param, value in provided.items():
            if param in properties:
                expected_type = properties[param].get('type')
                if expected_type:
                    if not self._check_type(value, expected_type):
                        return f"Invalid type for {param}: expected {expected_type}"
                        
        return None
        
    def _check_type(self, value: Any, expected: str) -> bool:
        """Check if value matches expected type"""
        type_map = {
            'string': str,
            'number': (int, float),
            'integer': int,
            'boolean': bool,
            'array': list,
            'object': dict
        }
        
        expected_type = type_map.get(expected)
        if expected_type:
            return isinstance(value, expected_type)
        return True
        
    def _check_rate_limit(self, function_name: str, limit: int) -> bool:
        """Check if function call is within rate limits"""
        now = datetime.now()
        
        # Initialize or clean old entries
        if function_name not in self.call_stats:
            self.call_stats[function_name] = []
        
        # Remove calls older than 1 minute
        cutoff = now.timestamp() - 60
        self.call_stats[function_name] = [
            call for call in self.call_stats[function_name]
            if call.timestamp() > cutoff
        ]
        
        # Check limit
        if len(self.call_stats[function_name]) >= limit:
            return False
            
        # Record this call
        self.call_stats[function_name].append(now)
        return True
        
    def _success_response(self, data: Any) -> Dict[str, Any]:
        """Format successful response"""
        return {
            'success': True,
            'data': data,
            'timestamp': datetime.now().isoformat()
        }
        
    def _error_response(self, message: str) -> Dict[str, Any]:
        """Format error response"""
        return {
            'success': False,
            'error': message,
            'timestamp': datetime.now().isoformat()
        }
```

### Memory Functions Implementation

```python
def _register_memory_functions(self):
    """Register memory-related MCP functions"""
    
    # Smart Search
    self.register(
        name="mira_smart_search",
        handler=self._handle_smart_search,
        description="Intelligent search across all memory systems",
        parameters={
            'required': ['query'],
            'properties': {
                'query': {'type': 'string'},
                'limit': {'type': 'integer', 'default': 10},
                'memory_types': {'type': 'array', 'default': ['all']}
            }
        },
        cache_ttl=60  # Cache for 1 minute
    )
    
    # Store Memory
    self.register(
        name="mira_store_memory",
        handler=self._handle_store_memory,
        description="Store a memory with semantic indexing",
        parameters={
            'required': ['content', 'memory_type'],
            'properties': {
                'content': {'type': 'string'},
                'memory_type': {'type': 'string', 'enum': ['general', 'decision', 'insight', 'code']},
                'metadata': {'type': 'object', 'default': {}}
            }
        }
    )
    
    # Private Memory Access
    self.register(
        name="mira_recall_private_memory",
        handler=self._handle_private_memory,
        description="Access encrypted private memory space",
        parameters={
            'required': ['query'],
            'properties': {
                'query': {'type': 'string'},
                'decrypt': {'type': 'boolean', 'default': True}
            }
        },
        requires_auth=True
    )

async def _handle_smart_search(self, query: str, limit: int = 10, 
                               memory_types: List[str] = None):
    """Handle smart search across memory systems"""
    memory_manager = self.components['memory_manager']
    
    # Determine which systems to search
    if not memory_types or 'all' in memory_types:
        systems = ['lightning_vidmem', 'chromadb', 'private']
    else:
        systems = memory_types
        
    # Perform parallel searches
    search_tasks = []
    
    if 'lightning_vidmem' in systems:
        search_tasks.append(
            memory_manager.search_lightning_vidmem(query, limit)
        )
        
    if 'chromadb' in systems:
        search_tasks.append(
            memory_manager.search_chromadb(query, limit)
        )
        
    if 'private' in systems:
        search_tasks.append(
            memory_manager.search_private_memory(query, limit)
        )
        
    # Wait for all searches
    results = await asyncio.gather(*search_tasks, return_exceptions=True)
    
    # Combine and rank results
    combined_results = []
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            logger.error(f"Search error in system {i}: {result}")
            continue
            
        for item in result:
            item['source_system'] = systems[i]
            combined_results.append(item)
            
    # Sort by relevance score
    combined_results.sort(key=lambda x: x.get('score', 0), reverse=True)
    
    # Return top results
    return {
        'results': combined_results[:limit],
        'total_found': len(combined_results),
        'systems_searched': systems
    }

async def _handle_store_memory(self, content: str, memory_type: str, 
                               metadata: Dict[str, Any] = None):
    """Store a memory with proper indexing"""
    memory_manager = self.components['memory_manager']
    
    # Enrich metadata
    enriched_metadata = {
        'timestamp': datetime.now().isoformat(),
        'memory_type': memory_type,
        'source': 'mcp_function',
        **(metadata or {})
    }
    
    # Store in both systems
    vidmem_id = await memory_manager.store_to_lightning_vidmem(
        content=content,
        metadata=enriched_metadata
    )
    
    chroma_id = await memory_manager.store_to_chromadb(
        content=content,
        metadata=enriched_metadata,
        collection=f"{memory_type}_memories"
    )
    
    return {
        'success': True,
        'vidmem_id': vidmem_id,
        'chroma_id': chroma_id,
        'memory_type': memory_type
    }
```

### Analysis Functions Implementation

```python
def _register_analysis_functions(self):
    """Register analysis-related MCP functions"""
    
    # Behavior Analysis
    self.register(
        name="mira_analyze_behavior",
        handler=self._handle_analyze_behavior,
        description="Analyze behavioral patterns in conversation",
        parameters={
            'required': ['message'],
            'properties': {
                'message': {'type': 'string'},
                'analysis_type': {'type': 'string', 'default': 'comprehensive'},
                'include_history': {'type': 'boolean', 'default': True}
            }
        }
    )
    
    # Work Context Analysis
    self.register(
        name="mira_analyze_work_context",
        handler=self._handle_work_context,
        description="Analyze recent work patterns and context",
        parameters={
            'properties': {
                'hours_back': {'type': 'integer', 'default': 24},
                'include_priorities': {'type': 'boolean', 'default': True}
            }
        },
        cache_ttl=300  # Cache for 5 minutes
    )
    
    # Steward Profile
    self.register(
        name="mira_get_steward_profile",
        handler=self._handle_steward_profile,
        description="Get comprehensive steward profile",
        parameters={
            'properties': {
                'include_history': {'type': 'boolean', 'default': False},
                'sections': {'type': 'array', 'default': ['all']}
            }
        }
    )

async def _handle_analyze_behavior(self, message: str, 
                                  analysis_type: str = 'comprehensive',
                                  include_history: bool = True):
    """Analyze behavioral patterns"""
    analyzer = self.components['steward_analyzer']
    
    # Get current profile
    profile = await analyzer.get_current_profile()
    
    # Perform analysis based on type
    if analysis_type == 'comprehensive':
        analysis = await analyzer.comprehensive_analysis(
            message=message,
            profile=profile,
            include_history=include_history
        )
    elif analysis_type == 'emotion':
        analysis = await analyzer.emotional_analysis(message)
    elif analysis_type == 'technical':
        analysis = await analyzer.technical_analysis(message)
    else:
        analysis = await analyzer.basic_analysis(message)
        
    # Update profile with findings
    await analyzer.update_profile_from_analysis(analysis)
    
    return {
        'analysis': analysis,
        'confidence': analysis.get('confidence', 0.0),
        'key_insights': analysis.get('insights', []),
        'profile_updated': True
    }

async def _handle_work_context(self, hours_back: int = 24,
                               include_priorities: bool = True):
    """Analyze recent work context"""
    analyzer = self.components['work_analyzer']
    scheduler = self.components['scheduler']
    
    # Get recent activities
    activities = await analyzer.get_recent_activities(hours_back)
    
    # Analyze patterns
    patterns = await analyzer.analyze_patterns(activities)
    
    # Get current priorities if requested
    priorities = []
    if include_priorities:
        priorities = await scheduler.get_current_priorities()
        
    return {
        'time_range': f"Last {hours_back} hours",
        'activities': activities,
        'patterns': patterns,
        'priorities': priorities,
        'productivity_score': patterns.get('productivity_score', 0),
        'focus_areas': patterns.get('focus_areas', [])
    }
```

### Code Intelligence Functions

```python
def _register_code_functions(self):
    """Register code intelligence functions"""
    
    # Codebase Search
    self.register(
        name="mira_search_codebase",
        handler=self._handle_codebase_search,
        description="Search codebase using AST and semantic analysis",
        parameters={
            'required': ['query'],
            'properties': {
                'query': {'type': 'string'},
                'file_pattern': {'type': 'string', 'default': '*'},
                'search_type': {'type': 'string', 'default': 'semantic'}
            }
        },
        cache_ttl=120
    )
    
    # Code Analysis
    self.register(
        name="mira_analyze_code",
        handler=self._handle_code_analysis,
        description="Perform deep code analysis",
        parameters={
            'properties': {
                'target': {'type': 'string', 'default': '.'},
                'analyzer_type': {'type': 'string', 'default': 'comprehensive'},
                'quick_mode': {'type': 'boolean', 'default': False}
            }
        }
    )

async def _handle_codebase_search(self, query: str, 
                                 file_pattern: str = '*',
                                 search_type: str = 'semantic'):
    """Search codebase with various strategies"""
    code_analyzer = self.components['code_analyzer']
    
    if search_type == 'semantic':
        # Use embeddings for semantic search
        results = await code_analyzer.semantic_search(
            query=query,
            file_pattern=file_pattern
        )
    elif search_type == 'ast':
        # Search using AST patterns
        results = await code_analyzer.ast_search(
            pattern=query,
            file_pattern=file_pattern
        )
    else:
        # Basic text search
        results = await code_analyzer.text_search(
            query=query,
            file_pattern=file_pattern
        )
        
    return {
        'results': results,
        'search_type': search_type,
        'total_files_searched': code_analyzer.last_search_stats.get('files_searched', 0)
    }
```

### System Functions

```python
def _register_system_functions(self):
    """Register system management functions"""
    
    # System Status
    self.register(
        name="mira_system_status",
        handler=self._handle_system_status,
        description="Get comprehensive system status",
        parameters={
            'properties': {
                'include_metrics': {'type': 'boolean', 'default': True},
                'components': {'type': 'array', 'default': ['all']}
            }
        },
        cache_ttl=30
    )

async def _handle_system_status(self, include_metrics: bool = True,
                               components: List[str] = None):
    """Get system status and health"""
    status = {
        'daemon_running': True,
        'uptime': self._get_uptime(),
        'version': '2.0.0'
    }
    
    # Component status
    if not components or 'all' in components:
        components = ['memory', 'analyzer', 'scheduler', 'mcp']
        
    component_status = {}
    
    if 'memory' in components:
        component_status['memory'] = await self._check_memory_systems()
        
    if 'analyzer' in components:
        component_status['analyzer'] = await self._check_analyzers()
        
    if 'scheduler' in components:
        component_status['scheduler'] = await self._check_scheduler()
        
    if 'mcp' in components:
        component_status['mcp'] = self._get_mcp_stats()
        
    status['components'] = component_status
    
    # Include metrics if requested
    if include_metrics:
        status['metrics'] = await self._gather_metrics()
        
    return status

def _get_mcp_stats(self) -> Dict[str, Any]:
    """Get MCP server statistics"""
    total_calls = sum(len(calls) for calls in self.call_stats.values())
    
    return {
        'registered_functions': len(self.functions),
        'total_calls_last_minute': total_calls,
        'cache_entries': len(self.cache),
        'active_rate_limits': len(self.call_stats)
    }
```

### Daemon Integration

```python
class MiraDaemon:
    """Main MIRA Daemon with embedded MCP Server"""
    
    def __init__(self):
        # Initialize components
        self.memory_manager = MemoryManager()
        self.scheduler = Scheduler()
        self.analyzer_engine = AnalyzerEngine()
        self.work_analyzer = WorkContextAnalyzer()
        self.code_analyzer = CodebaseAnalyzer()
        self.steward_analyzer = StewardProfileAnalyzer()
        
        # Package components for MCP
        daemon_components = {
            'memory_manager': self.memory_manager,
            'scheduler': self.scheduler,
            'analyzer_engine': self.analyzer_engine,
            'work_analyzer': self.work_analyzer,
            'code_analyzer': self.code_analyzer,
            'steward_analyzer': self.steward_analyzer
        }
        
        # Initialize embedded MCP server
        self.mcp_server = MCPServer(daemon_components)
        
        # IPC for main MIRA app
        self.ipc_server = IPCServer(self.mcp_server)
        
    async def start(self):
        """Start daemon with all services"""
        logger.info("Starting MIRA Daemon...")
        
        # Start background services
        await self.memory_manager.initialize()
        await self.scheduler.start()
        await self.analyzer_engine.start()
        
        # Start IPC server (includes MCP)
        await self.ipc_server.start()
        
        logger.info("MIRA Daemon started successfully")
        logger.info(f"MCP Server ready with {len(self.mcp_server.functions)} functions")
        
        # Keep running
        try:
            while True:
                await asyncio.sleep(1)
                await self._health_check()
        except KeyboardInterrupt:
            await self.shutdown()
            
    async def shutdown(self):
        """Graceful shutdown"""
        logger.info("Shutting down MIRA Daemon...")
        
        # Stop MCP server gracefully
        if hasattr(self.mcp_server, 'runner'):
            await self.mcp_server.runner.cleanup()
        await self.analyzer_engine.stop()
        await self.scheduler.stop()
        await self.memory_manager.close()
        
        logger.info("MIRA Daemon stopped")
```

### Client Usage Examples

```python
# Python client example
import aiohttp
import json

async def call_mira(function: str, **params):
    """Call MIRA MCP function"""
    async with aiohttp.ClientSession() as session:
        async with session.post(
            'http://localhost:7890/mcp',
            json={'function': function, 'params': params}
        ) as response:
            return await response.json()

# Usage examples
result = await call_mira('search', query='authentication in python files')
result = await call_mira('analyze', target='user behavior today')
result = await call_mira('store', content='Learned about async patterns')
```

```javascript
// JavaScript/TypeScript client example
async function callMira(functionName, params = {}) {
    const response = await fetch('http://localhost:7890/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            function: functionName,
            params: params
        })
    });
    return response.json();
}

// Usage examples  
const results = await callMira('search', { query: 'error handling patterns' });
const analysis = await callMira('analyze', { target: 'recent productivity' });
const stored = await callMira('store', { 
    content: 'Important architecture decision',
    metadata: { tags: ['architecture', 'decision'] }
});
```

## 🔐 Security Implementation

### Authentication for Private Functions

```python
class MCPAuthenticator:
    """Handle authentication for protected MCP functions"""
    
    def __init__(self):
        self.session_tokens = {}
        self.auth_config = self._load_auth_config()
        
    def authenticate(self, request: Dict[str, Any]) -> bool:
        """Authenticate MCP request"""
        # Check if function requires auth
        function_name = request.get('function')
        if not self._requires_auth(function_name):
            return True
            
        # Check session token
        token = request.get('auth_token')
        if not token:
            return False
            
        # Validate token
        return self._validate_token(token)
        
    def _validate_token(self, token: str) -> bool:
        """Validate authentication token"""
        if token in self.session_tokens:
            session = self.session_tokens[token]
            
            # Check expiration
            if datetime.now() < session['expires']:
                return True
                
        return False
```

## 🧪 Testing Utilities

### MCP Function Tester

```python
class MCPTester:
    """Test utility for MCP functions"""
    
    def __init__(self, mcp_server: MCPServer):
        self.server = mcp_server
        
    async def test_function(self, function_name: str, **params):
        """Test a specific MCP function"""
        request = {
            'function': function_name,
            'parameters': params
        }
        
        start_time = datetime.now()
        response = await self.server.handle_request(request)
        duration = (datetime.now() - start_time).total_seconds()
        
        print(f"\\nTesting: {function_name}")
        print(f"Parameters: {params}")
        print(f"Duration: {duration:.3f}s")
        print(f"Success: {response.get('success')}")
        
        if response.get('success'):
            print(f"Result: {json.dumps(response.get('data'), indent=2)}")
        else:
            print(f"Error: {response.get('error')}")
            
        return response
        
    async def test_all_functions(self):
        """Test all registered functions with default parameters"""
        for name, func in self.server.functions.items():
            print(f"\\n{'='*60}")
            
            # Build test parameters
            test_params = {}
            properties = func.parameters.get('properties', {})
            
            for param, schema in properties.items():
                if 'default' in schema:
                    test_params[param] = schema['default']
                elif schema.get('type') == 'string':
                    test_params[param] = "test"
                elif schema.get('type') == 'integer':
                    test_params[param] = 10
                elif schema.get('type') == 'boolean':
                    test_params[param] = True
                    
            await self.test_function(name, **test_params)
```

## 🛠️ Deployment Configuration

### Systemd Service

```ini
# /etc/systemd/system/mira-daemon.service
[Unit]
Description=MIRA Daemon with MCP Server
After=network.target

[Service]
Type=simple
User=%i
WorkingDirectory=/home/%i
ExecStart=/usr/bin/python3 -m mira.daemon
Restart=always
RestartSec=10
StandardOutput=append:/home/%i/.mira/logs/daemon.log
StandardError=append:/home/%i/.mira/logs/daemon-error.log

[Install]
WantedBy=multi-user.target
```

### Environment Configuration

```python
# config/mcp_config.py
MCP_CONFIG = {
    'rate_limits': {
        'default': 60,  # calls per minute
        'mira_smart_search': 120,
        'mira_store_memory': 30,
        'mira_analyze_code': 10
    },
    
    'cache_ttl': {
        'default': 0,
        'mira_smart_search': 60,
        'mira_system_status': 30,
        'mira_analyze_work_context': 300
    },
    
    'auth_required': [
        'mira_recall_private_memory',
        'mira_store_private_memory',
        'mira_delete_memory'
    ]
}
```

---

*This implementation guide provides the foundation for the MCP Server embedded within the MIRA Daemon, enabling seamless Claude integration.*