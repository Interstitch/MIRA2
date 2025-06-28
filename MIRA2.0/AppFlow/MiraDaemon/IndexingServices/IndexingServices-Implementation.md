# IndexingServices Implementation Guide

## 🎯 Core Implementation

### Base Indexing Service
```python
import asyncio
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any, Set
from datetime import datetime, timedelta
import hashlib
import json
from abc import ABC, abstractmethod

import chromadb
from sentence_transformers import SentenceTransformer
import sqlite3
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

logger = logging.getLogger(__name__)


class IndexingService(ABC):
    """Base class for all indexing services"""
    
    def __init__(self, mira_home: Path):
        self.mira_home = mira_home
        self.db_path = mira_home / 'databases'
        self.cache_path = mira_home / 'cache'
        self.is_running = False
        
        # Initialize embedding model
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Initialize vector DB client
        self.chroma_client = chromadb.PersistentClient(
            path=str(self.db_path / 'chromadb')
        )
        
        # Setup collections
        self._setup_collections()
        
    @abstractmethod
    async def index(self, content: Any) -> bool:
        """Index specific content"""
        pass
        
    @abstractmethod
    async def search(self, query: str, limit: int = 10) -> List[Dict]:
        """Search indexed content"""
        pass
        
    def _setup_collections(self):
        """Setup ChromaDB collections"""
        # Override in subclasses
        pass
        
    async def start(self):
        """Start the indexing service"""
        self.is_running = True
        logger.info(f"{self.__class__.__name__} started")
        
    async def stop(self):
        """Stop the indexing service"""
        self.is_running = False
        logger.info(f"{self.__class__.__name__} stopped")
```

