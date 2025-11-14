// order/server.js
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());
const catalogService = 'http://localhost:5003';  // بدلاً من 'http://catalog:5001'
app.post('/purchase/:id', async (req, res) => {
    try {
        const bookId = req.params.id;
        
        const bookInfo = await axios.get(`${catalogService}/info/${bookId}`);
        
        if (bookInfo.data.quantity <= 0) {
            return res.status(400).json({ error: 'Book out of stock' });
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
        res.status(500).json({ error: 'Purchase failed' });
    }
});

app.listen(5002, () => {
    console.log('Order Server running on port 5002');
});