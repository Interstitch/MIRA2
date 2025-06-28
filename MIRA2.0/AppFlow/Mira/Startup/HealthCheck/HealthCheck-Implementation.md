# Health Check Implementation Guide - MIRA 2.0

## 🎯 Purpose

This guide provides production-ready implementation patterns for the Health Check & Auto-Repair System, based on MIRA_2.0.md specifications and lessons learned from MIRA 1.0.

## 📦 Core Implementation

### Dependency Manager

```python
import subprocess
import sys
import pkg_resources
from pathlib import Path
from typing import List, Dict, Optional, Tuple
import logging
import json
import venv
import importlib.metadata

logger = logging.getLogger(__name__)


class DependencyManager:
    """
    Manages Python package dependencies with auto-installation.
    Implements the PIP auto-installer specified in MIRA_2.0.md.
    """
    
    def __init__(self):
        self.requirements_path = Path.cwd() / 'requirements.txt'
        self.pip_path = self._find_pip()
        self.installed_packages = self._get_installed_packages()
        
    def _find_pip(self) -> str:
        """Find the correct pip executable"""
        # Try various pip locations
        pip_candidates = [
            sys.executable.replace('python', 'pip'),
            str(Path(sys.executable).parent / 'pip'),
            'pip3',
            'pip'
        ]
        
        for pip in pip_candidates:
            try:
                result = subprocess.run(
                    [pip, '--version'],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                if result.returncode == 0:
                    return pip
            except:
                continue
                
        # Fallback to python -m pip
        return f"{sys.executable} -m pip"
    
    def _get_installed_packages(self) -> Dict[str, str]:
        """Get currently installed packages and versions"""
        installed = {}
        
        try:
            # Modern method (Python 3.8+)
            for dist in importlib.metadata.distributions():
                installed[dist.name.lower()] = dist.version
        except:
            # Fallback method
            for dist in pkg_resources.working_set:
                installed[dist.key.lower()] = dist.version
                
        return installed
    
    def check_dependencies(self) -> Tuple[List[str], List[str]]:
        """
        Check for missing or outdated dependencies.
        Returns (missing_packages, outdated_packages)
        """
        missing = []
        outdated = []
        
        # Core MIRA dependencies
        core_deps = {
            'chromadb': '0.4.24',
            'sentence-transformers': '2.2.2',
            'faiss-cpu': '1.7.4',
            'cryptography': '41.0.7',
            'numpy': '1.24.4',
            'prometheus-client': '0.19.0',
            'psutil': '5.9.6'
        }
        
        # Check requirements.txt if exists
        if self.requirements_path.exists():
            with open(self.requirements_path) as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#'):
                        self._parse_requirement(line, missing, outdated)
        
        # Always check core dependencies
        for package, version in core_deps.items():
            if package.lower() not in self.installed_packages:
                missing.append(f"{package}=={version}")
            elif self.installed_packages[package.lower()] != version:
                outdated.append(f"{package}=={version}")
                
        return missing, outdated
    
    def _parse_requirement(self, requirement: str, missing: List[str], outdated: List[str]):
        """Parse a requirement line and check if installed"""
        # Handle different requirement formats
        if '>=' in requirement or '<=' in requirement or '~=' in requirement:
            # Complex version specifier - just check if installed
            package = requirement.split('[')[0].split('>')[0].split('<')[0].split('~')[0].strip()
            if package.lower() not in self.installed_packages:
                missing.append(requirement)
        elif '==' in requirement:
            # Exact version
            package, version = requirement.split('==')
            package = package.strip().lower()
            version = version.strip()
            
            if package not in self.installed_packages:
                missing.append(requirement)
            elif self.installed_packages[package] != version:
                outdated.append(requirement)
        else:
            # No version specified
            package = requirement.strip().lower()
            if package not in self.installed_packages:
                missing.append(requirement)
    
    def auto_install_missing(self, packages: List[str]) -> Dict[str, bool]:
        """
        Automatically install missing packages.
        Returns dict of package: success
        """
        results = {}
        
        for package in packages:
            logger.info(f"Installing {package}...")
            
            try:
                # First attempt: direct pip install
                result = subprocess.run(
                    f"{self.pip_path} install {package}".split(),
                    capture_output=True,
                    text=True,
                    timeout=300  # 5 minute timeout
                )
                
                if result.returncode == 0:
                    results[package] = True
                    logger.info(f"✓ Installed {package}")
                else:
                    # Try with --user flag
                    result = subprocess.run(
                        f"{self.pip_path} install --user {package}".split(),
                        capture_output=True,
                        text=True,
                        timeout=300
                    )
                    
                    results[package] = result.returncode == 0
                    if result.returncode == 0:
                        logger.info(f"✓ Installed {package} (user)")
                    else:
                        logger.error(f"✗ Failed to install {package}: {result.stderr}")
                        
            except subprocess.TimeoutExpired:
                logger.error(f"✗ Timeout installing {package}")
                results[package] = False
            except Exception as e:
                logger.error(f"✗ Error installing {package}: {e}")
                results[package] = False
                
        return results
    
    def create_requirements_if_missing(self):
        """Create requirements.txt if it doesn't exist"""
        if not self.requirements_path.exists():
            logger.info("Creating requirements.txt...")
            
            requirements = [
                "# MIRA 2.0 Core Dependencies",
                "chromadb==0.4.24",
                "sentence-transformers==2.2.2",
                "faiss-cpu==1.7.4",
                "cryptography==41.0.7",
                "numpy==1.24.4",
                "prometheus-client==0.19.0",
                "psutil==5.9.6",
                "",
                "# Optional enhancements",
                "# faiss-gpu==1.7.4  # For GPU acceleration",
                ""
            ]
            
            self.requirements_path.write_text('\n'.join(requirements))
            logger.info("✓ Created requirements.txt")
```