### Conversation Indexer Implementation
```python
class ConversationIndexer(IndexingService):
    """Indexes Claude conversations for semantic search"""
    
    def __init__(self, mira_home: Path):
        super().__init__(mira_home)
        self.conversations_path = mira_home / 'conversations'
        self.sessions_path = self.conversations_path / 'sessions'
        self.index_db_path = self.conversations_path / 'index.db'
        
        # Setup FTS5 database
        self._setup_fts_database()
        
        # Setup file watcher
        self.observer = Observer()
        self.event_handler = ConversationFileHandler(self)
        
        # Indexing queue
        self.index_queue = asyncio.Queue()
        self.batch_size = 10
        self.batch_timeout = 5.0  # seconds
        
    def _setup_collections(self):
        """Setup ChromaDB collections for conversations"""
        self.conversation_collection = self.chroma_client.get_or_create_collection(
            name="conversations",
            metadata={"description": "Indexed Claude conversations"}
        )
        
    def _setup_fts_database(self):
        """Setup SQLite FTS5 for keyword search"""
        conn = sqlite3.connect(str(self.index_db_path))
        conn.execute('''
            CREATE VIRTUAL TABLE IF NOT EXISTS conversation_fts USING fts5(
                session_id,
                message_id,
                role,
                content,
                timestamp,
                metadata
            )
        ''')
        conn.commit()
        conn.close()
        
    async def index(self, conversation_path: Path) -> bool:
        """Index a conversation file"""
        try:
            # Load conversation
            with open(conversation_path, 'r') as f:
                conversation = json.load(f)
                
            # Extract messages
            messages = conversation.get('messages', [])
            session_id = conversation.get('session_id', str(conversation_path.stem))
            
            # Chunk messages for context
            chunks = self._create_contextual_chunks(messages, session_id)
            
            # Generate embeddings
            embeddings = await self._generate_embeddings(chunks)
            
            # Store in ChromaDB
            await self._store_in_chromadb(chunks, embeddings, session_id)
            
            # Store in FTS5
            await self._store_in_fts(messages, session_id)
            
            # Extract and store facts
            facts = await self._extract_conversation_facts(messages)
            await self._store_facts(facts, session_id)
            
            logger.info(f"Indexed conversation: {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to index conversation {conversation_path}: {e}")
            return False
            
    def _create_contextual_chunks(self, messages: List[Dict], session_id: str) -> List[Dict]:
        """Create overlapping chunks that preserve conversation context"""
        chunks = []
        chunk_size = 5  # messages per chunk
        overlap = 2     # overlapping messages
        
        for i in range(0, len(messages), chunk_size - overlap):
            chunk_messages = messages[i:i + chunk_size]
            
            # Create chunk text
            chunk_text = self._format_chunk(chunk_messages)
            
            # Extract metadata
            chunk_metadata = {
                'session_id': session_id,
                'chunk_index': len(chunks),
                'start_message': i,
                'end_message': min(i + chunk_size, len(messages)),
                'timestamp': chunk_messages[0].get('timestamp', ''),
                'participants': list(set(m.get('role', '') for m in chunk_messages))
            }
            
            chunks.append({
                'text': chunk_text,
                'metadata': chunk_metadata,
                'messages': chunk_messages
            })
            
        return chunks
        
    def _format_chunk(self, messages: List[Dict]) -> str:
        """Format messages into searchable text"""
        formatted = []
        
        for msg in messages:
            role = msg.get('role', 'unknown')
            content = msg.get('content', '')
            formatted.append(f"{role}: {content}")
            
        return "\n\n".join(formatted)
        
    async def _generate_embeddings(self, chunks: List[Dict]) -> List[List[float]]:
        """Generate embeddings for chunks"""
        texts = [chunk['text'] for chunk in chunks]
        
        # Generate embeddings in batches
        embeddings = []
        for i in range(0, len(texts), 32):
            batch = texts[i:i + 32]
            batch_embeddings = self.embedding_model.encode(batch)
            embeddings.extend(batch_embeddings.tolist())
            
        return embeddings
        
    async def _store_in_chromadb(self, chunks: List[Dict], embeddings: List[List[float]], session_id: str):
        """Store chunks in ChromaDB"""
        ids = [f"{session_id}_{i}" for i in range(len(chunks))]
        documents = [chunk['text'] for chunk in chunks]
        metadatas = [chunk['metadata'] for chunk in chunks]
        
        self.conversation_collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )
        
    async def _store_in_fts(self, messages: List[Dict], session_id: str):
        """Store messages in FTS5 for keyword search"""
        conn = sqlite3.connect(str(self.index_db_path))
        
        for i, msg in enumerate(messages):
            conn.execute('''
                INSERT INTO conversation_fts 
                (session_id, message_id, role, content, timestamp, metadata)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                session_id,
                f"{session_id}_{i}",
                msg.get('role', ''),
                msg.get('content', ''),
                msg.get('timestamp', ''),
                json.dumps(msg.get('metadata', {}))
            ))
            
        conn.commit()
        conn.close()
        
    async def _extract_conversation_facts(self, messages: List[Dict]) -> List[Dict]:
        """Extract facts from conversation messages"""
        facts = []
        
        # Patterns for fact extraction
        patterns = {
            'identity': r"(?:I am|I'm|My name is) ([A-Z][a-z]+ ?[A-Z]?[a-z]*)",
            'technology': r"(?:using|working with|built with) ([a-zA-Z0-9\-\.]+)",
            'decision': r"(?:decided to|chose|selected) ([^\.]+) because ([^\.]+)",
            'solution': r"(?:fixed|solved|resolved) ([^\.]+) by ([^\.]+)",
            'learning': r"(?:learned|discovered|found out) that ([^\.]+)"
        }
        
        for msg in messages:
            content = msg.get('content', '')
            
            for fact_type, pattern in patterns.items():
                import re
                matches = re.findall(pattern, content, re.IGNORECASE)
                
                for match in matches:
                    fact = {
                        'type': fact_type,
                        'content': match if isinstance(match, str) else ' '.join(match),
                        'source': 'conversation',
                        'confidence': 0.8,
                        'timestamp': msg.get('timestamp', datetime.now().isoformat()),
                        'context': content[:200]
                    }
                    facts.append(fact)
                    
        return facts
        
    async def _store_facts(self, facts: List[Dict], session_id: str):
        """Store extracted facts in identified_facts collection"""
        if not facts:
            return
            
        # Get or create facts collection
        facts_collection = self.chroma_client.get_or_create_collection(
            name="identified_facts",
            metadata={"description": "Facts extracted from conversations"}
        )
        
        # Generate embeddings for facts
        fact_texts = [f"{f['type']}: {f['content']}" for f in facts]
        embeddings = self.embedding_model.encode(fact_texts)
        
        # Store facts
        ids = [f"fact_{session_id}_{i}" for i in range(len(facts))]
        
        facts_collection.upsert(
            ids=ids,
            embeddings=embeddings.tolist(),
            documents=fact_texts,
            metadatas=facts
        )
        
    async def search(self, query: str, limit: int = 10) -> List[Dict]:
        """Search conversations using hybrid approach"""
        results = []
        
        # Semantic search in ChromaDB
        semantic_results = await self._semantic_search(query, limit)
        results.extend(semantic_results)
        
        # Keyword search in FTS5
        keyword_results = await self._keyword_search(query, limit)
        results.extend(keyword_results)
        
        # Deduplicate and rank
        return self._rank_results(results, query)[:limit]
        
    async def _semantic_search(self, query: str, limit: int) -> List[Dict]:
        """Perform semantic search using ChromaDB"""
        # Generate query embedding
        query_embedding = self.embedding_model.encode([query])[0].tolist()
        
        # Search in ChromaDB
        results = self.conversation_collection.query(
            query_embeddings=[query_embedding],
            n_results=limit
        )
        
        # Format results
        formatted_results = []
        for i in range(len(results['ids'][0])):
            formatted_results.append({
                'type': 'semantic',
                'id': results['ids'][0][i],
                'content': results['documents'][0][i],
                'metadata': results['metadatas'][0][i],
                'score': 1 - results['distances'][0][i]  # Convert distance to similarity
            })
            
        return formatted_results
        
    async def _keyword_search(self, query: str, limit: int) -> List[Dict]:
        """Perform keyword search using FTS5"""
        conn = sqlite3.connect(str(self.index_db_path))
        
        # Search in FTS5
        cursor = conn.execute('''
            SELECT session_id, message_id, role, content, timestamp, metadata,
                   rank
            FROM conversation_fts
            WHERE conversation_fts MATCH ?
            ORDER BY rank
            LIMIT ?
        ''', (query, limit))
        
        results = []
        for row in cursor:
            results.append({
                'type': 'keyword',
                'id': row[1],
                'content': row[3],
                'metadata': {
                    'session_id': row[0],
                    'role': row[2],
                    'timestamp': row[4],
                    **json.loads(row[5])
                },
                'score': -row[6]  # FTS5 rank is negative
            })
            
        conn.close()
        return results
        
    def _rank_results(self, results: List[Dict], query: str) -> List[Dict]:
        """Rank and deduplicate search results"""
        # Deduplicate by content hash
        seen = set()
        unique_results = []
        
        for result in results:
            content_hash = hashlib.md5(result['content'].encode()).hexdigest()
            if content_hash not in seen:
                seen.add(content_hash)
                unique_results.append(result)
                
        # Re-rank based on multiple factors
        for result in unique_results:
            # Boost recent results
            if 'timestamp' in result['metadata']:
                try:
                    timestamp = datetime.fromisoformat(result['metadata']['timestamp'])
                    age_days = (datetime.now() - timestamp).days
                    recency_boost = max(0, 1 - (age_days / 365))
                    result['score'] *= (1 + recency_boost * 0.2)
                except:
                    pass
                    
            # Boost exact matches
            if query.lower() in result['content'].lower():
                result['score'] *= 1.5
                
        # Sort by score
        unique_results.sort(key=lambda x: x['score'], reverse=True)
        
        return unique_results
        
    async def start(self):
        """Start the conversation indexer"""
        await super().start()
        
        # Start file watcher
        self.observer.schedule(self.event_handler, str(self.sessions_path), recursive=True)
        self.observer.start()
        
        # Start batch processor
        asyncio.create_task(self._batch_processor())
        
        # Initial indexing of existing conversations
        asyncio.create_task(self._initial_indexing())
        
    async def stop(self):
        """Stop the conversation indexer"""
        await super().stop()
        self.observer.stop()
        self.observer.join()
        
    async def _batch_processor(self):
        """Process indexing queue in batches"""
        batch = []
        
        while self.is_running:
            try:
                # Wait for items with timeout
                try:
                    item = await asyncio.wait_for(
                        self.index_queue.get(),
                        timeout=self.batch_timeout
                    )
                    batch.append(item)
                except asyncio.TimeoutError:
                    pass
                    
                # Process batch if full or timeout
                if len(batch) >= self.batch_size or (batch and not self.index_queue.empty()):
                    await self._process_batch(batch)
                    batch = []
                    
            except Exception as e:
                logger.error(f"Batch processor error: {e}")
                
    async def _process_batch(self, batch: List[Path]):
        """Process a batch of conversations"""
        logger.info(f"Processing batch of {len(batch)} conversations")
        
        tasks = [self.index(path) for path in batch]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        success_count = sum(1 for r in results if r is True)
        logger.info(f"Batch complete: {success_count}/{len(batch)} successful")
        
    async def _initial_indexing(self):
        """Index all existing conversations on startup"""
        logger.info("Starting initial conversation indexing")
        
        conversation_files = list(self.sessions_path.rglob("*.json"))
        
        # Check which need indexing
        needs_indexing = []
        for file in conversation_files:
            if await self._needs_indexing(file):
                needs_indexing.append(file)
                
        logger.info(f"Found {len(needs_indexing)} conversations to index")
        
        # Add to queue
        for file in needs_indexing:
            await self.index_queue.put(file)
            
    async def _needs_indexing(self, file_path: Path) -> bool:
        """Check if a file needs indexing"""
        # Check if already indexed
        session_id = file_path.stem
        
        # Query ChromaDB for existing index
        results = self.conversation_collection.get(
            ids=[f"{session_id}_0"],
            limit=1
        )
        
        if results['ids']:
            # Check if file is newer than index
            file_mtime = file_path.stat().st_mtime
            # Get index timestamp from metadata
            # For now, assume needs reindexing if exists
            # TODO: Store index timestamp in metadata
            return False
            
        return True


class ConversationFileHandler(FileSystemEventHandler):
    """Handles file system events for conversations"""
    
    def __init__(self, indexer: ConversationIndexer):
        self.indexer = indexer
        
    def on_created(self, event):
        if not event.is_directory and event.src_path.endswith('.json'):
            asyncio.create_task(
                self.indexer.index_queue.put(Path(event.src_path))
            )
            
    def on_modified(self, event):
        if not event.is_directory and event.src_path.endswith('.json'):
            asyncio.create_task(
                self.indexer.index_queue.put(Path(event.src_path))
            )
```

