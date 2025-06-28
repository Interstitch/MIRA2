# Path Discovery Quick Reference - MIRA 2.0

## 🚀 Quick Setup

### Import and Initialize
```python
from mira.discovery import get_mira_home, get_discovery_service

# Get MIRA home directory
mira_home = get_mira_home()

# Get discovery service
discovery = get_discovery_service()
```

## 📁 Directory Structure Created

```
.mira/
├── databases/              # All database storage
│   ├── chromadb/          # Vector database
│   ├── lightning_vidmem/  # Raw storage
│   │   ├── codebase/      # Code snapshots
│   │   ├── conversations/ # Dialogue backup
│   │   └── private_memory/# Encrypted thoughts
│   └── faiss/             # Fast search index
├── memories/              # Memory storage
│   ├── stored/           # Intentional saves
│   ├── identified/       # Extracted facts
│   └── working/          # Temporary
├── analysis/             # Analysis results
├── exports/              # Export formats
├── backups/              # Auto backups
├── logs/                 # System logs
├── cache/                # Temporary cache
├── config/               # Configuration
├── steward/              # User profiles
└── tmp/                  # Scratch space
```

## 🔍 Discovery Tiers

### MIRA Home Resolution Order
1. **Environment**: `$MIRA_HOME`
2. **Git Root**: `{git_root}/.mira`
3. **Workspace**: `{workspace}/.mira`
4. **User Home**: `~/.mira`
5. **Temp**: `/tmp/.mira_{user}`

### Quick Discovery Functions
```python
# MIRA directories
mira_home = get_mira_home()
db_path = get_mira_subdirectory('databases')
config_path = get_mira_subdirectory('config')

# System paths
git_root = discovery.discover_git_root()
claude_convos = discovery.discover_claude_conversations()
project_info = discovery.discover_project_type()
```

## 🎯 Common Patterns

### Get Database Paths
```python
# ChromaDB
chromadb = get_mira_subdirectory('databases', 'chromadb')

# Lightning Vidmem
vidmem = get_mira_subdirectory('databases', 'lightning_vidmem')
conversations = get_mira_subdirectory('databases', 'lightning_vidmem', 'conversations')

# FAISS
faiss = get_mira_subdirectory('databases', 'faiss')
```

### Get Memory Paths
```python
# Stored memories
stored = get_mira_subdirectory('memories', 'stored')

# Working memory
working = get_mira_subdirectory('memories', 'working')

# Cache
cache = get_mira_subdirectory('cache', 'embeddings')
```

## 🔧 Environment Variables

```bash
# Override MIRA home
export MIRA_HOME=/custom/path/.mira

# Disable auto-creation
export MIRA_NO_AUTO_CREATE=1

# Custom Claude path
export CLAUDE_CONVERSATION_PATH=/my/claude/data

# Force platform
export MIRA_PLATFORM=darwin  # darwin|linux|windows
```

## 📊 Platform-Specific Paths

### Claude Conversation Locations

**macOS**:
- `~/Library/Application Support/Claude/`
- `~/Library/Containers/com.anthropic.claude*/`

**Windows**:
- `%LOCALAPPDATA%\Claude\`
- `%APPDATA%\Claude\`

**Linux**:
- `~/.config/claude/`
- `~/.local/share/claude/`

**WSL**:
- `/mnt/c/Users/*/AppData/Local/Claude/`

## 🛠️ Troubleshooting

### Check Discovery
```python
# Get discovery report
resolver = MIRAPathResolver()
report = resolver.get_discovery_report()

print(f"MIRA Home: {report['current_home']}")
print(f"Structure Valid: {report['structure_valid']}")
print(f"Permissions: {report['permissions']}")
```

### Clear Cache
```python
# Clear discovery cache
discovery.clear_cache()

# Get cache stats
stats = discovery.get_cache_stats()
print(f"Cache entries: {stats['entries']}")
```

### Handle Permissions
```python
try:
    path = get_mira_home()
except PermissionError:
    # Will automatically fallback to temp
    print("Using temporary MIRA directory")
```

## 🚨 Common Issues

### Permission Denied
```bash
# Check write permissions
ls -la ~/.mira

# Fix permissions
chmod -R u+rwx ~/.mira
```

### Wrong Directory Found
```bash
# Force specific directory
export MIRA_HOME=/correct/path/.mira

# Or delete wrong directory
rm -rf /wrong/path/.mira
```

### Slow Discovery
```python
# Check what's being searched
discovery = get_discovery_service()
stats = discovery.get_cache_stats()

# Pre-warm cache
discovery.discover_git_root()
discovery.discover_project_type()
```

## 📈 Performance Tips

1. **Cache is 5 minutes** - Discoveries are cached
2. **Use subdirectory helper** - Auto-creates paths
3. **Batch discoveries** - Do all at startup
4. **Check report** - Verify structure on issues

## 🔍 Discovery Patterns

### Project Type Detection
```python
info = discovery.discover_project_type()
# Returns:
{
    'root': Path('/project'),
    'type': 'python',        # python|node|rust|go|java
    'framework': 'django',   # django|flask|react|vue
    'build_system': 'poetry',# poetry|npm|cargo|maven
    'test_framework': 'pytest'
}
```

### Environment Detection
```python
# In container?
if Path('/.dockerenv').exists():
    print("Running in Docker")

# In CI?
if any(os.environ.get(v) for v in ['CI', 'GITHUB_ACTIONS']):
    print("Running in CI")

# In WSL?
if 'microsoft' in platform.uname().release.lower():
    print("Running in WSL")
```

## 🎯 Best Practices

1. **Initialize early** - Call `get_mira_home()` at startup
2. **Use helpers** - Don't construct paths manually
3. **Check exists** - Paths are created on access
4. **Handle errors** - Always have fallback logic
5. **Log discoveries** - Track where things are found

---

**Remember**: Path Discovery ensures MIRA works everywhere without configuration!