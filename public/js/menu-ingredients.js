// Функции для работы с составом блюд и фото меню

let currentIngredients = [];

// Показать модальное окно добавления блюда
async function showAddMenuItem() {
    // Загрузить категории для селекта
    const response = await fetch(`${API_URL}/admin/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const categories = await response.json();
    updateCategorySelect(categories);
    
    // Загрузить товары для ингредиентов
    await loadProductsForIngredients();
    
    document.getElementById('menuForm').reset();
    document.getElementById('menuItemId').value = '';
    document.getElementById('menuModalTitle').textContent = 'Добавить блюдо';
    document.getElementById('menuSubmitBtn').textContent = 'Добавить';
    document.getElementById('menuItemPhotoPreview').style.display = 'none';
    currentIngredients = [];
    renderIngredients();
    document.getElementById('menuModal').classList.add('active');
}

// Редактировать блюдо
async function editMenuItem(item) {
    const response = await fetch(`${API_URL}/admin/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const categories = await response.json();
    updateCategorySelect(categories);
    
    // Загрузить товары для ингредиентов
    await loadProductsForIngredients();
    
    // Загрузить ингредиенты блюда
    const ingredientsResponse = await fetch(`${API_URL}/products/${item.id}/ingredients`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    currentIngredients = await ingredientsResponse.json();
    
    document.getElementById('menuItemId').value = item.id;
    document.getElementById('menuItemName').value = item.name;
    document.getElementById('menuItemCategory').value = item.category_id;
    document.getElementById('menuItemPrice').value = item.price;
    document.getElementById('menuItemDescription').value = item.description || '';
    
    // Показать текущее фото если есть
    if (item.image_url && item.image_url.startsWith('/api/admin/menu/')) {
        const preview = document.getElementById('menuItemPhotoPreview');
        preview.src = item.image_url;
        preview.style.display = 'block';
    } else {
        document.getElementById('menuItemPhotoPreview').style.display = 'none';
    }
    
    renderIngredients();
    
    document.getElementById('menuModalTitle').textContent = 'Редактировать блюдо';
    document.getElementById('menuSubmitBtn').textContent = 'Сохранить';
    document.getElementById('menuModal').classList.add('active');
}

// Загрузить товары для выбора ингредиентов
async function loadProductsForIngredients() {
    const response = await fetch(`${API_URL}/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const products = await response.json();
    
    const select = document.getElementById('ingredientProduct');
    select.innerHTML = '<option value="">Выберите товар</option>' + 
        products
            .filter(p => p.is_active)
            .map(p => `<option value="${p.id}">${p.name} (${p.category_name || 'Без категории'})</option>`)
            .join('');
}

// Добавить ингредиент во временный список
function addIngredient() {
    const productId = document.getElementById('ingredientProduct').value;
    const productName = document.getElementById('ingredientProduct').selectedOptions[0]?.text;
    const quantity = document.getElementById('ingredientQuantity').value;
    const unit = document.getElementById('ingredientUnit').value;
    
    if (!productId || !quantity) {
        alert('Выберите товар и укажите количество');
        return;
    }
    
    // Проверить, не добавлен ли уже этот товар
    if (currentIngredients.find(i => i.product_id == productId)) {
        alert('Этот товар уже добавлен в состав');
        return;
    }
    
    currentIngredients.push({
        product_id: parseInt(productId),
        product_name: productName.split(' (')[0],
        quantity: parseFloat(quantity),
        unit: unit
    });
    
    renderIngredients();
    
    // Очистить поля
    document.getElementById('ingredientProduct').value = '';
    document.getElementById('ingredientQuantity').value = '';
}

// Удалить ингредиент из временного списка
function removeIngredient(index) {
    currentIngredients.splice(index, 1);
    renderIngredients();
}

// Отрисовать список ингредиентов
function renderIngredients() {
    const container = document.getElementById('ingredientsList');
    
    if (currentIngredients.length === 0) {
        container.innerHTML = '<p style="color: #999;">Ингредиенты не добавлены</p>';
        return;
    }
    
    container.innerHTML = currentIngredients.map((ing, index) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f5f5f5; border-radius: 5px; margin-bottom: 5px;">
            <span>${ing.product_name}: ${ing.quantity} ${ing.unit}</span>
            <button type="button" onclick="removeIngredient(${index})" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">✕</button>
        </div>
    `).join('');
}

// Предпросмотр фото блюда
document.getElementById('menuItemPhoto').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('menuItemPhotoPreview');
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

// Обработчик формы добавления/редактирования блюда (обновленный)
document.getElementById('menuForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const menuItemId = document.getElementById('menuItemId').value;
    const formData = new FormData();
    
    formData.append('name', document.getElementById('menuItemName').value);
    formData.append('category_id', document.getElementById('menuItemCategory').value);
    formData.append('price', document.getElementById('menuItemPrice').value);
    formData.append('description', document.getElementById('menuItemDescription').value);
    
    // Добавить фото если выбрано
    const photoFile = document.getElementById('menuItemPhoto').files[0];
    if (photoFile) {
        formData.append('photo', photoFile);
    }
    
    // При редактировании добавляем is_active
    if (menuItemId) {
        const menuResponse = await fetch(`${API_URL}/admin/menu`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const menuItems = await menuResponse.json();
        const currentItem = menuItems.find(m => m.id == menuItemId);
        formData.append('is_active', currentItem.is_active);
    }
    
    try {
        const url = menuItemId ? `${API_URL}/admin/menu/${menuItemId}` : `${API_URL}/admin/menu`;
        const method = menuItemId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка сохранения блюда');
        }
        
        const savedItem = await response.json();
        
        // Сохранить ингредиенты
        if (currentIngredients.length > 0) {
            // Сначала удалить старые ингредиенты если это редактирование
            if (menuItemId) {
                const oldIngredients = await fetch(`${API_URL}/products/${menuItemId}/ingredients`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const oldIngs = await oldIngredients.json();
                
                for (const ing of oldIngs) {
                    await fetch(`${API_URL}/products/${menuItemId}/ingredients/${ing.id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                }
            }
            
            // Добавить новые ингредиенты
            const itemId = menuItemId || savedItem.id;
            for (const ing of currentIngredients) {
                await fetch(`${API_URL}/products/${itemId}/ingredients`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        product_id: ing.product_id,
                        quantity: ing.quantity,
                        unit: ing.unit
                    })
                });
            }
        }
        
        alert(menuItemId ? 'Блюдо успешно обновлено' : 'Блюдо успешно добавлено');
        closeModal('menuModal');
        loadMenu();
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
    }
});
