const API_URL = window.location.origin + '/api';
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');
const categoryForm = document.getElementById('categoryForm');

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
    if (tabName === 'products') loadProducts();
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
                <div class="stat-value">${(stats.today_revenue || 0).toFixed(0)} сум</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Выручка за месяц</div>
                <div class="stat-value">${(stats.month_revenue || 0).toFixed(0)} сум</div>
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
                    <button class="action-btn edit-btn" onclick='editUser(${JSON.stringify(u)})' title="Изменить">✏️</button>
                    <button class="action-btn ${u.is_active ? 'delete-btn' : 'edit-btn'}" onclick="toggleUserStatus(${u.id}, ${!u.is_active})" title="${u.is_active ? 'Деактивировать' : 'Активировать'}">
                        ${u.is_active ? '🔒' : '🔓'}
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteUser(${u.id})" title="Удалить">🗑️</button>
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
                <td>
                    ${item.image_url ? `<img src="${item.image_url}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px; margin-right: 10px;">` : ''}
                    ${item.name}
                </td>
                <td>${item.category_name || '-'}</td>
                <td>${parseFloat(item.price).toFixed(0)} сум</td>
                <td>${item.is_active ? '✅ Активно' : '❌ Неактивно'}</td>
                <td>
                    <button class="action-btn edit-btn" onclick='editMenuItem(${JSON.stringify(item).replace(/'/g, "&apos;")})' title="Изменить">✏️</button>
                    <button class="action-btn edit-btn" onclick="toggleMenuItem(${item.id}, ${!item.is_active})" title="${item.is_active ? 'Скрыть' : 'Показать'}">
                        ${item.is_active ? '👁️' : '👁️‍🗨️'}
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteMenuItem(${item.id})" title="Удалить">🗑️</button>
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
                    <button class="action-btn edit-btn" onclick='editCategory(${JSON.stringify(cat)})' title="Изменить">✏️</button>
                    <button class="action-btn edit-btn" onclick="toggleCategory(${cat.id}, ${!cat.is_active})" title="${cat.is_active ? 'Скрыть' : 'Показать'}">
                        ${cat.is_active ? '👁️' : '👁️‍🗨️'}
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteCategory(${cat.id})" title="Удалить">🗑️</button>
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
    const select = document.getElementById('menuItemCategory');
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
    document.getElementById('userId').value = '';
    document.getElementById('userModalTitle').textContent = 'Добавить пользователя';
    document.getElementById('userSubmitBtn').textContent = 'Создать';
    document.getElementById('userUsername').readOnly = false;
    document.getElementById('userPassword').required = true;
    document.getElementById('passwordHint').style.display = 'none';
    document.getElementById('userModal').classList.add('active');
}

// Показать модальное окно редактирования пользователя
function editUser(user) {
    document.getElementById('userId').value = user.id;
    document.getElementById('userUsername').value = user.username;
    document.getElementById('userPassword').value = '';
    document.getElementById('userFullName').value = user.full_name;
    document.getElementById('userRole').value = user.role;
    
    document.getElementById('userModalTitle').textContent = 'Редактировать пользователя';
    document.getElementById('userSubmitBtn').textContent = 'Сохранить';
    document.getElementById('userUsername').readOnly = true;
    document.getElementById('userPassword').required = false;
    document.getElementById('passwordHint').style.display = 'inline';
    document.getElementById('userModal').classList.add('active');
}

// Показать модальное окно добавления категории
function showAddCategory() {
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
    document.getElementById('categoryModalTitle').textContent = 'Добавить категорию';
    document.getElementById('categorySubmitBtn').textContent = 'Добавить';
    document.getElementById('categoryModal').classList.add('active');
}

// Редактировать категорию
function editCategory(category) {
    document.getElementById('categoryId').value = category.id;
    document.getElementById('categoryName').value = category.name;
    document.getElementById('categoryDisplayOrder').value = category.display_order;
    
    document.getElementById('categoryModalTitle').textContent = 'Редактировать категорию';
    document.getElementById('categorySubmitBtn').textContent = 'Сохранить';
    document.getElementById('categoryModal').classList.add('active');
}

