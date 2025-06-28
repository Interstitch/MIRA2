# Path Discovery Implementation Guide - MIRA 2.0

## 🎯 Purpose

This guide provides production-ready implementation patterns for the Path Discovery Engine, carrying forward battle-tested code from MIRA 1.0.

## 📦 Core Implementation

### MIRA Path Resolver

```python
import os
import sys
import platform
import tempfile
from pathlib import Path
from typing import Optional, List, Callable, Dict, Any
from functools import lru_cache
import subprocess
import json
import time
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class MIRAPathResolver:
    """
    Central authority for MIRA directory resolution.
    Implements 5-tier fallback strategy with auto-creation.
    """
    
    # Directory structure to create
    MIRA_STRUCTURE = {
        'databases': {
            'chromadb': {},
            'lightning_vidmem': {
                'codebase': {},
                'conversations': {},
                'private_memory': {}
            },
            'faiss': {}
        },
        'memories': {
            'stored': {},
            'identified': {},
            'working': {}
        },
        'analysis': {
            'code': {},
            'conversations': {},
            'patterns': {}
        },
        'exports': {
            'json': {},
            'markdown': {},
            'videos': {}
        },
        'backups': {
            'daily': {},
            'weekly': {},
            'critical': {}
        },
        'logs': {
            'system': {},
            'analysis': {},
            'errors': {}
        },
        'cache': {
            'embeddings': {},
            'search': {},
            'models': {}
        },
        'config': {},
        'steward': {},
        'tmp': {}
    }
    
    def __init__(self):
        self._mira_home = None
        self._discovery_history = []
        
    @property
    def mira_home(self) -> Path:
        """Get or discover MIRA home directory."""
        if self._mira_home and self._mira_home.exists():
            return self._mira_home
            
        # Run discovery
        self._mira_home = self._discover_mira_home()
        return self._mira_home
    
    def _discover_mira_home(self) -> Path:
        """
        5-tier discovery strategy for MIRA home.
        Returns validated and initialized directory.
        """
        discovery_tiers = [
            # Tier 1: Environment variable
            (1, "environment", self._check_environment),
            
            # Tier 2: Git repository root
            (2, "git_root", self._check_git_root),
            
            # Tier 3: Project/workspace root
            (3, "workspace", self._check_workspace),
            
            # Tier 4: User home directory
            (4, "user_home", self._check_user_home),
            
            # Tier 5: System temp (fallback)
            (5, "temp", self._check_temp)
        ]
        
        for tier, name, check_func in discovery_tiers:
            try:
                if path := check_func():
                    if self._validate_mira_directory(path):
                        logger.info(f"Found MIRA home at tier {tier} ({name}): {path}")
                        self._record_discovery(tier, name, path)
                        return path
            except Exception as e:
                logger.debug(f"Tier {tier} ({name}) failed: {e}")
                continue
        
        # Should never reach here due to temp fallback
        raise RuntimeError("Unable to establish MIRA home directory")
    
    def _check_environment(self) -> Optional[Path]:
        """Check MIRA_HOME environment variable."""
        if mira_home := os.environ.get('MIRA_HOME'):
            path = Path(mira_home).expanduser().resolve()
            if path.exists() or self._can_create(path):
                return path
        return None
    
    def _check_git_root(self) -> Optional[Path]:
        """Find .mira in git repository root."""
        try:
            # Find git root
            result = subprocess.run(
                ['git', 'rev-parse', '--show-toplevel'],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                git_root = Path(result.stdout.strip())
                mira_path = git_root / '.mira'
                
                # Avoid nested repositories
                if not self._is_nested_git(git_root):
                    return mira_path
        except (subprocess.SubprocessError, FileNotFoundError):
            pass
        return None
    
    def _check_workspace(self) -> Optional[Path]:
        """Find .mira in workspace/project root."""
        # Check common workspace indicators
        indicators = [
            '.vscode', '.idea', 'package.json', 'pyproject.toml',
            'Cargo.toml', 'go.mod', '.project', 'workspace.code-workspace'
        ]
        
        current = Path.cwd()
        while current != current.parent:
            # Check for indicators
            for indicator in indicators:
                if (current / indicator).exists():
                    return current / '.mira'
            
            # Don't go above home directory
            if current == Path.home():
                break
                
            current = current.parent
        
        return None
    
    def _check_user_home(self) -> Optional[Path]:
        """Use ~/.mira as standard location."""
        return Path.home() / '.mira'
    
    def _check_temp(self) -> Optional[Path]:
        """Last resort: temp directory."""
        temp_base = Path(tempfile.gettempdir())
        
        # User-specific temp directory
        username = os.environ.get('USER', 'unknown')
        return temp_base / f'.mira_{username}'
    
    def _validate_mira_directory(self, path: Path) -> bool:
        """
        Validate and optionally create MIRA directory structure.
        Returns True if directory is valid and ready.
        """
        if path.exists():
            if not path.is_dir():
                logger.error(f"Path exists but is not a directory: {path}")
                return False
            
            # Check if we can write
            if not os.access(path, os.W_OK):
                logger.error(f"No write permission for: {path}")
                return False
                
            # Ensure structure exists
            self._ensure_structure(path)
            return True
        
        # Try to create
        if self._can_create(path):
            try:
                self._create_mira_directory(path)
                return True
            except Exception as e:
                logger.error(f"Failed to create directory: {e}")
                return False
        
        return False
    
    def _can_create(self, path: Path) -> bool:
        """Check if we can create directory at path."""
        parent = path.parent
        
        # Check parents until we find one that exists
        while not parent.exists() and parent != parent.parent:
            parent = parent.parent
        
        # Check write permission on existing parent
        return parent.exists() and os.access(parent, os.W_OK)
    
    def _create_mira_directory(self, path: Path):
        """Create full MIRA directory structure."""
        logger.info(f"Creating MIRA directory structure at: {path}")
        
        # Create base directory
        path.mkdir(parents=True, exist_ok=True)
        
        # Create full structure
        self._ensure_structure(path)
        
        # Create marker file
        marker = path / '.mira_initialized'
        marker.write_text(json.dumps({
            'version': '2.0',
            'created': datetime.now().isoformat(),
            'platform': platform.system(),
            'python_version': sys.version
        }, indent=2))
    
    def _ensure_structure(self, base: Path):
        """Ensure full directory structure exists."""
        def create_structure(parent: Path, structure: Dict[str, Any]):
            for name, substructure in structure.items():
                dir_path = parent / name
                dir_path.mkdir(exist_ok=True)
                
                if substructure:  # Has subdirectories
                    create_structure(dir_path, substructure)
        
        create_structure(base, self.MIRA_STRUCTURE)
    
    def _is_nested_git(self, git_root: Path) -> bool:
        """Check if this is a nested git repository."""
        parent = git_root.parent
        
        while parent != parent.parent:
            if (parent / '.git').exists():
                return True
            parent = parent.parent
            
        return False
    
    def _record_discovery(self, tier: int, method: str, path: Path):
        """Record discovery for diagnostics."""
        self._discovery_history.append({
            'timestamp': datetime.now().isoformat(),
            'tier': tier,
            'method': method,
            'path': str(path),
            'success': True
        })
    
    def get_subdirectory(self, *parts: str) -> Path:
        """Get subdirectory within MIRA home."""
        path = self.mira_home
        
        for part in parts:
            path = path / part
            
        # Ensure it exists
        path.mkdir(parents=True, exist_ok=True)
        return path
    
    def get_discovery_report(self) -> Dict[str, Any]:
        """Get discovery diagnostics report."""
        return {
            'current_home': str(self.mira_home),
            'discovery_history': self._discovery_history,
            'structure_valid': self._verify_structure(),
            'permissions': self._check_permissions()
        }
    
    def _verify_structure(self) -> Dict[str, bool]:
        """Verify directory structure integrity."""
        def verify_structure(base: Path, structure: Dict[str, Any]) -> Dict[str, bool]:
            results = {}
            
            for name, substructure in structure.items():
                path = base / name
                results[name] = path.exists() and path.is_dir()
                
                if substructure and results[name]:
                    results[f"{name}_subs"] = verify_structure(path, substructure)
                    
            return results
        
        return verify_structure(self.mira_home, self.MIRA_STRUCTURE)
    
    def _check_permissions(self) -> Dict[str, str]:
        """Check permissions on key directories."""
        permissions = {}
        
        for key_dir in ['databases', 'memories', 'config']:
            path = self.mira_home / key_dir
            
            if path.exists():
                perms = []
                if os.access(path, os.R_OK):
                    perms.append('read')
                if os.access(path, os.W_OK):
                    perms.append('write')
                if os.access(path, os.X_OK):
                    perms.append('execute')
                    
                permissions[key_dir] = '+'.join(perms) if perms else 'none'
            else:
                permissions[key_dir] = 'missing'
                
        return permissions


# Global resolver instance
_resolver = None

def get_mira_home() -> Path:
    """Get MIRA home directory (singleton)."""
    global _resolver
    if _resolver is None:
        _resolver = MIRAPathResolver()
    return _resolver.mira_home

def get_mira_subdirectory(*parts: str) -> Path:
    """Get subdirectory within MIRA home."""
    global _resolver
    if _resolver is None:
        _resolver = MIRAPathResolver()
    return _resolver.get_subdirectory(*parts)
```

