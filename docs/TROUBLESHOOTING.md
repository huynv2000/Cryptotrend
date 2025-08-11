# Crypto Analytics Dashboard Pro - Troubleshooting Guide

## 📋 Overview

This comprehensive troubleshooting guide helps you diagnose and resolve common issues with the Crypto Analytics Dashboard Pro system. It covers installation problems, runtime errors, performance issues, and system failures.

## 🔍 Quick Diagnosis

### System Health Check

```bash
# Check system status
npm run health-check

# Check all services
curl http://localhost:3000/api/health

# Check database connection
npm run db:check

# Check API connectivity
npm run api:check
```

### Log Analysis

```bash
# View development logs
tail -f dev.log

# View production logs
tail -f server.log

# View application logs
tail -f logs/app.log

# Check error logs
grep -i error dev.log
```

## 🚀 Installation Issues

### Node.js Installation Problems

#### Issue: Node.js version not compatible
```bash
# Check current Node.js version
node --version

# Required: v18.0 or later
# Solution: Upgrade Node.js

# Using nvm
nvm install 20
nvm use 20

# Using package manager
# Ubuntu/Debian
sudo apt install nodejs npm

# macOS
brew install node

# Windows
# Download latest installer from nodejs.org
```

#### Issue: npm install fails
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install

# If still fails, try with --legacy-peer-deps
npm install --legacy-peer-deps
```

#### Issue: Permission denied
```bash
# macOS/Linux
sudo chown -R $USER:$USER node_modules
sudo chown -R $USER:$USER .next

# Windows
# Run Command Prompt as Administrator
takeown /f node_modules /r /d y
icacls node_modules /grant administrators:F /t
```

### Database Issues

#### Issue: Database file not found
```bash
# Create db directory
mkdir -p db

# Set proper permissions
chmod 755 db

# Reinitialize database
npm run db:push
npm run db:seed
```

#### Issue: Prisma client not generated
```bash
# Generate Prisma client
npm run db:generate

# If fails, try:
npx prisma generate

# Check Prisma schema
npx prisma validate
```

#### Issue: Database migration errors
```bash
# Reset database (development only)
npm run db:reset

# Manual migration
npx prisma migrate dev

# Check database status
npx prisma db status
```

### Environment Variables Issues

#### Issue: Missing required environment variables
```bash
# Check environment file
cat .env

# Copy from template
cp .env.example .env

# Edit environment file
nano .env  # or code .env

# Validate environment
npm run validate-config
```

#### Issue: Invalid API keys
```bash
# Test API connectivity
npm run api:check

# Check API key format
# OpenAI: sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Z.AI: should be a valid API key
# CoinGecko: should be a valid API key

# Regenerate API keys if necessary
```

## 🌐 Network and Connectivity Issues

### Port Already in Use

#### Issue: Port 3000 is already occupied
```bash
# Find process using port 3000
# macOS/Linux
sudo lsof -i :3000

# Windows
netstat -ano | findstr :3000

# Kill the process
# macOS/Linux
sudo kill -9 <PID>

# Windows
taskkill /PID <PID> /F

# Or use different port
PORT=3001 npm run dev
```

### API Connectivity Issues

#### Issue: Cannot connect to external APIs
```bash
# Test internet connectivity
ping google.com

# Test specific API endpoints
curl -I https://api.coingecko.com/api/v3/ping
curl -I https://api.openai.com/v1/models

# Check firewall settings
# macOS/Linux
sudo ufw status

# Windows
netsh advfirewall show allprofiles

# Check proxy settings
echo $HTTP_PROXY
echo $HTTPS_PROXY
```

#### Issue: Rate limiting errors
```bash
# Check rate limit status
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/rate_limits

# Reduce request frequency
# Edit .env file
RATE_LIMIT_REQUESTS_PER_MINUTE=30

# Implement exponential backoff
# System automatically retries failed requests
```

## 🤖 AI and Analysis Issues

### OpenAI API Issues

#### Issue: OpenAI API authentication failed
```bash
# Verify API key
echo $OPENAI_API_KEY

# Test API key
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models

# Check API key format
# Should start with "sk-"
# Should be 51 characters long

# Regenerate API key if needed
# Visit https://platform.openai.com/api-keys
```

#### Issue: OpenAI API rate limits exceeded
```bash
# Check current usage
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/rate_limits

# Reduce request frequency
# Edit configuration
AI_REQUEST_DELAY=1000  # milliseconds between requests

# Use fallback AI provider
ENABLE_Z_AI_FALLBACK=true
```

### Z.AI API Issues

#### Issue: Z.AI API connection failed
```bash
# Verify Z.AI configuration
echo $ZAI_API_KEY
echo $ZAI_BASE_URL

