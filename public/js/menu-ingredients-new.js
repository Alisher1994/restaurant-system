// Управление ингредиентами блюд - новая версия с поиском
let currentIngredients = [];
let allProducts = [];
let selectedSearchProduct = null;

// Показать модальное окно добавления блюда
async function showAddMenuItem() {
    // Загрузить категории для селекта
    const response = await fetch('/api/admin/categories', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const categories = await response.json();
    
    const categorySelect = document.getElementById('menuItemCategory');
    categorySelect.innerHTML = categories.map(cat => 
        `<option value="${cat.id}">${cat.name}</option>`
    ).join('');
    
    // Загрузить товары для ингредиентов
    await loadProductsForIngredients();
    
    document.getElementById('menuForm').reset();
    document.getElementById('menuItemId').value = '';
    document.getElementById('menuModalTitle').textContent = 'Добавить блюдо';
    document.getElementById('menuSubmitBtn').textContent = 'Сохранить';
    document.getElementById('menuItemPhotoPreview').style.display = 'none';
    document.getElementById('menuItemCostPrice').value = '0';
    document.getElementById('menuItemActive').checked = true;
    document.getElementById('menuItemInStock').checked = true;
    
    currentIngredients = [];
    renderIngredients();
    calculateCost();
    
    document.getElementById('menuModal').classList.add('active');
}

// Редактировать блюдо
async function editMenuItem(item) {
    // Загрузить категории для селекта
    const response = await fetch('/api/admin/categories', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const categories = await response.json();
    
    const categorySelect = document.getElementById('menuItemCategory');
    categorySelect.innerHTML = categories.map(cat => 
        `<option value="${cat.id}">${cat.name}</option>`
    ).join('');
    
    // Загрузить товары для ингредиентов
    await loadProductsForIngredients();
    
    // Загрузить ингредиенты блюда
    await loadMenuItemIngredients(item.id);
    
    document.getElementById('menuItemId').value = item.id;
    document.getElementById('menuItemName').value = item.name;
    document.getElementById('menuItemCategory').value = item.category_id;
    document.getElementById('menuItemPrice').value = item.price;
    document.getElementById('menuItemCostPrice').value = item.cost_price || 0;
    document.getElementById('menuItemDescription').value = item.description || '';
    document.getElementById('menuItemActive').checked = item.is_active;
    document.getElementById('menuItemInStock').checked = item.in_stock !== false;
    
    // Показать текущее фото если есть
    if (item.image_url) {
        const preview = document.getElementById('menuItemPhotoPreview');
        preview.src = item.image_url;
        preview.style.display = 'block';
    } else {
        document.getElementById('menuItemPhotoPreview').style.display = 'none';
    }
    
    document.getElementById('menuModalTitle').textContent = 'Редактировать блюдо';
    document.getElementById('menuSubmitBtn').textContent = 'Сохранить';
    document.getElementById('menuModal').classList.add('active');
}

// Загрузка списка товаров для поиска
async function loadProductsForIngredients() {
    try {
        const response = await fetch('/api/products', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            allProducts = await response.json();
            console.log('Loaded products:', allProducts);
        } else {
            console.error('Ошибка загрузки товаров');
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

// Поиск товаров
function searchProducts() {
    const searchInput = document.getElementById('ingredientSearch');
    const searchResults = document.getElementById('searchResults');
    const query = searchInput.value.toLowerCase().trim();
    
    if (query.length < 2) {
        searchResults.innerHTML = '';
        searchResults.style.display = 'none';
        return;
    }
    
    const filtered = allProducts.filter(p => 
        p.name.toLowerCase().includes(query) ||
        (p.barcode && p.barcode.includes(query))
    );
    
    if (filtered.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item" style="color: #999;">Товары не найдены</div>';
        searchResults.style.display = 'block';
        return;
    }
    
    searchResults.innerHTML = filtered.map(product => `
        <div class="search-result-item" onclick="selectSearchProduct(${product.id})">
            <div>
                <strong>${product.name}</strong>
                ${product.barcode ? `<br><small>Штрихкод: ${product.barcode}</small>` : ''}
            </div>
            <div style="text-align: right;">
                <small>Остаток: ${product.quantity || 0} ${product.unit || 'шт'}</small>
                <br>
                <small>${product.unit_price || 0} сум/${product.unit || 'шт'}</small>
            </div>
        </div>
    `).join('');
    
    searchResults.style.display = 'block';
}

// Выбор товара из результатов поиска
function selectSearchProduct(productId) {
    selectedSearchProduct = allProducts.find(p => p.id === productId);
    if (selectedSearchProduct) {
        document.getElementById('ingredientSearch').value = selectedSearchProduct.name;
        document.getElementById('ingredientUnit').value = selectedSearchProduct.unit || 'г';
        document.getElementById('ingredientQuantity').focus();
        document.getElementById('searchResults').style.display = 'none';
    }
}

// Добавление ингредиента из поиска
function addIngredientFromSearch() {
    if (!selectedSearchProduct) {
        alert('Выберите товар из списка');
        return;
    }
    
    const quantity = parseFloat(document.getElementById('ingredientQuantity').value);
    const unit = document.getElementById('ingredientUnit').value;
    
    if (!quantity || quantity <= 0) {
        alert('Укажите количество');
        return;
    }
    
    // Проверка, не добавлен ли уже этот товар
    if (currentIngredients.find(i => i.product_id === selectedSearchProduct.id)) {
        alert('Этот товар уже добавлен в состав');
        return;
    }
    
    currentIngredients.push({
        product_id: selectedSearchProduct.id,
        product_name: selectedSearchProduct.name,
        quantity: quantity,
        unit: unit,
        unit_price: selectedSearchProduct.unit_price || 0
    });
    
    // Очистка полей
    document.getElementById('ingredientSearch').value = '';
    document.getElementById('ingredientQuantity').value = '';
    document.getElementById('ingredientUnit').value = 'г';
    selectedSearchProduct = null;
    
    renderIngredients();
    calculateCost();
}

// Отображение списка ингредиентов
function renderIngredients() {
    const container = document.getElementById('ingredientsList');
    
    if (currentIngredients.length === 0) {
        container.innerHTML = '<div style="color: #999; text-align: center; padding: 20px;">Состав пока пуст. Добавьте товары через поиск выше.</div>';
        return;
    }
    
    container.innerHTML = currentIngredients.map((ing, index) => `
        <div class="ingredient-item">
            <div>
                <strong>${ing.product_name}</strong>
                <br>
                <small>${ing.quantity} ${ing.unit} × ${ing.unit_price} сум = ${(ing.quantity * ing.unit_price).toFixed(2)} сум</small>
            </div>
            <button onclick="removeIngredient(${index})" class="btn-icon" style="background: #f44336; color: white; padding: 5px 10px; border-radius: 4px;">🗑️</button>
        </div>
    `).join('');
}

// Удаление ингредиента
function removeIngredient(index) {
    currentIngredients.splice(index, 1);
    renderIngredients();
    calculateCost();
}

// Калькуляция себестоимости
function calculateCost() {
    const costPriceInput = document.getElementById('menuItemCostPrice');
    const salePriceInput = document.getElementById('menuItemPrice');
    const calculationDiv = document.getElementById('costCalculation');
    
    if (currentIngredients.length === 0) {
        costPriceInput.value = '0';
        calculationDiv.innerHTML = '<div style="color: #999;">Добавьте ингредиенты для расчёта</div>';
        return;
    }
    
    const totalCost = currentIngredients.reduce((sum, ing) => 
        sum + (ing.quantity * ing.unit_price), 0
    );
    
    costPriceInput.value = totalCost.toFixed(2);
    
    const salePrice = parseFloat(salePriceInput.value) || 0;
    const profit = salePrice - totalCost;
    const profitPercent = totalCost > 0 ? (profit / totalCost * 100) : 0;
    
    calculationDiv.innerHTML = `
        <div style="display: grid; gap: 10px;">
            <div style="display: flex; justify-content: space-between; padding: 8px; background: #f5f5f5; border-radius: 4px;">
                <span>Себестоимость:</span>
                <strong>${totalCost.toFixed(2)} сум</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px; background: #e3f2fd; border-radius: 4px;">
                <span>Цена продажи:</span>
                <strong>${salePrice.toFixed(2)} сум</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px; background: ${profit >= 0 ? '#e8f5e9' : '#ffebee'}; border-radius: 4px;">
                <span>Прибыль:</span>
                <strong style="color: ${profit >= 0 ? '#4caf50' : '#f44336'}">
                    ${profit.toFixed(2)} сум (${profitPercent.toFixed(1)}%)
                </strong>
            </div>
            <div style="display: grid; grid-template-columns: repeat(${Math.min(currentIngredients.length, 4)}, 1fr); gap: 5px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #e0e0e0;">
                ${currentIngredients.map(ing => `
                    <div style="font-size: 11px; text-align: center;">
                        <div style="font-weight: bold;">${ing.product_name}</div>
                        <div style="color: #666;">${(ing.quantity * ing.unit_price).toFixed(0)} сум</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Загрузка ингредиентов существующего блюда
async function loadMenuItemIngredients(menuItemId) {
    try {
        const response = await fetch(`/api/products/${menuItemId}/ingredients`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            currentIngredients = await response.json();
            renderIngredients();
            calculateCost();
        }
    } catch (error) {
        console.error('Ошибка загрузки ингредиентов:', error);
    }
}

// Сохранение ингредиентов блюда
async function saveMenuItemIngredients(menuItemId) {
    if (currentIngredients.length === 0) {
        return true;
    }

    try {
        const response = await fetch(`/api/products/${menuItemId}/ingredients`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ ingredients: currentIngredients })
        });

        return response.ok;
    } catch (error) {
        console.error('Ошибка сохранения ингредиентов:', error);
        return false;
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    loadProductsForIngredients();
    
    // Предпросмотр фото при выборе
    const photoInput = document.getElementById('menuItemPhoto');
    if (photoInput) {
        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const preview = document.getElementById('menuItemPhotoPreview');
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Поиск товаров при вводе
    const searchInput = document.getElementById('ingredientSearch');
    if (searchInput) {
        searchInput.addEventListener('input', searchProducts);
        
        // Закрытие результатов при клике вне
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.ingredient-search')) {
                const results = document.getElementById('searchResults');
                if (results) results.style.display = 'none';
            }
        });
    }
    
    // Пересчёт при изменении цены продажи
    const salePriceInput = document.getElementById('menuItemPrice');
    if (salePriceInput) {
        salePriceInput.addEventListener('input', calculateCost);
    }
    
    // Обработка отправки формы блюда
    const menuForm = document.getElementById('menuForm');
    if (menuForm) {
        menuForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(menuForm);
            const menuItemId = formData.get('id');
            
            // Добавляем поля себестоимости и наличия
            formData.set('cost_price', document.getElementById('menuItemCostPrice').value);
            formData.set('in_stock', document.getElementById('menuItemInStock').checked ? '1' : '0');
            formData.set('active', document.getElementById('menuItemActive').checked ? '1' : '0');
            
            try {
                const url = menuItemId ? `/api/admin/menu/${menuItemId}` : '/api/admin/menu';
                const method = menuItemId ? 'PUT' : 'POST';
                
                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: formData
                });
                
                if (response.ok) {
                    const result = await response.json();
                    const savedMenuItemId = result.id || menuItemId;
                    
                    // Сохраняем ингредиенты
                    const ingredientsSaved = await saveMenuItemIngredients(savedMenuItemId);
                    
                    if (ingredientsSaved) {
                        alert('Блюдо успешно сохранено');
                        closeModal('menuModal');
                        if (typeof loadMenu === 'function') {
                            loadMenu();
                        }
                    } else {
                        alert('Блюдо сохранено, но возникла ошибка при сохранении ингредиентов');
                    }
                } else {
                    const error = await response.json();
                    alert('Ошибка: ' + (error.error || 'Не удалось сохранить блюдо'));
                }
            } catch (error) {
                console.error('Ошибка:', error);
                alert('Ошибка при сохранении блюда');
            }
        });
    }
});