// Закрыть модальное окно
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Обработчик формы добавления/редактирования пользователя
document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    const userId = data.id;
    
    // Удаляем пустой пароль при редактировании
    if (userId && !data.password) {
        delete data.password;
    }
    
    delete data.id; // Удаляем id из данных
    
    try {
        const url = userId ? `${API_URL}/admin/users/${userId}` : `${API_URL}/admin/users`;
        const method = userId ? 'PUT' : 'POST';
        
        // При редактировании нужно добавить is_active
        if (userId) {
            const usersResponse = await fetch(`${API_URL}/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const users = await usersResponse.json();
            const currentUser = users.find(u => u.id == userId);
            data.is_active = currentUser.is_active;
        }
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка сохранения');
        }
        
        alert(userId ? 'Пользователь успешно обновлён' : 'Пользователь успешно создан');
        closeModal('userModal');
        loadUsers();
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
    }
});


// Обработчик формы добавления/редактирования категории
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
    if (tabName === 'products') loadProducts();
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
                <div class="stat-value">${(stats.today_revenue || 0).toFixed(0)} сум</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Выручка за месяц</div>
                <div class="stat-value">${(stats.month_revenue || 0).toFixed(0)} сум</div>
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
                    <button class="action-btn edit-btn" onclick='editUser(${JSON.stringify(u)})' title="Изменить">✏️</button>
                    <button class="action-btn ${u.is_active ? 'delete-btn' : 'edit-btn'}" onclick="toggleUserStatus(${u.id}, ${!u.is_active})" title="${u.is_active ? 'Деактивировать' : 'Активировать'}">
                        ${u.is_active ? '🔒' : '🔓'}
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteUser(${u.id})" title="Удалить">🗑️</button>
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
                <td>
                    ${item.image_url ? `<img src="${item.image_url}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px; margin-right: 10px;">` : ''}
                    ${item.name}
                </td>
                <td>${item.category_name || '-'}</td>
                <td>${parseFloat(item.price).toFixed(0)} сум</td>
                <td>${item.is_active ? '✅ Активно' : '❌ Неактивно'}</td>
                <td>
                    <button class="action-btn edit-btn" onclick='editMenuItem(${JSON.stringify(item).replace(/'/g, "&apos;")})' title="Изменить">✏️</button>
                    <button class="action-btn edit-btn" onclick="toggleMenuItem(${item.id}, ${!item.is_active})" title="${item.is_active ? 'Скрыть' : 'Показать'}">
                        ${item.is_active ? '👁️' : '👁️‍🗨️'}
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteMenuItem(${item.id})" title="Удалить">🗑️</button>
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
                    <button class="action-btn edit-btn" onclick='editCategory(${JSON.stringify(cat)})' title="Изменить">✏️</button>
                    <button class="action-btn edit-btn" onclick="toggleCategory(${cat.id}, ${!cat.is_active})" title="${cat.is_active ? 'Скрыть' : 'Показать'}">
                        ${cat.is_active ? '👁️' : '👁️‍🗨️'}
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteCategory(${cat.id})" title="Удалить">🗑️</button>
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
    const select = document.getElementById('menuItemCategory');
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
    document.getElementById('userId').value = '';
    document.getElementById('userModalTitle').textContent = 'Добавить пользователя';
    document.getElementById('userSubmitBtn').textContent = 'Создать';
    document.getElementById('userUsername').readOnly = false;
    document.getElementById('userPassword').required = true;
    document.getElementById('passwordHint').style.display = 'none';
    document.getElementById('userModal').classList.add('active');
}

// Показать модальное окно редактирования пользователя
function editUser(user) {
    document.getElementById('userId').value = user.id;
    document.getElementById('userUsername').value = user.username;
    document.getElementById('userPassword').value = '';
    document.getElementById('userFullName').value = user.full_name;
    document.getElementById('userRole').value = user.role;
    
    document.getElementById('userModalTitle').textContent = 'Редактировать пользователя';
    document.getElementById('userSubmitBtn').textContent = 'Сохранить';
    document.getElementById('userUsername').readOnly = true;
    document.getElementById('userPassword').required = false;
    document.getElementById('passwordHint').style.display = 'inline';
    document.getElementById('userModal').classList.add('active');
}

// Показать модальное окно добавления категории
function showAddCategory() {
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
    document.getElementById('categoryModalTitle').textContent = 'Добавить категорию';
    document.getElementById('categorySubmitBtn').textContent = 'Добавить';
    document.getElementById('categoryModal').classList.add('active');
}

// Редактировать категорию
function editCategory(category) {
    document.getElementById('categoryId').value = category.id;
    document.getElementById('categoryName').value = category.name;
    document.getElementById('categoryDisplayOrder').value = category.display_order;
    
    document.getElementById('categoryModalTitle').textContent = 'Редактировать категорию';
    document.getElementById('categorySubmitBtn').textContent = 'Сохранить';
    document.getElementById('categoryModal').classList.add('active');
}

// Закрыть модальное окно
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Обработчик формы добавления/редактирования пользователя
document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    const userId = data.id;
    
    // Удаляем пустой пароль при редактировании
    if (userId && !data.password) {
        delete data.password;
    }
    
    delete data.id; // Удаляем id из данных
    
    try {
        const url = userId ? `${API_URL}/admin/users/${userId}` : `${API_URL}/admin/users`;
        const method = userId ? 'PUT' : 'POST';
        
        // При редактировании нужно добавить is_active
        if (userId) {
            const usersResponse = await fetch(`${API_URL}/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const users = await usersResponse.json();
            const currentUser = users.find(u => u.id == userId);
            data.is_active = currentUser.is_active;
        }
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка сохранения');
        }
        
        alert(userId ? 'Пользователь успешно обновлён' : 'Пользователь успешно создан');
        closeModal('userModal');
        loadUsers();
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
    }
});


