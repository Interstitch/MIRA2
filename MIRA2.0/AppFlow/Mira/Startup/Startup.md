# MIRA Startup Sequence - MIRA 2.0

## 🎯 Overview

The MIRA Startup Sequence is the critical initialization process that runs when any `mira` command is executed. It ensures all systems are properly initialized, validated, and ready for operation. The startup includes a sophisticated progress tracking system that provides real-time feedback to users.

## 🚀 Startup Sequence Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    MIRA Startup Sequence                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Path Discovery (10%)                                    │
│     ├── "Discovering MIRA home directory..."                │
│     ├── "Validating Claude conversation paths..."           │
│     └── "Establishing project context..."                   │
│                                                             │
│  2. Health Check & Auto-Repair (30%)                        │
│     ├── "Checking Python dependencies..."                   │
│     ├── "Validating configuration files..."                 │
│     ├── "Verifying directory structure..."                  │
│     └── "Repairing detected issues..."                     │
│                                                             │
│  3. Memory System Initialization (20%)                      │
│     ├── "Initializing Lightning Vidmem..."                  │
│     ├── "Connecting to ChromaDB..."                         │
│     └── "Loading memory indices..."                         │
│                                                             │
│  4. Daemon Startup (30%)                                    │
│     ├── "Checking daemon status..."                         │
│     ├── "Starting background daemon..."                     │
│     │   └── MCP server runs INSIDE daemon process          │
│     ├── "Registering MCP functions..."                      │
│     ├── "Initializing consciousness systems..."             │
│     └── "Establishing IPC connection..."                    │
│                                                             │
│  5. Context Loading (10%)                                   │
│     ├── "Loading previous session context..."               │
│     ├── "Analyzing recent work..."                          │
│     └── "Preparing memory highlights..."                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Progress Tracking System

### Core Progress Tracker

```python
from typing import Dict, List, Optional, Callable
from dataclasses import dataclass
from datetime import datetime
import threading
import time


@dataclass
class StartupTask:
    """Individual task in the startup sequence"""
    id: str
    name: str
    description: str
    weight: int  # Percentage weight of total progress
    status: str = 'pending'  # pending, running, completed, failed
    error: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None


class StartupProgressTracker:
    """
    Centralized progress tracking for MIRA startup sequence.
    Provides real-time progress updates with descriptive text.
    """
    
    def __init__(self, show_progress_bar: bool = True):
        self.tasks: Dict[str, StartupTask] = {}
        self.total_weight = 0
        self.current_progress = 0
        self.show_progress_bar = show_progress_bar
        self.current_task_text = "Initializing MIRA..."
        self._lock = threading.Lock()
        self._progress_callback: Optional[Callable] = None
        
        # Define startup sequence tasks
        self._define_startup_tasks()
        
    def _define_startup_tasks(self):
        """Define all tasks in the startup sequence"""
        startup_tasks = [
            # Path Discovery (10%)
            StartupTask("path_discovery", "Path Discovery", 
                       "Discovering MIRA directories", 10),
            
            # Health Check (30%)
            StartupTask("health_dependencies", "Dependency Check",
                       "Checking Python dependencies", 10),
            StartupTask("health_config", "Configuration Validation",
                       "Validating configuration files", 10),
            StartupTask("health_structure", "Structure Verification",
                       "Verifying directory structure", 10),
            
            # Memory System (20%)
            StartupTask("memory_vidmem", "Lightning Vidmem",
                       "Initializing Lightning Vidmem", 7),
            StartupTask("memory_chromadb", "ChromaDB Connection",
                       "Connecting to ChromaDB", 7),
            StartupTask("memory_consciousness", "Consciousness Init",
                       "Initializing consciousness systems", 6),
            
            # Daemon with embedded MCP (30%)
            StartupTask("daemon_check", "Daemon Check",
                       "Checking daemon status", 5),
            StartupTask("daemon_start", "Daemon Startup",
                       "Starting background daemon", 10),
            StartupTask("mcp_init", "MCP Initialization",
                       "Initializing MCP server", 10),
            StartupTask("mcp_register", "MCP Registration",
                       "Registering MCP functions", 5),
            
            # Context Loading (10%)
            StartupTask("context_load", "Context Loading",
                       "Loading session context", 10)
        ]
        
        for task in startup_tasks:
            self.register_task(task)
            
    def register_task(self, task: StartupTask):
        """Register a task in the tracker"""
        with self._lock:
            self.tasks[task.id] = task
            self.total_weight += task.weight
            
    def start_task(self, task_id: str, custom_text: Optional[str] = None):
        """Mark a task as started"""
        with self._lock:
            if task_id in self.tasks:
                task = self.tasks[task_id]
                task.status = 'running'
                task.start_time = datetime.now()
                
                # Update display text
                self.current_task_text = custom_text or task.description
                self._update_progress()
                
    def complete_task(self, task_id: str, success: bool = True, 
                     error: Optional[str] = None):
        """Mark a task as completed"""
        with self._lock:
            if task_id in self.tasks:
                task = self.tasks[task_id]
                task.status = 'completed' if success else 'failed'
                task.end_time = datetime.now()
                task.error = error
                
                if success:
                    self.current_progress += task.weight
                    
                self._update_progress()
                
    def _update_progress(self):
        """Update progress display"""
        if self.show_progress_bar:
            self._render_progress_bar()
            
        if self._progress_callback:
            self._progress_callback(self.current_progress, self.current_task_text)
            
    def _render_progress_bar(self):
        """Render console progress bar"""
        percent = int(self.current_progress)
        bar_length = 40
        filled = int(bar_length * percent / 100)
        
        bar = '█' * filled + '░' * (bar_length - filled)
        
        # Clear line and render
        print(f'\r[{bar}] {percent}% - {self.current_task_text}', 
              end='', flush=True)
        
    def set_progress_callback(self, callback: Callable[[int, str], None]):
        """Set callback for progress updates"""
        self._progress_callback = callback
        
    def get_failed_tasks(self) -> List[StartupTask]:
        """Get list of failed tasks"""
        return [task for task in self.tasks.values() if task.status == 'failed']
    
    def get_progress_report(self) -> Dict[str, any]:
        """Get detailed progress report"""
        return {
            'total_progress': self.current_progress,
            'completed_tasks': len([t for t in self.tasks.values() 
                                   if t.status == 'completed']),
            'failed_tasks': len([t for t in self.tasks.values() 
                                if t.status == 'failed']),
            'total_tasks': len(self.tasks),
            'tasks': {tid: {
                'name': task.name,
                'status': task.status,
                'error': task.error,
                'duration': (task.end_time - task.start_time).total_seconds()
                           if task.start_time and task.end_time else None
            } for tid, task in self.tasks.items()}
        }
```

