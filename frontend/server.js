// frontend/server.js
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const catalogService = process.env.CATALOG_URL || 'http://catalog-service:5003';
const orderService = process.env.ORDER_URL || 'http://order-service:5002';

app.get('/search/:topic', async (req, res) => {
    try {
        const response = await axios.get(`${catalogService}/search/${req.params.topic}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Search failed' });
    }
});


app.get('/info/:id', async (req, res) => {
    try {
        const response = await axios.get(`${catalogService}/info/${req.params.id}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get book info' });
    }
});

// شراء كتاب
app.post('/purchase/:id', async (req, res) => {
    try {
        const response = await axios.post(`${orderService}/purchase/${req.params.id}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Purchase failed' });
    }
});

app.listen(5000, () => {
    console.log('Frontend Server running on port 5000');
});