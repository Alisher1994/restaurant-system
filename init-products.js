// Скрипт для инициализации таблиц товаров
const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

async function initProductsTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('Connecting to database...');
    
    const sql = fs.readFileSync('./database-products.sql', 'utf8');
    
    console.log('Executing SQL script...');
    await pool.query(sql);
    
    console.log('✅ Tables created successfully!');
    console.log('✅ Product categories table created');
    console.log('✅ Products table created');
    console.log('✅ Menu ingredients table created');
    console.log('✅ Menu items updated with photo columns');
    console.log('✅ Initial product categories inserted');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

initProductsTables();
