// catalog/server.js
const express = require('express');
const app = express();
app.use(express.json());

// بيانات الكتب الأولية
let books = [
    { id: 1, title: "How to get a good grade in DOS in 40 minutes a day", topic: "distributed systems", quantity: 10, price: 50 },
    { id: 2, title: "RPCs for Noobs", topic: "distributed systems", quantity: 5, price: 40 },
    { id: 3, title: "Xen and the Art of Surviving Undergraduate School", topic: "undergraduate school", quantity: 8, price: 30 },
    { id: 4, title: "Cooking for the Impatient Undergrad", topic: "undergraduate school", quantity: 3, price: 25 }
];

// البحث حسب الموضوع
app.get('/search/:topic', (req, res) => {
    const topic = req.params.topic;
    const result = books.filter(book => 
        book.topic.toLowerCase() === topic.toLowerCase()
    ).map(book => ({ id: book.id, title: book.title }));
    
    res.json({ books: result });
});

// الحصول على معلومات كتاب
app.get('/info/:id', (req, res) => {
    const book = books.find(b => b.id == req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    
    res.json({
        title: book.title,
        quantity: book.quantity,
        price: book.price
    });
});

// تحديث الكمية
app.put('/update/:id', (req, res) => {
    const book = books.find(b => b.id == req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    
    if (req.body.quantity !== undefined) {
        book.quantity = req.body.quantity;
    }
    if (req.body.price !== undefined) {
        book.price = req.body.price;
    }
    
    res.json({ message: 'Book updated successfully', book });
});

app.listen(5001, () => {
    console.log('Catalog Server running on port 5001');
});