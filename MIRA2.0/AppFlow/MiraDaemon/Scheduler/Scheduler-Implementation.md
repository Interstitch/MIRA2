# Scheduler Implementation Guide - MIRA 2.0

## 🎯 Purpose

This guide provides production-ready implementation patterns for the Background Scheduler & Analysis Engine, implementing the specifications from MIRA_2.0.md.

## 📦 Core Implementation

### Task Queue Manager

```python
import asyncio
import heapq
import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Callable, Any, Set
from datetime import datetime, timedelta
from enum import Enum
import logging
import psutil

logger = logging.getLogger(__name__)


class TaskPriority(Enum):
    CRITICAL = 1
    HIGH = 2
    NORMAL = 3
    LOW = 4
    DEFERRED = 5


@dataclass
class ScheduledTask:
    """Represents a scheduled analysis task"""
    id: str
    name: str
    handler: Callable
    priority: TaskPriority
    created_at: datetime = field(default_factory=datetime.now)
    deadline: Optional[datetime] = None
    user_triggered: bool = False
    retry_count: int = 0
    max_retries: int = 3
    dependencies: Set[str] = field(default_factory=set)
    result: Optional[Any] = None
    error: Optional[str] = None
    
    def __lt__(self, other):
        """For priority queue comparison"""
        return self.priority.value < other.priority.value


class TaskQueueManager:
    """
    Manages multiple task queues with different priorities
    """
    
    def __init__(self):
        self.priority_queue: List[ScheduledTask] = []
        self.regular_queue: List[ScheduledTask] = []
        self.deferred_queue: List[ScheduledTask] = []
        self.periodic_tasks: Dict[str, PeriodicTask] = {}
        self.running_tasks: Dict[str, ScheduledTask] = {}
        self.completed_tasks: Dict[str, ScheduledTask] = {}
        self._lock = asyncio.Lock()
        
    async def add_task(self, task: ScheduledTask):
        """Add task to appropriate queue"""
        async with self._lock:
            # Check dependencies
            if task.dependencies:
                unmet_deps = task.dependencies - set(self.completed_tasks.keys())
                if unmet_deps:
                    logger.info(f"Deferring task {task.id} due to unmet dependencies: {unmet_deps}")
                    heapq.heappush(self.deferred_queue, task)
                    return
                    
            # Route to appropriate queue
            if task.priority == TaskPriority.CRITICAL:
                heapq.heappush(self.priority_queue, task)
            elif task.priority == TaskPriority.DEFERRED:
                heapq.heappush(self.deferred_queue, task)
            else:
                heapq.heappush(self.regular_queue, task)
                
            logger.debug(f"Added task {task.id} to {task.priority.name} queue")
            
    async def get_next_task(self) -> Optional[ScheduledTask]:
        """Get next task based on priority and system load"""
        async with self._lock:
            # Check system load
            cpu_percent = psutil.cpu_percent(interval=0.1)
            memory_percent = psutil.virtual_memory().percent
            
            # Adaptive task selection based on load
            if cpu_percent > 80 or memory_percent > 85:
                # Only critical tasks under high load
                if self.priority_queue:
                    return heapq.heappop(self.priority_queue)
                return None
                
            # Normal operation - check queues in order
            if self.priority_queue:
                return heapq.heappop(self.priority_queue)
                
            if self.regular_queue:
                return heapq.heappop(self.regular_queue)
                
            # Check deferred queue for ready tasks
            ready_deferred = []
            while self.deferred_queue:
                task = heapq.heappop(self.deferred_queue)
                
                # Check if dependencies met
                if task.dependencies.issubset(set(self.completed_tasks.keys())):
                    return task
                else:
                    ready_deferred.append(task)
                    
            # Put back unready deferred tasks
            for task in ready_deferred:
                heapq.heappush(self.deferred_queue, task)
                
            return None
            
    def add_periodic_task(self, name: str, handler: Callable, 
                         interval: timedelta, priority: TaskPriority = TaskPriority.NORMAL):
        """Add a periodic task"""
        self.periodic_tasks[name] = PeriodicTask(
            name=name,
            handler=handler,
            interval=interval,
            priority=priority,
            next_run=datetime.now()
        )
        
    async def check_periodic_tasks(self):
        """Check and queue due periodic tasks"""
        now = datetime.now()
        
        for name, periodic_task in self.periodic_tasks.items():
            if now >= periodic_task.next_run:
                # Create scheduled task
                task = ScheduledTask(
                    id=f"{name}_{now.timestamp()}",
                    name=f"Periodic: {name}",
                    handler=periodic_task.handler,
                    priority=periodic_task.priority
                )
                
                await self.add_task(task)
                
                # Update next run time
                periodic_task.next_run = now + periodic_task.interval


@dataclass
class PeriodicTask:
    """Represents a recurring task"""
    name: str
    handler: Callable
    interval: timedelta
    priority: TaskPriority
    next_run: datetime
```