### System Path Discovery Service

```python
import threading
from typing import Dict, Optional, List, Tuple
from datetime import datetime, timedelta
import glob
import shutil


class PathDiscoveryService:
    """
    Discovers various system paths with caching.
    Thread-safe singleton implementation.
    """
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        self._cache = {}
        self._cache_timestamps = {}
        self._cache_ttl = timedelta(minutes=5)
        self._platform = platform.system().lower()
        self._initialized = True
        
        logger.info(f"PathDiscoveryService initialized for platform: {self._platform}")
    
    def discover_git_root(self, start_path: Optional[Path] = None) -> Optional[Path]:
        """Find top-level git repository."""
        cache_key = f"git_root_{start_path or 'cwd'}"
        
        if cached := self._get_cached(cache_key):
            return cached
            
        start = Path(start_path or os.getcwd())
        
        # Method 1: Use git command
        try:
            result = subprocess.run(
                ['git', 'rev-parse', '--show-toplevel'],
                cwd=start,
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                git_root = Path(result.stdout.strip())
                self._set_cache(cache_key, git_root)
                return git_root
        except:
            pass
        
        # Method 2: Walk up directory tree
        current = start
        while current != current.parent:
            if (current / '.git').is_dir():
                self._set_cache(cache_key, current)
                return current
            current = current.parent
            
        return None
    
    def discover_claude_conversations(self) -> List[Path]:
        """Find all Claude conversation directories."""
        cache_key = "claude_conversations"
        
        if cached := self._get_cached(cache_key):
            return cached
            
        conversations = []
        
        # Platform-specific search paths
        search_paths = self._get_claude_search_paths()
        
        for search_path in search_paths:
            try:
                # Expand user and environment variables
                expanded = Path(os.path.expandvars(os.path.expanduser(search_path)))
                
                if not expanded.exists():
                    continue
                    
                # Search for conversation files
                patterns = [
                    'claude*.json',
                    'conversation*.json',
                    '**/claude*/conversation*.json',
                    '**/Claude/History/*.json'
                ]
                
                for pattern in patterns:
                    for match in expanded.glob(pattern):
                        if self._validate_claude_conversation(match):
                            conversations.append(match)
                            
            except (PermissionError, OSError) as e:
                logger.debug(f"Cannot access {search_path}: {e}")
                continue
        
        # Remove duplicates and sort by modification time
        unique_conversations = list(set(conversations))
        unique_conversations.sort(key=lambda p: p.stat().st_mtime, reverse=True)
        
        self._set_cache(cache_key, unique_conversations)
        return unique_conversations
    
    def _get_claude_search_paths(self) -> List[str]:
        """Get platform-specific Claude search paths."""
        base_paths = []
        
        if self._platform == 'darwin':  # macOS
            base_paths = [
                '~/Library/Application Support/Claude',
                '~/Library/Containers/com.anthropic.claude*/Data',
                '/Users/Shared/Claude',
                '~/.claude',
                '~/Documents/Claude'
            ]
            
            # Add potential sandbox paths
            for i in range(10):
                base_paths.append(f'~/Library/Containers/com.anthropic.claude{i}/Data')
                
        elif self._platform == 'windows':
            base_paths = [
                '%LOCALAPPDATA%\\Claude',
                '%APPDATA%\\Claude',
                '%USERPROFILE%\\Documents\\Claude',
                '%PROGRAMDATA%\\Claude',
                'C:\\ProgramData\\Claude'
            ]
            
            # Add package paths
            base_paths.append('%USERPROFILE%\\AppData\\Local\\Packages\\Claude*')
            
        else:  # Linux and others
            base_paths = [
                '~/.config/claude',
                '~/.local/share/claude',
                '~/.claude',
                '~/Documents/claude',
                '/opt/claude/data'
            ]
            
            # WSL paths
            if 'microsoft' in platform.uname().release.lower():
                base_paths.extend([
                    '/mnt/c/Users/*/AppData/Local/Claude',
                    '/mnt/c/Users/*/Documents/Claude'
                ])
        
        # Docker/container paths
        if self._is_container():
            base_paths.extend([
                '/data/claude',
                '/claude',
                '/var/claude'
            ])
            
        # CI/CD paths
        if self._is_ci():
            base_paths.extend([
                os.environ.get('GITHUB_WORKSPACE', '.') + '/.claude',
                os.environ.get('CI_PROJECT_DIR', '.') + '/.claude',
                './.claude'
            ])
            
        return base_paths
    
    def _validate_claude_conversation(self, path: Path) -> bool:
        """Validate that file is a Claude conversation."""
        if not path.is_file():
            return False
            
        if path.suffix not in ['.json', '.jsonl']:
            return False
            
        # Check file size (conversations are typically > 1KB)
        if path.stat().st_size < 100:
            return False
            
        # Try to validate content
        try:
            with open(path, 'r', encoding='utf-8') as f:
                first_line = f.readline()
                
                # Check for JSON structure
                if first_line.strip().startswith('{'):
                    # Look for Claude-specific fields
                    content = f.read(1000)  # Read first 1KB
                    claude_indicators = [
                        '"model":', '"claude"', '"anthropic"',
                        '"conversation":', '"messages":', '"human":', '"assistant":'
                    ]
                    
                    return any(indicator in content.lower() for indicator in claude_indicators)
                    
        except Exception as e:
            logger.debug(f"Cannot validate {path}: {e}")
            
        return False
    
    def discover_project_type(self, project_root: Optional[Path] = None) -> Dict[str, Any]:
        """Discover project type and configuration."""
        root = project_root or Path.cwd()
        cache_key = f"project_type_{root}"
        
        if cached := self._get_cached(cache_key):
            return cached
            
        project_info = {
            'root': root,
            'type': 'unknown',
            'language': None,
            'framework': None,
            'build_system': None,
            'test_framework': None
        }
        
        # Check for configuration files
        config_checks = [
            # Python
            ('pyproject.toml', {'type': 'python', 'build_system': 'poetry'}),
            ('setup.py', {'type': 'python', 'build_system': 'setuptools'}),
            ('requirements.txt', {'type': 'python', 'build_system': 'pip'}),
            ('Pipfile', {'type': 'python', 'build_system': 'pipenv'}),
            
            # JavaScript/TypeScript
            ('package.json', {'type': 'node', 'build_system': 'npm'}),
            ('yarn.lock', {'type': 'node', 'build_system': 'yarn'}),
            ('pnpm-lock.yaml', {'type': 'node', 'build_system': 'pnpm'}),
            
            # Rust
            ('Cargo.toml', {'type': 'rust', 'build_system': 'cargo'}),
            
            # Go
            ('go.mod', {'type': 'go', 'build_system': 'go'}),
            
            # Java
            ('pom.xml', {'type': 'java', 'build_system': 'maven'}),
            ('build.gradle', {'type': 'java', 'build_system': 'gradle'}),
            
            # Ruby
            ('Gemfile', {'type': 'ruby', 'build_system': 'bundler'}),
            
            # .NET
            ('*.csproj', {'type': 'dotnet', 'build_system': 'dotnet'}),
            
            # Docker
            ('Dockerfile', {'framework': 'docker'}),
            ('docker-compose.yml', {'framework': 'docker-compose'})
        ]
        
        for config_file, attributes in config_checks:
            if '*' in config_file:
                if list(root.glob(config_file)):
                    project_info.update(attributes)
            elif (root / config_file).exists():
                project_info.update(attributes)
                
                # Parse additional info from config
                self._parse_project_config(root / config_file, project_info)
        
        self._set_cache(cache_key, project_info)
        return project_info
    
    def _parse_project_config(self, config_path: Path, project_info: Dict[str, Any]):
        """Parse project configuration for additional info."""
        try:
            if config_path.name == 'package.json':
                with open(config_path) as f:
                    data = json.load(f)
                    
                    # Detect framework
                    deps = {**data.get('dependencies', {}), **data.get('devDependencies', {})}
                    
                    if 'react' in deps:
                        project_info['framework'] = 'react'
                    elif 'vue' in deps:
                        project_info['framework'] = 'vue'
                    elif 'angular' in deps:
                        project_info['framework'] = 'angular'
                    elif 'express' in deps:
                        project_info['framework'] = 'express'
                    
                    # Detect test framework
                    if 'jest' in deps:
                        project_info['test_framework'] = 'jest'
                    elif 'mocha' in deps:
                        project_info['test_framework'] = 'mocha'
                    elif 'vitest' in deps:
                        project_info['test_framework'] = 'vitest'
                        
            elif config_path.name == 'pyproject.toml':
                # Could use toml parser here
                content = config_path.read_text()
                
                if 'django' in content:
                    project_info['framework'] = 'django'
                elif 'flask' in content:
                    project_info['framework'] = 'flask'
                elif 'fastapi' in content:
                    project_info['framework'] = 'fastapi'
                    
                if 'pytest' in content:
                    project_info['test_framework'] = 'pytest'
                elif 'unittest' in content:
                    project_info['test_framework'] = 'unittest'
                    
        except Exception as e:
            logger.debug(f"Error parsing {config_path}: {e}")
    
    def _is_container(self) -> bool:
        """Detect if running in container."""
        # Docker
        if Path('/.dockerenv').exists():
            return True
            
        # Check cgroup
        try:
            with open('/proc/1/cgroup', 'r') as f:
                return 'docker' in f.read() or 'containerd' in f.read()
        except:
            pass
            
        # Kubernetes
        if Path('/var/run/secrets/kubernetes.io').exists():
            return True
            
        return False
    
    def _is_ci(self) -> bool:
        """Detect if running in CI environment."""
        ci_env_vars = [
            'CI', 'CONTINUOUS_INTEGRATION', 'GITHUB_ACTIONS',
            'GITLAB_CI', 'JENKINS_HOME', 'TRAVIS', 'CIRCLECI',
            'TEAMCITY_VERSION', 'BUILDKITE', 'DRONE'
        ]
        
        return any(os.environ.get(var) for var in ci_env_vars)
    
    def _get_cached(self, key: str) -> Optional[Any]:
        """Get cached value if not expired."""
        if key in self._cache:
            timestamp = self._cache_timestamps.get(key)
            if timestamp and datetime.now() - timestamp < self._cache_ttl:
                logger.debug(f"Cache hit for {key}")
                return self._cache[key]
            else:
                # Expired
                del self._cache[key]
                del self._cache_timestamps[key]
                
        return None
    
    def _set_cache(self, key: str, value: Any):
        """Set cache value with timestamp."""
        self._cache[key] = value
        self._cache_timestamps[key] = datetime.now()
        logger.debug(f"Cached {key}")
    
    def clear_cache(self):
        """Clear all cached values."""
        self._cache.clear()
        self._cache_timestamps.clear()
        logger.info("Path discovery cache cleared")
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        return {
            'entries': len(self._cache),
            'keys': list(self._cache.keys()),
            'oldest': min(self._cache_timestamps.values()) if self._cache_timestamps else None,
            'newest': max(self._cache_timestamps.values()) if self._cache_timestamps else None
        }


# Global service instance
_discovery_service = None

def get_discovery_service() -> PathDiscoveryService:
    """Get path discovery service (singleton)."""
    global _discovery_service
    if _discovery_service is None:
        _discovery_service = PathDiscoveryService()
    return _discovery_service
```

