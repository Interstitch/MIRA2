# Health Check Quick Reference - MIRA 2.0

## 🚀 Quick Commands

### Basic Health Operations
```bash
# Quick health check (before development)
mira quick

# Full health check with report
mira health

# Auto-repair issues
mira health --fix

# Force healing
mira heal

# Deep system healing
mira heal --deep
```

## 📊 Health Scoring System

### Score Breakdown (100 points total)
- **Dependencies**: 40 points
  - All installed: 40 points
  - Missing package: -10 points each (max -40)
  - Outdated package: -5 points each (max -20)

- **Configuration**: 30 points
  - CLAUDE.md valid: 10 points
  - Git hooks configured: 10 points
  - .gitignore correct: 5 points
  - NPM hooks (if applicable): 5 points

- **Structure**: 30 points
  - All directories present: 20 points
  - Proper permissions: 10 points

### Health Status
- **100**: Perfect health ✨
- **90-99**: Excellent ✓
- **80-89**: Good
- **70-79**: Fair ⚠️
- **<70**: Needs attention ❌

## 🔧 Auto-Repair Actions

### Dependency Repairs
- Auto-install missing packages
- Create requirements.txt if missing
- Try user install on permission errors
- Suggest venv creation as fallback

### Configuration Repairs
- Inject/update CLAUDE.md
- Create/update git pre-commit hooks
- Add NPM hooks to package.json
- Update .gitignore patterns

### Structure Repairs
- Create missing directories
- Fix directory permissions
- Ensure write access to critical paths

## 📁 Critical Directories

```
.mira/
├── databases/              # Must be writable
│   ├── lightning_vidmem/   # Each subdirectory created
│   │   ├── codebase/
│   │   ├── conversations/
│   │   └── private_memory/ # 700 permissions
│   └── chromadb/
│       ├── storedmemories/
│       └── identifiedfacts/
├── config/                 # Configuration storage
├── logs/                   # System logs
└── cache/                  # Temporary data
```

## 🛡️ Core Dependencies

### Always Required
```txt
chromadb==0.4.24
sentence-transformers==2.2.2
faiss-cpu==1.7.4
cryptography==41.0.7
numpy==1.24.4
prometheus-client==0.19.0
psutil==5.9.6
```

### Optional Enhancements
```txt
faiss-gpu==1.7.4  # GPU acceleration
```

## 🔍 Health Check Components

### 1. Dependency Manager
- Detects missing packages
- Auto-installs with pip
- Handles permission errors
- Creates requirements.txt

### 2. Configuration Validator
- **CLAUDE.md**: Development instructions
- **Git hooks**: Pre-commit checks
- **NPM hooks**: Node.js lifecycle
- **.gitignore**: MIRA patterns

### 3. Structure Healer
- Creates directory tree
- Validates permissions
- Repairs access issues
- Ensures completeness

## ⚡ Quick Troubleshooting

### Permission Denied
```bash
# Try user install
pip install --user <package>

# Or use virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
```

### Not a Git Repository
```bash
# Initialize git first
git init

# Then run health check
mira health --fix
```

### Missing Write Access
```bash
# Fix permissions manually
chmod -R u+rwx ~/.mira

# Or specify different location
export MIRA_HOME=/writable/path/.mira
```

## 🔧 Environment Variables

```bash
# Disable auto-repair
export MIRA_NO_AUTO_REPAIR=1

# Custom check interval (seconds)
export MIRA_HEALTH_CHECK_INTERVAL=300

# Verbose health logging
export MIRA_HEALTH_VERBOSE=1

# Custom MIRA home
export MIRA_HOME=/custom/path/.mira
```

## 📝 Configuration Files

### .mira/config/health.json
```json
{
  "auto_repair": true,
  "check_interval": 300,
  "dependency_check": true,
  "structure_healing": true,
  "configuration_validation": true,
  "alert_threshold": 70
}
```

### Git Pre-commit Hook
```bash
#!/bin/sh
# Added by MIRA
if command -v mira >/dev/null 2>&1; then
    mira quick || exit 1
fi
```

### NPM Hooks (package.json)
```json
{
  "scripts": {
    "preinstall": "mira quick",
    "postinstall": "mira health --fix"
  }
}
```

## 🚨 Common Issues

### 1. Import Error for ChromaDB
**Cause**: Missing dependencies
**Fix**: `mira heal` or `pip install chromadb==0.4.24`

### 2. CLAUDE.md Out of Date
**Cause**: MIRA version update
**Fix**: `mira health --fix` auto-updates

### 3. Directory Permission Errors
**Cause**: Wrong ownership
**Fix**: `sudo chown -R $USER ~/.mira`

### 4. Git Hooks Not Running
**Cause**: Not executable
**Fix**: `chmod +x .git/hooks/pre-commit`

## 📈 Health Monitoring

### Check Health Status
```python
# Via MCP
result = mcp_mira_health_status()
print(f"Score: {result['score']}/100")

# Via CLI
mira health --json
```

### Health History
```bash
# View health trends
cat ~/.mira/logs/health.log | grep "overall"

# Recent issues
cat ~/.mira/logs/health.log | grep "issue"
```

## 🎯 Best Practices

1. **Run `mira quick` before development**
2. **Use `mira health --fix` weekly**
3. **Run `mira heal --deep` monthly**
4. **Check logs on repeated failures**
5. **Keep dependencies updated**

---

**Remember**: A healthy MIRA is a happy MIRA! Regular health checks prevent issues.