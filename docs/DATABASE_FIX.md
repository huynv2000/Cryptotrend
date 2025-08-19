# Database Connectivity Fix Guide

## Problem Description
The system was experiencing database connectivity issues with the error:
```
Execute returned results, which is not allowed in SQLite
```

## Root Cause
The issue was in `/src/lib/system-test.ts` at line 60, where `$executeRaw` was used for a `SELECT` query:
```typescript
await db.$executeRaw`SELECT 1`
```

In SQLite, `$executeRaw` is only meant for queries that don't return results (INSERT, UPDATE, DELETE). For SELECT queries, `$queryRaw` should be used instead.

## Solution Applied

### 1. Fixed System Test Database Connectivity Test
**File**: `/src/lib/system-test.ts`
**Line**: 60

**Before**:
```typescript
await db.$executeRaw`SELECT 1`
```

**After**:
```typescript
await db.$queryRaw`SELECT 1 as test`
```

### 2. Why This Fix Works
- `$queryRaw`: Used for queries that return results (SELECT)
- `$executeRaw`: Used for queries that don't return results (INSERT, UPDATE, DELETE)
- Added `as test` alias to make the query more explicit

## Testing the Fix

### Quick Test Commands
```bash
# Test system health
curl -s "http://localhost:3000/api/system-health"

# Test database debug endpoint
curl -s "http://localhost:3000/api/debug/database"

# Test dashboard API
curl -s "http://localhost:3000/api/dashboard?coinId=bitcoin"
```

### Expected Results
1. **System Health**: Database Connectivity should show "PASS"
2. **Database Debug**: Should show cryptocurrency data and counts
3. **Dashboard API**: Should return real price data

### Automated Test Script
```bash
# Run the comprehensive test script
./scripts/test-database-fix.sh
```

## Verification Steps

### 1. Check Database Status
```bash
curl -s "http://localhost:3000/api/system-health" | jq '.tests[] | select(.name == "Database Connectivity")'
```

**Expected Output**:
```json
{
  "name": "Database Connectivity",
  "status": "PASS",
  "duration": 2,
  "message": "Successfully connected to database"
}
```

### 2. Verify Data Access
```bash
curl -s "http://localhost:3000/api/debug/database" | jq '.counts'
```

**Expected Output**:
```json
{
  "cryptocurrencies": 5,
  "priceHistory": 5,
  "volumeHistory": 0,
  "technicalIndicators": 5,
  "onChainMetrics": 5,
  "sentimentMetrics": 0,
  "derivativeMetrics": 5
}
```

### 3. Test API Endpoints
```bash
# Test dashboard with bitcoin
curl -s "http://localhost:3000/api/dashboard?coinId=bitcoin" | jq '.price.usd'

# Test trading signals
curl -s "http://localhost:3000/api/trading-signals-fast?action=signal&coinId=bitcoin" | jq '.signal.signal'
```

## Additional Checks

### 1. Prisma Validation
```bash
npx prisma db validate
```

### 2. Database Schema Check
```bash
npx prisma db push
```

### 3. Check for Similar Issues
Search for other potential `$executeRaw` misuse:
```bash
grep -r "\$executeRaw.*SELECT" src/
grep -r "\$executeRaw" src/
```

## Prevention Measures

### 1. Code Review Guidelines
- Always use `$queryRaw` for SELECT queries
- Use `$executeRaw` only for INSERT, UPDATE, DELETE
- Consider using Prisma ORM methods instead of raw queries when possible

### 2. Testing Strategy
- Include database connectivity tests in CI/CD pipeline
- Test both query types (SELECT and modifications)
- Monitor database performance and error rates

### 3. Monitoring
- Monitor system health endpoint regularly
- Set up alerts for database connectivity failures
- Log database query errors for debugging

## Troubleshooting

### If Issues Persist
1. **Check Database File**: Ensure the database file exists at the correct path
2. **Verify Prisma Client**: Regenerate Prisma client if needed
3. **Check File Permissions**: Ensure the application has read/write access to the database file
4. **Restart Application**: Sometimes a restart is needed after code changes

### Common Error Messages
- `"Execute returned results, which is not allowed in SQLite"`: Use `$queryRaw` instead of `$executeRaw`
- `"No such file or directory"`: Check database file path and permissions
- `"Database is locked"`: Check for concurrent access issues

## Success Criteria
The fix is successful when:
1. System health shows "Database Connectivity: PASS"
2. All database-related APIs return data correctly
3. No SQLite raw query errors in logs
4. Health percentage improves from 75% to higher