## 🛠️ Integration Examples

### Basic Usage
```python
from mira.discovery import get_mira_home, get_discovery_service

# Get MIRA directories
mira_home = get_mira_home()
db_path = get_mira_subdirectory('databases', 'chromadb')
memories_path = get_mira_subdirectory('memories', 'stored')

# Discover system paths
discovery = get_discovery_service()
git_root = discovery.discover_git_root()
claude_convos = discovery.discover_claude_conversations()
project_info = discovery.discover_project_type()

print(f"MIRA Home: {mira_home}")
print(f"Git Root: {git_root}")
print(f"Project Type: {project_info['type']}")
print(f"Found {len(claude_convos)} Claude conversations")
```

### Startup Integration with Progress Tracking
```python
from mira.startup import StartupProgressTracker

class PathDiscoveryStartup:
    """Path Discovery with startup progress tracking"""
    
    def __init__(self, progress_tracker: StartupProgressTracker):
        self.tracker = progress_tracker
        self.resolver = MIRAPathResolver()
        self.discovery = get_discovery_service()
        
    def execute(self):
        """Execute path discovery as part of startup"""
        try:
            # Start the path discovery task
            self.tracker.start_task('path_discovery', 
                                   "Discovering MIRA home directory...")
            
            # Step 1: Find MIRA home
            mira_home = self.resolver.mira_home
            
            # Update progress for next step
            self.tracker.start_task('path_discovery',
                                   "Validating Claude conversation paths...")
            
            # Step 2: Discover Claude conversations
            claude_paths = self.discovery.discover_claude_conversations()
            
            # Update progress for final step
            self.tracker.start_task('path_discovery',
                                   "Establishing project context...")
            
            # Step 3: Discover project info
            project_info = self.discovery.discover_project_type()
            
            # Cache all discoveries for faster subsequent access
            self.discovery._set_cache('startup_complete', True)
            
            # Mark task as complete
            self.tracker.complete_task('path_discovery', success=True)
            
            return {
                'mira_home': mira_home,
                'claude_paths': claude_paths,
                'project_info': project_info
            }
            
        except Exception as e:
            # Report failure to tracker
            self.tracker.complete_task('path_discovery', 
                                     success=False, 
                                     error=str(e))
            
            # Try fallback strategy
            logger.warning(f"Path discovery failed: {e}")
            return self._fallback_discovery()
            
    def _fallback_discovery(self):
        """Fallback when normal discovery fails"""
        # Use temp directory as last resort
        temp_home = Path(tempfile.gettempdir()) / f'.mira_{os.getuid()}'
        temp_home.mkdir(exist_ok=True)
        
        return {
            'mira_home': temp_home,
            'claude_paths': [],
            'project_info': {'type': 'unknown', 'degraded': True}
        }
```

