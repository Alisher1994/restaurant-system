const express = require('express');
const bcrypt = require('bcrypt');
const { query } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Все маршруты доступны только администратору
router.use(authenticate, authorize('admin'));

// ========== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ==========

// Получить всех пользователей
router.get('/users', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, username, full_name, role, active as is_active, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать пользователя
router.post('/users', async (req, res) => {
  try {
    const { username, password, full_name, role } = req.body;

    if (!username || !password || !full_name || !role) {
      return res.status(400).json({ error: 'Заполните все поля' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await query(
      'INSERT INTO users (username, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, username, full_name, role, active as is_active',
      [username, password_hash, full_name, role]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // duplicate key
      return res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
    }
    console.error('Ошибка создания пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить пользователя
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, role, is_active, password } = req.body;

    let updateQuery = 'UPDATE users SET full_name = $1, role = $2, active = $3';
    const params = [full_name, role, is_active];

    if (password) {
      const password_hash = await bcrypt.hash(password, 10);
      updateQuery += ', password_hash = $4';
      params.push(password_hash);
    }

    updateQuery += ' WHERE id = $' + (params.length + 1) + ' RETURNING id, username, full_name, role, active as is_active';
    params.push(id);

    const result = await query(updateQuery, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка обновления пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить пользователя
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'Пользователь удалён' });
  } catch (error) {
    console.error('Ошибка удаления пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ========== УПРАВЛЕНИЕ МЕНЮ ==========

// Категории
router.get('/categories', async (req, res) => {
  try {
    const result = await query('SELECT id, name, display_order, active as is_active FROM categories ORDER BY display_order, name');
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения категорий:', error);
    res.status(500).json({ error: 'Ошибка получения категорий' });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const { name, display_order } = req.body;
    const result = await query(
      'INSERT INTO categories (name, display_order) VALUES ($1, $2) RETURNING id, name, display_order, active as is_active',
      [name, display_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка создания категории:', error);
    res.status(500).json({ error: 'Ошибка создания категории' });
  }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, display_order, is_active } = req.body;
    
    const result = await query(
      'UPDATE categories SET name = COALESCE($1, name), display_order = COALESCE($2, display_order), active = COALESCE($3, active) WHERE id = $4 RETURNING id, name, display_order, active as is_active',
      [name, display_order, is_active, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка обновления категории:', error);
    res.status(500).json({ error: 'Ошибка обновления категории' });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    await query('DELETE FROM categories WHERE id = $1', [req.params.id]);
    res.json({ message: 'Категория удалена' });
  } catch (error) {
    console.error('Ошибка удаления категории:', error);
    res.status(500).json({ error: 'Ошибка удаления категории' });
  }
});

// Позиции меню (дублируем для совместимости)
router.get('/menu', async (req, res) => {
  try {
    const result = await query(`
      SELECT m.id, m.name, m.description, m.price, m.image_url, m.active as is_active, 
             c.name as category_name, m.category_id
      FROM menu_items m 
      LEFT JOIN categories c ON m.category_id = c.id 
      ORDER BY c.display_order, m.name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения меню:', error);
    res.status(500).json({ error: 'Ошибка получения меню' });
  }
});

router.post('/menu', async (req, res) => {
  try {
    const { category_id, name, description, price, image_url } = req.body;
    const result = await query(
      'INSERT INTO menu_items (category_id, name, description, price, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, description, price, image_url, category_id, active as is_active',
      [category_id, name, description || '', price, image_url || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка создания блюда:', error);
    res.status(500).json({ error: 'Ошибка создания блюда' });
  }
});

router.put('/menu/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, name, description, price, image_url, is_active } = req.body;
    
    const result = await query(
      'UPDATE menu_items SET category_id = COALESCE($1, category_id), name = COALESCE($2, name), description = COALESCE($3, description), price = COALESCE($4, price), image_url = COALESCE($5, image_url), active = COALESCE($6, active) WHERE id = $7 RETURNING id, name, description, price, image_url, category_id, active as is_active',
      [category_id, name, description, price, image_url, is_active, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Блюдо не найдено' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка обновления блюда:', error);
    res.status(500).json({ error: 'Ошибка обновления блюда' });
  }
});

router.delete('/menu/:id', async (req, res) => {
  try {
    await query('DELETE FROM menu_items WHERE id = $1', [req.params.id]);
    res.json({ message: 'Блюдо удалено' });
  } catch (error) {
    console.error('Ошибка удаления блюда:', error);
    res.status(500).json({ error: 'Ошибка удаления блюда' });
  }
});

// Позиции меню
router.get('/menu-items', async (req, res) => {
  try {
    const result = await query(`
      SELECT m.*, c.name as category_name 
      FROM menu_items m 
      LEFT JOIN categories c ON m.category_id = c.id 
      ORDER BY c.display_order, m.name
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения меню' });
  }
});

router.post('/menu-items', async (req, res) => {
  try {
    const { category_id, name, description, price, image_url } = req.body;
    const result = await query(
      'INSERT INTO menu_items (category_id, name, description, price, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [category_id, name, description, price, image_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка создания позиции меню' });
  }
});

router.put('/menu-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, name, description, price, image_url, active } = req.body;
    const result = await query(
      'UPDATE menu_items SET category_id = $1, name = $2, description = $3, price = $4, image_url = $5, active = $6 WHERE id = $7 RETURNING *',
      [category_id, name, description, price, image_url, active, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка обновления позиции меню' });
  }
});

router.delete('/menu-items/:id', async (req, res) => {
  try {
    await query('DELETE FROM menu_items WHERE id = $1', [req.params.id]);
    res.json({ message: 'Позиция меню удалена' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка удаления позиции' });
  }
});

// ========== СТАТИСТИКА ==========

router.get('/stats', async (req, res) => {
  try {
    const stats = {};

    // Количество активных пользователей
    const usersResult = await query('SELECT COUNT(*) FROM users WHERE active = true');
    stats.active_users = parseInt(usersResult.rows[0].count);

    // Количество открытых заказов
    const ordersResult = await query("SELECT COUNT(*) FROM orders WHERE status NOT IN ('paid', 'cancelled')");
    stats.open_orders = parseInt(ordersResult.rows[0].count);

    // Доход за сегодня
    const todayRevenue = await query(`
      SELECT COALESCE(SUM(total_amount), 0) as revenue 
      FROM orders 
      WHERE status = 'paid' AND DATE(paid_at) = CURRENT_DATE
    `);
    stats.today_revenue = parseFloat(todayRevenue.rows[0].revenue);

    // Доход за месяц
    const monthRevenue = await query(`
      SELECT COALESCE(SUM(total_amount), 0) as revenue 
      FROM orders 
      WHERE status = 'paid' AND DATE_TRUNC('month', paid_at) = DATE_TRUNC('month', CURRENT_DATE)
    `);
    stats.month_revenue = parseFloat(monthRevenue.rows[0].revenue);

    // Свободные/занятые столы
    const tablesStats = await query(`
      SELECT status, COUNT(*) as count 
      FROM tables 
      GROUP BY status
    `);
    stats.tables = {};
    tablesStats.rows.forEach(row => {
      stats.tables[row.status] = parseInt(row.count);
    });

    res.json(stats);
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