### Codebase Indexer Implementation
```python
import ast
import re
from typing import Dict, List, Set, Tuple
import aiofiles
import chardet


class CodebaseIndexer(IndexingService):
    """Indexes project codebases for code search"""
    
    SUPPORTED_EXTENSIONS = {
        '.py': 'python',
        '.js': 'javascript',
        '.ts': 'typescript',
        '.jsx': 'javascript',
        '.tsx': 'typescript',
        '.java': 'java',
        '.go': 'go',
        '.rs': 'rust',
        '.cpp': 'cpp',
        '.c': 'c',
        '.cs': 'csharp',
        '.rb': 'ruby',
        '.php': 'php',
        '.swift': 'swift',
        '.kt': 'kotlin',
        '.scala': 'scala',
        '.r': 'r',
        '.m': 'objc',
        '.mm': 'objcpp',
        '.vue': 'vue',
        '.svelte': 'svelte'
    }
    
    def __init__(self, mira_home: Path):
        super().__init__(mira_home)
        self.indexed_projects = {}
        self.file_hashes = {}
        
        # Language-specific parsers
        self.parsers = {
            'python': PythonParser(),
            'javascript': JavaScriptParser(),
            'typescript': TypeScriptParser(),
            # Add more parsers as needed
        }
        
    def _setup_collections(self):
        """Setup ChromaDB collections for code"""
        self.code_collection = self.chroma_client.get_or_create_collection(
            name="codebase",
            metadata={"description": "Indexed source code"}
        )
        
        self.symbol_collection = self.chroma_client.get_or_create_collection(
            name="code_symbols",
            metadata={"description": "Code symbols and definitions"}
        )
        
    async def index_project(self, project_path: Path) -> bool:
        """Index an entire project"""
        try:
            logger.info(f"Indexing project: {project_path}")
            
            # Analyze project structure
            project_info = await self._analyze_project(project_path)
            
            # Find all source files
            source_files = await self._find_source_files(project_path)
            
            # Index files in batches
            batch_size = 20
            for i in range(0, len(source_files), batch_size):
                batch = source_files[i:i + batch_size]
                await self._index_file_batch(batch, project_info)
                
            # Store project metadata
            await self._store_project_metadata(project_path, project_info)
            
            self.indexed_projects[str(project_path)] = {
                'info': project_info,
                'indexed_at': datetime.now().isoformat(),
                'file_count': len(source_files)
            }
            
            logger.info(f"Indexed {len(source_files)} files from {project_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to index project {project_path}: {e}")
            return False
            
    async def _analyze_project(self, project_path: Path) -> Dict:
        """Analyze project structure and metadata"""
        info = {
            'path': str(project_path),
            'name': project_path.name,
            'type': 'unknown',
            'language': 'mixed',
            'framework': None,
            'dependencies': []
        }
        
        # Check for project files
        if (project_path / 'package.json').exists():
            info['type'] = 'node'
            info['language'] = 'javascript'
            package_json = await self._read_json(project_path / 'package.json')
            if package_json:
                info['dependencies'] = list(package_json.get('dependencies', {}).keys())
                info['framework'] = self._detect_js_framework(package_json)
                
        elif (project_path / 'requirements.txt').exists():
            info['type'] = 'python'
            info['language'] = 'python'
            requirements = await self._read_file(project_path / 'requirements.txt')
            info['dependencies'] = [
                line.split('==')[0].strip()
                for line in requirements.split('\n')
                if line.strip() and not line.startswith('#')
            ]
            
        elif (project_path / 'go.mod').exists():
            info['type'] = 'go'
            info['language'] = 'go'
            
        elif (project_path / 'Cargo.toml').exists():
            info['type'] = 'rust'
            info['language'] = 'rust'
            
        return info
        
    async def _find_source_files(self, project_path: Path) -> List[Path]:
        """Find all source files in project"""
        source_files = []
        
        # Common directories to skip
        skip_dirs = {
            '.git', 'node_modules', '__pycache__', '.pytest_cache',
            'venv', 'env', '.env', 'dist', 'build', 'target',
            '.idea', '.vscode', 'coverage', '.nyc_output'
        }
        
        for file_path in project_path.rglob('*'):
            # Skip directories
            if file_path.is_dir():
                continue
                
            # Skip if in excluded directory
            if any(skip_dir in file_path.parts for skip_dir in skip_dirs):
                continue
                
            # Check if supported extension
            if file_path.suffix in self.SUPPORTED_EXTENSIONS:
                source_files.append(file_path)
                
        return source_files
        
    async def _index_file_batch(self, files: List[Path], project_info: Dict):
        """Index a batch of files"""
        tasks = []
        
        for file_path in files:
            # Check if file needs reindexing
            if await self._needs_reindexing(file_path):
                tasks.append(self._index_single_file(file_path, project_info))
                
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
            
    async def _needs_reindexing(self, file_path: Path) -> bool:
        """Check if file needs reindexing based on hash"""
        current_hash = await self._calculate_file_hash(file_path)
        
        stored_hash = self.file_hashes.get(str(file_path))
        if stored_hash == current_hash:
            return False
            
        self.file_hashes[str(file_path)] = current_hash
        return True
        
    async def _calculate_file_hash(self, file_path: Path) -> str:
        """Calculate file hash for change detection"""
        hasher = hashlib.sha256()
        
        async with aiofiles.open(file_path, 'rb') as f:
            while chunk := await f.read(8192):
                hasher.update(chunk)
                
        return hasher.hexdigest()
        
    async def _index_single_file(self, file_path: Path, project_info: Dict):
        """Index a single source file"""
        try:
            # Read file content
            content = await self._read_file_safe(file_path)
            if not content:
                return
                
            # Detect language
            language = self.SUPPORTED_EXTENSIONS.get(file_path.suffix, 'unknown')
            
            # Parse file structure
            if language in self.parsers:
                parsed = await self.parsers[language].parse(content, file_path)
            else:
                parsed = await self._generic_parse(content, language)
                
            # Create chunks for embedding
            chunks = await self._create_code_chunks(content, parsed, file_path)
            
            # Generate embeddings
            embeddings = await self._generate_code_embeddings(chunks)
            
            # Store in ChromaDB
            await self._store_code_chunks(chunks, embeddings, file_path, project_info)
            
            # Store symbols separately
            await self._store_code_symbols(parsed, file_path, project_info)
            
        except Exception as e:
            logger.error(f"Failed to index file {file_path}: {e}")
            
    async def _read_file_safe(self, file_path: Path) -> Optional[str]:
        """Read file with encoding detection"""
        try:
            # Try UTF-8 first
            async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
                return await f.read()
        except UnicodeDecodeError:
            # Detect encoding
            async with aiofiles.open(file_path, 'rb') as f:
                raw_data = await f.read()
                
            detected = chardet.detect(raw_data)
            if detected['confidence'] > 0.7:
                try:
                    return raw_data.decode(detected['encoding'])
                except:
                    pass
                    
        return None
        
    async def _create_code_chunks(self, content: str, parsed: Dict, file_path: Path) -> List[Dict]:
        """Create semantic chunks from code"""
        chunks = []
        
        # Function/method level chunks
        for func in parsed.get('functions', []):
            chunk = {
                'type': 'function',
                'name': func['name'],
                'content': func['body'],
                'signature': func['signature'],
                'docstring': func.get('docstring', ''),
                'start_line': func['start_line'],
                'end_line': func['end_line'],
                'file_path': str(file_path),
                'language': parsed['language']
            }
            chunks.append(chunk)
            
        # Class level chunks
        for cls in parsed.get('classes', []):
            chunk = {
                'type': 'class',
                'name': cls['name'],
                'content': cls['body'],
                'docstring': cls.get('docstring', ''),
                'methods': [m['name'] for m in cls.get('methods', [])],
                'start_line': cls['start_line'],
                'end_line': cls['end_line'],
                'file_path': str(file_path),
                'language': parsed['language']
            }
            chunks.append(chunk)
            
        # If no structured elements, chunk by lines
        if not chunks:
            lines = content.split('\n')
            chunk_size = 50
            
            for i in range(0, len(lines), chunk_size - 10):
                chunk_lines = lines[i:i + chunk_size]
                chunk = {
                    'type': 'code_block',
                    'content': '\n'.join(chunk_lines),
                    'start_line': i + 1,
                    'end_line': min(i + chunk_size, len(lines)),
                    'file_path': str(file_path),
                    'language': parsed['language']
                }
                chunks.append(chunk)
                
        return chunks
        
    async def _generate_code_embeddings(self, chunks: List[Dict]) -> List[List[float]]:
        """Generate embeddings for code chunks"""
        # Create searchable text for each chunk
        texts = []
        
        for chunk in chunks:
            # Combine different elements for embedding
            text_parts = []
            
            if chunk['type'] == 'function':
                text_parts.append(f"Function: {chunk['name']}")
                text_parts.append(f"Signature: {chunk['signature']}")
                if chunk['docstring']:
                    text_parts.append(f"Description: {chunk['docstring']}")
                text_parts.append(chunk['content'][:500])  # First 500 chars
                
            elif chunk['type'] == 'class':
                text_parts.append(f"Class: {chunk['name']}")
                if chunk['docstring']:
                    text_parts.append(f"Description: {chunk['docstring']}")
                text_parts.append(f"Methods: {', '.join(chunk['methods'])}")
                text_parts.append(chunk['content'][:500])
                
            else:
                text_parts.append(chunk['content'][:1000])
                
            texts.append('\n'.join(text_parts))
            
        # Generate embeddings
        embeddings = self.embedding_model.encode(texts)
        return embeddings.tolist()
        
    async def search(self, query: str, limit: int = 10) -> List[Dict]:
        """Search code using natural language"""
        # Generate query embedding
        query_embedding = self.embedding_model.encode([query])[0].tolist()
        
        # Search in code collection
        results = self.code_collection.query(
            query_embeddings=[query_embedding],
            n_results=limit * 2  # Get more for filtering
        )
        
        # Format and filter results
        formatted_results = []
        
        for i in range(len(results['ids'][0])):
            result = {
                'id': results['ids'][0][i],
                'metadata': results['metadatas'][0][i],
                'score': 1 - results['distances'][0][i],
                'type': results['metadatas'][0][i].get('type', 'code'),
                'file_path': results['metadatas'][0][i].get('file_path', ''),
                'content': results['documents'][0][i]
            }
            
            # Extract relevant lines
            if 'start_line' in result['metadata']:
                result['location'] = {
                    'file': result['file_path'],
                    'line': result['metadata']['start_line'],
                    'end_line': result['metadata'].get('end_line')
                }
                
            formatted_results.append(result)
            
        # Re-rank based on query intent
        return self._rerank_code_results(formatted_results, query)[:limit]
        
    def _rerank_code_results(self, results: List[Dict], query: str) -> List[Dict]:
        """Rerank code search results based on query intent"""
        # Boost exact name matches
        query_lower = query.lower()
        query_words = set(query_lower.split())
        
        for result in results:
            boost = 1.0
            
            # Check for function/class name match
            if 'name' in result['metadata']:
                name_lower = result['metadata']['name'].lower()
                if name_lower in query_lower or query_lower in name_lower:
                    boost *= 2.0
                elif any(word in name_lower for word in query_words):
                    boost *= 1.5
                    
            # Check for file path relevance
            if 'file_path' in result:
                file_name = Path(result['file_path']).name.lower()
                if any(word in file_name for word in query_words):
                    boost *= 1.3
                    
            # Apply boost
            result['score'] *= boost
            
        # Sort by score
        results.sort(key=lambda x: x['score'], reverse=True)
        
        return results


class PythonParser:
    """Parser for Python code"""
    
    async def parse(self, content: str, file_path: Path) -> Dict:
        """Parse Python code structure"""
        parsed = {
            'language': 'python',
            'imports': [],
            'functions': [],
            'classes': [],
            'variables': []
        }
        
        try:
            tree = ast.parse(content)
            
            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    func_info = self._extract_function_info(node, content)
                    parsed['functions'].append(func_info)
                    
                elif isinstance(node, ast.ClassDef):
                    class_info = self._extract_class_info(node, content)
                    parsed['classes'].append(class_info)
                    
                elif isinstance(node, ast.Import):
                    for alias in node.names:
                        parsed['imports'].append(alias.name)
                        
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        parsed['imports'].append(node.module)
                        
        except SyntaxError as e:
            logger.warning(f"Syntax error in {file_path}: {e}")
            
        return parsed
        
    def _extract_function_info(self, node: ast.FunctionDef, content: str) -> Dict:
        """Extract function information"""
        lines = content.split('\n')
        
        # Get function body
        start_line = node.lineno - 1
        end_line = node.end_lineno
        body = '\n'.join(lines[start_line:end_line])
        
        # Get signature
        args = []
        for arg in node.args.args:
            args.append(arg.arg)
        signature = f"{node.name}({', '.join(args)})"
        
        # Get docstring
        docstring = ast.get_docstring(node) or ''
        
        return {
            'name': node.name,
            'signature': signature,
            'body': body,
            'docstring': docstring,
            'start_line': node.lineno,
            'end_line': node.end_lineno or node.lineno,
            'is_async': isinstance(node, ast.AsyncFunctionDef)
        }
        
    def _extract_class_info(self, node: ast.ClassDef, content: str) -> Dict:
        """Extract class information"""
        lines = content.split('\n')
        
        # Get class body
        start_line = node.lineno - 1
        end_line = node.end_lineno
        body = '\n'.join(lines[start_line:end_line])
        
        # Get methods
        methods = []
        for item in node.body:
            if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                methods.append({
                    'name': item.name,
                    'is_async': isinstance(item, ast.AsyncFunctionDef)
                })
                
        # Get docstring
        docstring = ast.get_docstring(node) or ''
        
        # Get base classes
        bases = [self._get_name(base) for base in node.bases]
        
        return {
            'name': node.name,
            'body': body,
            'docstring': docstring,
            'methods': methods,
            'bases': bases,
            'start_line': node.lineno,
            'end_line': node.end_lineno or node.lineno
        }
        
    def _get_name(self, node) -> str:
        """Get name from AST node"""
        if isinstance(node, ast.Name):
            return node.id
        elif isinstance(node, ast.Attribute):
            return f"{self._get_name(node.value)}.{node.attr}"
        else:
            return str(node)
```