### Advanced Integration
```python
class MIRACore:
    """Example integration with MIRA core systems."""
    
    def __init__(self):
        # Initialize paths
        self.mira_home = get_mira_home()
        self.discovery = get_discovery_service()
        
        # Get key directories
        self.db_path = get_mira_subdirectory('databases')
        self.config_path = get_mira_subdirectory('config')
        
        # Load configuration
        self.config = self._load_config()
        
        # Initialize based on project type
        self.project = self.discovery.discover_project_type()
        self._setup_for_project()
    
    def _load_config(self) -> Dict[str, Any]:
        """Load MIRA configuration."""
        config_file = self.config_path / 'mira.json'
        
        if config_file.exists():
            with open(config_file) as f:
                return json.load(f)
        else:
            # Create default config
            default_config = {
                'version': '2.0',
                'paths': {
                    'mira_home': str(self.mira_home),
                    'discovered_at': datetime.now().isoformat()
                }
            }
            
            config_file.write_text(json.dumps(default_config, indent=2))
            return default_config
    
    def _setup_for_project(self):
        """Configure MIRA based on project type."""
        if self.project['type'] == 'python':
            # Python-specific setup
            self._setup_python_environment()
        elif self.project['type'] == 'node':
            # Node.js-specific setup
            self._setup_node_environment()
```