# Test API connectivity
curl -H "Authorization: Bearer $ZAI_API_KEY" $ZAI_BASE_URL/health

# Check API key format
# Should be a valid Z.AI API key

# Regenerate API key if needed
# Visit https://z-ai.dev/dashboard
```

#### Issue: AI analysis timeout
```bash
# Increase timeout settings
AI_TIMEOUT=30000  # 30 seconds

# Reduce analysis complexity
AI_MAX_TOKENS=1000
AI_TEMPERATURE=0.5

# Enable caching
ENABLE_AI_CACHING=true
AI_CACHE_TTL=3600  # 1 hour
```

## 📊 Data Collection Issues

### CoinGecko API Issues

#### Issue: CoinGecko API rate limits
```bash
# Check API key status
curl -H "x-cg-demo-api-key: $COINGECKO_DEMO_KEY" https://api.coingecko.com/api/v3/ping

# Upgrade to Pro plan for higher limits
# Visit https://www.coingecko.com/api

# Implement request throttling
COINGECKO_REQUEST_DELAY=1000  # milliseconds
```

#### Issue: Missing cryptocurrency data
```bash
# Check if coin exists
curl "https://api.coingecko.com/api/v3/coins/bitcoin"

# Verify coin ID in database
npx prisma studio

# Re-seed default coins
npm run db:seed
```

### Data Collection Failures

#### Issue: Data collection not running
```bash
# Check collection status
curl http://localhost:3000/api/collection/status

# Manually trigger collection
curl -X POST http://localhost:3000/api/collection/trigger

# Check collection logs
grep -i collection dev.log
```

#### Issue: Data collection errors
```bash
# Check error logs
grep -i error dev.log | grep collection

# Reset collection status
curl -X POST http://localhost:3000/api/collection/reset

# Verify API keys
npm run api:check
```

## 🎨 Frontend Issues

### Build Errors

#### Issue: Next.js build fails
```bash
# Clean build artifacts
rm -rf .next

# Rebuild
npm run build

# Check for TypeScript errors
npm run lint

# Check for missing dependencies
npm audit
```

#### Issue: CSS/styling issues
```bash
# Check Tailwind CSS configuration
npx tailwindcss --help

# Rebuild CSS
npm run build:css

# Check for missing CSS imports
grep -r "import.*css" src/
```

### Runtime Errors

#### Issue: Page not found (404)
```bash
# Check routing configuration
ls src/app/

# Verify page structure
ls src/app/page.tsx

# Check for missing files
find src -name "*.tsx" -o -name "*.ts"
```

#### Issue: Component errors
```bash
# Check browser console
# Open Developer Tools > Console

# Check for missing props
# Review component props interface

# Check for undefined values
# Add console.log statements
```

## 🔧 Performance Issues

### Memory Issues

#### Issue: High memory usage
```bash
# Check memory usage
# macOS/Linux
top -p $(pgrep -f "node.*next")

# Windows
tasklist | findstr node

# Optimize memory usage
# Edit .env
NODE_OPTIONS="--max-old-space-size=4096"

# Restart application
```

#### Issue: Memory leaks
```bash
# Monitor memory over time
# Use Chrome DevTools Memory tab

# Check for event listeners
# Review useEffect cleanup

# Check for circular references
# Review component dependencies
```

### Performance Optimization

#### Issue: Slow page load
```bash
# Check bundle size
npm run analyze

# Optimize images
# Use next/image component

# Enable caching
# Configure proper cache headers
```

#### Issue: Slow API responses
```bash
# Check API response times
curl -w "@{time_total}\n" -o /dev/null -s http://localhost:3000/api/health

# Enable database indexing
# Review Prisma schema

# Optimize database queries
# Use query optimization
```

## 🔄 WebSocket Issues

### Connection Issues

#### Issue: WebSocket connection failed
```bash
# Check WebSocket server status
curl -I http://localhost:3000/api/socketio

# Check WebSocket configuration
echo $SOCKET_IO_PORT
echo $SOCKET_IO_PATH

# Test WebSocket connection
# Use browser DevTools > Network > WS
```

#### Issue: Real-time updates not working
```bash
# Check WebSocket logs
grep -i socket dev.log

# Verify client-side connection
# Check browser console for errors

# Test manual connection
# Use WebSocket testing tool
```

## 🚨 Critical Issues

### Application Crashes

#### Issue: Application crashes on startup
```bash
# Check error logs
tail -f server.log

# Check for uncaught exceptions
grep -i error server.log

# Verify environment variables
npm run validate-config

# Test minimal startup
NODE_ENV=development npm start
```

#### Issue: Application crashes during operation
```bash
# Check for memory issues
# Monitor memory usage

# Check for unhandled promises
# Add proper error handling

