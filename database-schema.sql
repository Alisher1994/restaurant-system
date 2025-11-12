-- ================================
-- СХЕМА БД ДЛЯ РЕСТОРАННОЙ СИСТЕМЫ
-- ================================

-- 1. ПОЛЬЗОВАТЕЛИ И РОЛИ
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'cashier', 'waiter', 'cook', 'supplier', 'warehouse')),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. МЕНЮ
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    display_order INT DEFAULT 0,
    active BOOLEAN DEFAULT true
);

CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(500),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. СТОЛЫ И БРОНИРОВАНИЕ
CREATE TABLE tables (
    id SERIAL PRIMARY KEY,
    table_number VARCHAR(20) UNIQUE NOT NULL,
    floor INT NOT NULL CHECK (floor IN (1, 2, 3, 99)), -- 99 = VIP
    seats INT NOT NULL,
    status VARCHAR(20) DEFAULT 'free' CHECK (status IN ('free', 'occupied', 'reserved', 'cleaning')),
    current_order_id INT, -- ссылка на текущий заказ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE table_reservations (
    id SERIAL PRIMARY KEY,
    table_id INT REFERENCES tables(id) ON DELETE CASCADE,
    customer_name VARCHAR(200) NOT NULL,
    customer_phone VARCHAR(50),
    reservation_time TIMESTAMP NOT NULL,
    duration_minutes INT DEFAULT 120,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    notes TEXT,
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. ЗАКАЗЫ
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    table_id INT REFERENCES tables(id) ON DELETE SET NULL,
    waiter_id INT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'cooking', 'ready', 'served', 'paid', 'cancelled')),
    total_amount DECIMAL(10,2) DEFAULT 0,
    payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'mixed', NULL)),
    paid_at TIMESTAMP,
    cashier_id INT REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INT REFERENCES menu_items(id) ON DELETE SET NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL, -- цена на момент заказа
    item_status VARCHAR(20) DEFAULT 'pending' CHECK (item_status IN ('pending', 'cooking', 'ready', 'served')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. СКЛАД
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    product_name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    unit VARCHAR(50) NOT NULL, -- кг, литр, шт и т.д.
    quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
    min_quantity DECIMAL(10,3) DEFAULT 0, -- минимальный остаток
    price_per_unit DECIMAL(10,2),
    last_restocked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory_movements (
    id SERIAL PRIMARY KEY,
    inventory_id INT REFERENCES inventory(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('inbound', 'outbound', 'writeoff', 'adjustment')),
    quantity DECIMAL(10,3) NOT NULL,
    reason TEXT,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. ЗАКУПКИ
CREATE TABLE purchase_requests (
    id SERIAL PRIMARY KEY,
    requested_by INT REFERENCES users(id) ON DELETE SET NULL, -- повар
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'ordered', 'received', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_request_items (
    id SERIAL PRIMARY KEY,
    request_id INT REFERENCES purchase_requests(id) ON DELETE CASCADE,
    product_name VARCHAR(200) NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    notes TEXT
);

CREATE TABLE purchases (
    id SERIAL PRIMARY KEY,
    request_id INT REFERENCES purchase_requests(id) ON DELETE SET NULL,
    supplier_id INT REFERENCES users(id) ON DELETE SET NULL, -- снабженец
    total_amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'ordered' CHECK (status IN ('ordered', 'delivered', 'cancelled')),
    delivery_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_items (
    id SERIAL PRIMARY KEY,
    purchase_id INT REFERENCES purchases(id) ON DELETE CASCADE,
    inventory_id INT REFERENCES inventory(id) ON DELETE SET NULL,
    product_name VARCHAR(200) NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    price_per_unit DECIMAL(10,2),
    total_price DECIMAL(10,2)
);

-- 7. ПЛАТЕЖИ И ЧЕКИ
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'card')),
    cashier_id INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_table ON orders(table_id);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_tables_status ON tables(status);
CREATE INDEX idx_inventory_quantity ON inventory(quantity);
CREATE INDEX idx_purchase_requests_status ON purchase_requests(status);

-- 9. ТРИГГЕРЫ

-- Автоматическое обновление updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_orders_updated_at BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_inventory_updated_at BEFORE UPDATE ON inventory
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Автоматический подсчёт total_amount в заказе
CREATE OR REPLACE FUNCTION update_order_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE orders
    SET total_amount = (
        SELECT COALESCE(SUM(price * quantity), 0)
        FROM order_items
        WHERE order_id = NEW.order_id
    )
    WHERE id = NEW.order_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_order_items_total AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW EXECUTE FUNCTION update_order_total();

-- 10. НАЧАЛЬНЫЕ ДАННЫЕ (для тестирования)

-- Администратор по умолчанию (пароль: admin123)
INSERT INTO users (username, password_hash, full_name, role) VALUES
('admin', '$2b$10$YourHashedPasswordHere', 'Администратор', 'admin');

-- Категории меню
INSERT INTO categories (name, display_order) VALUES
('Салаты', 1),
('Горячие блюда', 2),
('Супы', 3),
('Десерты', 4),
('Напитки', 5);

-- Столы (пример)
INSERT INTO tables (table_number, floor, seats) VALUES
('1-01', 1, 4),
('1-02', 1, 2),
('1-03', 1, 6),
('2-01', 2, 4),
('2-02', 2, 8),
('3-01', 3, 10),
('VIP-1', 99, 6);

-- Базовые товары на складе
INSERT INTO inventory (product_name, category, unit, quantity, min_quantity, price_per_unit) VALUES
('Мука', 'Продукты', 'кг', 50.0, 10.0, 50.00),
('Сахар', 'Продукты', 'кг', 30.0, 5.0, 80.00),
('Соль', 'Продукты', 'кг', 20.0, 3.0, 40.00),
('Масло подсолнечное', 'Продукты', 'литр', 15.0, 5.0, 150.00);