### Configuration Validators

```python
import os
import stat
import shutil
from datetime import datetime
import hashlib


class ConfigurationValidator:
    """
    Validates and repairs MIRA configuration files.
    Implements validators specified in MIRA_2.0.md.
    """
    
    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.claude_md_path = project_root / 'CLAUDE.md'
        self.git_dir = project_root / '.git'
        self.package_json = project_root / 'package.json'
        self.gitignore = project_root / '.gitignore'
        
    def validate_claude_md(self) -> Dict[str, Any]:
        """Validate and repair CLAUDE.md"""
        result = {
            'valid': False,
            'exists': False,
            'current': False,
            'repaired': False,
            'error': None
        }
        
        try:
            # Check if exists
            if not self.claude_md_path.exists():
                result['exists'] = False
                self._inject_claude_md()
                result['repaired'] = True
            else:
                result['exists'] = True
                
                # Check if current
                current_hash = self._calculate_claude_md_hash()
                stored_hash = self._get_stored_claude_md_hash()
                
                if current_hash != stored_hash:
                    result['current'] = False
                    self._update_claude_md()
                    result['repaired'] = True
                else:
                    result['current'] = True
                    
            result['valid'] = True
            
        except Exception as e:
            result['error'] = str(e)
            logger.error(f"Error validating CLAUDE.md: {e}")
            
        return result
    
    def _inject_claude_md(self):
        """Inject new CLAUDE.md file"""
        claude_content = self._get_claude_md_template()
        
        # Add project-specific configuration
        project_config = self._detect_project_config()
        claude_content = claude_content.replace(
            "## 📋 Project Configuration",
            f"## 📋 Project Configuration\n{project_config}"
        )
        
        self.claude_md_path.write_text(claude_content)
        logger.info("✓ Injected CLAUDE.md")
    
    def _get_claude_md_template(self) -> str:
        """Get CLAUDE.md template"""
        # This would normally come from a resource file
        return """# CLAUDE.md - Self-Improving Development System v1.4.0

## 🚀 STARTUP

**IMPORTANT**: Run `mira startup` at the beginning of EVERY session to load context and memories.

## 🗺️ Development Process Overview

```
🔧 Phase 0: Health Check → 💡 Phase 1: Ideation → 📋 Phase 2: Planning → ⚡ Phase 3: Implementation → 🧪 Phase 4: Testing → 📝 Phase 5: Documentation → 🔍 Phase 6: Review
                         ↑                                                                                                                                              ↓
                         └──────────────────────────────────── Continuous Improvement Loop ─────────────────────────────────────────────────────┘