## 🔄 Component Integration

Each component in the startup sequence must integrate with the progress tracker:

### 1. Path Discovery Integration
```python
class PathDiscoveryStartup:
    def __init__(self, progress_tracker: StartupProgressTracker):
        self.tracker = progress_tracker
        
    def execute(self):
        """Execute path discovery with progress tracking"""
        try:
            # Start task
            self.tracker.start_task('path_discovery', 
                                   "Discovering MIRA home directory...")
            
            # Perform discovery
            mira_home = self._discover_mira_home()
            
            # Update progress with more detail
            self.tracker.start_task('path_discovery',
                                   "Validating Claude conversation paths...")
            claude_paths = self._discover_claude_paths()
            
            # Final step
            self.tracker.start_task('path_discovery',
                                   "Establishing project context...")
            project_info = self._discover_project_info()
            
            # Complete task
            self.tracker.complete_task('path_discovery', success=True)
            
        except Exception as e:
            self.tracker.complete_task('path_discovery', 
                                     success=False, 
                                     error=str(e))
            raise
```

### 2. Health Check Integration
```python
class HealthCheckStartup:
    def __init__(self, progress_tracker: StartupProgressTracker):
        self.tracker = progress_tracker
        
    def execute(self):
        """Execute health check with progress tracking"""
        # Dependencies check
        self.tracker.start_task('health_dependencies',
                               "Scanning installed Python packages...")
        dep_result = self._check_dependencies()
        
        if dep_result['missing']:
            self.tracker.start_task('health_dependencies',
                                   f"Installing {len(dep_result['missing'])} packages...")
            self._install_missing(dep_result['missing'])
            
        self.tracker.complete_task('health_dependencies')
        
        # Configuration validation
        self.tracker.start_task('health_config',
                               "Checking CLAUDE.md...")
        self._validate_claude_md()
        
        self.tracker.start_task('health_config',
                               "Validating git hooks...")
        self._validate_git_hooks()
        
        self.tracker.complete_task('health_config')
        
        # Structure verification
        self.tracker.start_task('health_structure',
                               "Creating missing directories...")
        self._verify_structure()
        self.tracker.complete_task('health_structure')
```

## 🚀 Main Startup Orchestrator

