# Test Script for Bazar.com Part II

This script provides step-by-step commands to test all Part II features: Caching, Replication, and Consistency.

## Prerequisites

Make sure all services are running:
```bash
docker-compose up --build
```

Or manually start all services as described in DESIGN_DOCUMENT.md.

---

## Test 1: Basic Functionality

### Test 1.1: Search Books
```bash
# Search for distributed systems books
curl http://localhost:5000/search/distributed%20systems

# Expected output:
# {"books":[{"id":1,"title":"How to get a good grade in DOS in 40 minutes a day"},{"id":2,"title":"RPCs for Noobs"}]}
```

### Test 1.2: Get Book Info
```bash
# Get info for book ID 1
curl http://localhost:5000/info/1

# Expected output:
# {"title":"How to get a good grade in DOS in 40 minutes a day","quantity":10,"price":50}
```

### Test 1.3: Purchase Book
```bash
# Purchase book ID 1
curl -X POST http://localhost:5000/purchase/1

# Expected output:
# {"message":"Purchase successful","order":{...}}
```

---

## Test 2: Caching Functionality

### Test 2.1: Cache Miss (First Request)
```bash
# First request - should be cache MISS
curl http://localhost:5000/info/2

# Check frontend logs - should show:
# "Cache MISS for info: 2"
```

### Test 2.2: Cache Hit (Second Request)
```bash
# Second request - should be cache HIT
curl http://localhost:5000/info/2

# Check frontend logs - should show:
# "Cache HIT for info: 2"
# Response should be much faster (~3ms vs ~45ms)
```

### Test 2.3: Cache Statistics
```bash
# Check cache size
curl http://localhost:5000/cache/stats

# Expected output:
# {"cacheSize":X,"maxSize":50}
```

---

## Test 3: Cache Invalidation

### Test 3.1: Cache Before Purchase
```bash
# Request book info (cache it)
curl http://localhost:5000/info/3

# Expected: quantity = 8
# Check logs: "Cache MISS for info: 3"
```

### Test 3.2: Request Again (Cache Hit)
```bash
# Request same book (from cache)
curl http://localhost:5000/info/3

# Expected: quantity = 8 (same)
# Check logs: "Cache HIT for info: 3"
```

### Test 3.3: Purchase Book (Invalidate Cache)
```bash
# Purchase the book
curl -X POST http://localhost:5000/purchase/3

# Check logs:
# Frontend: "Cache INVALIDATED for book: 3"
# Catalog: "Cache invalidation sent to frontend for book 3"
```

### Test 3.4: Verify Cache Invalidation
```bash
# Request book info again
curl http://localhost:5000/info/3

# Expected: quantity = 7 (decreased by 1)
# Check logs: "Cache MISS for info: 3" (cache was invalidated)
```

---

## Test 4: Load Balancing

### Test 4.1: Multiple Requests to Catalog
```bash
# Send 4 requests
curl http://localhost:5000/info/1
curl http://localhost:5000/info/2
curl http://localhost:5000/info/3
curl http://localhost:5000/info/4

# Check catalog logs:
# Replica 1 (5003) should handle requests 1 and 3
# Replica 2 (5004) should handle requests 2 and 4
```

### Test 4.2: Multiple Purchase Requests
```bash
# Send 2 purchase requests
curl -X POST http://localhost:5000/purchase/1
curl -X POST http://localhost:5000/purchase/2

# Check order logs:
# Order Replica 1 (5002) should handle first request
# Order Replica 2 (5005) should handle second request
```

---

## Test 5: Replica Synchronization

### Test 5.1: Catalog Replica Sync
```bash
# Update book on catalog (will sync to other replica)
curl -X PUT http://localhost:5003/update/1 \
  -H "Content-Type: application/json" \
  -d '{"price":55}'

# Check logs:
# Catalog 1: "Synced with replica: http://localhost:5004"
# Catalog 2: "Synced book 1 from another replica"
```

### Test 5.2: Verify Sync
```bash
# Check book on both replicas
curl http://localhost:5003/info/1
curl http://localhost:5004/info/1

# Both should return: "price":55
```

### Test 5.3: Order Replica Sync
```bash
# Purchase book (will sync order to other replica)
curl -X POST http://localhost:5000/purchase/4

# Check logs:
# Order 1: "Order synced with replica: http://localhost:5005"
# Order 2: "Received order sync: Order XXXXX"
```

---

## Test 6: Cache Consistency

### Test 6.1: Consistency After Update
```bash
# Step 1: Cache book info
curl http://localhost:5000/info/1

# Step 2: Update book directly on catalog
curl -X PUT http://localhost:5003/update/1 \
  -H "Content-Type: application/json" \
  -d '{"quantity":20}'

# Step 3: Request book info from frontend
curl http://localhost:5000/info/1

# Expected: quantity = 20 (cache was invalidated)
# Check logs: "Cache invalidated by backend for book: 1"
```

### Test 6.2: Consistency After Purchase
```bash
# Step 1: Get initial quantity
curl http://localhost:5000/info/2
# Note the quantity (e.g., 5)

# Step 2: Purchase book
curl -X POST http://localhost:5000/purchase/2

# Step 3: Get updated quantity
curl http://localhost:5000/info/2
# Quantity should be decreased by 1 (e.g., 4)
```

