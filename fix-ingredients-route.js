const fs = require('fs');

let content = fs.readFileSync('routes/products.js', 'utf8');

const oldCode = `// Добавить ингредиент в блюдо
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
});`;

const newCode = `// Добавить ингредиенты в блюдо (массив)
router.post('/:menuItemId/ingredients', async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const { ingredients } = req.body;

    if (!ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({ error: 'Необходим массив ингредиентов' });
    }

    // Удаляем старые ингредиенты
    await query('DELETE FROM menu_item_ingredients WHERE menu_item_id = $1', [menuItemId]);

    // Добавляем новые
    const promises = ingredients.map(ing => {
      return query(
        'INSERT INTO menu_item_ingredients (menu_item_id, product_id, quantity, unit) VALUES ($1, $2, $3, $4) RETURNING *',
        [menuItemId, ing.product_id, ing.quantity, ing.unit || 'г']
      );
    });

    await Promise.all(promises);

    res.status(201).json({ message: 'Ингредиенты успешно сохранены', count: ingredients.length });
  } catch (error) {
    console.error('Ошибка добавления ингредиентов:', error);
    res.status(500).json({ error: 'Ошибка добавления ингредиентов', details: error.message });
  }
});`;

content = content.replace(oldCode, newCode);

fs.writeFileSync('routes/products.js', content, 'utf8');
console.log('✅ Маршрут ингредиентов обновлен для работы с массивом');
