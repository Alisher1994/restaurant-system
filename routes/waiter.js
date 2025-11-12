const express = require('express');
const { query } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Доступ только официантам и администраторам
router.use(authenticate, authorize('waiter', 'admin'));

// Получить список столов
router.get('/tables', async (req, res) => {
  try {
    const result = await query(`
      SELECT t.*, o.id as order_id, o.total_amount
      FROM tables t
      LEFT JOIN orders o ON t.current_order_id = o.id
      ORDER BY t.floor, t.table_number
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения столов' });
  }
});

// Получить меню (только активные позиции)
router.get('/menu', async (req, res) => {
  try {
    const result = await query(`
      SELECT m.*, c.name as category_name, c.id as category_id
      FROM menu_items m
      JOIN categories c ON m.category_id = c.id
      WHERE m.active = true AND c.active = true
      ORDER BY c.display_order, m.name
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения меню' });
  }
});

// Создать новый заказ
router.post('/orders', async (req, res) => {
  try {
    const { table_id, items, notes } = req.body;
    const waiter_id = req.user.id;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Добавьте позиции в заказ' });
    }

    // Проверка статуса стола
    if (table_id) {
      const tableResult = await query('SELECT status FROM tables WHERE id = $1', [table_id]);
      if (tableResult.rows.length === 0) {
        return res.status(404).json({ error: 'Стол не найден' });
      }
      if (tableResult.rows[0].status === 'occupied') {
        return res.status(400).json({ error: 'Стол уже занят' });
      }
    }

    // Создание заказа
    const orderResult = await query(
      'INSERT INTO orders (table_id, waiter_id, notes) VALUES ($1, $2, $3) RETURNING *',
      [table_id, waiter_id, notes]
    );
    const order = orderResult.rows[0];

    // Добавление позиций
    for (const item of items) {
      await query(
        'INSERT INTO order_items (order_id, menu_item_id, quantity, price, notes) VALUES ($1, $2, $3, $4, $5)',
        [order.id, item.menu_item_id, item.quantity, item.price, item.notes]
      );
    }

    // Обновление статуса стола
    if (table_id) {
      await query(
        'UPDATE tables SET status = $1, current_order_id = $2 WHERE id = $3',
        ['occupied', order.id, table_id]
      );
    }

    // Получение полного заказа с позициями
    const fullOrder = await query(`
      SELECT o.*, 
             json_agg(json_build_object(
               'id', oi.id,
               'menu_item_id', oi.menu_item_id,
               'name', m.name,
               'quantity', oi.quantity,
               'price', oi.price,
               'item_status', oi.item_status
             )) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items m ON oi.menu_item_id = m.id
      WHERE o.id = $1
      GROUP BY o.id
    `, [order.id]);

    res.status(201).json(fullOrder.rows[0]);
  } catch (error) {
    console.error('Ошибка создания заказа:', error);
    res.status(500).json({ error: 'Ошибка создания заказа' });
  }
});

// Получить мои активные заказы
router.get('/my-orders', async (req, res) => {
  try {
    const waiter_id = req.user.id;
    const result = await query(`
      SELECT o.*, t.table_number, t.floor,
             json_agg(json_build_object(
               'id', oi.id,
               'menu_item_id', oi.menu_item_id,
               'name', m.name,
               'quantity', oi.quantity,
               'price', oi.price,
               'item_status', oi.item_status
             )) as items
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items m ON oi.menu_item_id = m.id
      WHERE o.waiter_id = $1 AND o.status NOT IN ('paid', 'cancelled')
      GROUP BY o.id, t.table_number, t.floor
      ORDER BY o.created_at DESC
    `, [waiter_id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения заказов' });
  }
});

// Добавить позицию в существующий заказ
router.post('/orders/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    const { menu_item_id, quantity, price, notes } = req.body;

    // Проверка что заказ активен
    const orderCheck = await query(
      'SELECT status FROM orders WHERE id = $1',
      [id]
    );
    
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    if (orderCheck.rows[0].status === 'paid' || orderCheck.rows[0].status === 'cancelled') {
      return res.status(400).json({ error: 'Нельзя изменить оплаченный или отменённый заказ' });
    }

    const result = await query(
      'INSERT INTO order_items (order_id, menu_item_id, quantity, price, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, menu_item_id, quantity, price, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка добавления позиции' });
  }
});

// Удалить позицию из заказа
router.delete('/orders/:orderId/items/:itemId', async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    
    await query('DELETE FROM order_items WHERE id = $1 AND order_id = $2', [itemId, orderId]);
    res.json({ message: 'Позиция удалена' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка удаления позиции' });
  }
});

module.exports = router;
