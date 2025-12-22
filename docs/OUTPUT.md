# Program Output Examples

This document shows sample output from running the Bazar.com distributed system with caching and replication enabled.

## Starting the System

### Frontend Server Output
```
Frontend Server running on port 5000
Cache enabled with LRU policy (max 50 items)
Load balancing: Round-robin for catalog and order replicas
```

### Catalog Replica 1 Output
```
Catalog Server running on port 5003
Frontend URL: http://localhost:5000
Replicas: http://localhost:5004
```

### Catalog Replica 2 Output
```
Catalog Server running on port 5004
Frontend URL: http://localhost:5000
Replicas: http://localhost:5003
```

### Order Replica 1 Output
```
Order Server running on port 5002
Catalog replicas: http://localhost:5003, http://localhost:5004
Order replicas: http://localhost:5005
```

### Order Replica 2 Output
```
Order Server running on port 5005
Catalog replicas: http://localhost:5003, http://localhost:5004
Order replicas: http://localhost:5002
```

---

## Test Scenario 1: Search Books

### Request
```bash
curl http://localhost:5000/search/distributed%20systems
```

### Frontend Output (Cache Miss)
```
Cache MISS for search: distributed systems
```

### Response
```json
{
  "books": [
    {
      "id": 1,
      "title": "How to get a good grade in DOS in 40 minutes a day"
    },
    {
      "id": 2,
      "title": "RPCs for Noobs"
    }
  ]
}
```

