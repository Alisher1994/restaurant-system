const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Импорт маршрутов
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const cashierRoutes = require('./routes/cashier');
const waiterRoutes = require('./routes/waiter');
const cookRoutes = require('./routes/cook');
const supplierRoutes = require('./routes/supplier');
const warehouseRoutes = require('./routes/warehouse');
const tablesRoutes = require('./routes/tables');

// Подключение маршрутов
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cashier', cashierRoutes);
app.use('/api/waiter', waiterRoutes);
app.use('/api/cook', cookRoutes);
app.use('/api/supplier', supplierRoutes);
app.use('/api/warehouse', warehouseRoutes);
app.use('/api/tables', tablesRoutes);

// Главная страница
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Запуск сервера
async function startServer() {
  await initDatabase();
  
  app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📱 Откройте http://localhost:${PORT}`);
  });
}

startServer();