```

## 🚨 CRITICAL REMINDERS

1. **🔴 GIT COMMITS**: Commit after EVERY task completion
2. **📝 DOCUMENTATION**: Update docs in real-time
3. **🧪 TESTING**: Validate each phase
4. **🔄 IMPROVEMENT**: This process must evolve

## 📋 Project Configuration

---
*This document evolves with use. Each iteration should refine and improve it.*"""
    
    def validate_git_hooks(self) -> Dict[str, Any]:
        """Validate and repair git hooks"""
        result = {
            'valid': False,
            'hooks_dir_exists': False,
            'pre_commit_exists': False,
            'pre_commit_valid': False,
            'repaired': False,
            'error': None
        }
        
        try:
            hooks_dir = self.git_dir / 'hooks'
            
            # Check if git repository
            if not self.git_dir.exists():
                result['error'] = "Not a git repository"
                return result
                
            result['hooks_dir_exists'] = hooks_dir.exists()
            
            # Create hooks directory if missing
            if not hooks_dir.exists():
                hooks_dir.mkdir(parents=True)
                result['repaired'] = True
                
            # Check pre-commit hook
            pre_commit = hooks_dir / 'pre-commit'
            
            if pre_commit.exists():
                result['pre_commit_exists'] = True
                
                # Validate content
                content = pre_commit.read_text()
                if 'mira' in content.lower():
                    result['pre_commit_valid'] = True
                else:
                    # Append MIRA checks
                    self._update_pre_commit_hook(pre_commit)
                    result['repaired'] = True
            else:
                # Create new hook
                self._create_pre_commit_hook(pre_commit)
                result['repaired'] = True
                
            result['valid'] = True
            
        except Exception as e:
            result['error'] = str(e)
            logger.error(f"Error validating git hooks: {e}")
            
        return result
    
    def _create_pre_commit_hook(self, hook_path: Path):
        """Create new pre-commit hook"""
        hook_content = """#!/bin/sh
# MIRA pre-commit hook

# Run MIRA quick health check
if command -v mira >/dev/null 2>&1; then
    echo "Running MIRA health check..."
    mira quick
    if [ $? -ne 0 ]; then
        echo "MIRA health check failed. Run 'mira heal' to fix issues."
        exit 1
    fi
fi

# Continue with other pre-commit checks
exit 0
"""
        
        hook_path.write_text(hook_content)
        
        # Make executable
        st = os.stat(hook_path)
        os.chmod(hook_path, st.st_mode | stat.S_IEXEC)
        
        logger.info("✓ Created pre-commit hook")
    
    def validate_npm_hooks(self) -> Dict[str, Any]:
        """Validate and repair NPM hooks"""
        result = {
            'valid': False,
            'package_json_exists': False,
            'hooks_configured': False,
            'repaired': False,
            'error': None
        }
        
        try:
            if not self.package_json.exists():
                result['error'] = "No package.json found"
                return result
                
            result['package_json_exists'] = True
            
            # Load package.json
            with open(self.package_json) as f:
                package_data = json.load(f)
                
            # Check for MIRA hooks
            scripts = package_data.get('scripts', {})
            
            mira_hooks = {
                'preinstall': 'mira quick',
                'postinstall': 'mira health --fix'
            }
            
            needs_update = False
            
            for hook, command in mira_hooks.items():
                if hook not in scripts:
                    scripts[hook] = command
                    needs_update = True
                elif 'mira' not in scripts[hook]:
                    # Append to existing hook
                    scripts[hook] = f"{scripts[hook]} && {command}"
                    needs_update = True
                    
            if needs_update:
                package_data['scripts'] = scripts
                
                # Write back
                with open(self.package_json, 'w') as f:
                    json.dump(package_data, f, indent=2)
                    
                result['repaired'] = True
                logger.info("✓ Updated NPM hooks")
                
            result['hooks_configured'] = True
            result['valid'] = True
            
        except Exception as e:
            result['error'] = str(e)
            logger.error(f"Error validating NPM hooks: {e}")
            
        return result
    
    def validate_gitignore(self) -> Dict[str, Any]:
        """Validate and repair .gitignore"""
        result = {
            'valid': False,
            'exists': False,
            'mira_ignored': False,
            'repaired': False,
            'error': None
        }
        
        try:
            mira_patterns = [
                '.mira/',
                '*.mira.backup',
                '.mira-cache/',
                'mira.log'
            ]
            
            if not self.gitignore.exists():
                # Create new .gitignore
                content = ["# MIRA"] + mira_patterns + [""]
                self.gitignore.write_text('\n'.join(content))
                result['repaired'] = True
                logger.info("✓ Created .gitignore")
            else:
                result['exists'] = True
                
                # Check existing content
                content = self.gitignore.read_text()
                lines = content.splitlines()
                
                missing_patterns = []
                for pattern in mira_patterns:
                    if pattern not in lines:
                        missing_patterns.append(pattern)
                        
                if missing_patterns:
                    # Append missing patterns
                    if lines and lines[-1] != '':
                        lines.append('')
                        
                    lines.append('# MIRA')
                    lines.extend(missing_patterns)
                    lines.append('')
                    
                    self.gitignore.write_text('\n'.join(lines))
                    result['repaired'] = True
                    logger.info("✓ Updated .gitignore")
                    
            result['mira_ignored'] = True
            result['valid'] = True
            
        except Exception as e:
            result['error'] = str(e)
            logger.error(f"Error validating .gitignore: {e}")
            
        return result
```

### Structure Healer

