// order/server.js
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5002;
const CATALOG_REPLICAS = process.env.CATALOG_REPLICAS ? process.env.CATALOG_REPLICAS.split(',') : ['http://localhost:5003', 'http://localhost:5004'];
const REPLICA_URLS = process.env.REPLICA_URLS ? process.env.REPLICA_URLS.split(',') : [];

let catalogIndex = 0;

function getNextCatalogReplica() {
    const replica = CATALOG_REPLICAS[catalogIndex];
    catalogIndex = (catalogIndex + 1) % CATALOG_REPLICAS.length;
    return replica;
}


app.post('/purchase/:id', async (req, res) => {
    try {
        const bookId = req.params.id;
        const catalogService = getNextCatalogReplica();
        
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
        
        await syncWithReplicas(order.id, order);
        
        res.json({ 
            message: 'Purchase successful', 
            order: order 
        });
        
    } catch (error) {
        res.status(500).json({ error: 'Purchase failed' });
    }
});

app.post('/sync-order', (req, res) => {
    const { orderId, orderData } = req.body;
    console.log(`Received order sync: Order ${orderId}`);
    res.json({ message: 'Order synced successfully' });
});

app.listen(PORT, () => {
    console.log(`Order Server running on port ${PORT}`);
    console.log(`Catalog replicas: ${CATALOG_REPLICAS.join(', ')}`);
    console.log(`Order replicas: ${REPLICA_URLS.length > 0 ? REPLICA_URLS.join(', ') : 'None'}`);
});