## 🐛 Common Issues and Solutions

### 1. Permission Denied
```python
def handle_permission_error(path: Path, operation: str = "access"):
    """Handle permission errors gracefully."""
    
    logger.warning(f"Permission denied for {operation} on {path}")
    
    # Try alternative locations
    alternatives = [
        Path.home() / '.mira',
        Path('/tmp') / f'.mira_{os.getuid()}',
        Path(tempfile.gettempdir()) / '.mira'
    ]
    
    for alt in alternatives:
        try:
            alt.mkdir(parents=True, exist_ok=True)
            
            # Test write
            test_file = alt / '.write_test'
            test_file.write_text("test")
            test_file.unlink()
            
            logger.info(f"Using alternative path: {alt}")
            return alt
            
        except Exception:
            continue
            
    raise PermissionError(f"No writable location found for MIRA")
```

### 2. Slow Discovery
```python
class CachedDiscovery:
    """Persistent cache for discovery results."""
    
    def __init__(self, cache_dir: Path):
        self.cache_file = cache_dir / 'discovery_cache.json'
        self.cache = self._load_cache()
    
    def _load_cache(self) -> Dict[str, Any]:
        """Load cache from disk."""
        if self.cache_file.exists():
            try:
                with open(self.cache_file) as f:
                    data = json.load(f)
                    
                # Validate cache age
                cache_time = datetime.fromisoformat(data.get('timestamp', ''))
                if datetime.now() - cache_time < timedelta(hours=24):
                    return data.get('cache', {})
            except:
                pass
                
        return {}
    
    def get(self, key: str) -> Optional[Any]:
        """Get cached discovery result."""
        entry = self.cache.get(key)
        
        if entry:
            # Check if path still exists
            if 'path' in entry:
                path = Path(entry['path'])
                if path.exists():
                    return path
                    
        return None
    
    def set(self, key: str, value: Any):
        """Cache discovery result."""
        self.cache[key] = {
            'value': str(value) if isinstance(value, Path) else value,
            'timestamp': datetime.now().isoformat()
        }
        
        # Save to disk
        self._save_cache()
    
    def _save_cache(self):
        """Persist cache to disk."""
        data = {
            'timestamp': datetime.now().isoformat(),
            'cache': self.cache
        }
        
        self.cache_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(self.cache_file, 'w') as f:
            json.dump(data, f, indent=2)
```

