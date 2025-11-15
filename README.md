# Bazar.com - Online Book Store

## APIs Documentation

### Frontend Server (Port 5000)
- `GET /search/:topic` - البحث حسب الموضوع
- `GET /info/:id` - معلومات الكتاب
- `POST /purchase/:id` - شراء كتاب

### Catalog Server (Port 5001)  
- `GET /search/:topic` - البحث
- `GET /info/:id` - معلومات الكتاب
- `PUT /update/:id` - تحديث الكمية/السعر

### Order Server (Port 5002)
- `POST /purchase/:id` - معالجة الطلبات

### Postman Collection
[Click here to open the Postman Collection](https://www.postman.com/s12114137-6590910/workspace/dos-bazar/collection/50077591-9fe2d420-1a28-4031-b07a-59e88debadb0?action=share&creator=50092040)