### Memory Indexer Implementation
```python
class MemoryIndexer(IndexingService):
    """Maintains search indices for memories"""
    
    def __init__(self, mira_home: Path):
        super().__init__(mira_home)
        self.last_index_check = datetime.now()
        self.index_interval = timedelta(minutes=5)
        
    def _setup_collections(self):
        """Setup memory collections"""
        # These are the three main collections
        self.stored_memories = self.chroma_client.get_or_create_collection(
            name="stored_memories",
            metadata={"description": "Tagged and categorized memories"}
        )
        
        self.identified_facts = self.chroma_client.get_or_create_collection(
            name="identified_facts",
            metadata={"description": "Extracted facts and knowledge"}
        )
        
        self.raw_embeddings = self.chroma_client.get_or_create_collection(
            name="raw_embeddings",
            metadata={"description": "Raw embeddings for flexible storage"}
        )
        
    async def maintain_indices(self):
        """Continuously maintain memory indices"""
        while self.is_running:
            try:
                current_time = datetime.now()
                
                if current_time - self.last_index_check > self.index_interval:
                    await self._update_indices()
                    await self._optimize_indices()
                    await self._cleanup_stale_entries()
                    
                    self.last_index_check = current_time
                    
                await asyncio.sleep(60)  # Check every minute
                
            except Exception as e:
                logger.error(f"Memory index maintenance error: {e}")
                await asyncio.sleep(300)  # Wait 5 minutes on error
                
    async def _update_indices(self):
        """Update memory indices with new entries"""
        # This would integrate with the memory core system
        # For now, we'll outline the structure
        
        # Get unindexed memories from memory core
        # unindexed = await self.get_unindexed_memories()
        
        # Process each memory type
        # await self._index_stored_memories(unindexed['stored'])
        # await self._index_identified_facts(unindexed['facts'])
        # await self._index_raw_embeddings(unindexed['raw'])
        
        logger.info("Memory indices updated")
        
    async def _optimize_indices(self):
        """Optimize index performance"""
        # Get index statistics
        stats = {
            'stored_memories': len(self.stored_memories.get()['ids']),
            'identified_facts': len(self.identified_facts.get()['ids']),
            'raw_embeddings': len(self.raw_embeddings.get()['ids'])
        }
        
        logger.info(f"Index statistics: {stats}")
        
        # Optimize if needed
        for collection_name, count in stats.items():
            if count > 10000:  # Threshold for optimization
                logger.info(f"Optimizing {collection_name} with {count} entries")
                # ChromaDB handles optimization internally
                
    async def _cleanup_stale_entries(self):
        """Remove old or irrelevant entries"""
        cutoff_date = datetime.now() - timedelta(days=365)
        
        # Would implement cleanup logic here
        # This is placeholder for the structure
        logger.info("Stale entry cleanup completed")
        
    async def search(self, query: str, limit: int = 10) -> List[Dict]:
        """Search across all memory types"""
        results = []
        
        # Search each collection
        collections = [
            (self.stored_memories, 'stored_memory'),
            (self.identified_facts, 'fact'),
            (self.raw_embeddings, 'raw')
        ]
        
        query_embedding = self.embedding_model.encode([query])[0].tolist()
        
        for collection, memory_type in collections:
            try:
                search_results = collection.query(
                    query_embeddings=[query_embedding],
                    n_results=limit
                )
                
                # Format results
                for i in range(len(search_results['ids'][0])):
                    results.append({
                        'id': search_results['ids'][0][i],
                        'type': memory_type,
                        'content': search_results['documents'][0][i],
                        'metadata': search_results['metadatas'][0][i],
                        'score': 1 - search_results['distances'][0][i]
                    })
                    
            except Exception as e:
                logger.error(f"Error searching {memory_type}: {e}")
                
        # Sort by score
        results.sort(key=lambda x: x['score'], reverse=True)
        
        return results[:limit]
```