## 🔮 Future Enhancements

### Parallel Discovery
```python
async def discover_all_paths_async():
    """Discover all paths in parallel."""
    import asyncio
    
    tasks = [
        discover_git_root_async(),
        discover_claude_async(),
        discover_project_async(),
        discover_vscode_async()
    ]
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    return {
        'git_root': results[0] if not isinstance(results[0], Exception) else None,
        'claude': results[1] if not isinstance(results[1], Exception) else None,
        'project': results[2] if not isinstance(results[2], Exception) else None,
        'vscode': results[3] if not isinstance(results[3], Exception) else None
    }
```

### ML-Based Path Prediction
```python
class SmartPathPredictor:
    """Use patterns to predict likely paths."""
    
    def __init__(self):
        self.patterns = defaultdict(list)
        self.load_patterns()
    
    def learn(self, target: str, found_at: Path):
        """Learn from successful discoveries."""
        relative_path = self._get_relative_pattern(found_at)
        self.patterns[target].append(relative_path)
        
        # Keep top 10 most common
        if len(self.patterns[target]) > 10:
            # Sort by frequency
            counter = Counter(self.patterns[target])
            self.patterns[target] = [p for p, _ in counter.most_common(10)]
    
    def predict(self, target: str) -> List[Path]:
        """Predict likely locations."""
        predictions = []
        
        if target in self.patterns:
            for pattern in self.patterns[target]:
                predicted = self._apply_pattern(pattern)
                if predicted and predicted.exists():
                    predictions.append(predicted)
                    
        return predictions
```

---

*This implementation guide contains the battle-tested patterns that make MIRA's path discovery reliable across all environments.*