const fs = require('fs');

let content = fs.readFileSync('routes/products.js', 'utf8');

// Ищем маршрут POST /:menuItemId/ingredients
const startMarker = "// Добавить ингредиент в блюдо";
const endMarker = "// Удалить ингредиент из блюда";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.log('❌ Не найдены маркеры');
    process.exit(1);
}

const newRoute = `// Добавить ингредиенты в блюдо (массив)
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
    for (const ing of ingredients) {
      await query(
        'INSERT INTO menu_item_ingredients (menu_item_id, product_id, quantity, unit) VALUES ($1, $2, $3, $4)',
        [menuItemId, ing.product_id, ing.quantity, ing.unit || 'г']
      );
    }

    res.status(201).json({ message: 'Ингредиенты успешно сохранены', count: ingredients.length });
  } catch (error) {
    console.error('Ошибка добавления ингредиентов:', error);
    res.status(500).json({ error: 'Ошибка добавления ингредиентов', details: error.message });
  }
});

`;

// Заменяем
content = content.substring(0, startIndex) + newRoute + content.substring(endIndex);

fs.writeFileSync('routes/products.js', content, 'utf8');
console.log('✅ Маршрут успешно обновлен');
