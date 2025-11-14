// frontend/server.js
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const catalogService = 'http://localhost:5001';
const orderService = 'http://localhost:5002';


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