# Path Discovery Engine - MIRA 2.0

## 🎯 Overview

The Path Discovery Engine is MIRA's intelligent filesystem navigation system that ensures "it just works" across any environment. It automatically discovers critical paths, handles platform differences, and creates necessary directory structures without user configuration.

## 🏗️ Core Architecture

### Three-Tier Discovery System

```
┌─────────────────────────────────────────────────────────┐
│                  Path Discovery Engine                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────┐│
│  │ MIRA Path       │  │ System Path      │  │ Claude ││
│  │ Resolver        │  │ Discovery        │  │ Path   ││
│  │                 │  │ Service          │  │ Finder ││
│  │ • .mira dir     │  │ • Git roots      │  │ • Conv ││
│  │ • Tiered search │  │ • Project paths  │  │ • 25+  ││
│  │ • Auto-create   │  │ • Claude dirs    │  │  locs  ││
│  └─────────────────┘  └──────────────────┘  └────────┘│
│                                                         │
│  ┌─────────────────────────────────────────────────────┤
│  │                  Shared Components                   │
│  │  • Platform Detection  • Permission Handler         │
│  │  • Path Validation    • Cache Manager (5min TTL)   │
│  └─────────────────────────────────────────────────────┤
└─────────────────────────────────────────────────────────┘
```

## 📦 Core Components

### 1. MIRA Path Resolver
**Purpose**: Finds or creates the `.mira` directory with intelligent fallbacks

**5-Tier Resolution Strategy**:
```python
RESOLUTION_TIERS = [
    # Tier 1: Environment override
    lambda: os.environ.get('MIRA_HOME'),
    
    # Tier 2: Git repository root
    lambda: find_git_root() / '.mira',
    
    # Tier 3: Project workspace
    lambda: find_workspace_root() / '.mira',
    
    # Tier 4: User home directory
    lambda: Path.home() / '.mira',
    
    # Tier 5: System temp (last resort)
    lambda: Path(tempfile.gettempdir()) / f'.mira_{getuser()}'
]
```

**Directory Structure Created** (Aligned with MIRA 2.0):
```
.mira/
├── databases/
│   ├── chromadb/              # Vector storage
│   │   ├── stored_memories/   # Personal memories
│   │   ├── identified_facts/  # Extracted facts
│   │   └── raw_embeddings/    # Raw data embeddings
│   └── lightning_vidmem/      # Triple-encrypted storage
│       ├── codebase_copies/   # Codebase snapshots
│       ├── conversation_backups/ # Conversation history
│       └── private_thoughts/  # Private consciousness
├── conversations/             # Conversation tracking
│   ├── sessions/             # Individual sessions
│   ├── bridges/              # Continuity bridges
│   └── handoffs/             # Session handoffs
├── consciousness/            # Consciousness system
│   ├── patterns/             # Pattern storage
│   ├── evolution/            # Evolution data
│   ├── contemplation/        # Contemplation results
│   └── steward_profiles/     # User profiles
├── insights/                 # Generated insights
│   ├── daily/               # Daily insights
│   ├── patterns/            # Pattern insights
│   ├── retrospectives/      # Retrospective analysis
│   └── contemplations/      # Contemplation insights
├── cache/                   # Temporary data
│   ├── embeddings/          # Embedding cache
│   ├── search_results/      # Search cache
│   ├── steward_analysis/    # Analysis cache
│   └── pattern_cache/       # Pattern cache
├── exports/                 # Data exports
│   ├── backups/            # Backup data
│   │   ├── config/         # Config backups
│   │   ├── memories/       # Memory backups
│   │   └── patterns/       # Pattern backups
│   └── migrations/         # Migration data
├── logs/                   # System logs
│   ├── daemon/            # Daemon logs
│   ├── mcp/               # MCP logs
│   └── startup/           # Startup logs
├── config.json            # Unified configuration
├── version.json           # Version tracking
├── steward_profile.json   # Main steward profile
└── session_continuity.json # Session tracking
```

### 2. System Path Discovery Service
**Purpose**: Discovers various system paths beyond MIRA directories

**Key Features**:
- Singleton pattern with thread-safe initialization
- 5-minute cache expiry for discovered paths
- Platform-specific discovery logic
- Graceful permission handling

**Discovery Targets**:
```python
DISCOVERY_TARGETS = {
    'git_root': find_git_repository,
    'project_root': find_project_root,
    'claude_conversations': find_claude_conversations,
    'vscode_workspace': find_vscode_workspace,
    'docker_context': detect_docker_environment,
    'ci_environment': detect_ci_platform
}
```

