// Функции для работы с товарами

// Загрузка товаров
async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/products`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            console.error('Response status:', response.status);
            throw new Error('Ошибка загрузки товаров');
        }
        
        const products = await response.json();
        console.log('Loaded products:', products);
        
        const tbody = document.getElementById('productsTableBody');
        
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px; color: #999;">Товары не добавлены</td></tr>';
            return;
        }
        
        tbody.innerHTML = products.map(p => {
            const productData = {
                id: p.id,
                name: p.name,
                category_id: p.category_id,
                category_name: p.category_name,
                barcode: p.barcode,
                netto: p.netto,
                brutto: p.brutto,
                unit: p.unit,
                is_active: p.is_active,
                has_photo: p.has_photo
            };
            
            return `
            <tr>
                <td>${p.id}</td>
                <td>
                    ${p.has_photo ? `<img src="${API_URL}/products/${p.id}/photo" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">` : '📦'}
                </td>
                <td>${p.name}</td>
                <td>${p.category_name || '-'}</td>
                <td>${p.barcode || '-'}</td>
                <td>${p.netto ? p.netto + ' ' + (p.unit || 'кг') : '-'}</td>
                <td>${p.brutto ? p.brutto + ' ' + (p.unit || 'кг') : '-'}</td>
                <td>${p.is_active ? '✅ Активен' : '❌ Неактивен'}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editProduct(${p.id})" title="Изменить">✏️</button>
                    <button class="action-btn edit-btn" onclick="toggleProduct(${p.id}, ${!p.is_active})" title="${p.is_active ? 'Скрыть' : 'Показать'}">
                        ${p.is_active ? '👁️' : '👁️‍🗨️'}
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteProduct(${p.id})" title="Удалить">🗑️</button>
                </td>
            </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось загрузить товары: ' + error.message);
    }
}

// Показать модальное окно добавления товара
async function showAddProduct() {
    // Загрузить категории товаров
    const response = await fetch(`${API_URL}/products/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const categories = await response.json();
    
    const select = document.getElementById('productCategory');
    if (!select) return;
    select.innerHTML = categories
        .filter(c => c.is_active)
        .map(c => `<option value="${c.id}">${c.name}</option>`)
        .join('');
    
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('productModalTitle').textContent = 'Добавить товар';
    document.getElementById('productSubmitBtn').textContent = 'Добавить';
    document.getElementById('productPhotoPreview').style.display = 'none';
    document.getElementById('productModal').classList.add('active');
}

// Редактировать товар
async function editProduct(product) {
    const response = await fetch(`${API_URL}/products/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const categories = await response.json();
    
    const select = document.getElementById('productCategory');
    if (!select) return;
    select.innerHTML = categories
        .map(c => `<option value="${c.id}">${c.name}</option>`)
        .join('');
    
    document.getElementById('productId').value = product.id;
    document.getElementById('productCategory').value = product.category_id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productBarcode').value = product.barcode || '';
    document.getElementById('productNetto').value = product.netto || '';
    document.getElementById('productBrutto').value = product.brutto || '';
    document.getElementById('productUnit').value = product.unit || 'кг';
    
    // Показать текущее фото если есть
    if (product.has_photo) {
        const preview = document.getElementById('productPhotoPreview');
        preview.src = `${API_URL}/products/${product.id}/photo`;
        preview.style.display = 'block';
    } else {
        document.getElementById('productPhotoPreview').style.display = 'none';
    }
    
    document.getElementById('productModalTitle').textContent = 'Редактировать товар';
    document.getElementById('productSubmitBtn').textContent = 'Сохранить';
    document.getElementById('productModal').classList.add('active');
}

// Обработчик формы добавления/редактирования товара
const productForm = document.getElementById('productForm');
// Функции для работы с товарами

// Загрузка товаров
async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/products`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            console.error('Response status:', response.status);
            throw new Error('Ошибка загрузки товаров');
        }
        
        const products = await response.json();
        console.log('Loaded products:', products);
        
        const tbody = document.getElementById('productsTableBody');
        
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px; color: #999;">Товары не добавлены</td></tr>';
            return;
        }
        
        tbody.innerHTML = products.map(p => {
            const productData = {
                id: p.id,
                name: p.name,
                category_id: p.category_id,
                category_name: p.category_name,
                barcode: p.barcode,
                netto: p.netto,
                brutto: p.brutto,
                unit: p.unit,
                is_active: p.is_active,
                has_photo: p.has_photo
            };
            
            return `
            <tr>
                <td>${p.id}</td>
                <td>
                    ${p.has_photo ? `<img src="${API_URL}/products/${p.id}/photo" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">` : '📦'}
                </td>
                <td>${p.name}</td>
                <td>${p.category_name || '-'}</td>
                <td>${p.barcode || '-'}</td>
                <td>${p.netto ? p.netto + ' ' + (p.unit || 'кг') : '-'}</td>
                <td>${p.brutto ? p.brutto + ' ' + (p.unit || 'кг') : '-'}</td>
                <td>${p.is_active ? '✅ Активен' : '❌ Неактивен'}</td>
                <td>
                    <button class="action-btn edit-btn" onclick='editProduct(${JSON.stringify(productData)})' title="Изменить">✏️</button>
                    <button class="action-btn edit-btn" onclick="toggleProduct(${p.id}, ${!p.is_active})" title="${p.is_active ? 'Скрыть' : 'Показать'}">
                        ${p.is_active ? '👁️' : '👁️‍🗨️'}
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteProduct(${p.id})" title="Удалить">🗑️</button>
                </td>
            </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось загрузить товары: ' + error.message);
    }
}