# Check for infinite loops
# Review recursive functions
```

### Data Corruption

#### Issue: Database corruption
```bash
# Backup current database
cp db/custom.db db/custom.db.backup

# Reset database
npm run db:reset

# Restore from backup if needed
cp db/custom.db.backup db/custom.db
```

#### Issue: Configuration corruption
```bash
# Backup current configuration
cp .env .env.backup

# Reset to defaults
cp .env.example .env

# Restore from backup if needed
cp .env.backup .env
```

## 🛠️ Advanced Troubleshooting

### Debug Mode

#### Enable Debug Logging
```bash
# Set debug mode
export DEBUG=*

# Run application
npm run dev

# Check debug output
grep -i debug dev.log
```

#### Enable Verbose Output
```bash
# Enable verbose logging
LOG_LEVEL=debug npm run dev

# Check verbose logs
tail -f dev.log
```

### Performance Profiling

#### CPU Profiling
```bash
# Start with CPU profiling
node --prof server.js

# Generate profile report
node --prof-process isolate-0xnnnnnnnnnnnn-v8.log > profile.txt

# Analyze profile
# Use Chrome DevTools > Performance
```

#### Memory Profiling
```bash
# Generate heap snapshot
node --inspect server.js

# Connect Chrome DevTools
# Open chrome://inspect
# Take heap snapshot
```

### Network Analysis

#### Packet Capture
```bash
# Capture network traffic
# macOS/Linux
sudo tcpdump -i any -w capture.pcap port 3000

# Windows
netsh trace start capture=yes persistent=yes
# ... run application ...
netsh trace stop

# Analyze capture
# Use Wireshark
```

#### API Analysis
```bash
# Monitor API calls
# Use browser DevTools > Network

# Test API endpoints
curl -v http://localhost:3000/api/health

# Check response headers
curl -I http://localhost:3000/api/health
```

## 📚 Common Error Codes and Solutions

### HTTP Status Codes

#### 400 Bad Request
```bash
# Cause: Invalid request parameters
# Solution: Check request body and headers
# Verify data format and types
```

#### 401 Unauthorized
```bash
# Cause: Invalid authentication
# Solution: Check API keys
# Verify authentication headers
```

#### 403 Forbidden
```bash
# Cause: Insufficient permissions
# Solution: Check API key permissions
# Verify rate limits
```

#### 404 Not Found
```bash
# Cause: Resource not found
# Solution: Check URL path
# Verify resource exists
```

#### 429 Too Many Requests
```bash
# Cause: Rate limit exceeded
# Solution: Reduce request frequency
# Implement backoff strategy
```

#### 500 Internal Server Error
```bash
# Cause: Server error
# Solution: Check server logs
# Verify database connection
```

#### 502 Bad Gateway
```bash
# Cause: Gateway error
# Solution: Check proxy configuration
# Verify upstream services
```

#### 503 Service Unavailable
```bash
# Cause: Service overload
# Solution: Check server resources
# Implement load balancing
```

### Database Error Codes

#### Prisma Errors
```bash
# P1001: Can't reach database
# Solution: Check database file path
# Verify file permissions

# P2002: Unique constraint violation
# Solution: Check for duplicate entries
# Verify unique constraints

# P2003: Foreign key constraint violation
# Solution: Check related records
# Verify foreign key relationships

# P2025: Record not found
# Solution: Check record existence
# Verify query conditions
```

## 🆘 Emergency Recovery

### Complete System Reset

#### Warning: This will delete all data
```bash
# Stop application
# macOS/Linux
pkill -f "node.*next"

# Windows
taskkill /F /IM node.exe

# Backup important data
cp -r db/ db.backup/
cp .env .env.backup

# Remove all generated files
rm -rf .next node_modules db/custom.db

# Reinstall dependencies
npm install

# Reinitialize database
npm run db:push
npm run db:seed

# Restore configuration
cp .env.backup .env

# Restart application
npm run dev
```

### Data Recovery

#### From Database Backup
```bash
# Restore from backup
cp db/custom.db.backup db/custom.db

# Verify data integrity
npm run db:check
```

#### From Logs
```bash
# Extract data from logs
grep -i "price.*bitcoin" dev.log > bitcoin_prices.log

# Parse and import data
# Use custom script to import parsed data
```

## 📞 Getting Help

### Community Support

#### GitHub Issues
- Create detailed issue report
- Include error logs and system information
- Provide steps to reproduce

#### Documentation
- Check official documentation
- Review configuration guides
- Consult API references

### Professional Support

#### Debugging Services
- Remote debugging sessions
- Performance optimization
- Security audits

#### Custom Development
- Feature requests
- Custom integrations
- Performance tuning

---

**Note**: Always backup your data before attempting major troubleshooting steps. If you're unsure about any procedure, seek professional assistance or consult the community forums.