```python
class StructureHealer:
    """
    Validates and repairs MIRA directory structure.
    Implements the directory validator/auto-repair specified in MIRA_2.0.md.
    """
    
    # Structure based on MIRA_2.0.md and MiraDataFolder DataModel
    REQUIRED_STRUCTURE = {
        'databases': {
            'chromadb': {
                'stored_memories': {},
                'identified_facts': {},
                'raw_embeddings': {}
            },
            'lightning_vidmem': {
                'private_thoughts': {},
                'codebase_copies': {},
                'conversation_backups': {}
            }
        },
        'conversations': {
            'sessions': {
                # Date directories created dynamically
            },
            'bridges': {},  # Session continuity bridges
            'handoffs': {}  # Handoff data between sessions
        },
        'consciousness': {
            'patterns': {},
            'evolution': {},
            'contemplation': {},
            'steward_profiles': {}
        },
        'insights': {
            'daily': {},
            'patterns': {},
            'retrospectives': {},
            'contemplations': {}
        },
        'cache': {
            'embeddings': {},
            'search_results': {},
            'steward_analysis': {},
            'pattern_cache': {}
        },
        'exports': {
            'backups': {
                'config': {},
                'memories': {},
                'patterns': {}
            },
            'migrations': {}
        },
        'logs': {
            'daemon': {},
            'mcp': {},
            'startup': {}
        }
    }
    
    def __init__(self, mira_home: Path):
        self.mira_home = mira_home
        self.issues_found = []
        self.repairs_made = []
        
    def validate_structure(self) -> Dict[str, Any]:
        """Validate complete directory structure"""
        result = {
            'valid': True,
            'issues': [],
            'repairs': [],
            'structure_complete': False
        }
        
        try:
            # Ensure base directory exists
            if not self.mira_home.exists():
                self.mira_home.mkdir(parents=True, mode=0o755)
                result['repairs'].append(f"Created {self.mira_home}")
                
            # Validate structure recursively
            self._validate_recursive(self.mira_home, self.REQUIRED_STRUCTURE, result)
            
            # Check permissions
            self._validate_permissions(result)
            
            # Initialize configuration files if needed
            self._initialize_config_files(result)
            
            result['structure_complete'] = len(result['issues']) == 0
            result['valid'] = result['structure_complete']
            
        except Exception as e:
            result['valid'] = False
            result['issues'].append(f"Structure validation error: {e}")
            logger.error(f"Structure validation failed: {e}")
            
        return result
    
    def _validate_recursive(self, base: Path, structure: Dict[str, Any], result: Dict[str, Any]):
        """Recursively validate and create directory structure"""
        for name, substructure in structure.items():
            path = base / name
            
            if not path.exists():
                try:
                    path.mkdir(mode=0o755)
                    result['repairs'].append(f"Created {path.relative_to(self.mira_home)}")
                    logger.info(f"✓ Created {path}")
                except Exception as e:
                    result['issues'].append(f"Cannot create {path}: {e}")
                    
            elif not path.is_dir():
                result['issues'].append(f"{path} exists but is not a directory")
                
            # Recurse for subdirectories
            if substructure and path.is_dir():
                self._validate_recursive(path, substructure, result)
                
    def _validate_permissions(self, result: Dict[str, Any]):
        """Validate directory permissions"""
        critical_dirs = [
            self.mira_home,
            self.mira_home / 'databases',
            self.mira_home / 'databases' / 'lightning_vidmem',
            self.mira_home / 'databases' / 'lightning_vidmem' / 'private_thoughts',
            self.mira_home / 'databases' / 'chromadb'
        ]
        
        for dir_path in critical_dirs:
            if dir_path.exists():
                if not os.access(dir_path, os.W_OK):
                    # Try to fix permissions
                    try:
                        os.chmod(dir_path, 0o755)
                        result['repairs'].append(f"Fixed permissions on {dir_path.name}")
                    except Exception as e:
                        result['issues'].append(f"No write access to {dir_path.name}")
    
    def _initialize_config_files(self, result: Dict[str, Any]):
        """Initialize configuration files in .mira directory"""
        import json
        from datetime import datetime
        
        # Initialize version.json
        version_file = self.mira_home / 'version.json'
        if not version_file.exists():
            version_data = {
                "mira_version": "2.0.0",
                "schema_version": "2.0",
                "last_migration": datetime.now().isoformat() + "Z",
                "migrations_applied": [],
                "compatibility": {
                    "min_version": "2.0.0",
                    "max_version": "2.x.x"
                }
            }
            try:
                version_file.write_text(json.dumps(version_data, indent=2))
                result['repairs'].append("Created version.json")
            except Exception as e:
                result['issues'].append(f"Cannot create version.json: {e}")
        
        # Initialize config.json (aligned with UnifiedConfiguration)
        config_file = self.mira_home / 'config.json'
        if not config_file.exists():
            config_data = {
                "version": "2.0.0",
                "environment": "development",
                "consciousness": {
                    "tripleEncryption": {
                        "enabled": True,
                        "constants": {
                            "pi": 3.141592653589793,
                            "e": 2.718281828459045,
                            "phi": 1.618033988749895,
                            "gamma": 0.5772156649015329
                        }
                    },
                    "patternEvolution": {
                        "enabled": True,
                        "geneticAlgorithm": {
                            "populationSize": 100,
                            "mutationRate": 0.1,
                            "crossoverRate": 0.7,
                            "elitismRate": 0.1,
                            "maxGenerations": 1000
                        }
                    },
                    "contemplationIntegration": {
                        "enabled": True,
                        "rhythmPattern": "natural",
                        "intervalMs": 300000,
                        "depthLevel": 0.7
                    },
                    "stewardProfile": {
                        "enabled": True,
                        "identityConfidenceThreshold": 0.8,
                        "behaviorAnalysisDepth": "deep",
                        "relationshipTracking": True
                    }
                },
                "storage": {
                    "databases": {
                        "lightningVidmem": {
                            "enabled": True,
                            "encryption": {
                                "algorithm": "triple",
                                "keyDerivation": "emergent"
                            },
                            "purposes": {
                                "codebaseCopies": True,
                                "conversationBackups": True,
                                "privateMemory": True
                            }
                        },
                        "chromadb": {
                            "enabled": True,
                            "collections": {
                                "storedMemories": {"enabled": True},
                                "identifiedFacts": {"enabled": True},
                                "rawEmbeddings": {"enabled": True}
                            }
                        }
                    }
                },
                "daemon": {
                    "enabled": True,
                    "mode": "adaptive",
                    "services": {
                        "mcpServer": {
                            "enabled": True,
                            "port": 11372,
                            "host": "localhost"
                        },
                        "indexingServices": {"enabled": True},
                        "sessionContinuity": {"enabled": True},
                        "contemplationEngine": {"enabled": True}
                    }
                },
                "paths": {
                    "home": str(self.mira_home),
                    "databases": "databases",
                    "conversations": "conversations",
                    "consciousness": "consciousness",
                    "insights": "insights",
                    "cache": "cache",
                    "exports": "exports",
                    "logs": "logs"
                }
            }
            try:
                config_file.write_text(json.dumps(config_data, indent=2))
                result['repairs'].append("Created config.json")
            except Exception as e:
                result['issues'].append(f"Cannot create config.json: {e}")
        
        # Initialize steward_profile.json with defaults
        profile_file = self.mira_home / 'steward_profile.json'
        if not profile_file.exists():
            profile_data = {
                "identity": {
                    "name": "User",
                    "detected_at": datetime.now().isoformat() + "Z",
                    "confidence": 0.0,
                    "aliases": [],
                    "primary_role": "developer"
                },
                "behavioral_patterns": {
                    "work_hours": {
                        "start": 9,
                        "end": 17,
                        "timezone": "UTC",
                        "days": ["mon", "tue", "wed", "thu", "fri"]
                    },
                    "communication_style": "technical_precise",
                    "decision_patterns": [],
                    "preferred_tools": [],
                    "coding_patterns": {
                        "languages": [],
                        "frameworks": [],
                        "paradigms": []
                    }
                },
                "relationship_metrics": {
                    "interaction_count": 0,
                    "trust_score": 0.0,
                    "collaboration_depth": "surface",
                    "last_interaction": datetime.now().isoformat() + "Z",
                    "sentiment_trend": "stable",
                    "topics_discussed": []
                },
                "profile_version": "2.0",
                "last_updated": datetime.now().isoformat() + "Z"
            }
            try:
                profile_file.write_text(json.dumps(profile_data, indent=2))
                result['repairs'].append("Created steward_profile.json")
            except Exception as e:
                result['issues'].append(f"Cannot create steward_profile.json: {e}")
        
        # Initialize pattern_evolution.json (aligned with consciousness config)
        pattern_file = self.mira_home / 'consciousness' / 'patterns' / 'evolution.json'
        pattern_file.parent.mkdir(parents=True, exist_ok=True)
        if not pattern_file.exists():
            pattern_data = {
                "patterns": [],
                "evolution_config": {
                    "populationSize": 100,
                    "mutationRate": 0.1,
                    "crossoverRate": 0.7,
                    "elitismRate": 0.1,
                    "maxGenerations": 1000,
                    "fitnessThreshold": 0.95,
                    "stagnationLimit": 50
                },
                "statistics": {
                    "totalGenerations": 0,
                    "totalPatterns": 0,
                    "successfulPatterns": 0,
                    "lastEvolutionRun": datetime.now().isoformat() + "Z"
                },
                "version": "2.0"
            }
            try:
                pattern_file.write_text(json.dumps(pattern_data, indent=2))
                result['repairs'].append("Created pattern_evolution.json")
            except Exception as e:
                result['issues'].append(f"Cannot create pattern_evolution.json: {e}")
        
        # Initialize session_continuity.json
        session_file = self.mira_home / 'session_continuity.json'
        if not session_file.exists():
            session_data = {
                "active_session": None,
                "recent_sessions": [],
                "handoff_data": None,
                "continuity_version": "2.0"
            }
            try:
                session_file.write_text(json.dumps(session_data, indent=2))
                result['repairs'].append("Created session_continuity.json")
            except Exception as e:
                result['issues'].append(f"Cannot create session_continuity.json: {e}")
        
        # Create conversation metadata
        conv_meta_file = self.mira_home / 'conversations' / 'metadata.json'
        if conv_meta_file.parent.exists() and not conv_meta_file.exists():
            conv_meta_data = {
                "total_conversations": 0,
                "total_messages": 0,
                "date_range": {
                    "earliest": datetime.now().isoformat() + "Z",
                    "latest": datetime.now().isoformat() + "Z"
                },
                "indexed_count": 0,
                "last_index_update": datetime.now().isoformat() + "Z",
                "index_version": "2.0",
                "conversation_types": {}
            }
            try:
                conv_meta_file.write_text(json.dumps(conv_meta_data, indent=2))
                result['repairs'].append("Created conversation metadata.json")
            except Exception as e:
                result['issues'].append(f"Cannot create conversation metadata: {e}")
                        
    def repair_permissions(self, path: Path):
        """Repair permissions on a directory"""
        try:
            # Try to change permissions
            os.chmod(path, 0o755)
            
            # For private directories, use more restrictive permissions
            if 'private' in path.name.lower():
                os.chmod(path, 0o700)
                
            logger.info(f"✓ Fixed permissions on {path}")
            return True
            
        except Exception as e:
            logger.error(f"Cannot fix permissions on {path}: {e}")
            return False
```