// Показать модальное окно добавления товара
async function showAddProduct() {
    // Загрузить категории товаров
    const response = await fetch(`${API_URL}/products/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const categories = await response.json();
    
    const select = document.getElementById('productCategory');
    if (!select) return;
    select.innerHTML = categories
        .filter(c => c.is_active)
        .map(c => `<option value="${c.id}">${c.name}</option>`)
        .join('');
    
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('productModalTitle').textContent = 'Добавить товар';
    document.getElementById('productSubmitBtn').textContent = 'Добавить';
    document.getElementById('productPhotoPreview').style.display = 'none';
    document.getElementById('productModal').classList.add('active');
}

// Редактировать товар
async function editProduct(product) {
    const response = await fetch(`${API_URL}/products/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const categories = await response.json();
    
    const select = document.getElementById('productCategory');
    if (!select) return;
    select.innerHTML = categories
        .map(c => `<option value="${c.id}">${c.name}</option>`)
        .join('');
    
    document.getElementById('productId').value = product.id;
    document.getElementById('productCategory').value = product.category_id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productBarcode').value = product.barcode || '';
    document.getElementById('productNetto').value = product.netto || '';
    document.getElementById('productBrutto').value = product.brutto || '';
    document.getElementById('productUnit').value = product.unit || 'кг';
    
    // Показать текущее фото если есть
    if (product.has_photo) {
        const preview = document.getElementById('productPhotoPreview');
        preview.src = `${API_URL}/products/${product.id}/photo`;
        preview.style.display = 'block';
    } else {
        document.getElementById('productPhotoPreview').style.display = 'none';
    }
    
    document.getElementById('productModalTitle').textContent = 'Редактировать товар';
    document.getElementById('productSubmitBtn').textContent = 'Сохранить';
    document.getElementById('productModal').classList.add('active');
}

// Обработчик формы добавления/редактирования товара
/ Функции для работы с товарами

// Загрузка товаров
async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/products`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            console.error('Response status:', response.status);
            throw new Error('Ошибка загрузки товаров');
        }
        
        const products = await response.json();
        console.log('Loaded products:', products);
        
        const tbody = document.getElementById('productsTableBody');
        
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px; color: #999;">Товары не добавлены</td></tr>';
            return;
        }
        
        tbody.innerHTML = products.map(p => {
            const productData = {
                id: p.id,
                name: p.name,
                category_id: p.category_id,
                category_name: p.category_name,
                barcode: p.barcode,
                netto: p.netto,
                brutto: p.brutto,
                unit: p.unit,
                is_active: p.is_active,
                has_photo: p.has_photo
            };
            
            return `
            <tr>
                <td>${p.id}</td>
                <td>
                    ${p.has_photo ? `<img src="${API_URL}/products/${p.id}/photo" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">` : '📦'}
                </td>
                <td>${p.name}</td>
                <td>${p.category_name || '-'}</td>
                <td>${p.barcode || '-'}</td>
                <td>${p.netto ? p.netto + ' ' + (p.unit || 'кг') : '-'}</td>
                <td>${p.brutto ? p.brutto + ' ' + (p.unit || 'кг') : '-'}</td>
                <td>${p.is_active ? '✅ Активен' : '❌ Неактивен'}</td>
                <td>
                    <button class="action-btn edit-btn" onclick='editProduct(${JSON.stringify(productData)})' title="Изменить">✏️</button>
                    <button class="action-btn edit-btn" onclick="toggleProduct(${p.id}, ${!p.is_active})" title="${p.is_active ? 'Скрыть' : 'Показать'}">
                        ${p.is_active ? '👁️' : '👁️‍🗨️'}
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteProduct(${p.id})" title="Удалить">🗑️</button>
                </td>
            </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось загрузить товары: ' + error.message);
    }
}

