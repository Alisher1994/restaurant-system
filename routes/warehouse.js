const express = require('express');
const { query } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Доступ только складу и администраторам
router.use(authenticate, authorize('warehouse', 'admin'));

// Получить все товары на складе
router.get('/inventory', async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM inventory ORDER BY category, product_name
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения складских остатков' });
  }
});

// Получить товары с низким остатком
router.get('/inventory/low-stock', async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM inventory 
      WHERE quantity <= min_quantity
      ORDER BY quantity ASC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения товаров' });
  }
});

// Добавить новый товар на склад
router.post('/inventory', async (req, res) => {
  try {
    const { product_name, category, unit, quantity, min_quantity, price_per_unit } = req.body;

    const result = await query(
      `INSERT INTO inventory (product_name, category, unit, quantity, min_quantity, price_per_unit)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [product_name, category, unit, quantity || 0, min_quantity || 0, price_per_unit]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка добавления товара' });
  }
});

// Оприходовать товар (приход от закупки)
router.post('/inventory/:id/inbound', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, reason, price_per_unit } = req.body;
    const user_id = req.user.id;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Укажите корректное количество' });
    }

    // Обновление остатка
    await query(
      `UPDATE inventory 
       SET quantity = quantity + $1, 
           last_restocked_at = CURRENT_TIMESTAMP,
           price_per_unit = COALESCE($2, price_per_unit)
       WHERE id = $3`,
      [quantity, price_per_unit, id]
    );

    // Запись движения
    await query(
      `INSERT INTO inventory_movements (inventory_id, movement_type, quantity, reason, user_id)
       VALUES ($1, 'inbound', $2, $3, $4)`,
      [id, quantity, reason, user_id]
    );

    res.json({ message: 'Приход оформлен', quantity });
  } catch (error) {
    console.error('Ошибка оприходования:', error);
    res.status(500).json({ error: 'Ошибка оприходования' });
  }
});

// Списать товар
router.post('/inventory/:id/outbound', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, reason } = req.body;
    const user_id = req.user.id;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Укажите корректное количество' });
    }

    // Проверка наличия
    const check = await query('SELECT quantity FROM inventory WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    if (check.rows[0].quantity < quantity) {
      return res.status(400).json({ error: 'Недостаточно товара на складе' });
    }

    // Списание
    await query('UPDATE inventory SET quantity = quantity - $1 WHERE id = $2', [quantity, id]);

    // Запись движения
    await query(
      `INSERT INTO inventory_movements (inventory_id, movement_type, quantity, reason, user_id)
       VALUES ($1, 'outbound', $2, $3, $4)`,
      [id, quantity, reason, user_id]
    );

    res.json({ message: 'Списание оформлено', quantity });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка списания' });
  }
});

// Корректировка остатков (инвентаризация)
router.post('/inventory/:id/adjust', async (req, res) => {
  try {
    const { id } = req.params;
    const { new_quantity, reason } = req.body;
    const user_id = req.user.id;

    // Получение текущего остатка
    const current = await query('SELECT quantity FROM inventory WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    const old_quantity = parseFloat(current.rows[0].quantity);
    const difference = new_quantity - old_quantity;

    // Обновление остатка
    await query('UPDATE inventory SET quantity = $1 WHERE id = $2', [new_quantity, id]);

    // Запись движения
    await query(
      `INSERT INTO inventory_movements (inventory_id, movement_type, quantity, reason, user_id)
       VALUES ($1, 'adjustment', $2, $3, $4)`,
      [id, difference, reason, user_id]
    );

    res.json({ 
      message: 'Корректировка выполнена', 
      old_quantity, 
      new_quantity, 
      difference 
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка корректировки' });
  }
});

// Получить историю движений по товару
router.get('/inventory/:id/movements', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT im.*, u.full_name as user_name
      FROM inventory_movements im
      LEFT JOIN users u ON im.user_id = u.id
      WHERE im.inventory_id = $1
      ORDER BY im.created_at DESC
      LIMIT 100
    `, [id]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения истории' });
  }
});

// Получить закупки ожидающие приёмки
router.get('/pending-deliveries', async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*, u.full_name as supplier_name,
             json_agg(json_build_object(
               'id', pi.id,
               'product_name', pi.product_name,
               'quantity', pi.quantity,
               'unit', pi.unit,
               'inventory_id', pi.inventory_id
             )) as items
      FROM purchases p
      LEFT JOIN users u ON p.supplier_id = u.id
      LEFT JOIN purchase_items pi ON p.id = pi.purchase_id
      WHERE p.status = 'ordered'
      GROUP BY p.id, u.full_name
      ORDER BY p.delivery_date ASC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения закупок' });
  }
});

module.exports = router;