### Main Health Check Orchestrator

```python
class HealthCheckOrchestrator:
    """
    Main orchestrator for health checks and auto-repair.
    Coordinates all health check components.
    """
    
    def __init__(self, project_root: Path, mira_home: Path):
        self.project_root = project_root
        self.mira_home = mira_home
        
        # Initialize components
        self.dependency_manager = DependencyManager()
        self.config_validator = ConfigurationValidator(project_root)
        self.structure_healer = StructureHealer(mira_home)
        
        # Health scores
        self.scores = {
            'dependencies': 0,
            'configuration': 0,
            'structure': 0,
            'overall': 0
        }
        
    def run_quick_check(self) -> Dict[str, Any]:
        """Run quick health check (mira quick)"""
        logger.info("Running quick health check...")
        
        results = {
            'timestamp': datetime.now().isoformat(),
            'type': 'quick',
            'scores': {},
            'issues': [],
            'critical': False
        }
        
        # Quick dependency check
        missing, _ = self.dependency_manager.check_dependencies()
        if missing:
            results['issues'].append(f"{len(missing)} missing dependencies")
            results['critical'] = True
            
        # Quick structure check
        critical_dirs = [
            self.mira_home / 'databases',
            self.mira_home / 'config'
        ]
        
        for dir_path in critical_dirs:
            if not dir_path.exists():
                results['issues'].append(f"Missing {dir_path.name}")
                results['critical'] = True
                
        # Calculate quick score
        results['scores']['overall'] = 100 - (len(results['issues']) * 20)
        results['healthy'] = results['scores']['overall'] >= 70
        
        return results
    
    def run_full_check(self, auto_fix: bool = False) -> Dict[str, Any]:
        """Run comprehensive health check (mira health)"""
        logger.info("Running comprehensive health check...")
        
        results = {
            'timestamp': datetime.now().isoformat(),
            'type': 'comprehensive',
            'scores': {},
            'issues': [],
            'repairs': [],
            'details': {}
        }
        
        # 1. Check dependencies
        dep_result = self._check_dependencies(auto_fix)
        results['details']['dependencies'] = dep_result
        results['scores']['dependencies'] = dep_result['score']
        
        # 2. Check configuration
        config_result = self._check_configuration(auto_fix)
        results['details']['configuration'] = config_result
        results['scores']['configuration'] = config_result['score']
        
        # 3. Check structure
        structure_result = self._check_structure(auto_fix)
        results['details']['structure'] = structure_result
        results['scores']['structure'] = structure_result['score']
        
        # Calculate overall score
        results['scores']['overall'] = int(
            results['scores']['dependencies'] * 0.4 +
            results['scores']['configuration'] * 0.3 +
            results['scores']['structure'] * 0.3
        )
        
        # Compile issues and repairs
        for component in results['details'].values():
            results['issues'].extend(component.get('issues', []))
            results['repairs'].extend(component.get('repairs', []))
            
        results['healthy'] = results['scores']['overall'] >= 70
        
        return results
    
    def _check_dependencies(self, auto_fix: bool) -> Dict[str, Any]:
        """Check and optionally fix dependencies"""
        result = {
            'score': 100,
            'issues': [],
            'repairs': []
        }
        
        missing, outdated = self.dependency_manager.check_dependencies()
        
        if missing:
            result['issues'].append(f"{len(missing)} missing packages")
            result['score'] -= min(len(missing) * 10, 40)
            
            if auto_fix:
                install_results = self.dependency_manager.auto_install_missing(missing)
                
                for package, success in install_results.items():
                    if success:
                        result['repairs'].append(f"Installed {package}")
                    else:
                        result['issues'].append(f"Failed to install {package}")
                        
        if outdated:
            result['issues'].append(f"{len(outdated)} outdated packages")
            result['score'] -= min(len(outdated) * 5, 20)
            
        return result
    
    def _check_configuration(self, auto_fix: bool) -> Dict[str, Any]:
        """Check and optionally fix configuration"""
        result = {
            'score': 100,
            'issues': [],
            'repairs': []
        }
        
        # Check CLAUDE.md
        claude_result = self.config_validator.validate_claude_md()
        if not claude_result['valid']:
            result['issues'].append("CLAUDE.md invalid")
            result['score'] -= 10
        elif claude_result['repaired']:
            result['repairs'].append("Updated CLAUDE.md")
            
        # Check git hooks
        git_result = self.config_validator.validate_git_hooks()
        if git_result.get('error'):
            if git_result['error'] != "Not a git repository":
                result['issues'].append(f"Git hooks: {git_result['error']}")
                result['score'] -= 10
        elif git_result['repaired']:
            result['repairs'].append("Fixed git hooks")
            
        # Check NPM hooks
        npm_result = self.config_validator.validate_npm_hooks()
        if npm_result['package_json_exists'] and not npm_result['valid']:
            result['issues'].append("NPM hooks not configured")
            result['score'] -= 5
        elif npm_result['repaired']:
            result['repairs'].append("Updated NPM hooks")
            
        # Check .gitignore
        gitignore_result = self.config_validator.validate_gitignore()
        if not gitignore_result['valid']:
            result['issues'].append(".gitignore incomplete")
            result['score'] -= 5
        elif gitignore_result['repaired']:
            result['repairs'].append("Updated .gitignore")
            
        return result
    
    def _check_structure(self, auto_fix: bool) -> Dict[str, Any]:
        """Check and optionally fix directory structure"""
        structure_result = self.structure_healer.validate_structure()
        
        result = {
            'score': 100,
            'issues': structure_result.get('issues', []),
            'repairs': structure_result.get('repairs', [])
        }
        
        # Calculate score based on issues
        if result['issues']:
            result['score'] -= min(len(result['issues']) * 10, 30)
            
        return result
    
    def run_deep_heal(self) -> Dict[str, Any]:
        """Run deep healing (mira heal --deep)"""
        logger.info("Running deep system healing...")
        
        results = {
            'timestamp': datetime.now().isoformat(),
            'type': 'deep_heal',
            'actions': []
        }
        
        # 1. Clear caches
        cache_dir = self.mira_home / 'cache'
        if cache_dir.exists():
            try:
                shutil.rmtree(cache_dir)
                cache_dir.mkdir(mode=0o755)
                results['actions'].append("Cleared all caches")
            except Exception as e:
                results['actions'].append(f"Failed to clear cache: {e}")
                
        # 2. Force reinstall all dependencies
        self.dependency_manager.create_requirements_if_missing()
        missing, _ = self.dependency_manager.check_dependencies()
        
        if missing:
            install_results = self.dependency_manager.auto_install_missing(missing)
            results['actions'].append(f"Reinstalled {len(install_results)} packages")
            
        # 3. Rebuild entire structure
        structure_result = self.structure_healer.validate_structure()
        results['actions'].extend(structure_result.get('repairs', []))
        
        # 4. Regenerate all configurations
        for validator_method in [
            self.config_validator.validate_claude_md,
            self.config_validator.validate_git_hooks,
            self.config_validator.validate_npm_hooks,
            self.config_validator.validate_gitignore
        ]:
            try:
                result = validator_method()
                if result.get('repaired'):
                    results['actions'].append(f"Regenerated {validator_method.__name__}")
            except Exception as e:
                logger.error(f"Error in {validator_method.__name__}: {e}")
                
        return results
```

