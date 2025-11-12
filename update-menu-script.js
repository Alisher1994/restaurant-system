// Скрипт для выполнения update-menu-items.sql через Railway
const fs = require('fs');
const { Client } = require('pg');

async function runUpdateSQL() {
    const client = new Client({
        connectionString: process.env.DATABASE_PUBLIC_URL
    });

    try {
        console.log('Подключение к базе данных...');
        await client.connect();
        console.log('Подключено успешно');

        // Читаем SQL файл
        const sql = fs.readFileSync('./update-menu-items.sql', 'utf8');
        
        console.log('Выполнение SQL...');
        await client.query(sql);
        
        console.log('✓ Колонки cost_price и in_stock успешно добавлены');
        console.log('✓ База данных обновлена');
        
    } catch (error) {
        console.error('Ошибка при выполнении SQL:', error.message);
        process.exit(1);
    } finally {
        await client.end();
        console.log('Соединение закрыто');
    }
}

runUpdateSQL();
