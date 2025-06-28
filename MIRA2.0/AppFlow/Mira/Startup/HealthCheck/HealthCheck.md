# Health Check & Auto-Repair System - MIRA 2.0

## 🎯 Overview

The Health Check & Auto-Repair System is MIRA's autonomous maintenance system that validates configuration, manages dependencies, and ensures system integrity. It runs proactively to detect and fix issues before they impact functionality, embodying MIRA's philosophy of intelligent automation.

## 🏗️ Core Components

As specified in MIRA_2.0.md, the Health Check & Auto-Repair System consists of:

### 1. Dependency Management
**Purpose**: Automatic Python package installation and management

**Key Features**:
- **PIP Auto-Installer**: Detects missing packages and installs automatically
- **Version Validation**: Ensures correct package versions are installed
- **Virtual Environment Support**: Works within venv/conda environments
- **Requirement Sync**: Keeps requirements.txt synchronized

### 2. Configuration Validators

#### CLAUDE.md Validator/Injector
**Purpose**: Ensures MIRA's development instructions are present

**Features**:
- Detects if CLAUDE.md exists in project root
- Validates content matches current version
- Auto-injects or updates when missing/outdated
- Preserves project-specific customizations

#### Git Pre-commit Hook Manager
**Purpose**: Maintains git hooks for code quality

**Features**:
- Installs pre-commit hooks automatically
- Validates hook functionality
- Updates hooks when MIRA updates
- Preserves existing user hooks

#### NPM Hook Validator/Injector
**Purpose**: Manages NPM lifecycle hooks for Node.js projects

**Features**:
- Detects package.json presence
- Validates/adds MIRA-specific hooks
- Ensures compatibility with existing scripts
- Auto-repairs broken configurations

#### .gitignore Maintenance
**Purpose**: Keeps .gitignore properly configured

**Features**:
- Ensures .mira/ is properly ignored
- Adds MIRA-specific patterns
- Preserves user entries
- Handles platform-specific patterns

### 3. Structure Healing
**Purpose**: Directory validator and auto-repair system

**Features**:
- Validates complete .mira directory structure
- Auto-creates missing directories
- Repairs permission issues
- Ensures write access to critical paths

## 🔍 Health Check Flow

```
┌─────────────────────────────────────────────────────────┐
│                 Health Check System                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Dependency Check                                    │
│     ├── Scan installed packages                         │
│     ├── Compare with requirements                       │
│     └── Auto-install missing                           │
│                                                         │
│  2. Configuration Validation                            │
│     ├── CLAUDE.md presence & version                    │
│     ├── Git hooks configuration                         │
│     ├── NPM hooks (if applicable)                       │
│     └── .gitignore patterns                            │
│                                                         │
│  3. Structure Healing                                   │
│     ├── Verify .mira directory tree                     │
│     ├── Check permissions                               │
│     └── Create/repair as needed                        │
│                                                         │
│  4. Report Generation                                   │
│     ├── Health score calculation                        │
│     ├── Issues found & fixed                           │
│     └── Recommendations                                │
└─────────────────────────────────────────────────────────┘
```

## 💊 Auto-Repair Mechanisms

### Dependency Repairs
```python
class DependencyManager:
    def auto_install_missing(self):
        """Automatically install missing dependencies"""
        missing = self.detect_missing_packages()
        
        for package in missing:
            try:
                # Try pip install
                subprocess.run([sys.executable, '-m', 'pip', 'install', package])
                logger.info(f"✓ Installed {package}")
            except Exception as e:
                # Fallback strategies
                self.try_alternative_install(package)
```

### Configuration Repairs
```python
class ConfigurationValidator:
    def repair_claude_md(self):
        """Ensure CLAUDE.md exists and is current"""
        claude_path = Path.cwd() / 'CLAUDE.md'
        
        if not claude_path.exists():
            # Inject new CLAUDE.md
            self.inject_claude_md()
        elif self.is_outdated(claude_path):
            # Update while preserving customizations
            self.update_claude_md(claude_path)
    
    def repair_git_hooks(self):
        """Ensure git hooks are properly configured"""
        hooks_dir = Path('.git/hooks')
        
        if not hooks_dir.exists():
            return  # Not a git repository
            
        # Install/update pre-commit hook
        self.install_precommit_hook(hooks_dir)
```