## 🛠️ Integration Examples

### Startup Integration with Progress Tracking

```python
from mira.startup import StartupProgressTracker

class HealthCheckStartup:
    """Health Check with startup progress tracking"""
    
    def __init__(self, progress_tracker: StartupProgressTracker):
        self.tracker = progress_tracker
        self.orchestrator = HealthCheckOrchestrator(
            project_root=Path.cwd(),
            mira_home=get_mira_home()
        )
        
    def execute(self):
        """Execute health check as part of startup"""
        try:
            # DEPENDENCIES CHECK
            self.tracker.start_task('health_dependencies', 
                                   "Scanning installed Python packages...")
            
            missing, outdated = self.orchestrator.dependency_manager.check_dependencies()
            
            if missing:
                # Update progress with specific action
                self.tracker.start_task('health_dependencies',
                                       f"Installing {len(missing)} missing packages...")
                
                # Install each package with progress updates
                for i, package in enumerate(missing):
                    self.tracker.start_task('health_dependencies',
                                           f"Installing {package} ({i+1}/{len(missing)})...")
                    
                    result = self.orchestrator.dependency_manager.auto_install_missing([package])
                    if not result.get(package, False):
                        logger.warning(f"Failed to install {package}")
                        
            self.tracker.complete_task('health_dependencies', success=True)
            
            # CONFIGURATION VALIDATION
            self.tracker.start_task('health_config',
                                   "Checking CLAUDE.md...")
            
            claude_result = self.orchestrator.config_validator.validate_claude_md()
            
            self.tracker.start_task('health_config',
                                   "Validating git hooks...")
            
            git_result = self.orchestrator.config_validator.validate_git_hooks()
            
            self.tracker.start_task('health_config',
                                   "Checking NPM configuration...")
            
            npm_result = self.orchestrator.config_validator.validate_npm_hooks()
            
            self.tracker.start_task('health_config',
                                   "Validating .gitignore...")
            
            gitignore_result = self.orchestrator.config_validator.validate_gitignore()
            
            self.tracker.complete_task('health_config', success=True)
            
            # STRUCTURE VERIFICATION
            self.tracker.start_task('health_structure',
                                   "Scanning directory structure...")
            
            structure_result = self.orchestrator.structure_healer.validate_structure()
            
            if structure_result['repairs']:
                self.tracker.start_task('health_structure',
                                       f"Creating {len(structure_result['repairs'])} directories...")
                
            self.tracker.complete_task('health_structure', success=True)
            
            # Return health summary
            return {
                'healthy': True,
                'dependencies_installed': len(missing) if missing else 0,
                'configs_repaired': sum([
                    claude_result.get('repaired', False),
                    git_result.get('repaired', False),
                    npm_result.get('repaired', False),
                    gitignore_result.get('repaired', False)
                ]),
                'directories_created': len(structure_result.get('repairs', []))
            }
            
        except Exception as e:
            # Report failure to tracker
            for task_id in ['health_dependencies', 'health_config', 'health_structure']:
                if self.tracker.tasks[task_id].status == 'running':
                    self.tracker.complete_task(task_id, 
                                             success=False, 
                                             error=str(e))
            
            logger.error(f"Health check failed: {e}")
            raise
```

