# Bazar.com - Online Book Store

## APIs Documentation

### Frontend Server (Port 5000)
- `GET /search/:topic` - البحث حسب الموضوع
- `GET /info/:id` - معلومات الكتاب
- `POST /purchase/:id` - شراء كتاب

### Catalog Server (Port 5003)  
- `GET /search/:topic` - البحث
- `GET /info/:id` - معلومات الكتاب
- `PUT /update/:id` - تحديث الكمية/السعر

### Order Server (Port 5002)
- `POST /purchase/:id` - معالجة الطلبات
