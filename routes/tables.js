const express = require('express');
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Доступ для всех авторизованных пользователей
router.use(authenticate);

// Получить все столы с их статусами
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT t.*, o.id as order_id, o.total_amount, o.status as order_status,
             u.full_name as waiter_name
      FROM tables t
      LEFT JOIN orders o ON t.current_order_id = o.id
      LEFT JOIN users u ON o.waiter_id = u.id
      ORDER BY t.floor, t.table_number
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения столов' });
  }
});

// Получить столы по этажу
router.get('/floor/:floor', async (req, res) => {
  try {
    const { floor } = req.params;
    
    const result = await query(`
      SELECT t.*, o.id as order_id, o.total_amount, o.status as order_status
      FROM tables t
      LEFT JOIN orders o ON t.current_order_id = o.id
      WHERE t.floor = $1
      ORDER BY t.table_number
    `, [floor]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения столов' });
  }
});

// Создать бронирование стола (только admin и waiter)
router.post('/reservations', async (req, res) => {
  try {
    const { table_id, customer_name, customer_phone, reservation_time, duration_minutes, notes } = req.body;
    const created_by = req.user.id;

    if (!['admin', 'waiter'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }

    // Проверка что стол свободен в это время
    const conflict = await query(`
      SELECT id FROM table_reservations
      WHERE table_id = $1 
        AND status = 'active'
        AND reservation_time < $2 + INTERVAL '1 minute' * $3
        AND reservation_time + INTERVAL '1 minute' * duration_minutes > $2
    `, [table_id, reservation_time, duration_minutes || 120]);

    if (conflict.rows.length > 0) {
      return res.status(400).json({ error: 'Стол занят в это время' });
    }

    const result = await query(
      `INSERT INTO table_reservations 
       (table_id, customer_name, customer_phone, reservation_time, duration_minutes, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [table_id, customer_name, customer_phone, reservation_time, duration_minutes || 120, notes, created_by]
    );

    // Обновление статуса стола (если бронь на сегодня и близко к времени)
    const now = new Date();
    const resTime = new Date(reservation_time);
    const timeDiff = (resTime - now) / 1000 / 60; // минуты

    if (timeDiff < 60 && timeDiff > -30) { // если меньше часа до брони или уже идёт
      await query(`UPDATE tables SET status = 'reserved' WHERE id = $1`, [table_id]);
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка бронирования:', error);
    res.status(500).json({ error: 'Ошибка бронирования стола' });
  }
});

// Получить бронирования
router.get('/reservations', async (req, res) => {
  try {
    const { date, status } = req.query;
    
    let sql = `
      SELECT r.*, t.table_number, t.floor, u.full_name as created_by_name
      FROM table_reservations r
      JOIN tables t ON r.table_id = t.id
      LEFT JOIN users u ON r.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      params.push(date);
      sql += ` AND DATE(r.reservation_time) = $${params.length}`;
    }

    if (status) {
      params.push(status);
      sql += ` AND r.status = $${params.length}`;
    }

    sql += ' ORDER BY r.reservation_time ASC';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения бронирований' });
  }
});

// Отменить бронирование
router.post('/reservations/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;

    if (!['admin', 'waiter'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }

    const result = await query(
      `UPDATE table_reservations SET status = 'cancelled' WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Бронирование не найдено' });
    }

    // Освобождение стола если нет других активных броней
    const reservation = result.rows[0];
    const otherReservations = await query(
      `SELECT COUNT(*) as count FROM table_reservations 
       WHERE table_id = $1 AND id != $2 AND status = 'active' 
         AND reservation_time < NOW() + INTERVAL '1 hour'
         AND reservation_time + INTERVAL '1 minute' * duration_minutes > NOW()`,
      [reservation.table_id, id]
    );

    if (parseInt(otherReservations.rows[0].count) === 0) {
      await query(`UPDATE tables SET status = 'free' WHERE id = $1 AND status = 'reserved'`, [reservation.table_id]);
    }

    res.json({ message: 'Бронирование отменено' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка отмены бронирования' });
  }
});

// Завершить бронирование
router.post('/reservations/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE table_reservations SET status = 'completed' WHERE id = $1 RETURNING *`,
      [id]
    );

    res.json({ message: 'Бронирование завершено' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка' });
  }
});

// Изменить статус стола вручную (только admin)
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }

    if (!['free', 'occupied', 'reserved', 'cleaning'].includes(status)) {
      return res.status(400).json({ error: 'Неверный статус' });
    }

    await query(`UPDATE tables SET status = $1 WHERE id = $2`, [status, id]);
    res.json({ message: 'Статус обновлён' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка обновления статуса' });
  }
});

module.exports = router;
