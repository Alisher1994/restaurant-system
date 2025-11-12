-- Таблица категорий товаров
CREATE TABLE IF NOT EXISTS product_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица товаров
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES product_categories(id) ON DELETE SET NULL,
  name VARCHAR(200) NOT NULL,
  barcode VARCHAR(100) UNIQUE,
  photo BYTEA,
  photo_mime_type VARCHAR(50),
  netto DECIMAL(10, 3),
  brutto DECIMAL(10, 3),
  unit VARCHAR(20) DEFAULT 'кг',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица состава блюд (рецепты)
CREATE TABLE IF NOT EXISTS menu_item_ingredients (
  id SERIAL PRIMARY KEY,
  menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 3) NOT NULL,
  unit VARCHAR(20) DEFAULT 'г',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(menu_item_id, product_id)
);

-- Обновляем таблицу menu_items для хранения фото
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS photo BYTEA;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS photo_mime_type VARCHAR(50);

-- Начальные категории товаров
INSERT INTO product_categories (name, display_order) VALUES
  ('Овощи и Фрукты', 1),
  ('Мясо и Птица', 2),
  ('Рыба и Морепродукты', 3),
  ('Молочные продукты', 4),
  ('Крупы и Мука', 5),
  ('Специи и Приправы', 6),
  ('Напитки', 7),
  ('Прочее', 8)
ON CONFLICT DO NOTHING;

-- Индексы
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_menu_ingredients_menu_item ON menu_item_ingredients(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_menu_ingredients_product ON menu_item_ingredients(product_id);

-- Триггер для updated_at
CREATE OR REPLACE FUNCTION update_products_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_products_timestamp ON products;
CREATE TRIGGER trigger_update_products_timestamp
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_products_timestamp();