// Обработчик формы добавления/редактирования категории
onst API_URL = window.location.origin + '/api';
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
    if (tabName === 'products') loadProducts();
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
                <div class="stat-value">${(stats.today_revenue || 0).toFixed(0)} сум</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Выручка за месяц</div>
                <div class="stat-value">${(stats.month_revenue || 0).toFixed(0)} сум</div>
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
                    <button class="action-btn edit-btn" onclick='editUser(${JSON.stringify(u)})' title="Изменить">✏️</button>
                    <button class="action-btn ${u.is_active ? 'delete-btn' : 'edit-btn'}" onclick="toggleUserStatus(${u.id}, ${!u.is_active})" title="${u.is_active ? 'Деактивировать' : 'Активировать'}">
                        ${u.is_active ? '🔒' : '🔓'}
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteUser(${u.id})" title="Удалить">🗑️</button>
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
                <td>
                    ${item.image_url ? `<img src="${item.image_url}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px; margin-right: 10px;">` : ''}
                    ${item.name}
                </td>
                <td>${item.category_name || '-'}</td>
                <td>${parseFloat(item.price).toFixed(0)} сум</td>
                <td>${item.is_active ? '✅ Активно' : '❌ Неактивно'}</td>
                <td>
                    <button class="action-btn edit-btn" onclick='editMenuItem(${JSON.stringify(item).replace(/'/g, "&apos;")})' title="Изменить">✏️</button>
                    <button class="action-btn edit-btn" onclick="toggleMenuItem(${item.id}, ${!item.is_active})" title="${item.is_active ? 'Скрыть' : 'Показать'}">
                        ${item.is_active ? '👁️' : '👁️‍🗨️'}
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteMenuItem(${item.id})" title="Удалить">🗑️</button>
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
                    <button class="action-btn edit-btn" onclick='editCategory(${JSON.stringify(cat)})' title="Изменить">✏️</button>
                    <button class="action-btn edit-btn" onclick="toggleCategory(${cat.id}, ${!cat.is_active})" title="${cat.is_active ? 'Скрыть' : 'Показать'}">
                        ${cat.is_active ? '👁️' : '👁️‍🗨️'}
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteCategory(${cat.id})" title="Удалить">🗑️</button>
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
    const select = document.getElementById('menuItemCategory');
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
    document.getElementById('userId').value = '';
    document.getElementById('userModalTitle').textContent = 'Добавить пользователя';
    document.getElementById('userSubmitBtn').textContent = 'Создать';
    document.getElementById('userUsername').readOnly = false;
    document.getElementById('userPassword').required = true;
    document.getElementById('passwordHint').style.display = 'none';
    document.getElementById('userModal').classList.add('active');
}

// Показать модальное окно редактирования пользователя
function editUser(user) {
    document.getElementById('userId').value = user.id;
    document.getElementById('userUsername').value = user.username;
    document.getElementById('userPassword').value = '';
    document.getElementById('userFullName').value = user.full_name;
    document.getElementById('userRole').value = user.role;
    
    document.getElementById('userModalTitle').textContent = 'Редактировать пользователя';
    document.getElementById('userSubmitBtn').textContent = 'Сохранить';
    document.getElementById('userUsername').readOnly = true;
    document.getElementById('userPassword').required = false;
    document.getElementById('passwordHint').style.display = 'inline';
    document.getElementById('userModal').classList.add('active');
}