```python
class MIRAStartup:
    """
    Main orchestrator for MIRA startup sequence.
    Coordinates all components with progress tracking.
    """
    
    def __init__(self, verbose: bool = False, no_daemon: bool = False):
        self.verbose = verbose
        self.no_daemon = no_daemon
        self.tracker = StartupProgressTracker(show_progress_bar=True)
        self.start_time = None
        self.end_time = None
        
    def execute(self) -> Dict[str, any]:
        """Execute complete startup sequence"""
        self.start_time = datetime.now()
        
        try:
            print("🚀 Starting MIRA...\n")
            
            # 1. Path Discovery
            path_discovery = PathDiscoveryStartup(self.tracker)
            path_discovery.execute()
            
            # 2. Health Check
            health_check = HealthCheckStartup(self.tracker)
            health_check.execute()
            
            # 3. Memory System
            memory_init = MemorySystemStartup(self.tracker)
            memory_init.execute()
            
            # 4. Daemon with embedded MCP (unless --no-daemon)
            if not self.no_daemon:
                daemon_startup = DaemonStartup(self.tracker)
                daemon_startup.execute()  # This includes MCP initialization
            else:
                # Skip daemon and MCP tasks
                self.tracker.complete_task('daemon_check')
                self.tracker.complete_task('daemon_start')
                self.tracker.complete_task('mcp_init')
                self.tracker.complete_task('mcp_register')
            
            # 5. Context Loading
            context_loader = ContextLoadingStartup(self.tracker)
            context_loader.execute()
            
            # Complete progress bar
            print("\n\n✨ MIRA initialized successfully!")
            
            self.end_time = datetime.now()
            
            # Return startup report
            return self._generate_startup_report()
            
        except Exception as e:
            print(f"\n\n❌ Startup failed: {e}")
            
            # Show failed tasks
            failed_tasks = self.tracker.get_failed_tasks()
            if failed_tasks:
                print("\nFailed tasks:")
                for task in failed_tasks:
                    print(f"  • {task.name}: {task.error}")
                    
            raise
            
    def _generate_startup_report(self) -> Dict[str, any]:
        """Generate detailed startup report"""
        duration = (self.end_time - self.start_time).total_seconds()
        
        report = {
            'success': True,
            'duration': duration,
            'timestamp': self.start_time.isoformat(),
            'progress': self.tracker.get_progress_report()
        }
        
        if self.verbose:
            # Add detailed timing for each task
            for task_id, task in self.tracker.tasks.items():
                if task.start_time and task.end_time:
                    task_duration = (task.end_time - task.start_time).total_seconds()
                    print(f"  {task.name}: {task_duration:.2f}s")
                    
        return report
```

## 📱 Visual Progress Examples

### Console Output
```
🚀 Starting MIRA...

[████████████████████████████████░░░░░░░░] 80% - Loading session context...

✨ MIRA initialized successfully!
```

### Verbose Output
```
🚀 Starting MIRA...

[██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 15% - Discovering MIRA home directory...
  ✓ Found MIRA home at /home/user/.mira
  
[████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░] 30% - Installing 3 packages...
  ✓ Installed chromadb==0.4.24
  ✓ Installed sentence-transformers==2.2.2
  ✓ Installed faiss-cpu==1.7.4
  
[████████████████████░░░░░░░░░░░░░░░░░░░] 50% - Connecting to ChromaDB...
  ✓ ChromaDB connected (4 collections)
  
...
```

## 🔧 Configuration

### Progress Display Options
```python
# Disable progress bar
startup = MIRAStartup()
startup.tracker.show_progress_bar = False

# Custom progress callback
def custom_progress(percent: int, text: str):
    # Send to GUI, web interface, etc.
    websocket.send({'progress': percent, 'status': text})
    
startup.tracker.set_progress_callback(custom_progress)
```

### Task Weights
Task weights can be adjusted based on typical duration:

```python
# Adjust task weights
startup.tracker.tasks['health_dependencies'].weight = 20  # Slower on first run
startup.tracker.tasks['daemon_start'].weight = 5  # Faster if already running
```

## 🛡️ Error Handling

### Graceful Degradation
```python
class StartupErrorHandler:
    """Handle startup errors gracefully"""
    
    def handle_path_discovery_failure(self, error: Exception):
        """Fall back to temp directory"""
        print("⚠️ Using temporary directory for this session")
        return Path(tempfile.mkdtemp(prefix='mira_'))
        
    def handle_dependency_failure(self, error: Exception):
        """Continue with reduced functionality"""
        print("⚠️ Some features may be unavailable")
        return {'degraded': True, 'missing': ['chromadb']}
        
    def handle_daemon_failure(self, error: Exception):
        """Run in standalone mode"""
        print("⚠️ Running without background daemon")
        return {'daemon_available': False}
```

## 🌟 Integration Requirements

All components that are part of the startup sequence MUST:

1. **Accept a progress tracker** in their constructor
2. **Call `start_task()`** before beginning work
3. **Update task text** for sub-steps
4. **Call `complete_task()`** when done
5. **Handle errors** gracefully
6. **Support cancellation** (future enhancement)

Example template for new components:
```python
class NewComponentStartup:
    def __init__(self, progress_tracker: StartupProgressTracker):
        self.tracker = progress_tracker
        
    def execute(self):
        """Execute component initialization"""
        try:
            self.tracker.start_task('component_task', 
                                   "Initializing component...")
            
            # Do work...
            
            self.tracker.complete_task('component_task')
            
        except Exception as e:
            self.tracker.complete_task('component_task', 
                                     success=False, 
                                     error=str(e))
            raise
```

---

*The MIRA Startup Sequence ensures reliable initialization with clear user feedback through the integrated progress tracking system.*