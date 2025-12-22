# Bazar.com - Design Document (Part II)

## Project Overview
This document describes the implementation of Part II of the Bazar.com distributed online bookstore system, focusing on **Replication**, **Caching**, and **Consistency**.

## System Architecture

### Components
1. **Frontend Server** (Port 5000)
   - Single instance (not replicated)
   - Implements in-memory LRU cache
   - Load balances requests to backend replicas
   - Handles cache invalidation

2. **Catalog Service** (Ports 5003, 5004)
   - 2 replicas for high availability
   - Manages book catalog (search, info, updates)
   - Synchronizes data between replicas
   - Sends cache invalidation to frontend

3. **Order Service** (Ports 5002, 5005)
   - 2 replicas for high availability
   - Processes purchase orders
   - Synchronizes orders between replicas
   - Communicates with catalog replicas

## Design Decisions

### 1. Caching Strategy

#### In-Memory Cache Implementation
- **Type**: LRU (Least Recently Used) Cache
- **Location**: Frontend Server
- **Max Size**: 50 items
- **Cached Data**:
  - Search results: `search:{topic}`
  - Book information: `info:{bookId}`

#### Cache Operations
- **Cache Hit**: Returns cached data immediately
- **Cache Miss**: Fetches from backend, stores in cache
- **Cache Invalidation**: Triggered on write operations (purchase, update)

#### Why LRU?
- Simple and effective for limited cache size
- Automatically removes least recently used items
- Good performance for typical access patterns

### 2. Replication Strategy

#### Catalog Service Replication
- **Number of Replicas**: 2
- **Replication Type**: Active-Active
- **Data**: In-memory book catalog (shared initial state)
- **Synchronization**: Push-based on updates

#### Order Service Replication
- **Number of Replicas**: 2
- **Replication Type**: Active-Active
- **Synchronization**: Push-based on new orders

### 3. Load Balancing

#### Algorithm: Round-Robin
- **Simplicity**: Easy to implement and understand
- **Fairness**: Distributes load evenly across replicas
- **Stateless**: No need to track server load or health

#### Implementation
```javascript
let catalogIndex = 0;
function getNextCatalogReplica() {
    const replica = catalogReplicas[catalogIndex];
    catalogIndex = (catalogIndex + 1) % catalogReplicas.length;
    return replica;
}
```

### 4. Cache Consistency

#### Strong Consistency Approach
We implement **server-push invalidation** to maintain cache consistency:

1. **Write Operations** (purchase, update):
   - Backend replica performs database write
   - Backend sends invalidation request to frontend cache
   - Backend synchronizes with other replicas
   - Frontend removes stale data from cache

2. **Read Operations** (search, info):
   - Check cache first
   - On cache miss, fetch from backend (load balanced)
   - Store result in cache

#### Invalidation Flow
```
Purchase Request → Order Service → Catalog Update → Cache Invalidation
                                                   ↓
                                              Frontend Cache
```

### 5. Replica Synchronization

#### Catalog Replicas
- On update operation, primary replica:
  1. Updates local data
  2. Sends invalidation to frontend
  3. Synchronizes with other catalog replicas via `/sync/:id` endpoint

#### Order Replicas
- On purchase operation, primary replica:
  1. Creates order
  2. Updates catalog (via load-balanced request)
  3. Synchronizes order with other order replicas via `/sync-order` endpoint

## API Endpoints

### Frontend Server (Port 5000)
- `GET /search/:topic` - Search books (cached)
- `GET /info/:id` - Get book info (cached)
- `POST /purchase/:id` - Purchase book (invalidates cache)
- `POST /invalidate/:id` - Cache invalidation (called by backend)
- `GET /cache/stats` - Cache statistics

### Catalog Service (Ports 5003, 5004)
- `GET /search/:topic` - Search books by topic
- `GET /info/:id` - Get book information
- `PUT /update/:id` - Update book (triggers invalidation + sync)
- `POST /sync/:id` - Sync update from another replica

### Order Service (Ports 5002, 5005)
- `POST /purchase/:id` - Process purchase order
- `POST /sync-order` - Sync order from another replica

## Trade-offs and Design Considerations

### 1. Cache Size Limit (50 items)
**Pros**:
- Prevents memory overflow
- LRU ensures most relevant data stays cached

**Cons**:
- May evict frequently accessed items if catalog is large
- Could be increased based on memory availability

### 2. Round-Robin Load Balancing
**Pros**:
- Simple, no overhead
- Fair distribution

**Cons**:
- Doesn't consider server load or health
- No failover mechanism (could be improved)

### 3. In-Memory Storage
**Pros**:
- Fast access
- Simple implementation

**Cons**:
- Data lost on restart
- No persistence (could add database in future)

### 4. Synchronous Replication
**Pros**:
- Strong consistency
- Immediate synchronization

**Cons**:
- Higher latency on write operations
- Could use async for better performance

## Possible Improvements

1. **Health Checks**: Monitor replica health and exclude failed replicas from load balancing
2. **Persistent Storage**: Add database (SQLite/PostgreSQL) for data persistence
3. **Async Replication**: Use message queues for better performance
4. **Cache Warming**: Pre-populate cache with popular items
5. **Metrics**: Add monitoring for cache hit rate, latency, etc.
6. **Weighted Load Balancing**: Consider server capacity in load distribution
7. **Cache Partitioning**: Distribute cache across multiple nodes

## How to Run

### Using Docker Compose
```bash
docker-compose up --build
```

This will start:
- 1 Frontend server (port 5000)
- 2 Catalog replicas (ports 5003, 5004)
- 2 Order replicas (ports 5002, 5005)

### Without Docker
Start each service manually:
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

