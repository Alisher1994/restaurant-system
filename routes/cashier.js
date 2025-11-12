const express = require('express');
const { query } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Доступ только кассирам и администраторам
router.use(authenticate, authorize('cashier', 'admin'));

// Получить заказы готовые к оплате
router.get('/orders', async (req, res) => {
  try {
    const result = await query(`
      SELECT o.*, t.table_number, t.floor, u.full_name as waiter_name,
             json_agg(json_build_object(
               'id', oi.id,
               'name', m.name,
               'quantity', oi.quantity,
               'price', oi.price
             )) as items
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN users u ON o.waiter_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items m ON oi.menu_item_id = m.id
      WHERE o.status IN ('new', 'cooking', 'ready', 'served')
      GROUP BY o.id, t.table_number, t.floor, u.full_name
      ORDER BY o.created_at ASC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения заказов' });
  }
});

// Получить детали конкретного заказа
router.get('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT o.*, t.table_number, t.floor, u.full_name as waiter_name,
             json_agg(json_build_object(
               'id', oi.id,
               'name', m.name,
               'quantity', oi.quantity,
               'price', oi.price,
               'total', oi.quantity * oi.price
             )) as items
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN users u ON o.waiter_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items m ON oi.menu_item_id = m.id
      WHERE o.id = $1
      GROUP BY o.id, t.table_number, t.floor, u.full_name
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения заказа' });
  }
});

// Принять оплату
router.post('/orders/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_method, amount } = req.body; // 'cash' или 'card'
    const cashier_id = req.user.id;

    if (!['cash', 'card', 'mixed'].includes(payment_method)) {
      return res.status(400).json({ error: 'Неверный способ оплаты' });
    }

    // Проверка заказа
    const orderCheck = await query('SELECT * FROM orders WHERE id = $1', [id]);
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    const order = orderCheck.rows[0];

    if (order.status === 'paid') {
      return res.status(400).json({ error: 'Заказ уже оплачен' });
    }

    // Обновление заказа
    await query(
      `UPDATE orders 
       SET status = 'paid', payment_method = $1, paid_at = CURRENT_TIMESTAMP, cashier_id = $2
       WHERE id = $3`,
      [payment_method, cashier_id, id]
    );

    // Запись платежа
    await query(
      'INSERT INTO payments (order_id, amount, payment_method, cashier_id) VALUES ($1, $2, $3, $4)',
      [id, amount || order.total_amount, payment_method, cashier_id]
    );

    // Освобождение стола
    if (order.table_id) {
      await query(
        'UPDATE tables SET status = $1, current_order_id = NULL WHERE id = $2',
        ['free', order.table_id]
      );
    }

    res.json({ message: 'Оплата принята', order_id: id, amount: order.total_amount });
  } catch (error) {
    console.error('Ошибка оплаты:', error);
    res.status(500).json({ error: 'Ошибка обработки оплаты' });
  }
});

// Отменить заказ
router.post('/orders/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await query(
      `UPDATE orders 
       SET status = 'cancelled', notes = CONCAT(COALESCE(notes, ''), ' [Отменён: ', $1, ']')
       WHERE id = $2 AND status != 'paid'
       RETURNING *`,
      [reason || 'Не указано', id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Невозможно отменить заказ' });
    }

    // Освобождение стола
    const order = result.rows[0];
    if (order.table_id) {
      await query('UPDATE tables SET status = $1, current_order_id = NULL WHERE id = $2', ['free', order.table_id]);
    }

    res.json({ message: 'Заказ отменён', order: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка отмены заказа' });
  }
});

// Статистика кассира (смена)
router.get('/shift-stats', async (req, res) => {
  try {
    const cashier_id = req.user.id;
    
    // Выручка за сегодня этим кассиром
    const result = await query(`
      SELECT 
        COUNT(*) as orders_count,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END), 0) as cash_revenue,
        COALESCE(SUM(CASE WHEN payment_method = 'card' THEN total_amount ELSE 0 END), 0) as card_revenue
      FROM orders
      WHERE cashier_id = $1 AND status = 'paid' AND DATE(paid_at) = CURRENT_DATE
    `, [cashier_id]);

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
});

module.exports = router;
