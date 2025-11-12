// Обновление функций для работы с новым интерфейсом

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
    document.getElementById('photoPlaceholder').style.display = 'block';
    document.getElementById('menuItemCostPrice').value = '0';
    document.getElementById('menuItemStatus').value = 'active';
    
    currentIngredients = [];
    renderIngredients();
    
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
    
    // Определяем статус
    if (item.is_active && item.in_stock !== false) {
        document.getElementById('menuItemStatus').value = 'active';
    } else if (!item.is_active) {
        document.getElementById('menuItemStatus').value = 'hidden';
    } else {
        document.getElementById('menuItemStatus').value = 'out_of_stock';
    }
    
    // Показать текущее фото если есть
    if (item.image_url) {
        const preview = document.getElementById('menuItemPhotoPreview');
        preview.src = item.image_url;
        preview.style.display = 'block';
        document.getElementById('photoPlaceholder').style.display = 'none';
    } else {
        document.getElementById('menuItemPhotoPreview').style.display = 'none';
        document.getElementById('photoPlaceholder').style.display = 'block';
    }
    
    document.getElementById('menuModalTitle').textContent = 'Редактировать блюдо';
    document.getElementById('menuSubmitBtn').textContent = 'Сохранить';
    document.getElementById('menuModal').classList.add('active');
}

// Отображение списка ингредиентов (без калькуляции)
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
            <button onclick="removeIngredient(${index})" class="btn-icon" type="button" style="background: #f44336; color: white; padding: 8px 12px; border-radius: 4px; border: none; cursor: pointer;">🗑️ Удалить</button>
        </div>
    `).join('');
    
    // Обновляем себестоимость
    updateCostPrice();
}

// Обновление себестоимости (без показа детальной калькуляции)
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

// Обработка отправки формы
document.addEventListener('DOMContentLoaded', () => {
    const menuForm = document.getElementById('menuForm');
    if (menuForm) {
        menuForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(menuForm);
            const menuItemId = formData.get('id');
            const status = formData.get('status');
            
            // Конвертируем статус в active и in_stock
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
            
            formData.delete('status'); // Удаляем временное поле
            
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
    
    // Предпросмотр фото при выборе
    const photoInput = document.getElementById('menuItemPhoto');
    if (photoInput) {
        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const preview = document.getElementById('menuItemPhotoPreview');
                    const placeholder = document.getElementById('photoPlaceholder');
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                    if (placeholder) placeholder.style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        });
    }
});