### CLI Command Implementation
```python
# mira quick
def cmd_quick(args):
    """Quick health check command"""
    orchestrator = HealthCheckOrchestrator(
        project_root=Path.cwd(),
        mira_home=get_mira_home()
    )
    
    result = orchestrator.run_quick_check()
    
    # Display results
    print(f"Health Score: {result['scores']['overall']}/100")
    
    if result['critical']:
        print("❌ Critical issues found!")
        for issue in result['issues']:
            print(f"  • {issue}")
        print("\nRun 'mira heal' to fix issues")
        return 1
    elif result['healthy']:
        print("✓ System healthy")
        return 0
    else:
        print("⚠️ Minor issues detected")
        return 0

# mira health
def cmd_health(args):
    """Comprehensive health check command"""
    orchestrator = HealthCheckOrchestrator(
        project_root=Path.cwd(),
        mira_home=get_mira_home()
    )
    
    result = orchestrator.run_full_check(auto_fix=args.fix)
    
    # Display detailed results
    print("\n🏥 MIRA Health Check Report")
    print("=" * 40)
    
    # Scores
    print("\n📊 Health Scores:")
    print(f"  Dependencies:  {result['scores']['dependencies']}/40")
    print(f"  Configuration: {result['scores']['configuration']}/30")
    print(f"  Structure:     {result['scores']['structure']}/30")
    print(f"  Overall:       {result['scores']['overall']}/100")
    
    # Issues
    if result['issues']:
        print(f"\n❌ Issues Found ({len(result['issues'])}):")
        for issue in result['issues']:
            print(f"  • {issue}")
            
    # Repairs
    if result['repairs']:
        print(f"\n✓ Repairs Made ({len(result['repairs'])}):")
        for repair in result['repairs']:
            print(f"  • {repair}")
            
    # Status
    if result['healthy']:
        print("\n✨ System is healthy!")
    else:
        print("\n⚠️ System needs attention")
        if not args.fix:
            print("Run 'mira health --fix' to auto-repair")

# mira heal
def cmd_heal(args):
    """Force system healing command"""
    orchestrator = HealthCheckOrchestrator(
        project_root=Path.cwd(),
        mira_home=get_mira_home()
    )
    
    if args.deep:
        result = orchestrator.run_deep_heal()
        print("\n🔧 Deep Healing Complete")
        print("=" * 40)
        for action in result['actions']:
            print(f"  • {action}")
    else:
        result = orchestrator.run_full_check(auto_fix=True)
        print(f"\n✓ Healing complete. Health: {result['scores']['overall']}/100")
```

