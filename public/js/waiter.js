const API_URL = window.location.origin + '/api';
let token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user') || '{}');
let menu = [];
let cart = [];

// Проверка авторизации
if (!token || user.role !== 'waiter') {
    window.location.href = '/';
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('userInfo').textContent = user.full_name || user.username;
    loadTables();
    loadOrders();
    loadMenu();
});

// Переключение вкладок
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(`${tabName}-section`).classList.add('active');
    
    if (tabName === 'tables') loadTables();
    if (tabName === 'orders') loadOrders();
}

// Загрузка столов
async function loadTables() {
    try {
        const response = await fetch(`${API_URL}/waiter/tables`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const tables = await response.json();
        
        const container = document.getElementById('tablesContainer');
        const floors = { 1: [], 2: [], 3: [], 99: [] };
        
        tables.forEach(table => {
            floors[table.floor] = floors[table.floor] || [];
            floors[table.floor].push(table);
        });
        
        container.innerHTML = '';
        
        Object.entries(floors).forEach(([floor, floorTables]) => {
            if (floorTables.length > 0) {
                const floorName = floor == 99 ? 'VIP' : `${floor} этаж`;
                container.innerHTML += `<div class="floor-title">${floorName}</div>`;
                
                const grid = document.createElement('div');
                grid.className = 'table-grid';
                
                floorTables.forEach(table => {
                    const statusText = {
                        'free': 'Свободен',
                        'occupied': 'Занят',
                        'reserved': 'Забронирован',
                        'cleaning': 'Уборка'
                    };
                    
                    grid.innerHTML += `
                        <div class="table-card ${table.status}" onclick="selectTableForOrder('${table.id}', '${table.table_number}')">
                            <div class="table-number">${table.table_number}</div>
                            <div class="table-status">${statusText[table.status]}</div>
                            ${table.order_id ? `<div style="font-size:11px;color:#999;">Заказ #${table.order_id}</div>` : ''}
                        </div>
                    `;
                });
                
                container.appendChild(grid);
            }
        });
    } catch (error) {
        console.error('Ошибка загрузки столов:', error);
    }
}

// Выбрать стол для нового заказа
function selectTableForOrder(tableId, tableName) {
    switchTab('new-order');
    document.getElementById('tableSelect').value = tableId;
    showMenu();
}

// Загрузка заказов
async function loadOrders() {
    try {
        const response = await fetch(`${API_URL}/waiter/my-orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const orders = await response.json();
        
        const container = document.getElementById('ordersContainer');
        
        if (orders.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#999;">Нет активных заказов</p>';
            return;
        }
        
        container.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <strong>Заказ #${order.id}</strong><br>
                        ${order.table_number ? `Стол: ${order.table_number} (${order.floor} этаж)` : 'Take-away'}
                    </div>
                    <span class="status-badge status-${order.status}">${getStatusText(order.status)}</span>
                </div>
                <ul class="order-items">
                    ${order.items.map(item => `
                        <li>
                            <span>${item.name} x${item.quantity}</span>
                            <span>${item.price * item.quantity}₽</span>
                        </li>
                    `).join('')}
                </ul>
                <div style="text-align:right;margin-top:15px;font-size:18px;font-weight:bold;color:#667eea;">
                    Итого: ${order.total_amount}₽
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Ошибка загрузки заказов:', error);
    }
}

function getStatusText(status) {
    const texts = {
        'new': 'Новый',
        'cooking': 'Готовится',
        'ready': 'Готов',
        'served': 'Подан',
        'paid': 'Оплачен'
    };
    return texts[status] || status;
}

// Загрузка меню
async function loadMenu() {
    try {
        const response = await fetch(`${API_URL}/waiter/menu`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        menu = await response.json();
        
        // Заполнение селекта столов
        const tablesResponse = await fetch(`${API_URL}/waiter/tables`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const tables = await tablesResponse.json();
        
        const select = document.getElementById('tableSelect');
        select.innerHTML = '<option value="">Take-away (без стола)</option>';
        tables.filter(t => t.status === 'free').forEach(table => {
            select.innerHTML += `<option value="${table.id}">Стол ${table.table_number} (${table.floor} этаж)</option>`;
        });
    } catch (error) {
        console.error('Ошибка загрузки меню:', error);
    }
}

// Показать меню
function showMenu() {
    const modal = document.getElementById('menuModal');
    const container = document.getElementById('menuContainer');
    
    const categories = {};
    menu.forEach(item => {
        if (!categories[item.category_name]) {
            categories[item.category_name] = [];
        }
        categories[item.category_name].push(item);
    });
    
    container.innerHTML = Object.entries(categories).map(([catName, items]) => `
        <div class="menu-category">
            <h3>${catName}</h3>
            ${items.map(item => `
                <div class="menu-item">
                    <div class="menu-item-info">
                        <div class="menu-item-name">${item.name}</div>
                        <div class="menu-item-price">${item.price}₽</div>
                    </div>
                    <button class="add-btn" onclick="addToCart(${item.id}, '${item.name}', ${item.price})">Добавить</button>
                </div>
            `).join('')}
        </div>
    `).join('');
    
    modal.classList.add('active');
}

function closeMenu() {
    document.getElementById('menuModal').classList.remove('active');
}

// Добавить в корзину
function addToCart(id, name, price) {
    const existing = cart.find(item => item.menu_item_id === id);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ menu_item_id: id, name, price, quantity: 1 });
    }
    updateCart();
}

// Обновить корзину
function updateCart() {
    const cartDiv = document.getElementById('cart');
    const itemsDiv = document.getElementById('cartItems');
    const totalDiv = document.getElementById('cartTotal');
    
    if (cart.length === 0) {
        cartDiv.style.display = 'none';
        return;
    }
    
    cartDiv.style.display = 'block';
    
    itemsDiv.innerHTML = cart.map((item, idx) => `
        <div class="cart-item">
            <span>${item.name} x${item.quantity}</span>
            <span>${item.price * item.quantity}₽ <button onclick="removeFromCart(${idx})" style="border:none;background:none;color:#ff6b6b;cursor:pointer;">✕</button></span>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    totalDiv.textContent = `Итого: ${total}₽`;
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
}

// Создать заказ
async function createOrder() {
    if (cart.length === 0) {
        alert('Добавьте блюда в заказ');
        return;
    }
    
    const table_id = document.getElementById('tableSelect').value || null;
    
    try {
        const response = await fetch(`${API_URL}/waiter/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                table_id,
                items: cart
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
        }
        
        alert('Заказ создан!');
        cart = [];
        updateCart();
        loadTables();
        switchTab('orders');
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

// Выход
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
}
