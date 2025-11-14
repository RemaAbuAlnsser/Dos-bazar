// order/server.js
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());
const catalogService = process.env.CATALOG_URL || 'http://catalog-service:5003';

app.get('/info/:id', async (req, res) => {
    try {
        const response = await axios.get(`${catalogService}/info/${req.params.id}`);
        res.json(response.data);
    } catch (error) {
        if (error.response?.status === 404) {
            return res.status(404).json({ error: 'Book not found', bookId: req.params.id });
        }
        res.status(500).json({ error: 'Failed to get book info', details: error.message });
    }
});

app.post('/purchase/:id', async (req, res) => {
    try {
        const bookId = req.params.id;
        
        const bookInfo = await axios.get(`${catalogService}/info/${bookId}`);
        
        if (bookInfo.data.quantity <= 0) {
            return res.status(400).json({ error: 'Book out of stock', bookId: bookId });
        }
        
        await axios.put(`${catalogService}/update/${bookId}`, {
            quantity: bookInfo.data.quantity - 1
        });
        
        const order = {
            id: Date.now(),
            bookId: parseInt(bookId),
            bookTitle: bookInfo.data.title,
            timestamp: new Date().toISOString()
        };
        
        res.json({ 
            message: 'Purchase successful', 
            order: order 
        });
        
    } catch (error) {
        if (error.response?.status === 404) {
            return res.status(404).json({ error: 'Book not found', bookId: req.params.id });
        }
        res.status(500).json({ error: 'Purchase failed', details: error.message });
    }
});

app.listen(5002, () => {
    console.log('Order Server running on port 5002');
});