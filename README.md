# Bazar.com - Online Book Store (Part II)

## Project Overview
Distributed online bookstore system with **Caching**, **Replication**, and **Consistency** features.

## Features (Part II)
✅ **In-Memory Caching** - LRU cache with 50-item limit  
✅ **Load Balancing** - Round-robin across replicas  
✅ **Replication** - 2 replicas each for Catalog and Order services  
✅ **Cache Invalidation** - Server-push mechanism for consistency  
✅ **Replica Synchronization** - Automatic data sync between replicas  

## System Architecture
- **Frontend Server** (1 instance, Port 5000) - Handles caching and load balancing
- **Catalog Service** (2 replicas, Ports 5003, 5004) - Book catalog management
- **Order Service** (2 replicas, Ports 5002, 5005) - Order processing

## Quick Start

### Using Docker Compose (Recommended)
```bash
docker-compose up --build
```

### Manual Start
```bash
# Terminal 1 - Catalog Replica 1
cd catalog_service
PORT=5003 node catalog_server.js

# Terminal 2 - Catalog Replica 2
cd catalog_service
PORT=5004 REPLICA_URLS=http://localhost:5003 node catalog_server.js

# Terminal 3 - Order Replica 1
cd order_service
PORT=5002 node order_server.js

# Terminal 4 - Order Replica 2
cd order_service
PORT=5005 REPLICA_URLS=http://localhost:5002 node order_server.js

# Terminal 5 - Frontend
cd frontend
node server.js
```

## APIs Documentation

### Frontend Server (Port 5000)
- `GET /search/:topic` - البحث حسب الموضوع (cached)
- `GET /info/:id` - معلومات الكتاب (cached)
- `POST /purchase/:id` - شراء كتاب (invalidates cache)
- `POST /invalidate/:id` - إبطال الـ cache (internal)
- `GET /cache/stats` - إحصائيات الـ cache

### Catalog Server (Ports 5003, 5004)  
- `GET /search/:topic` - البحث
- `GET /info/:id` - معلومات الكتاب
- `PUT /update/:id` - تحديث الكمية/السعر
- `POST /sync/:id` - مزامنة بين replicas (internal)

### Order Server (Ports 5002, 5005)
- `POST /purchase/:id` - معالجة الطلبات
- `POST /sync-order` - مزامنة الطلبات (internal)

## Testing
See `docs/TEST_SCRIPT.md` for comprehensive test scenarios.

Quick test:
```bash
# Search books
curl http://localhost:5000/search/distributed%20systems

# Get book info (cache miss)
curl http://localhost:5000/info/1

# Get book info again (cache hit - faster!)
curl http://localhost:5000/info/1

# Purchase book (invalidates cache)
curl -X POST http://localhost:5000/purchase/1

# Check cache stats
curl http://localhost:5000/cache/stats
```

## Documentation
- **Design Document**: `docs/DESIGN_DOCUMENT.md`
- **Performance Results**: `docs/PERFORMANCE_RESULTS.md`
- **Program Output**: `docs/OUTPUT.md`
- **Test Script**: `docs/TEST_SCRIPT.md`

## Performance Highlights
- **93-95% faster** response time with cache hits
- **60-70% cache hit rate** in realistic scenarios
- **50/50 load distribution** across replicas
- **100% synchronization success** between replicas
- **5-8% overhead** for cache invalidation

## Books Catalog
1. "How to get a good grade in DOS in 40 minutes a day" - Distributed Systems
2. "RPCs for Noobs" - Distributed Systems
3. "Xen and the Art of Surviving Undergraduate School" - Undergraduate School
4. "Cooking for the Impatient Undergrad" - Undergraduate School