### Background Scheduler Core

```python
class Scheduler:
    """
    Main scheduler that orchestrates all background analysis
    """
    
    def __init__(self, max_workers: int = 4):
        self.queue_manager = TaskQueueManager()
        self.max_workers = max_workers
        self.workers: List[asyncio.Task] = []
        self.analyzers: Dict[str, BaseAnalyzer] = {}
        self._running = False
        self._stats = SchedulerStats()
        
        # Initialize analyzers
        self._init_analyzers()
        
        # Setup periodic tasks
        self._setup_periodic_tasks()
        
    def _init_analyzers(self):
        """Initialize all analysis engines"""
        self.analyzers['codebase'] = CodebaseAnalyzer()
        self.analyzers['steward'] = StewardProfileAnalyzer()
        self.analyzers['conversation'] = ConversationIndexer()
        self.analyzers['pattern'] = PatternRecognitionEngine()
        
    def _setup_periodic_tasks(self):
        """Setup recurring analysis tasks"""
        # Hourly quick scan
        self.queue_manager.add_periodic_task(
            'quick_codebase_scan',
            self._quick_codebase_scan,
            timedelta(hours=1),
            TaskPriority.NORMAL
        )
        
        # Daily full analysis
        self.queue_manager.add_periodic_task(
            'full_codebase_analysis',
            self._full_codebase_analysis,
            timedelta(days=1),
            TaskPriority.LOW
        )
        
        # Weekly deep pattern mining
        self.queue_manager.add_periodic_task(
            'deep_pattern_mining',
            self._deep_pattern_mining,
            timedelta(days=7),
            TaskPriority.DEFERRED
        )
        
    async def start(self):
        """Start the scheduler"""
        self._running = True
        logger.info("Starting Background Scheduler")
        
        # Start workers
        for i in range(self.max_workers):
            worker = asyncio.create_task(self._worker(i))
            self.workers.append(worker)
            
        # Start periodic task checker
        asyncio.create_task(self._periodic_checker())
        
        # Start resource monitor
        asyncio.create_task(self._resource_monitor())
        
        logger.info(f"Started {self.max_workers} workers")
        
    async def stop(self):
        """Stop the scheduler"""
        logger.info("Stopping Background Scheduler")
        self._running = False
        
        # Wait for workers to finish
        await asyncio.gather(*self.workers, return_exceptions=True)
        
        logger.info("Background Scheduler stopped")
        
    async def _worker(self, worker_id: int):
        """Worker coroutine that processes tasks"""
        logger.info(f"Worker {worker_id} started")
        
        while self._running:
            try:
                # Get next task
                task = await self.queue_manager.get_next_task()
                
                if not task:
                    # No tasks available, wait
                    await asyncio.sleep(1)
                    continue
                    
                # Execute task
                logger.info(f"Worker {worker_id} executing task: {task.name}")
                start_time = time.time()
                
                try:
                    # Record as running
                    self.queue_manager.running_tasks[task.id] = task
                    
                    # Execute
                    if asyncio.iscoroutinefunction(task.handler):
                        result = await task.handler()
                    else:
                        result = await asyncio.to_thread(task.handler)
                        
                    # Success
                    task.result = result
                    self.queue_manager.completed_tasks[task.id] = task
                    
                    # Update stats
                    duration = time.time() - start_time
                    self._stats.record_success(task, duration)
                    
                    logger.info(f"Task {task.name} completed in {duration:.2f}s")
                    
                except Exception as e:
                    # Handle failure
                    task.error = str(e)
                    task.retry_count += 1
                    
                    logger.error(f"Task {task.name} failed: {e}")
                    self._stats.record_failure(task)
                    
                    # Retry if allowed
                    if task.retry_count < task.max_retries:
                        task.priority = TaskPriority.LOW  # Lower priority for retries
                        await self.queue_manager.add_task(task)
                    else:
                        logger.error(f"Task {task.name} failed after {task.max_retries} retries")
                        
                finally:
                    # Remove from running
                    self.queue_manager.running_tasks.pop(task.id, None)
                    
            except Exception as e:
                logger.error(f"Worker {worker_id} error: {e}")
                await asyncio.sleep(1)
                
        logger.info(f"Worker {worker_id} stopped")
        
    async def _periodic_checker(self):
        """Check for due periodic tasks"""
        while self._running:
            try:
                await self.queue_manager.check_periodic_tasks()
                await asyncio.sleep(60)  # Check every minute
            except Exception as e:
                logger.error(f"Periodic checker error: {e}")
                
    async def _resource_monitor(self):
        """Monitor and adjust resources"""
        while self._running:
            try:
                cpu_percent = psutil.cpu_percent(interval=1)
                memory_percent = psutil.virtual_memory().percent
                
                # Adaptive worker management
                if cpu_percent > 90 or memory_percent > 90:
                    # Reduce workers under high load
                    if len(self.workers) > 1:
                        worker = self.workers.pop()
                        worker.cancel()
                        logger.warning(f"Reduced workers to {len(self.workers)} due to high load")
                        
                elif cpu_percent < 50 and memory_percent < 70:
                    # Add workers under low load
                    if len(self.workers) < self.max_workers:
                        worker = asyncio.create_task(self._worker(len(self.workers)))
                        self.workers.append(worker)
                        logger.info(f"Increased workers to {len(self.workers)}")
                        
                await asyncio.sleep(30)  # Check every 30 seconds
                
            except Exception as e:
                logger.error(f"Resource monitor error: {e}")
```

