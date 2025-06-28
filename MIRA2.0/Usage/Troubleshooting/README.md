# Troubleshooting Guide - MIRA 2.0

## 🎯 Overview

This guide helps you diagnose and fix common issues with MIRA. Most problems have simple solutions, and MIRA includes built-in diagnostics to help.

## 🚨 Common Issues & Solutions

### MIRA Won't Start

#### Symptom: `mira startup` fails or hangs

**Quick Fix:**
```bash
# Check if daemon is already running
mira daemon status

# If stuck, restart
mira daemon restart

# Check logs for errors
tail -f ~/.mira/logs/daemon.log
```

**Root Causes:**
- Port 7890 already in use (MCP server)
- Corrupted daemon socket
- Database connection issues

**Full Solution:**
```bash
# 1. Stop everything
mira daemon stop

# 2. Clean up
rm ~/.mira/daemon.sock
rm ~/.mira/daemon.pid

# 3. Check ports
lsof -i :7890  # Should show nothing

# 4. Restart
mira startup
```

### MCP Server Not Responding

#### Symptom: Claude can't connect to MIRA functions

**Quick Fix:**
```bash
# Test MCP health
curl http://localhost:7890/health

# If no response, restart daemon
mira daemon restart
```

**Diagnostic Steps:**
```bash
# 1. Check if MCP is running
mira daemon status | grep MCP

# 2. Test MCP discovery
curl http://localhost:7890/mcp/discover

# 3. Check firewall
sudo lsof -i :7890
```

**Common Solutions:**
- Firewall blocking localhost connections
- Another service using port 7890
- MCP server didn't start with daemon

### Search Not Finding Expected Results

#### Symptom: `mira recall` returns nothing or wrong results

**Quick Fix:**
```bash
# Rebuild search index
mira daemon rebuild-index

# Try broader search
mira recall "authentication"  # Instead of specific terms
```

**Diagnostic Steps:**
```javascript
// Test via MCP
const result = await mcp.call('search', {
    query: 'test query'
});
console.log(result);  // Check what's returned

// Try different search types
await mcp.call('code_search', {query: 'function name'});
```

**Common Causes:**
- Memories not yet indexed (wait 30 seconds)
- Too specific search terms
- Wrong storage system being searched

### Memory Storage Failing

#### Symptom: `mira store` appears to work but memories aren't saved

**Quick Fix:**
```bash
# Check storage health
mira status --storage

# Test storage directly
mira store "Test memory $(date)" && mira recall "Test memory"
```

**Diagnostic Steps:**
```bash
# 1. Check disk space
df -h ~/.mira

# 2. Verify permissions
ls -la ~/.mira/databases/

# 3. Test each storage system
mira debug storage-test
```

**Common Solutions:**
- Disk full (clean up ~/.mira/databases/)
- Permission issues (chmod -R 755 ~/.mira)
- Database corruption (backup and recreate)

### High Memory/CPU Usage

#### Symptom: System slows down when MIRA is running

**Quick Fix:**
```bash
# Check resource usage
mira daemon stats

# Reduce background analysis
mira config set daemon.analysis.interval 300  # 5 minutes instead of 1
```

**Performance Tuning:**
```json
// ~/.mira/config/settings.json
{
  "daemon": {
    "analysis": {
      "enabled": true,
      "interval": 300,        // Seconds between analysis
      "maxConcurrent": 2      // Parallel analysis tasks
    },
    "indexing": {
      "batchSize": 100,       // Documents per batch
      "throttleMs": 100       // Delay between batches
    }
  }
}
```

### Session Context Missing

#### Symptom: `mira startup` doesn't show previous work

**Quick Fix:**
```bash
# Force context rebuild
mira daemon rebuild-context

# Check session bridges
mira debug session-bridges --recent
```

**Common Causes:**
- Session bridge expired (>30 days)
- Different project directory
- Git branch changed

**Solution:**
```bash
# 1. Verify you're in the right directory
pwd
git status

# 2. Check for session data
ls ~/.mira/databases/lightning_vidmem/conversations/

# 3. Manually search for context
mira recall "recent work on $(git branch --show-current)"
```

## 🔧 Diagnostic Commands

### System Health Check

```bash
# Complete health check
mira diagnose

# Output includes:
# ✓ Daemon Status
# ✓ Storage Health  
# ✓ Memory Count
# ✓ Index Status
# ✓ MCP Server
# ✓ Disk Usage
# ✓ Performance Metrics
```