### Structure Repairs
```python
class StructureHealer:
    REQUIRED_STRUCTURE = {
        'databases': {
            'chromadb': {},
            'lightning_vidmem': {
                'codebase': {},
                'conversations': {},
                'private_memory': {}
            }
        },
        'memories': {},
        'cache': {},
        'logs': {},
        'config': {}
    }
    
    def heal_directory_structure(self):
        """Validate and repair directory structure"""
        mira_home = get_mira_home()
        
        def create_structure(base: Path, structure: dict):
            for name, substructure in structure.items():
                path = base / name
                
                if not path.exists():
                    path.mkdir(parents=True)
                    logger.info(f"✓ Created {path}")
                    
                # Check permissions
                if not os.access(path, os.W_OK):
                    self.repair_permissions(path)
                    
                # Recurse for subdirectories
                if substructure:
                    create_structure(path, substructure)
        
        create_structure(mira_home, self.REQUIRED_STRUCTURE)
```

## 🚀 Command Integration

### mira quick
Quick health check command used before development:

```bash
mira quick
```

**Actions**:
1. Fast dependency scan
2. Critical configuration check
3. Essential directory validation
4. Returns health score (0-100)

### mira health
Comprehensive health check with detailed reporting:

```bash
mira health [--verbose] [--fix]
```

**Options**:
- `--verbose`: Detailed output
- `--fix`: Auto-repair found issues

### mira heal
Force complete system healing:

```bash
mira heal [--deep]
```

**Options**:
- `--deep`: Comprehensive repair including cache clearing

## 📊 Health Scoring

Health scores are calculated across three dimensions:

### 1. Dependency Health (0-40 points)
- All packages installed: 40 points
- Missing non-critical: -5 points each
- Missing critical: -20 points each

### 2. Configuration Health (0-30 points)
- CLAUDE.md present & current: 10 points
- Git hooks configured: 10 points
- .gitignore correct: 5 points
- NPM hooks (if applicable): 5 points

### 3. Structure Health (0-30 points)
- All directories present: 20 points
- Proper permissions: 10 points

### Overall Health Status
- **100**: Perfect health ✨
- **90-99**: Excellent health ✓
- **80-89**: Good health
- **70-79**: Fair health ⚠️
- **<70**: Needs attention ❌

## 🛡️ Error Handling

### Graceful Degradation
```python
def handle_repair_failure(component: str, error: Exception):
    """Handle repair failures gracefully"""
    
    # Log but don't crash
    logger.warning(f"Could not auto-repair {component}: {error}")
    
    # Provide manual instructions
    if component == "dependencies":
        print("Manual fix: pip install -r requirements.txt")
    elif component == "permissions":
        print("Manual fix: chmod -R u+rwx .mira")
    
    # Continue with degraded functionality
    return {"status": "degraded", "component": component}
```

### Recovery Strategies
1. **Retry with backoff**: For transient failures
2. **Alternative methods**: Multiple approaches for each repair
3. **Manual fallback**: Clear instructions when auto-repair fails
4. **Partial operation**: System continues with available features

## 🔧 Configuration

### Environment Variables
```bash
# Disable auto-repair
export MIRA_NO_AUTO_REPAIR=1

# Custom health check interval
export MIRA_HEALTH_CHECK_INTERVAL=300  # seconds

# Verbose health logging
export MIRA_HEALTH_VERBOSE=1
```

### Configuration File
```json
{
  "health": {
    "auto_repair": true,
    "check_interval": 300,
    "dependency_check": true,
    "structure_healing": true,
    "configuration_validation": true,
    "alert_threshold": 70
  }
}
```

## 🌟 Integration Points

### 1. Startup Integration
- Health check runs automatically during `mira startup`
- Quick validation before any operations
- Auto-repair attempts for critical issues

### 2. Daemon Integration
- Background health monitoring
- Periodic health checks
- Proactive issue detection

### 3. MCP Integration
- Health status available via MCP
- Remote health monitoring
- Programmatic repair triggers

## 🔮 Future Enhancements

### Planned for MIRA 2.0
1. **Predictive Health**: ML-based failure prediction
2. **Self-Learning Repairs**: Learn from successful repairs
3. **Health History**: Track health trends over time
4. **Custom Health Checks**: User-defined validators
5. **Health Webhooks**: External monitoring integration

---

*The Health Check & Auto-Repair System ensures MIRA maintains itself autonomously, embodying the principle of intelligent automation while preserving system integrity.*