// Показать модальное окно добавления товара
async function showAddProduct() {
    // Загрузить категории товаров
    const response = await fetch(`${API_URL}/products/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const categories = await response.json();
    
    const select = document.getElementById('productCategory');
    if (!select) return;
    select.innerHTML = categories
        .filter(c => c.is_active)
        .map(c => `<option value="${c.id}">${c.name}</option>`)
        .join('');
    
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('productModalTitle').textContent = 'Добавить товар';
    document.getElementById('productSubmitBtn').textContent = 'Добавить';
    document.getElementById('productPhotoPreview').style.display = 'none';
    document.getElementById('productModal').classList.add('active');
}

// Редактировать товар
async function editProduct(product) {
    const response = await fetch(`${API_URL}/products/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const categories = await response.json();
    
    const select = document.getElementById('productCategory');
    if (!select) return;
    select.innerHTML = categories
        .map(c => `<option value="${c.id}">${c.name}</option>`)
        .join('');
    
    document.getElementById('productId').value = product.id;
    document.getElementById('productCategory').value = product.category_id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productBarcode').value = product.barcode || '';
    document.getElementById('productNetto').value = product.netto || '';
    document.getElementById('productBrutto').value = product.brutto || '';
    document.getElementById('productUnit').value = product.unit || 'кг';
    
    // Показать текущее фото если есть
    if (product.has_photo) {
        const preview = document.getElementById('productPhotoPreview');
        preview.src = `${API_URL}/products/${product.id}/photo`;
        preview.style.display = 'block';
    } else {
        document.getElementById('productPhotoPreview').style.display = 'none';
    }
    
    document.getElementById('productModalTitle').textContent = 'Редактировать товар';
    document.getElementById('productSubmitBtn').textContent = 'Сохранить';
    document.getElementById('productModal').classList.add('active');
}

// Обработчик формы добавления/редактирования товара
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const productId = document.getElementById('productId').value;
    const formData = new FormData(e.target);
    
    // Если файл не выбран при редактировании, удаляем поле
    if (productId && !formData.get('photo').name) {
        formData.delete('photo');
    }
    
    // При редактировании добавляем is_active
    if (productId) {
        const productsResponse = await fetch(`${API_URL}/products`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const products = await productsResponse.json();
        const currentProduct = products.find(p => p.id == productId);
        formData.append('is_active', currentProduct.is_active);
    }
    
    try {
        const url = productId ? `${API_URL}/products/${productId}` : `${API_URL}/products`;
        const method = productId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка сохранения товара');
        }
        
        alert(productId ? 'Товар успешно обновлён' : 'Товар успешно добавлен');
        closeModal('productModal');
        loadProducts();
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
    }
});
}

// Предпросмотр фото товара
document.getElementById('productPhoto').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('productPhotoPreview');
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

// Переключение статуса товара
async function toggleProduct(id, isActive) {
    try {
        const productsResponse = await fetch(`${API_URL}/products`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const products = await productsResponse.json();
        const product = products.find(p => p.id === id);
        
        if (!product) throw new Error('Товар не найден');
        
        const formData = new FormData();
        formData.append('name', product.name);
        formData.append('category_id', product.category_id);
        formData.append('barcode', product.barcode || '');
        formData.append('netto', product.netto || '');
        formData.append('brutto', product.brutto || '');
        formData.append('unit', product.unit);
        formData.append('is_active', isActive);
        
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка обновления товара');
        }
        
        loadProducts();
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
    }
}

// Удаление товара
async function deleteProduct(id) {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) return;
    
    try {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Ошибка удаления товара');
        
        alert('Товар удален');
        loadProducts();
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
    }
}


