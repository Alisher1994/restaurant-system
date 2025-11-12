const express = require('express');
const multer = require('multer');
const { query } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Настройка multer для загрузки фото в память
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Только изображения разрешены'));
    }
  }
});

// Получить фото товара (БЕЗ авторизации для отображения в HTML)
router.get('/:id/photo', async (req, res) => {
  try {
    const result = await query('SELECT photo, photo_mime_type FROM products WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0 || !result.rows[0].photo) {
      return res.status(404).json({ error: 'Фото не найдено' });
    }
    
    res.set('Content-Type', result.rows[0].photo_mime_type);
    res.set('Cache-Control', 'public, max-age=31536000'); // Кэшировать на год
    res.send(result.rows[0].photo);
  } catch (error) {
    console.error('Ошибка получения фото:', error);
    res.status(500).json({ error: 'Ошибка получения фото' });
  }
});

// Получить фото блюда из меню (ингредиенты) - БЕЗ авторизации
router.get('/menu/:id/photo', async (req, res) => {
  try {
    const result = await query('SELECT photo, photo_mime_type FROM menu_items WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0 || !result.rows[0].photo) {
      return res.status(404).json({ error: 'Фото не найдено' });
    }
    
    res.set('Content-Type', result.rows[0].photo_mime_type);
    res.set('Cache-Control', 'public, max-age=31536000');
    res.send(result.rows[0].photo);
  } catch (error) {
    console.error('Ошибка получения фото:', error);
    res.status(500).json({ error: 'Ошибка получения фото' });
  }
});

// Все остальные маршруты доступны только администратору
router.use(authenticate, authorize('admin'));

// ========== КАТЕГОРИИ ТОВАРОВ ==========

router.get('/categories', async (req, res) => {
  try {
    const result = await query('SELECT id, name, display_order, active as is_active FROM product_categories ORDER BY display_order, name');
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения категорий товаров:', error);
    res.status(500).json({ error: 'Ошибка получения категорий' });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const { name, display_order } = req.body;
    const result = await query(
      'INSERT INTO product_categories (name, display_order) VALUES ($1, $2) RETURNING id, name, display_order, active as is_active',
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
      'UPDATE product_categories SET name = COALESCE($1, name), display_order = COALESCE($2, display_order), active = COALESCE($3, active) WHERE id = $4 RETURNING id, name, display_order, active as is_active',
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
    await query('DELETE FROM product_categories WHERE id = $1', [req.params.id]);
    res.json({ message: 'Категория удалена' });
  } catch (error) {
    console.error('Ошибка удаления категории:', error);
    res.status(500).json({ error: 'Ошибка удаления категории' });
  }
});

// ========== ТОВАРЫ ==========

router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT p.id, p.name, p.barcode, p.netto, p.brutto, p.unit, p.active as is_active,
             pc.name as category_name, p.category_id,
             CASE WHEN p.photo IS NOT NULL THEN true ELSE false END as has_photo
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      ORDER BY pc.display_order, p.name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения товаров:', error);
    res.status(500).json({ error: 'Ошибка получения товаров' });
  }
});

router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const { category_id, name, barcode, netto, brutto, unit } = req.body;
    
    let photoData = null;
    let photoMimeType = null;
    
    if (req.file) {
      photoData = req.file.buffer;
      photoMimeType = req.file.mimetype;
    }
    
    const result = await query(
      'INSERT INTO products (category_id, name, barcode, photo, photo_mime_type, netto, brutto, unit) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, name, barcode, netto, brutto, unit, active as is_active, category_id',
      [category_id || null, name, barcode || null, photoData, photoMimeType, netto || null, brutto || null, unit || 'кг']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка создания товара:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Товар с таким штрих-кодом уже существует' });
    }
    res.status(500).json({ error: 'Ошибка создания товара' });
  }
});

router.put('/:id', upload.single('photo'), async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, name, barcode, netto, brutto, unit, is_active } = req.body;
    
    // Получаем текущие данные товара
    const current = await query('SELECT * FROM products WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    
    let photoData = current.rows[0].photo;
    let photoMimeType = current.rows[0].photo_mime_type;
    
    if (req.file) {
      photoData = req.file.buffer;
      photoMimeType = req.file.mimetype;
    }
    
    const result = await query(
      'UPDATE products SET category_id = COALESCE($1, category_id), name = COALESCE($2, name), barcode = COALESCE($3, barcode), photo = COALESCE($4, photo), photo_mime_type = COALESCE($5, photo_mime_type), netto = COALESCE($6, netto), brutto = COALESCE($7, brutto), unit = COALESCE($8, unit), active = COALESCE($9, active) WHERE id = $10 RETURNING id, name, barcode, netto, brutto, unit, active as is_active, category_id',
      [category_id, name, barcode, photoData, photoMimeType, netto, brutto, unit, is_active, id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка обновления товара:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Товар с таким штрих-кодом уже существует' });
    }
    res.status(500).json({ error: 'Ошибка обновления товара' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ message: 'Товар удален' });
  } catch (error) {
    console.error('Ошибка удаления товара:', error);
    res.status(500).json({ error: 'Ошибка удаления товара' });
  }
});

// ========== СОСТАВ БЛЮД ==========

// Получить ингредиенты блюда
router.get('/:menuItemId/ingredients', async (req, res) => {
  try {
    const result = await query(`
      SELECT mii.id, mii.quantity, mii.unit, 
             p.id as product_id, p.name as product_name
      FROM menu_item_ingredients mii
      JOIN products p ON mii.product_id = p.id
      WHERE mii.menu_item_id = $1
      ORDER BY p.name
    `, [req.params.menuItemId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения ингредиентов:', error);
    res.status(500).json({ error: 'Ошибка получения ингредиентов' });
  }
});

// Добавить ингредиент в блюдо
router.post('/:menuItemId/ingredients', async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const { product_id, quantity, unit } = req.body;
    
    const result = await query(
      'INSERT INTO menu_item_ingredients (menu_item_id, product_id, quantity, unit) VALUES ($1, $2, $3, $4) RETURNING *',
      [menuItemId, product_id, quantity, unit || 'г']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка добавления ингредиента:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Этот ингредиент уже добавлен' });
    }
    res.status(500).json({ error: 'Ошибка добавления ингредиента' });
  }
});

// Удалить ингредиент из блюда
router.delete('/:menuItemId/ingredients/:id', async (req, res) => {
  try {
    await query('DELETE FROM menu_item_ingredients WHERE id = $1 AND menu_item_id = $2', [req.params.id, req.params.menuItemId]);
    res.json({ message: 'Ингредиент удален' });
  } catch (error) {
    console.error('Ошибка удаления ингредиента:', error);
    res.status(500).json({ error: 'Ошибка удаления ингредиента' });
  }
});

module.exports = router;
