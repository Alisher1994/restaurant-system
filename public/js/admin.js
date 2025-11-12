const API_URL = window.location.origin + '/api';
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

// Проверка авторизации
if (!token || user.role !== 'admin') {
    window.location.href = '/';
}

// Отображение информации о пользователе
document.getElementById('userInfo').textContent = `${user.full_name} (${user.username})`;

// Функция выхода
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
}

// Переключение вкладок
function switchTab(tabName) {
    // Убрать активный класс со всех вкладок
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));

    // Добавить активный класс к выбранной вкладке
    event.target.classList.add('active');
    document.getElementById(tabName + '-section').classList.add('active');

    // Загрузить данные для вкладки
    if (tabName === 'stats') loadStats();
    if (tabName === 'users') loadUsers();
    if (tabName === 'menu') loadMenu();
    if (tabName === 'categories') loadCategories();
}

// Загрузка статистики
async function loadStats() {
    try {
        const response = await fetch(`${API_URL}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Ошибка загрузки статистики');
        
        const stats = await response.json();
        
        const statsGrid = document.getElementById('statsGrid');
        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-label">Активных пользователей</div>
                <div class="stat-value">${stats.active_users || 0}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Открытых заказов</div>
                <div class="stat-value">${stats.open_orders || 0}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Выручка сегодня</div>
                <div class="stat-value">${(stats.today_revenue || 0).toFixed(2)} ₽</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Выручка за месяц</div>
                <div class="stat-value">${(stats.month_revenue || 0).toFixed(2)} ₽</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Занято столов</div>
                <div class="stat-value">${stats.occupied_tables || 0}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Свободно столов</div>
                <div class="stat-value">${stats.available_tables || 0}</div>
            </div>
        `;
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось загрузить статистику');
    }
}

// Загрузка пользователей
async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/admin/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Ошибка загрузки пользователей');
        
        const users = await response.json();
        
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = users.map(u => `
            <tr>
                <td>${u.id}</td>
                <td>${u.username}</td>
                <td>${u.full_name}</td>
                <td>${getRoleName(u.role)}</td>
                <td>${u.is_active ? '✅ Активен' : '❌ Неактивен'}</td>
                <td>
                    <button class="action-btn delete-btn" onclick="deleteUser(${u.id})">Удалить</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось загрузить пользователей');
    }
}

// Загрузка меню
async function loadMenu() {
    try {
        const response = await fetch(`${API_URL}/admin/menu`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Ошибка загрузки меню');
        
        const items = await response.json();
        
        const tbody = document.getElementById('menuTableBody');
        tbody.innerHTML = items.map(item => `
            <tr>
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td>${item.category_name || '-'}</td>
                <td>${parseFloat(item.price).toFixed(2)} ₽</td>
                <td>${item.is_active ? '✅ Активно' : '❌ Неактивно'}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="toggleMenuItem(${item.id}, ${!item.is_active})">
                        ${item.is_active ? 'Скрыть' : 'Показать'}
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteMenuItem(${item.id})">Удалить</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось загрузить меню');
    }
}

// Загрузка категорий
async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/admin/categories`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Ошибка загрузки категорий');
        
        const categories = await response.json();
        
        const tbody = document.getElementById('categoriesTableBody');
        tbody.innerHTML = categories.map(cat => `
            <tr>
                <td>${cat.id}</td>
                <td>${cat.name}</td>
                <td>${cat.display_order}</td>
                <td>${cat.is_active ? '✅ Активна' : '❌ Неактивна'}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="toggleCategory(${cat.id}, ${!cat.is_active})">
                        ${cat.is_active ? 'Скрыть' : 'Показать'}
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteCategory(${cat.id})">Удалить</button>
                </td>
            </tr>
        `).join('');
        
        // Обновить селект категорий в форме добавления блюда
        updateCategorySelect(categories);
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось загрузить категории');
    }
}

// Обновление селекта категорий
function updateCategorySelect(categories) {
    const select = document.getElementById('menuCategorySelect');
    select.innerHTML = categories
        .filter(c => c.is_active)
        .map(c => `<option value="${c.id}">${c.name}</option>`)
        .join('');
}

// Получение названия роли
function getRoleName(role) {
    const roles = {
        admin: 'Администратор',
        cashier: 'Кассир',
        waiter: 'Официант',
        cook: 'Повар',
        supplier: 'Снабженец',
        warehouse: 'Склад'
    };
    return roles[role] || role;
}

// Показать модальное окно добавления пользователя
function showAddUser() {
    document.getElementById('userForm').reset();
    document.getElementById('userModal').classList.add('active');
}

// Показать модальное окно добавления блюда
async function showAddMenuItem() {
    // Загрузить категории для селекта
    const response = await fetch(`${API_URL}/admin/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const categories = await response.json();
    updateCategorySelect(categories);
    
    document.getElementById('menuForm').reset();
    document.getElementById('menuModal').classList.add('active');
}

// Показать модальное окно добавления категории
function showAddCategory() {
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryModal').classList.add('active');
}

// Закрыть модальное окно
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Обработчик формы добавления пользователя
document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await fetch(`${API_URL}/admin/users`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка создания пользователя');
        }
        
        alert('Пользователь успешно создан');
        closeModal('userModal');
        loadUsers();
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
    }
});

// Обработчик формы добавления блюда
document.getElementById('menuForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await fetch(`${API_URL}/admin/menu`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка добавления блюда');
        }
        
        alert('Блюдо успешно добавлено');
        closeModal('menuModal');
        loadMenu();
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
    }
});

// Обработчик формы добавления категории
document.getElementById('categoryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await fetch(`${API_URL}/admin/categories`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка добавления категории');
        }
        
        alert('Категория успешно добавлена');
        closeModal('categoryModal');
        loadCategories();
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
    }
});

// Удаление пользователя
async function deleteUser(id) {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) return;
    
    try {
        const response = await fetch(`${API_URL}/admin/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Ошибка удаления пользователя');
        
        alert('Пользователь удален');
        loadUsers();
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
    }
}

// Удаление блюда
async function deleteMenuItem(id) {
    if (!confirm('Вы уверены, что хотите удалить это блюдо?')) return;
    
    try {
        const response = await fetch(`${API_URL}/admin/menu/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Ошибка удаления блюда');
        
        alert('Блюдо удалено');
        loadMenu();
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
    }
}

// Удаление категории
async function deleteCategory(id) {
    if (!confirm('Вы уверены, что хотите удалить эту категорию?')) return;
    
    try {
        const response = await fetch(`${API_URL}/admin/categories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Ошибка удаления категории');
        
        alert('Категория удалена');
        loadCategories();
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
    }
}

// Переключение статуса блюда
async function toggleMenuItem(id, isActive) {
    try {
        const response = await fetch(`${API_URL}/admin/menu/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ is_active: isActive })
        });
        
        if (!response.ok) throw new Error('Ошибка обновления блюда');
        
        loadMenu();
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
    }
}

// Переключение статуса категории
async function toggleCategory(id, isActive) {
    try {
        const response = await fetch(`${API_URL}/admin/categories/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ is_active: isActive })
        });
        
        if (!response.ok) throw new Error('Ошибка обновления категории');
        
        loadCategories();
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
    }
}

// Загрузка статистики при открытии страницы
loadStats();