// Показать модальное окно добавления категории
function showAddCategory() {
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
    document.getElementById('categoryModalTitle').textContent = 'Добавить категорию';
    document.getElementById('categorySubmitBtn').textContent = 'Добавить';
    document.getElementById('categoryModal').classList.add('active');
}

// Редактировать категорию
function editCategory(category) {
    document.getElementById('categoryId').value = category.id;
    document.getElementById('categoryName').value = category.name;
    document.getElementById('categoryDisplayOrder').value = category.display_order;
    
    document.getElementById('categoryModalTitle').textContent = 'Редактировать категорию';
    document.getElementById('categorySubmitBtn').textContent = 'Сохранить';
    document.getElementById('categoryModal').classList.add('active');
}

// Закрыть модальное окно
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Обработчик формы добавления/редактирования пользователя
document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    const userId = data.id;
    
    // Удаляем пустой пароль при редактировании
    if (userId && !data.password) {
        delete data.password;
    }
    
    delete data.id; // Удаляем id из данных
    
    try {
        const url = userId ? `${API_URL}/admin/users/${userId}` : `${API_URL}/admin/users`;
        const method = userId ? 'PUT' : 'POST';
        
        // При редактировании нужно добавить is_active
        if (userId) {
            const usersResponse = await fetch(`${API_URL}/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const users = await usersResponse.json();
            const currentUser = users.find(u => u.id == userId);
            data.is_active = currentUser.is_active;
        }
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка сохранения');
        }
        
        alert(userId ? 'Пользователь успешно обновлён' : 'Пользователь успешно создан');
        closeModal('userModal');
        loadUsers();
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
    }
});


// Обработчик формы добавления/редактирования категории
categoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    const categoryId = data.id;
    delete data.id;
    
    // При редактировании добавляем is_active
    if (categoryId) {
        const categoriesResponse = await fetch(`${API_URL}/admin/categories`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const categories = await categoriesResponse.json();
        const currentCategory = categories.find(c => c.id == categoryId);
        data.is_active = currentCategory.is_active;
    }
    
    try {
        const url = categoryId ? `${API_URL}/admin/categories/${categoryId}` : `${API_URL}/admin/categories`;
        const method = categoryId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка сохранения категории');
        }
        
        alert(categoryId ? 'Категория успешно обновлена' : 'Категория успешно добавлена');
        closeModal('categoryModal');
        loadCategories();
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
    }
});
}

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

// Переключение статуса пользователя
async function toggleUserStatus(id, isActive) {
    try {
        // Сначала получаем данные пользователя
        const usersResponse = await fetch(`${API_URL}/admin/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = await usersResponse.json();
        const user = users.find(u => u.id === id);
        
        if (!user) throw new Error('Пользователь не найден');
        
        const response = await fetch(`${API_URL}/admin/users/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                full_name: user.full_name,
                role: user.role,
                is_active: isActive
            })
        });
        
        if (!response.ok) throw new Error('Ошибка обновления статуса');
        
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
        // Получаем данные блюда
        const menuResponse = await fetch(`${API_URL}/admin/menu`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const menuItems = await menuResponse.json();
        const menuItem = menuItems.find(m => m.id === id);
        
        if (!menuItem) throw new Error('Блюдо не найдено');
        
        const response = await fetch(`${API_URL}/admin/menu/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: menuItem.name,
                category_id: menuItem.category_id,
                description: menuItem.description,
                price: menuItem.price,
                image_url: menuItem.image_url,
                is_active: isActive
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка обновления блюда');
        }
        
        loadMenu();
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
    }
}

// Переключение статуса категории
async function toggleCategory(id, isActive) {
    try {
        // Получаем данные категории
        const categoriesResponse = await fetch(`${API_URL}/admin/categories`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const categories = await categoriesResponse.json();
        const category = categories.find(c => c.id === id);
        
        if (!category) throw new Error('Категория не найдена');
        
        const response = await fetch(`${API_URL}/admin/categories/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: category.name,
                display_order: category.display_order,
                is_active: isActive
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка обновления категории');
        }
        
        loadCategories();
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
    }
}

// Загрузка статистики при открытии страницы
loadStats();