### Codebase Analyzer Implementation

```python
import ast
import os
from pathlib import Path
from typing import Dict, List, Set, Any
import subprocess
import json
import re


class CodebaseAnalyzer(BaseAnalyzer):
    """
    Analyzes codebase for languages, frameworks, dependencies, and patterns
    """
    
    def __init__(self):
        self.project_root = Path.cwd()
        self.cache = {}
        self.last_analysis = None
        
    async def analyze(self, quick: bool = False) -> Dict[str, Any]:
        """Perform codebase analysis"""
        logger.info(f"Starting {'quick' if quick else 'full'} codebase analysis")
        
        result = {
            'timestamp': datetime.now().isoformat(),
            'type': 'quick' if quick else 'full',
            'languages': await self._detect_languages(),
            'frameworks': await self._analyze_frameworks(),
            'dependencies': await self._map_dependencies(),
            'database_tech': await self._detect_databases(),
            'coding_style': await self._extract_style() if not quick else None
        }
        
        self.last_analysis = result
        return result
        
    async def _detect_languages(self) -> Dict[str, Any]:
        """Detect programming languages in use"""
        language_stats = {}
        total_files = 0
        
        # Language extensions mapping
        lang_extensions = {
            '.py': 'Python',
            '.js': 'JavaScript',
            '.ts': 'TypeScript',
            '.java': 'Java',
            '.cpp': 'C++',
            '.c': 'C',
            '.go': 'Go',
            '.rs': 'Rust',
            '.rb': 'Ruby',
            '.php': 'PHP',
            '.swift': 'Swift',
            '.kt': 'Kotlin',
            '.scala': 'Scala',
            '.r': 'R',
            '.m': 'MATLAB',
            '.jl': 'Julia'
        }
        
        # Walk through project
        for root, dirs, files in os.walk(self.project_root):
            # Skip hidden and vendor directories
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['node_modules', 'vendor', '__pycache__']]
            
            for file in files:
                ext = Path(file).suffix.lower()
                if ext in lang_extensions:
                    lang = lang_extensions[ext]
                    language_stats[lang] = language_stats.get(lang, 0) + 1
                    total_files += 1
                    
        # Calculate percentages
        if total_files > 0:
            for lang in language_stats:
                percentage = (language_stats[lang] / total_files) * 100
                language_stats[lang] = {
                    'count': language_stats[lang],
                    'percentage': round(percentage, 2)
                }
                
        # Determine primary language
        primary_language = max(language_stats.items(), key=lambda x: x[1]['count'])[0] if language_stats else None
        
        return {
            'primary': primary_language,
            'distribution': language_stats,
            'total_files': total_files
        }
        
    async def _analyze_frameworks(self) -> Dict[str, Any]:
        """Detect frameworks and libraries in use"""
        frameworks = {
            'web': [],
            'testing': [],
            'build': [],
            'other': []
        }
        
        # Check package.json for Node.js projects
        package_json = self.project_root / 'package.json'
        if package_json.exists():
            with open(package_json) as f:
                data = json.load(f)
                deps = {**data.get('dependencies', {}), **data.get('devDependencies', {})}
                
                # Web frameworks
                for fw in ['react', 'vue', 'angular', 'express', 'next', 'nuxt']:
                    if fw in deps:
                        frameworks['web'].append(fw)
                        
                # Testing frameworks
                for test_fw in ['jest', 'mocha', 'cypress', 'playwright']:
                    if test_fw in deps:
                        frameworks['testing'].append(test_fw)
                        
                # Build tools
                for build in ['webpack', 'vite', 'parcel', 'rollup']:
                    if build in deps:
                        frameworks['build'].append(build)
                        
        # Check Python projects
        for req_file in ['requirements.txt', 'setup.py', 'pyproject.toml']:
            req_path = self.project_root / req_file
            if req_path.exists():
                content = req_path.read_text()
                
                # Web frameworks
                for fw in ['django', 'flask', 'fastapi', 'tornado']:
                    if fw in content.lower():
                        frameworks['web'].append(fw)
                        
                # Testing
                for test_fw in ['pytest', 'unittest', 'nose']:
                    if test_fw in content.lower():
                        frameworks['testing'].append(test_fw)
                        
        return frameworks
        
    async def _map_dependencies(self) -> Dict[str, Any]:
        """Map project dependencies"""
        dependencies = {
            'direct': {},
            'dev': {},
            'total_count': 0
        }
        
        # Node.js dependencies
        package_json = self.project_root / 'package.json'
        if package_json.exists():
            with open(package_json) as f:
                data = json.load(f)
                dependencies['direct'].update(data.get('dependencies', {}))
                dependencies['dev'].update(data.get('devDependencies', {}))
                
        # Python dependencies
        requirements = self.project_root / 'requirements.txt'
        if requirements.exists():
            for line in requirements.read_text().splitlines():
                line = line.strip()
                if line and not line.startswith('#'):
                    # Parse requirement
                    match = re.match(r'([a-zA-Z0-9-_.]+)(.*)', line)
                    if match:
                        pkg_name = match.group(1)
                        version_spec = match.group(2).strip()
                        dependencies['direct'][pkg_name] = version_spec or '*'
                        
        dependencies['total_count'] = len(dependencies['direct']) + len(dependencies['dev'])
        
        return dependencies
        
    async def _detect_databases(self) -> List[str]:
        """Detect database technologies in use"""
        databases = set()
        
        # Check for database libraries
        db_indicators = {
            'postgresql': ['psycopg2', 'asyncpg', 'pg'],
            'mysql': ['mysqlclient', 'pymysql', 'mysql-connector'],
            'mongodb': ['pymongo', 'motor', 'mongoose'],
            'redis': ['redis', 'aioredis'],
            'sqlite': ['sqlite3', 'aiosqlite'],
            'elasticsearch': ['elasticsearch', 'elasticsearch-py']
        }
        
        # Search in dependencies
        all_deps = []
        
        # Node.js
        package_json = self.project_root / 'package.json'
        if package_json.exists():
            with open(package_json) as f:
                data = json.load(f)
                all_deps.extend(data.get('dependencies', {}).keys())
                all_deps.extend(data.get('devDependencies', {}).keys())
                
        # Python
        requirements = self.project_root / 'requirements.txt'
        if requirements.exists():
            for line in requirements.read_text().splitlines():
                if line and not line.startswith('#'):
                    pkg = line.split('==')[0].split('>=')[0].split('[')[0].strip()
                    all_deps.append(pkg)
                    
        # Check indicators
        for db, indicators in db_indicators.items():
            if any(ind in dep.lower() for dep in all_deps for ind in indicators):
                databases.add(db)
                
        # Check for ORM/ODM usage
        orm_mapping = {
            'sqlalchemy': 'SQL databases',
            'django.db': 'Django ORM',
            'mongoengine': 'MongoDB',
            'tortoise-orm': 'Async SQL'
        }
        
        # Search in code files
        for pattern, db_type in orm_mapping.items():
            result = subprocess.run(
                ['grep', '-r', pattern, str(self.project_root), '--include=*.py'],
                capture_output=True,
                text=True
            )
            if result.returncode == 0 and result.stdout:
                databases.add(db_type)
                
        return list(databases)
        
    async def _extract_style(self) -> Dict[str, Any]:
        """Extract coding style and conventions"""
        style = {
            'naming_conventions': {},
            'file_organization': {},
            'comment_style': {},
            'patterns': []
        }
        
        # Analyze Python files for style
        python_files = list(self.project_root.glob('**/*.py'))[:100]  # Sample
        
        if python_files:
            # Naming conventions
            function_names = []
            class_names = []
            variable_names = []
            
            for py_file in python_files:
                try:
                    tree = ast.parse(py_file.read_text())
                    
                    for node in ast.walk(tree):
                        if isinstance(node, ast.FunctionDef):
                            function_names.append(node.name)
                        elif isinstance(node, ast.ClassDef):
                            class_names.append(node.name)
                        elif isinstance(node, ast.Name) and isinstance(node.ctx, ast.Store):
                            variable_names.append(node.id)
                            
                except Exception:
                    continue
                    
            # Analyze naming patterns
            if function_names:
                snake_case = sum(1 for n in function_names if '_' in n and n.islower())
                camel_case = sum(1 for n in function_names if n[0].islower() and any(c.isupper() for c in n))
                
                if snake_case > camel_case:
                    style['naming_conventions']['functions'] = 'snake_case'
                else:
                    style['naming_conventions']['functions'] = 'camelCase'
                    
            if class_names:
                pascal_case = sum(1 for n in class_names if n[0].isupper())
                if pascal_case > len(class_names) * 0.8:
                    style['naming_conventions']['classes'] = 'PascalCase'
                    
        # File organization
        src_exists = (self.project_root / 'src').exists()
        lib_exists = (self.project_root / 'lib').exists()
        tests_exist = any(self.project_root.glob('**/test*'))
        
        style['file_organization'] = {
            'has_src_directory': src_exists,
            'has_lib_directory': lib_exists,
            'has_tests': tests_exist,
            'structure_type': 'modular' if src_exists or lib_exists else 'flat'
        }
        
        return style


class SchedulerStats:
    """Track scheduler performance metrics"""
    
    def __init__(self):
        self.total_tasks = 0
        self.successful_tasks = 0
        self.failed_tasks = 0
        self.total_duration = 0
        self.task_durations = {}
        
    def record_success(self, task: ScheduledTask, duration: float):
        self.total_tasks += 1
        self.successful_tasks += 1
        self.total_duration += duration
        
        task_type = task.name.split(':')[0]
        if task_type not in self.task_durations:
            self.task_durations[task_type] = []
        self.task_durations[task_type].append(duration)
        
    def record_failure(self, task: ScheduledTask):
        self.total_tasks += 1
        self.failed_tasks += 1
        
    def get_stats(self) -> Dict[str, Any]:
        return {
            'total_tasks': self.total_tasks,
            'successful_tasks': self.successful_tasks,
            'failed_tasks': self.failed_tasks,
            'success_rate': self.successful_tasks / self.total_tasks if self.total_tasks > 0 else 0,
            'average_duration': self.total_duration / self.successful_tasks if self.successful_tasks > 0 else 0,
            'task_type_durations': {
                task_type: sum(durations) / len(durations)
                for task_type, durations in self.task_durations.items()
            }
        }
```

