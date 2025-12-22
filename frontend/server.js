// frontend/server.js
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const catalogReplicas = [
    'http://localhost:5003',
    'http://localhost:5004'
];
const orderReplicas = [
    'http://localhost:5002',
    'http://localhost:5005'
];

class LRUCache {
    constructor(maxSize = 50) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }

    get(key) {
        if (!this.cache.has(key)) return null;
        const value = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, value);
        return value;
    }

    set(key, value) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }

    invalidate(key) {
        this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }

    size() {
        return this.cache.size;
    }
}

const cache = new LRUCache(50);
let catalogIndex = 0;
let orderIndex = 0;

function getNextCatalogReplica() {
    const replica = catalogReplicas[catalogIndex];
    catalogIndex = (catalogIndex + 1) % catalogReplicas.length;
    return replica;
}

function getNextOrderReplica() {
    const replica = orderReplicas[orderIndex];
    orderIndex = (orderIndex + 1) % orderReplicas.length;
    return replica;
}

app.get('/search/:topic', async (req, res) => {
    try {
        const topic = req.params.topic;
        const cacheKey = `search:${topic}`;
        
        const cached = cache.get(cacheKey);
        if (cached) {
            console.log(`Cache HIT for search: ${topic}`);
            return res.json(cached);
        }
        
        console.log(`Cache MISS for search: ${topic}`);
        const catalogService = getNextCatalogReplica();
        const response = await axios.get(`${catalogService}/search/${topic}`);
        
        cache.set(cacheKey, response.data);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Search failed' });
    }
});

app.get('/info/:id', async (req, res) => {
    try {
        const bookId = req.params.id;
        const cacheKey = `info:${bookId}`;
        
        const cached = cache.get(cacheKey);
        if (cached) {
            console.log(`Cache HIT for info: ${bookId}`);
            return res.json(cached);
        }
        
        console.log(`Cache MISS for info: ${bookId}`);
        const catalogService = getNextCatalogReplica();
        const response = await axios.get(`${catalogService}/info/${bookId}`);
        
        cache.set(cacheKey, response.data);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get book info' });
    }
});

app.post('/purchase/:id', async (req, res) => {
    try {
        const bookId = req.params.id;
        const orderService = getNextOrderReplica();
        const response = await axios.post(`${orderService}/purchase/${bookId}`);
        
        cache.invalidate(`info:${bookId}`);
        console.log(`Cache INVALIDATED for book: ${bookId}`);
        
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Purchase failed' });
    }
});

app.post('/invalidate/:id', (req, res) => {
    const bookId = req.params.id;
    cache.invalidate(`info:${bookId}`);
    console.log(`Cache invalidated by backend for book: ${bookId}`);
    res.json({ message: 'Cache invalidated' });
});

app.get('/cache/stats', (req, res) => {
    res.json({ 
        cacheSize: cache.size(),
        maxSize: cache.maxSize
    });
});

app.listen(5000, () => {
    console.log('Frontend Server running on port 5000');
    console.log('Cache enabled with LRU policy (max 50 items)');
    console.log('Load balancing: Round-robin for catalog and order replicas');
});