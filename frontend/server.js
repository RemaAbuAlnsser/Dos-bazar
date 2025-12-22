// frontend/server.js
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const catalogService = 'http://localhost:5003';
const orderService = 'http://localhost:5002';


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