### Pattern Recognition Engine

```python
class PatternRecognitionEngine(BaseAnalyzer):
    """
    Recognizes patterns in code, work habits, and technology usage
    """
    
    def __init__(self):
        self.patterns = {
            'code': [],
            'work': [],
            'tech': []
        }
        self.pattern_confidence = {}
        
    async def analyze(self, pattern_type: str = 'all') -> Dict[str, Any]:
        """Analyze patterns based on type"""
        results = {}
        
        if pattern_type in ['all', 'code']:
            results['code_patterns'] = await self._analyze_code_patterns()
            
        if pattern_type in ['all', 'work']:
            results['work_patterns'] = await self._analyze_work_patterns()
            
        if pattern_type in ['all', 'tech']:
            results['tech_patterns'] = await self._analyze_tech_patterns()
            
        return results
        
    async def _analyze_code_patterns(self) -> List[Dict[str, Any]]:
        """Identify common code patterns"""
        patterns = []
        
        # Analyze recent code changes
        try:
            # Get recent commits
            result = subprocess.run(
                ['git', 'log', '--since=30.days', '--pretty=format:%H', '--no-merges'],
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                commits = result.stdout.strip().split('\n')[:50]  # Last 50 commits
                
                # Analyze commit patterns
                file_changes = {}
                
                for commit in commits:
                    diff_result = subprocess.run(
                        ['git', 'diff-tree', '--no-commit-id', '--name-only', '-r', commit],
                        capture_output=True,
                        text=True
                    )
                    
                    if diff_result.returncode == 0:
                        for file in diff_result.stdout.strip().split('\n'):
                            if file:
                                file_changes[file] = file_changes.get(file, 0) + 1
                                
                # Identify frequently changed files
                hot_files = sorted(file_changes.items(), key=lambda x: x[1], reverse=True)[:10]
                
                if hot_files:
                    patterns.append({
                        'type': 'hot_files',
                        'description': 'Frequently modified files',
                        'data': hot_files,
                        'confidence': 0.9,
                        'insight': 'These files are changed often and may benefit from refactoring'
                    })
                    
        except Exception as e:
            logger.error(f"Error analyzing code patterns: {e}")
            
        # Pattern: Error handling style
        try:
            # Sample Python files
            py_files = list(Path.cwd().glob('**/*.py'))[:50]
            
            try_except_count = 0
            if_check_count = 0
            
            for py_file in py_files:
                content = py_file.read_text()
                try_except_count += content.count('try:')
                if_check_count += len(re.findall(r'if\s+\w+\s+is\s+None:', content))
                
            if try_except_count > 0 or if_check_count > 0:
                patterns.append({
                    'type': 'error_handling',
                    'description': 'Error handling preferences',
                    'data': {
                        'try_except': try_except_count,
                        'if_checks': if_check_count,
                        'preference': 'exceptions' if try_except_count > if_check_count else 'conditionals'
                    },
                    'confidence': 0.7
                })
                
        except Exception as e:
            logger.error(f"Error analyzing error handling patterns: {e}")
            
        return patterns
        
    async def _analyze_work_patterns(self) -> List[Dict[str, Any]]:
        """Analyze work rhythm patterns"""
        patterns = []
        
        try:
            # Analyze commit times
            result = subprocess.run(
                ['git', 'log', '--since=90.days', '--pretty=format:%ai', '--no-merges'],
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                timestamps = []
                for line in result.stdout.strip().split('\n'):
                    if line:
                        try:
                            dt = datetime.fromisoformat(line.split('+')[0].strip())
                            timestamps.append(dt)
                        except:
                            continue
                            
                if timestamps:
                    # Hour distribution
                    hour_dist = {}
                    day_dist = {}
                    
                    for ts in timestamps:
                        hour = ts.hour
                        day = ts.weekday()
                        
                        hour_dist[hour] = hour_dist.get(hour, 0) + 1
                        day_dist[day] = day_dist.get(day, 0) + 1
                        
                    # Find peak hours
                    peak_hours = sorted(hour_dist.items(), key=lambda x: x[1], reverse=True)[:3]
                    peak_days = sorted(day_dist.items(), key=lambda x: x[1], reverse=True)[:2]
                    
                    patterns.append({
                        'type': 'work_hours',
                        'description': 'Most productive hours',
                        'data': {
                            'peak_hours': [h for h, _ in peak_hours],
                            'peak_days': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][peak_days[0][0]]
                        },
                        'confidence': 0.8,
                        'insight': f"Most active during hours {peak_hours[0][0]}-{peak_hours[-1][0]}"
                    })
                    
        except Exception as e:
            logger.error(f"Error analyzing work patterns: {e}")
            
        return patterns
        
    async def _analyze_tech_patterns(self) -> List[Dict[str, Any]]:
        """Analyze technology usage patterns"""
        patterns = []
        
        # Tool preferences based on config files
        config_files = {
            '.vscode/settings.json': 'VS Code',
            '.idea': 'IntelliJ/PyCharm',
            '.vim': 'Vim',
            '.emacs': 'Emacs'
        }
        
        used_tools = []
        for config, tool in config_files.items():
            if (Path.cwd() / config).exists():
                used_tools.append(tool)
                
        if used_tools:
            patterns.append({
                'type': 'development_tools',
                'description': 'Preferred development environments',
                'data': used_tools,
                'confidence': 1.0
            })
            
        # Package manager preferences
        package_managers = {
            'package-lock.json': 'npm',
            'yarn.lock': 'yarn',
            'pnpm-lock.yaml': 'pnpm',
            'Pipfile.lock': 'pipenv',
            'poetry.lock': 'poetry'
        }
        
        for lock_file, pm in package_managers.items():
            if (Path.cwd() / lock_file).exists():
                patterns.append({
                    'type': 'package_manager',
                    'description': 'Package manager preference',
                    'data': pm,
                    'confidence': 1.0
                })
                break
                
        return patterns
```