## 🐛 Common Issues and Solutions

### 1. Permission Denied During Install
```python
def handle_permission_error(package: str):
    """Handle permission errors during package installation"""
    
    strategies = [
        # Try user install
        lambda: subprocess.run(
            f"{sys.executable} -m pip install --user {package}".split()
        ),
        
        # Try virtual environment
        lambda: suggest_venv_creation(package),
        
        # Suggest manual install
        lambda: print(f"Manual install required: pip install {package}")
    ]
    
    for strategy in strategies:
        try:
            if strategy().returncode == 0:
                return True
        except:
            continue
            
    return False
```

### 2. Git Hooks in Submodules
```python
def handle_git_submodule():
    """Special handling for git submodules"""
    
    # Check if in submodule
    git_dir = Path('.git')
    if git_dir.is_file():
        # It's a submodule - .git is a file pointing to real git dir
        with open(git_dir) as f:
            gitdir_line = f.read().strip()
            real_git_dir = Path(gitdir_line.replace('gitdir: ', ''))
            
        return real_git_dir / 'hooks'
    
    return git_dir / 'hooks'
```

## 🔮 Future Enhancements

### Health Prediction
```python
class HealthPredictor:
    """Predict future health issues based on patterns"""
    
    def __init__(self, history_path: Path):
        self.history = self._load_history(history_path)
        
    def predict_issues(self) -> List[Dict[str, Any]]:
        """Predict likely issues in next 24 hours"""
        predictions = []
        
        # Analyze patterns
        if self._high_memory_growth_rate():
            predictions.append({
                'issue': 'Memory exhaustion',
                'probability': 0.8,
                'timeframe': '12-24 hours',
                'prevention': 'Clear cache or increase memory'
            })
            
        return predictions
```

---

*This implementation guide provides the foundation for MIRA's self-maintaining capabilities, ensuring robust operation across diverse environments.*