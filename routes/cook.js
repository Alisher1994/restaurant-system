const express = require('express');
const { query } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Доступ только поварам и администраторам
router.use(authenticate, authorize('cook', 'admin'));

// Получить очередь заказов для кухни
router.get('/orders', async (req, res) => {
  try {
    const result = await query(`
      SELECT o.id, o.table_id, o.status, o.created_at, t.table_number, t.floor,
             json_agg(json_build_object(
               'id', oi.id,
               'name', m.name,
               'quantity', oi.quantity,
               'item_status', oi.item_status,
               'notes', oi.notes
             ) ORDER BY oi.id) as items
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items m ON oi.menu_item_id = m.id
      WHERE o.status IN ('new', 'cooking')
      GROUP BY o.id, t.table_number, t.floor
      ORDER BY o.created_at ASC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения заказов' });
  }
});

// Взять заказ в работу
router.post('/orders/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `UPDATE orders SET status = 'cooking', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND status = 'new' RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Заказ уже в работе или не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка обновления заказа' });
  }
});

// Отметить позицию как готовую
router.post('/orders/:orderId/items/:itemId/ready', async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    
    await query(
      `UPDATE order_items SET item_status = 'ready' WHERE id = $1 AND order_id = $2`,
      [itemId, orderId]
    );

    // Проверка - все ли позиции готовы
    const allReady = await query(
      `SELECT COUNT(*) as count FROM order_items 
       WHERE order_id = $1 AND item_status != 'ready'`,
      [orderId]
    );

    if (parseInt(allReady.rows[0].count) === 0) {
      // Все позиции готовы - меняем статус заказа
      await query(`UPDATE orders SET status = 'ready' WHERE id = $1`, [orderId]);
    }

    res.json({ message: 'Позиция готова' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка обновления позиции' });
  }
});

// Отметить весь заказ как готовый
router.post('/orders/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    
    await query(`UPDATE order_items SET item_status = 'ready' WHERE order_id = $1`, [id]);
    await query(`UPDATE orders SET status = 'ready' WHERE id = $1`, [id]);

    res.json({ message: 'Заказ готов' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка завершения заказа' });
  }
});

// Создать заявку на закупку продуктов
router.post('/purchase-requests', async (req, res) => {
  try {
    const { items, notes } = req.body;
    const requested_by = req.user.id;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Добавьте товары в заявку' });
    }

    // Создание заявки
    const requestResult = await query(
      'INSERT INTO purchase_requests (requested_by, notes) VALUES ($1, $2) RETURNING *',
      [requested_by, notes]
    );
    const request = requestResult.rows[0];

    // Добавление позиций
    for (const item of items) {
      await query(
        'INSERT INTO purchase_request_items (request_id, product_name, quantity, unit, notes) VALUES ($1, $2, $3, $4, $5)',
        [request.id, item.product_name, item.quantity, item.unit, item.notes]
      );
    }

    res.status(201).json({ message: 'Заявка создана', request_id: request.id });
  } catch (error) {
    console.error('Ошибка создания заявки:', error);
    res.status(500).json({ error: 'Ошибка создания заявки' });
  }
});

// Получить мои заявки на закупку
router.get('/purchase-requests', async (req, res) => {
  try {
    const requested_by = req.user.id;
    
    const result = await query(`
      SELECT pr.*, u.full_name as requested_by_name,
             json_agg(json_build_object(
               'id', pri.id,
               'product_name', pri.product_name,
               'quantity', pri.quantity,
               'unit', pri.unit,
               'notes', pri.notes
             )) as items
      FROM purchase_requests pr
      LEFT JOIN users u ON pr.requested_by = u.id
      LEFT JOIN purchase_request_items pri ON pr.id = pri.request_id
      WHERE pr.requested_by = $1
      GROUP BY pr.id, u.full_name
      ORDER BY pr.created_at DESC
    `, [requested_by]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения заявок' });
  }
});

module.exports = router;