### Component-Specific Checks

```bash
# Storage systems
mira debug storage
- Lightning Vidmem: OK (1.2GB)
- ChromaDB: OK (842MB)
- FAISS Index: OK (124MB)

# Memory statistics
mira stats memory
- Total Memories: 5,432
- Private: 234
- Decisions: 567
- Insights: 1,890

# Search performance
mira debug search-performance
- Average query time: 127ms
- Index size: 5.4M vectors
- Cache hit rate: 67%
```

### Log Analysis

```bash
# View recent errors
mira logs errors --recent

# Follow daemon logs
mira logs daemon --follow

# Search logs
mira logs search "ERROR|WARN" --since "1 hour ago"
```

## 🛠️ Advanced Troubleshooting

### Database Issues

#### ChromaDB Corruption
```bash
# Backup current data
cp -r ~/.mira/databases/chromadb ~/.mira/databases/chromadb.backup

# Rebuild from Lightning Vidmem
mira daemon rebuild-chromadb

# Verify
mira debug storage --verify
```

#### Lightning Vidmem Recovery
```bash
# Check frame integrity
mira debug lightning-frames --verify

# Repair corrupted frames
mira debug lightning-repair

# Rebuild index
mira daemon rebuild-index --lightning
```

### MCP Connection Issues

#### Test MCP Manually
```python
# test_mcp.py
import asyncio
import aiohttp

async def test_mcp():
    async with aiohttp.ClientSession() as session:
        # Test health
        async with session.get('http://localhost:7890/health') as resp:
            print(f"Health: {await resp.json()}")
        
        # Test function call
        async with session.post(
            'http://localhost:7890/mcp',
            json={'function': 'status', 'params': {}}
        ) as resp:
            print(f"Status: {await resp.json()}")

asyncio.run(test_mcp())
```

#### Debug MCP Registration
```bash
# Check registered functions
curl http://localhost:7890/mcp/discover | jq '.functions | keys'

# Should show:
# ["analyze", "code_analyze", "code_search", "profile", 
#  "recall", "search", "status", "store"]
```

### Performance Optimization

#### Slow Searches
```bash
# Analyze search performance
mira debug search-trace "your query"

# Shows:
# - Query parsing: 12ms
# - Embedding generation: 45ms
# - FAISS search: 23ms
# - ChromaDB search: 89ms
# - Result merging: 15ms
# Total: 184ms
```

#### Memory Optimization
```bash
# Reduce cache sizes
mira config set cache.embeddings.maxSize 5000
mira config set cache.search.ttl 60

# Disable unused features
mira config set daemon.analysis.patterns false
mira config set daemon.contemplation false
```

## 🔄 Recovery Procedures

### Complete Reset (Last Resort)

```bash
# 1. Backup everything
mira export --all --output mira-backup.tar.gz

# 2. Stop daemon
mira daemon stop

# 3. Reset configuration
mv ~/.mira ~/.mira.old
mira init

# 4. Restore data
mira import mira-backup.tar.gz

# 5. Restart
mira startup
```

### Selective Recovery

```bash
# Just reset daemon
mira daemon reset

# Just rebuild indexes
mira daemon rebuild-index --all

# Just clear caches
mira cache clear --all
```

## 📞 Getting Help

### Built-in Help
```bash
# General help
mira help

# Command-specific help
mira help recall
mira help daemon

# Diagnostic report
mira diagnose --report > mira-diagnostic.txt
```

### Debug Mode
```bash
# Run with debug output
MIRA_DEBUG=true mira startup

# Verbose logging
MIRA_LOG_LEVEL=debug mira daemon start
```

### Community Support
- GitHub Issues: Report bugs and request features
- Discussions: Ask questions and share tips
- Wiki: Additional troubleshooting guides

## 🎯 Prevention Tips

1. **Regular Maintenance**
   ```bash
   # Weekly
   mira maintenance clean-cache
   
   # Monthly  
   mira maintenance optimize-db
   ```

2. **Monitor Health**
   ```bash
   # Add to shell profile
   alias mira-health='mira status --brief'
   ```

3. **Backup Important Data**
   ```bash
   # Automated backups
   mira config set backup.enabled true
   mira config set backup.frequency daily
   ```

---

*Most MIRA issues are easy to fix. When in doubt, `mira daemon restart` solves 90% of problems. For persistent issues, the diagnostic commands will help identify the root cause.*