const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Инициализация БД
async function initDatabase() {
  try {
    // Проверка подключения
    await pool.query('SELECT NOW()');
    console.log('✅ Подключение к PostgreSQL установлено');
  } catch (error) {
    console.error('❌ Ошибка подключения к БД:', error.message);
    process.exit(1);
  }
}

module.exports = {
  pool,
  initDatabase,
  query: (text, params) => pool.query(text, params)
};