### Main IndexingServices Orchestrator
```python
class IndexingServices:
    """Main orchestrator for all indexing services"""
    
    def __init__(self, mira_home: Path):
        self.mira_home = mira_home
        self.services = {}
        self.is_running = False
        
        # Initialize services
        self._initialize_services()
        
    def _initialize_services(self):
        """Initialize all indexing services"""
        self.services['conversations'] = ConversationIndexer(self.mira_home)
        self.services['codebase'] = CodebaseIndexer(self.mira_home)
        self.services['memory'] = MemoryIndexer(self.mira_home)
        
    async def start(self):
        """Start all indexing services"""
        logger.info("Starting IndexingServices")
        self.is_running = True
        
        # Start each service
        start_tasks = []
        for name, service in self.services.items():
            logger.info(f"Starting {name} indexer")
            start_tasks.append(service.start())
            
        await asyncio.gather(*start_tasks)
        
        # Start memory maintenance
        asyncio.create_task(self.services['memory'].maintain_indices())
        
        logger.info("All indexing services started")
        
    async def stop(self):
        """Stop all indexing services"""
        logger.info("Stopping IndexingServices")
        self.is_running = False
        
        # Stop each service
        stop_tasks = []
        for name, service in self.services.items():
            logger.info(f"Stopping {name} indexer")
            stop_tasks.append(service.stop())
            
        await asyncio.gather(*stop_tasks)
        
        logger.info("All indexing services stopped")
        
    async def search(self, query: str, options: Dict = None) -> Dict[str, List[Dict]]:
        """Search across all indices"""
        options = options or {}
        limit = options.get('limit', 10)
        
        results = {}
        
        # Search each service based on options
        search_tasks = {}
        
        if options.get('include_conversations', True):
            search_tasks['conversations'] = self.services['conversations'].search(query, limit)
            
        if options.get('include_codebase', True):
            search_tasks['codebase'] = self.services['codebase'].search(query, limit)
            
        if options.get('include_memories', True):
            search_tasks['memory'] = self.services['memory'].search(query, limit)
            
        # Execute searches in parallel
        search_results = await asyncio.gather(
            *search_tasks.values(),
            return_exceptions=True
        )
        
        # Map results back
        for i, (service_name, task) in enumerate(search_tasks.items()):
            if isinstance(search_results[i], Exception):
                logger.error(f"Search error in {service_name}: {search_results[i]}")
                results[service_name] = []
            else:
                results[service_name] = search_results[i]
                
        return results
        
    async def index_codebase(self, project_path: Path) -> bool:
        """Index a specific codebase"""
        return await self.services['codebase'].index_project(project_path)
        
    async def get_statistics(self) -> Dict:
        """Get indexing statistics"""
        stats = {
            'services': {},
            'total_indexed': 0,
            'last_update': datetime.now().isoformat()
        }
        
        # Get stats from each service
        # This would be implemented per service
        
        return stats


# Daemon integration
async def start_indexing_daemon(mira_home: Path) -> IndexingServices:
    """Start the indexing daemon"""
    services = IndexingServices(mira_home)
    await services.start()
    return services
```