### 3. Claude Path Finder
**Purpose**: Specialized discovery for Claude Code conversation history

**Search Locations** (25+ paths across platforms):
```python
# macOS
~/Library/Application Support/Claude/
~/Library/Containers/com.anthropic.claude*/
/var/folders/*/Claude/

# Windows
%LOCALAPPDATA%\Claude\
%APPDATA%\Claude\
%USERPROFILE%\AppData\Local\Packages\Claude*\

# Linux
~/.config/claude/
~/.local/share/claude/
/opt/claude/data/

# Docker/WSL
/mnt/c/Users/*/AppData/Local/Claude/
/home/*/.claude/

# CI/CD environments
$GITHUB_WORKSPACE/.claude/
$CI_PROJECT_DIR/.claude/
```

## 🔍 Discovery Algorithms

### Tiered Search Strategy
```python
def discover_path(target: str) -> Optional[Path]:
    """Multi-tier discovery with validation"""
    
    # Check cache first
    if cached := cache.get(target):
        if cached.exists() and is_valid(cached):
            return cached
    
    # Try each tier in order
    for tier, discovery_func in enumerate(TIERS):
        try:
            path = discovery_func(target)
            if path and validate_path(path, target):
                cache.set(target, path)
                log_discovery(f"Found {target} at tier {tier}")
                return path
        except PermissionError:
            continue  # Try next tier
    
    # Fallback creation
    return create_fallback(target)
```

### Validation Logic
```python
VALIDATORS = {
    'claude_conversation': lambda p: (
        p.suffix in ['.json', '.jsonl'] and
        'claude' in p.stem.lower() and
        validate_conversation_format(p)
    ),
    
    'git_repository': lambda p: (
        (p / '.git').is_dir() and
        not is_submodule(p)
    ),
    
    'mira_directory': lambda p: (
        p.is_dir() and
        check_mira_structure(p)
    )
}
```

## ⚡ Performance Optimizations

### 1. Intelligent Caching
```python
class PathCache:
    def __init__(self, ttl: int = 300):  # 5-minute TTL
        self._cache = {}
        self._timestamps = {}
        self._ttl = ttl
    
    def get(self, key: str) -> Optional[Path]:
        if key in self._cache:
            if time.time() - self._timestamps[key] < self._ttl:
                return self._cache[key]
            else:
                del self._cache[key]
                del self._timestamps[key]
        return None
```

### 2. Lazy Directory Creation
```python
def ensure_directory(path: Path, create_structure: bool = False):
    """Create directory only when needed"""
    if not path.exists():
        if create_structure:
            create_full_structure(path)
        else:
            path.mkdir(parents=True, exist_ok=True)
```

### 3. Platform-Specific Shortcuts
```python
PLATFORM_SHORTCUTS = {
    'darwin': {
        'claude': '~/Library/Application Support/Claude',
        'vscode': '~/Library/Application Support/Code',
    },
    'win32': {
        'claude': '%LOCALAPPDATA%\\Claude',
        'vscode': '%APPDATA%\\Code',
    },
    'linux': {
        'claude': '~/.config/claude',
        'vscode': '~/.config/Code',
    }
}
```

## 🛡️ Error Handling

### Permission Denied Strategy
```python
def handle_permission_denied(path: Path, operation: str):
    """Graceful handling of permission errors"""
    
    strategies = [
        # Try with elevated permissions (if available)
        lambda: try_with_sudo(path, operation),
        
        # Use alternative location
        lambda: find_alternative_location(path),
        
        # Create in temp with symlink
        lambda: create_temp_with_link(path),
        
        # Log and continue with degraded functionality
        lambda: log_and_continue(path, operation)
    ]
    
    for strategy in strategies:
        if result := strategy():
            return result
```

### Environment Detection
```python
ENVIRONMENT_MARKERS = {
    'docker': [
        Path('/.dockerenv'),
        lambda: 'docker' in Path('/proc/1/cgroup').read_text()
    ],
    'wsl': [
        Path('/proc/sys/fs/binfmt_misc/WSLInterop'),
        lambda: 'microsoft' in platform.uname().release.lower()
    ],
    'codespace': [
        lambda: os.environ.get('CODESPACES') == 'true',
        Path('/workspaces/.codespaces')
    ],
    'ci': [
        lambda: any(os.environ.get(var) for var in 
                   ['CI', 'CONTINUOUS_INTEGRATION', 'GITHUB_ACTIONS'])
    ]
}
```

