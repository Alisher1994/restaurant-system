// Управление ингредиентами блюд - обновленная версия
let currentIngredients = [];
let allProducts = [];
let selectedSearchProduct = null;

// Показать модальное окно добавления блюда
async function showAddMenuItem() {
    const response = await fetch('/api/admin/categories', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const categories = await response.json();
    
    const categorySelect = document.getElementById('menuItemCategory');
    categorySelect.innerHTML = categories.map(cat => 
        `<option value="${cat.id}">${cat.name}</option>`
    ).join('');
    
    await loadProductsForIngredients();
    
    document.getElementById('menuForm').reset();
    document.getElementById('menuItemId').value = '';
    document.getElementById('menuModalTitle').textContent = 'Добавить блюдо';
    document.getElementById('menuSubmitBtn').textContent = 'Сохранить';
    const preview = document.getElementById('menuItemPhotoPreview');
    const photoBox = preview.closest('[onclick]');
    preview.style.display = 'none';
    if (photoBox) photoBox.classList.remove('has-photo');
    const placeholder = document.getElementById('photoPlaceholder');
    if (placeholder) placeholder.style.display = 'block';
    document.getElementById('menuItemCostPrice').value = '0';
    document.getElementById('menuItemStatus').value = 'active';
    
    currentIngredients = [];
    renderIngredients();
    
    document.getElementById('menuModal').classList.add('active');
}

// Редактировать блюдо
async function editMenuItem(item) {
    const response = await fetch('/api/admin/categories', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const categories = await response.json();
    
    const categorySelect = document.getElementById('menuItemCategory');
    categorySelect.innerHTML = categories.map(cat => 
        `<option value="${cat.id}">${cat.name}</option>`
    ).join('');
    
    await loadProductsForIngredients();
    await loadMenuItemIngredients(item.id);
    
    document.getElementById('menuItemId').value = item.id;
    document.getElementById('menuItemName').value = item.name;
    document.getElementById('menuItemCategory').value = item.category_id;
    document.getElementById('menuItemPrice').value = item.price;
    document.getElementById('menuItemCostPrice').value = item.cost_price || 0;
    
    // Определяем статус
    if (item.is_active && item.in_stock !== false) {
        document.getElementById('menuItemStatus').value = 'active';
    } else if (!item.is_active) {
        document.getElementById('menuItemStatus').value = 'hidden';
    } else {
        document.getElementById('menuItemStatus').value = 'out_of_stock';
    }
    
    // Показать текущее фото
    if (item.image_url) {
        const preview = document.getElementById('menuItemPhotoPreview');
        const photoBox = preview.closest('[onclick]');
        preview.src = item.image_url;
        preview.style.display = 'block';
        if (photoBox) photoBox.classList.add('has-photo');
        const placeholder = document.getElementById('photoPlaceholder');
        if (placeholder) placeholder.style.display = 'none';
    } else {
        const preview = document.getElementById('menuItemPhotoPreview');
    const photoBox = preview.closest('[onclick]');
    preview.style.display = 'none';
    if (photoBox) photoBox.classList.remove('has-photo');
    const placeholder = document.getElementById('photoPlaceholder');
    if (placeholder) placeholder.style.display = 'block';
    }
    
    document.getElementById('menuModalTitle').textContent = 'Редактировать блюдо';
    document.getElementById('menuSubmitBtn').textContent = 'Сохранить';
    document.getElementById('menuModal').classList.add('active');
}

// Загрузка списка товаров
async function loadProductsForIngredients() {
    try {
        const response = await fetch('/api/products', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
            allProducts = await response.json();
            console.log('Loaded products:', allProducts);
        }
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
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

// Добавление ингредиента
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
    
    document.getElementById('ingredientSearch').value = '';
    document.getElementById('ingredientQuantity').value = '';
    document.getElementById('ingredientUnit').value = 'г';
    selectedSearchProduct = null;
    
    renderIngredients();
    updateCostPrice();
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
                <small style="color: #666;">${ing.quantity} ${ing.unit} × ${ing.unit_price} сум = ${(ing.quantity * ing.unit_price).toFixed(2)} сум</small>
            </div>
            <button onclick="removeIngredient(${index})" class="btn-icon" type="button" style="background: #f44336; color: white; padding: 8px 12px; border-radius: 4px; border: none; cursor: pointer;">🗑️</button>
        </div>
    `).join('');
}

// Удаление ингредиента
function removeIngredient(index) {
    currentIngredients.splice(index, 1);
    renderIngredients();
    updateCostPrice();
}

// Обновление себестоимости
function updateCostPrice() {
    const costPriceInput = document.getElementById('menuItemCostPrice');
    
    if (currentIngredients.length === 0) {
        costPriceInput.value = '0';
        return;
    }
    
    const totalCost = currentIngredients.reduce((sum, ing) => 
        sum + (ing.quantity * ing.unit_price), 0
    );
    
    costPriceInput.value = totalCost.toFixed(2);
}

// Загрузка ингредиентов блюда
async function loadMenuItemIngredients(menuItemId) {
    try {
        const response = await fetch(`/api/products/${menuItemId}/ingredients`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
            currentIngredients = await response.json();
            renderIngredients();
            updateCostPrice();
        }
    } catch (error) {
        console.error('Ошибка загрузки ингредиентов:', error);
    }
}

// Сохранение ингредиентов
async function saveMenuItemIngredients(menuItemId) {
    if (currentIngredients.length === 0) return true;

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
    
    // Предпросмотр фото
    const photoInput = document.getElementById('menuItemPhoto');
    if (photoInput) {
        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const preview = document.getElementById('menuItemPhotoPreview');
                    const photoBox = preview.closest('[onclick]');
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                    if (photoBox) photoBox.classList.add('has-photo');
                    const placeholder = document.getElementById('photoPlaceholder');
                    if (placeholder) placeholder.style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Поиск товаров
    const searchInput = document.getElementById('ingredientSearch');
    if (searchInput) {
        searchInput.addEventListener('input', searchProducts);
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.form-group')) {
                const results = document.getElementById('searchResults');
                if (results) results.style.display = 'none';
            }
        });
    }
    
    // Отправка формы
    const menuForm = document.getElementById('menuForm');
    if (menuForm) {
        menuForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(menuForm);
            const menuItemId = formData.get('id');
            const status = formData.get('status');
            
            // Конвертируем статус
            if (status === 'active') {
                formData.set('active', '1');
                formData.set('in_stock', '1');
            } else if (status === 'hidden') {
                formData.set('active', '0');
                formData.set('in_stock', '0');
            } else if (status === 'out_of_stock') {
                formData.set('active', '1');
                formData.set('in_stock', '0');
            }
            
            formData.delete('status');
            
            try {
                const url = menuItemId ? `/api/admin/menu/${menuItemId}` : '/api/admin/menu';
                const method = menuItemId ? 'PUT' : 'POST';
                
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                    body: formData
                });
                
                if (response.ok) {
                    const result = await response.json();
                    const savedMenuItemId = result.id || menuItemId;
                    
                    const ingredientsSaved = await saveMenuItemIngredients(savedMenuItemId);
                    
                    if (ingredientsSaved) {
                        alert('Блюдо успешно сохранено');
                        closeModal('menuModal');
                        if (typeof loadMenu === 'function') {
                            loadMenu();
                        }
                    } else {
                        alert('Блюдо сохранено, но ошибка при сохранении ингредиентов');
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
