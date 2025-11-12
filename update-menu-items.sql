-- Добавляем поле себестоимости и статуса доступности в меню
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT true;

-- Комментарии
COMMENT ON COLUMN menu_items.cost_price IS 'Себестоимость блюда';
COMMENT ON COLUMN menu_items.price IS 'Цена продажи блюда';
COMMENT ON COLUMN menu_items.in_stock IS 'Есть ли блюдо в продаже (true = есть, false = нет в наличии)';
COMMENT ON COLUMN menu_items.active IS 'Отображается ли блюдо в меню (true = да, false = скрыто)';
