const express = require('express');
const { query } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Доступ только снабженцам и администраторам
router.use(authenticate, authorize('supplier', 'admin'));

// Получить все заявки на закупку
router.get('/purchase-requests', async (req, res) => {
  try {
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
      GROUP BY pr.id, u.full_name
      ORDER BY 
        CASE pr.status 
          WHEN 'pending' THEN 1
          WHEN 'approved' THEN 2
          WHEN 'ordered' THEN 3
          ELSE 4
        END,
        pr.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения заявок' });
  }
});

// Одобрить заявку
router.post('/purchase-requests/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `UPDATE purchase_requests SET status = 'approved' WHERE id = $1 RETURNING *`,
      [id]
    );

    res.json({ message: 'Заявка одобрена', request: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка одобрения заявки' });
  }
});

// Создать закупку на основе заявки
router.post('/purchases', async (req, res) => {
  try {
    const { request_id, delivery_date, notes, items } = req.body;
    const supplier_id = req.user.id;

    // Создание закупки
    const purchaseResult = await query(
      'INSERT INTO purchases (request_id, supplier_id, delivery_date, notes) VALUES ($1, $2, $3, $4) RETURNING *',
      [request_id, supplier_id, delivery_date, notes]
    );
    const purchase = purchaseResult.rows[0];

    // Добавление позиций
    let total = 0;
    for (const item of items) {
      const itemTotal = item.quantity * item.price_per_unit;
      total += itemTotal;
      
      await query(
        `INSERT INTO purchase_items (purchase_id, inventory_id, product_name, quantity, unit, price_per_unit, total_price) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [purchase.id, item.inventory_id, item.product_name, item.quantity, item.unit, item.price_per_unit, itemTotal]
      );
    }

    // Обновление общей суммы
    await query('UPDATE purchases SET total_amount = $1 WHERE id = $2', [total, purchase.id]);

    // Обновление статуса заявки
    if (request_id) {
      await query(`UPDATE purchase_requests SET status = 'ordered' WHERE id = $1`, [request_id]);
    }

    res.status(201).json({ message: 'Закупка создана', purchase_id: purchase.id });
  } catch (error) {
    console.error('Ошибка создания закупки:', error);
    res.status(500).json({ error: 'Ошибка создания закупки' });
  }
});

// Получить список закупок
router.get('/purchases', async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*, u.full_name as supplier_name,
             json_agg(json_build_object(
               'id', pi.id,
               'product_name', pi.product_name,
               'quantity', pi.quantity,
               'unit', pi.unit,
               'price_per_unit', pi.price_per_unit,
               'total_price', pi.total_price
             )) as items
      FROM purchases p
      LEFT JOIN users u ON p.supplier_id = u.id
      LEFT JOIN purchase_items pi ON p.id = pi.purchase_id
      GROUP BY p.id, u.full_name
      ORDER BY p.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения закупок' });
  }
});

// Отметить закупку как доставленную
router.post('/purchases/:id/deliver', async (req, res) => {
  try {
    const { id } = req.params;
    
    await query(`UPDATE purchases SET status = 'delivered' WHERE id = $1`, [id]);

    res.json({ message: 'Закупка отмечена как доставленная' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка обновления закупки' });
  }
});

module.exports = router;