## 🔧 Configuration

### Environment Variables
```bash
# Override MIRA home directory
export MIRA_HOME=/custom/path/.mira

# Disable automatic directory creation
export MIRA_NO_AUTO_CREATE=1

# Custom Claude conversation path
export CLAUDE_CONVERSATION_PATH=/my/claude/data

# Force specific platform behavior
export MIRA_PLATFORM=darwin  # Force macOS paths on Linux
```

### Configuration File
```json
{
  "discovery": {
    "cache_ttl": 300,
    "max_search_depth": 5,
    "timeout_seconds": 10,
    "create_missing": true,
    "preferred_locations": [
      "~/.mira",
      "/opt/mira"
    ]
  },
  "validators": {
    "strict_mode": false,
    "require_git_root": false,
    "validate_permissions": true
  }
}
```

## 🚀 Usage Patterns

### Basic Discovery
```python
from mira.discovery import PathDiscovery

# Get MIRA home directory
mira_home = PathDiscovery.get_mira_home()

# Find Claude conversations
conversations = PathDiscovery.find_claude_conversations()

# Get project root
project = PathDiscovery.get_project_root()
```

### Advanced Discovery
```python
# Custom discovery with validation
custom_path = PathDiscovery.discover(
    target='my_data',
    validators=[validate_json_files],
    search_paths=['~/Documents', '/data'],
    create_if_missing=True
)

# Batch discovery with caching
paths = PathDiscovery.discover_multiple([
    'git_root',
    'claude_data',
    'vscode_settings'
], cache_results=True)
```

## 🌟 MIRA 2.0 Enhancements

### Planned Improvements
1. **Parallel Discovery** - Search multiple paths concurrently
2. **Smart Predictions** - ML-based path prediction from patterns
3. **Network Paths** - Support for remote/network storage
4. **Path Migrations** - Automatic migration when paths change
5. **Discovery Plugins** - Extensible discovery for new tools

### Architecture Decisions
1. **Keep It Working** - Never break existing discovery logic
2. **Fail Gracefully** - Always provide a workable path
3. **Cache Aggressively** - Minimize filesystem operations
4. **Validate Thoroughly** - Ensure discovered paths are valid
5. **Document Paths** - Log where things are discovered

## 📚 MIRA 1.0 Lessons Learned

### Problems Solved
The Path Discovery Engine in MIRA 1.0 successfully solved these critical challenges:

1. **Environment Variability** - Works across 20+ different environment types (local, Docker, WSL, CI/CD, cloud IDEs)
2. **Permission Issues** - Validates and handles permission errors gracefully without crashing
3. **Path Consistency** - Single source of truth prevents path mismatches between components
4. **Performance** - Caching prevents repeated expensive filesystem scans
5. **User Experience** - Automatic discovery eliminates manual configuration burden
6. **Container Support** - Seamless operation in Docker, Kubernetes, and CI/CD pipelines
7. **Cross-Platform** - Handles Windows, macOS, Linux path differences elegantly

### Key Implementation Insights

#### Must Preserve from MIRA 1.0:
1. **Tiered Search Strategy** - Check most likely locations first for performance
2. **Validation Layer** - Always validate discovered paths actually work
3. **Caching Mechanism** - Essential for performance (5-minute TTL works well)
4. **Directory Structure** - Many components depend on the exact layout
5. **Environment Override** - `MIRA_MEMORY_DIR` for custom setups
6. **Git Intelligence** - Top-level repo detection logic (avoid nested repos)
7. **Cross-Platform Logic** - Platform-specific path handling is battle-tested

#### Integration Points That Work Well:
1. **Setup Scripts** - `setup.js` uses discovery during installation
2. **MCP Server** - Path resolution for MCP function context
3. **Daemon Services** - All background services use resolved paths
4. **Python Bridge** - Consistent path sharing between TypeScript and Python
5. **CLI Commands** - All commands resolve paths before execution

#### Configuration Format (Proven Effective):
```json
{
  "version": "1.0.0",
  "paths": {
    "claudeConversations": "/home/user/.claude/projects",
    "claudeConversationsValid": true,
    "lastConversationCheck": "2025-06-09T10:30:45.123Z",
    "discoveryMethod": "fallback_comprehensive_search",
    "discoveredAt": "2025-06-09T10:30:45.123Z"
  }
}
```

---

*The Path Discovery Engine ensures MIRA works everywhere without configuration. It's the foundation of MIRA's "zero-config" philosophy, proven across thousands of diverse environments.*