// catalog/server.js
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5003;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5000';
const REPLICA_URLS = process.env.REPLICA_URLS ? process.env.REPLICA_URLS.split(',') : [];

let books = [
    { id: 1, title: "How to get a good grade in DOS in 40 minutes a day", topic: "distributed systems", quantity: 10, price: 50 },
    { id: 2, title: "RPCs for Noobs", topic: "distributed systems", quantity: 5, price: 40 },
    { id: 3, title: "Xen and the Art of Surviving Undergraduate School", topic: "undergraduate school", quantity: 8, price: 30 },
    { id: 4, title: "Cooking for the Impatient Undergrad", topic: "undergraduate school", quantity: 3, price: 25 }
];

async function invalidateCache(bookId) {
    try {
        await axios.post(`${FRONTEND_URL}/invalidate/${bookId}`);
        console.log(`Cache invalidation sent to frontend for book ${bookId}`);
    } catch (error) {
        console.error(`Failed to invalidate cache for book ${bookId}:`, error.message);
    }
}


app.get('/search/:topic', (req, res) => {
    const topic = req.params.topic;
    const result = books.filter(book => 
        book.topic.toLowerCase() === topic.toLowerCase()
    ).map(book => ({ id: book.id, title: book.title }));
    
    res.json({ books: result });
});

app.get('/info/:id', (req, res) => {
    const book = books.find(b => b.id == req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    
    res.json({
        title: book.title,
        quantity: book.quantity,
        price: book.price
    });
});

app.put('/update/:id', async (req, res) => {
    const book = books.find(b => b.id == req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    
    if (req.body.quantity !== undefined) {
        book.quantity = req.body.quantity;
    }
    if (req.body.price !== undefined) {
        book.price = req.body.price;
    }
    
    await invalidateCache(req.params.id);
    await syncWithReplicas(req.params.id, req.body);
    
    res.json({ message: 'Book updated successfully', book });
});

app.post('/sync/:id', (req, res) => {
    const book = books.find(b => b.id == req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    
    if (req.body.quantity !== undefined) {
        book.quantity = req.body.quantity;
    }
    if (req.body.price !== undefined) {
        book.price = req.body.price;
    }
    
    console.log(`Synced book ${req.params.id} from another replica`);
    res.json({ message: 'Sync successful' });
});

app.listen(PORT, () => {
    console.log(`Catalog Server running on port ${PORT}`);
    console.log(`Frontend URL: ${FRONTEND_URL}`);
    console.log(`Replicas: ${REPLICA_URLS.length > 0 ? REPLICA_URLS.join(', ') : 'None'}`);
});