---

## Test 7: Error Handling

### Test 7.1: Out of Stock
```bash
# Purchase all copies of a book
curl -X POST http://localhost:5000/purchase/4
curl -X POST http://localhost:5000/purchase/4
curl -X POST http://localhost:5000/purchase/4

# Try to purchase when out of stock
curl -X POST http://localhost:5000/purchase/4

# Expected output:
# {"error":"Book out of stock"}
```

### Test 7.2: Invalid Book ID
```bash
# Request non-existent book
curl http://localhost:5000/info/999

# Expected output:
# {"error":"Failed to get book info"}
```

---

## Test 8: Performance Measurement

### Test 8.1: Measure Cache Hit Performance
```bash
# Use time command to measure response time

# Cache MISS (first request)
time curl http://localhost:5000/info/1
# Expected: ~45-50ms

# Cache HIT (second request)
time curl http://localhost:5000/info/1
# Expected: ~2-3ms (93% faster!)
```

### Test 8.2: Measure Cache Hit Rate
```bash
# Send 10 requests (5 unique books, 2 requests each)
for i in {1..2}; do
  curl http://localhost:5000/info/1
  curl http://localhost:5000/info/2
  curl http://localhost:5000/info/3
  curl http://localhost:5000/info/4
  curl http://localhost:5000/info/1
done

# Check logs:
# Expected: 5 cache misses, 5 cache hits
# Hit rate: 50%
```

---

## Test 9: Complete Workflow

### Scenario: Customer Searches and Purchases Book
```bash
# Step 1: Search for books
curl http://localhost:5000/search/distributed%20systems
# Output: List of books

# Step 2: Get details of first book
curl http://localhost:5000/info/1
# Output: Book details with quantity

# Step 3: Purchase the book
curl -X POST http://localhost:5000/purchase/1
# Output: Purchase confirmation

# Step 4: Verify quantity decreased
curl http://localhost:5000/info/1
# Output: Quantity decreased by 1

# Step 5: Check cache stats
curl http://localhost:5000/cache/stats
# Output: Cache size and usage
```

---

## Test 10: Stress Test (Optional)

### Test 10.1: Multiple Concurrent Requests
```bash
# Send 100 requests in parallel (requires bash)
for i in {1..100}; do
  curl http://localhost:5000/info/$((i % 4 + 1)) &
done
wait

# Check logs to verify:
# - Load balancing works correctly
# - Cache hit rate improves over time
# - No errors or crashes
```

---

## Expected Results Summary

After running all tests, you should observe:

✅ **Caching**:
- Cache hits return data in ~3ms
- Cache misses take ~45ms
- Cache hit rate: 60-70% for realistic patterns

✅ **Load Balancing**:
- Requests distributed 50/50 between replicas
- Round-robin pattern visible in logs

✅ **Cache Invalidation**:
- Cache cleared after purchases
- Cache cleared after updates
- No stale data served

✅ **Replica Synchronization**:
- All replicas stay in sync
- Updates propagate within 5-10ms
- 100% synchronization success

✅ **Consistency**:
- Strong consistency maintained
- Fresh data after invalidation
- Correct quantity tracking

---

## Troubleshooting

### Services Not Starting
```bash
# Check if ports are already in use
netstat -ano | findstr :5000
netstat -ano | findstr :5002
netstat -ano | findstr :5003
netstat -ano | findstr :5004
netstat -ano | findstr :5005

# Kill processes if needed
taskkill /PID <PID> /F
```

### Cache Not Working
```bash
# Check frontend logs for cache messages
# Should see "Cache HIT" or "Cache MISS"

# Verify cache stats
curl http://localhost:5000/cache/stats
```

### Replicas Not Syncing
```bash
# Check network connectivity
curl http://localhost:5003/info/1
curl http://localhost:5004/info/1

# Check logs for sync messages
# Should see "Synced with replica" messages
```

---

## Automated Test Script (Bash)

Save this as `run_tests.sh`:

```bash
#!/bin/bash

echo "=== Bazar.com Part II Test Suite ==="
echo ""

echo "Test 1: Search Books"
curl -s http://localhost:5000/search/distributed%20systems | jq
echo ""

echo "Test 2: Get Book Info (Cache Miss)"
curl -s http://localhost:5000/info/1 | jq
echo ""

echo "Test 3: Get Book Info (Cache Hit)"
curl -s http://localhost:5000/info/1 | jq
echo ""

echo "Test 4: Purchase Book"
curl -s -X POST http://localhost:5000/purchase/1 | jq
echo ""

echo "Test 5: Verify Cache Invalidation"
curl -s http://localhost:5000/info/1 | jq
echo ""

echo "Test 6: Cache Statistics"
curl -s http://localhost:5000/cache/stats | jq
echo ""

echo "=== All Tests Complete ==="
```

Run with:
```bash
bash run_tests.sh
```

---

## Conclusion

This test script covers all Part II requirements:
- ✅ Caching with LRU policy
- ✅ Load balancing across replicas
- ✅ Cache invalidation and consistency
- ✅ Replica synchronization
- ✅ Performance improvements

All tests should pass successfully, demonstrating a fully functional distributed system with caching and replication.