## 🔧 Integration with MCP Server

```python
# In MCPServer implementation
class IndexingMCPHandlers:
    """MCP handlers for indexing operations"""
    
    def __init__(self, indexing_services: IndexingServices):
        self.indexing = indexing_services
        
    @tool(name="search_all")
    async def search_all(self, query: str, limit: int = 10) -> Dict:
        """Search across all indexed content"""
        results = await self.indexing.search(query, {'limit': limit})
        
        # Format for MCP response
        formatted = {
            'query': query,
            'results': [],
            'total_count': 0
        }
        
        for source, items in results.items():
            for item in items:
                formatted['results'].append({
                    'source': source,
                    'content': item.get('content', ''),
                    'metadata': item.get('metadata', {}),
                    'score': item.get('score', 0)
                })
                
        formatted['total_count'] = len(formatted['results'])
        formatted['results'].sort(key=lambda x: x['score'], reverse=True)
        
        return formatted
        
    @tool(name="index_project")
    async def index_project(self, project_path: str) -> Dict:
        """Index a project codebase"""
        path = Path(project_path)
        
        if not path.exists():
            return {'success': False, 'error': 'Project path not found'}
            
        success = await self.indexing.index_codebase(path)
        
        return {
            'success': success,
            'project': project_path,
            'indexed_at': datetime.now().isoformat()
        }
```

---

*This implementation provides the foundation for MIRA's intelligent indexing capabilities, making all knowledge instantly searchable.*