## 🔧 Integration with MIRA Daemon

```python
class MiraDaemon:
    """Main daemon with integrated scheduler"""
    
    def __init__(self):
        # ... other components ...
        self.scheduler = Scheduler(max_workers=4)
        
        # Register analyzer tasks
        self._register_analyzer_tasks()
        
    def _register_analyzer_tasks(self):
        """Register analysis tasks with scheduler"""
        
        # Quick codebase scan
        async def quick_scan():
            analyzer = self.scheduler.analyzers['codebase']
            result = await analyzer.analyze(quick=True)
            
            # Store result
            await self.memory_manager.store_to_chromadb(
                content=json.dumps(result),
                metadata={
                    'type': 'codebase_analysis',
                    'quick': True,
                    'timestamp': result['timestamp']
                },
                collection='analysis_results'
            )
            
            return result
            
        self.scheduler._quick_codebase_scan = quick_scan
        
        # Full analysis
        async def full_analysis():
            results = {}
            
            # Run all analyzers
            for name, analyzer in self.scheduler.analyzers.items():
                try:
                    result = await analyzer.analyze()
                    results[name] = result
                    
                    # Store individual results
                    await self.memory_manager.store_to_chromadb(
                        content=json.dumps(result),
                        metadata={
                            'type': f'{name}_analysis',
                            'timestamp': datetime.now().isoformat()
                        },
                        collection='analysis_results'
                    )
                except Exception as e:
                    logger.error(f"Analysis failed for {name}: {e}")
                    results[name] = {'error': str(e)}
                    
            return results
            
        self.scheduler._full_codebase_analysis = full_analysis
        
    async def queue_analysis(self, analysis_type: str, priority: TaskPriority = TaskPriority.NORMAL):
        """Queue an analysis task"""
        
        handlers = {
            'codebase': self.scheduler.analyzers['codebase'].analyze,
            'steward': self.scheduler.analyzers['steward'].analyze,
            'patterns': self.scheduler.analyzers['pattern'].analyze,
            'conversation': self.scheduler.analyzers['conversation'].analyze
        }
        
        if analysis_type not in handlers:
            raise ValueError(f"Unknown analysis type: {analysis_type}")
            
        task = ScheduledTask(
            id=f"{analysis_type}_{datetime.now().timestamp()}",
            name=f"Manual {analysis_type} analysis",
            handler=handlers[analysis_type],
            priority=priority,
            user_triggered=True
        )
        
        await self.scheduler.queue_manager.add_task(task)
        
        return task.id
```

---

*This implementation provides a robust, scalable foundation for MIRA's background intelligence processing.*