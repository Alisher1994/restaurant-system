const fs = require('fs');

let html = fs.readFileSync('public/admin.html', 'utf8');

// Ищем модальное окно меню
const startMarker = '<div class="modal" id="menuModal">';
const endMarker = '<script src="/js/admin.js"></script>';

const startIndex = html.indexOf(startMarker);
const endIndex = html.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.log('❌ Не найдены маркеры', startIndex, endIndex);
    process.exit(1);
}

const newModalHTML = `<div class="modal" id="menuModal">
        <div class="modal-content fullscreen">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 id="menuModalTitle">Добавить блюдо</h2>
                <button onclick="closeModal('menuModal')" style="background: none; border: none; font-size: 24px; cursor: pointer;">✕</button>
            </div>
            
            <form id="menuForm" enctype="multipart/form-data">
                <input type="hidden" name="id" id="menuItemId">
                
                <div class="modal-two-columns">
                    <!-- Левая колонка: Основные данные -->
                    <div class="modal-column">
                        <h3>📝 Основные данные</h3>
                        
                        <!-- Фото сверху -->
                        <div class="form-group">
                            <label>Фото блюда</label>
                            <div style="width: 150px; height: 150px; border: 2px dashed #ccc; border-radius: 8px; overflow: hidden; position: relative; background: #f9f9f9; cursor: pointer; margin-bottom: 15px;" onclick="document.getElementById('menuItemPhoto').click()">
                                <img id="menuItemPhotoPreview" style="width: 100%; height: 100%; object-fit: cover; display: none; position: absolute; top: 0; left: 0;">
                                <div id="photoPlaceholder" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #999; font-size: 12px; pointer-events: none; text-align: center; padding: 10px;">
                                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 8px;">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                        <polyline points="21 15 16 10 5 21"></polyline>
                                    </svg>
                                    <span>Нажмите для<br>выбора фото</span>
                                </div>
                                <input type="file" name="photo" id="menuItemPhoto" accept="image/*" style="display: none;">
                            </div>
                        </div>
                        
                        <!-- Название, Категория, Цена в одной строке -->
                        <div style="display: grid; grid-template-columns: 2fr 1.5fr 1fr; gap: 15px; margin-bottom: 15px;">
                            <div class="form-group" style="margin: 0;">
                                <label>Название *</label>
                                <input type="text" name="name" id="menuItemName" required style="padding: 10px; font-size: 15px; width: 100%;">
                            </div>
                            
                            <div class="form-group" style="margin: 0;">
                                <label>Категория *</label>
                                <select name="category_id" id="menuItemCategory" required style="padding: 10px; font-size: 15px; width: 100%;"></select>
                            </div>
                            
                            <div class="form-group" style="margin: 0;">
                                <label>Цена (сум) *</label>
                                <input type="number" name="price" id="menuItemPrice" step="1" required style="padding: 10px; font-size: 15px; width: 100%;">
                            </div>
                        </div>
                        
                        <!-- Статус -->
                        <div class="form-group">
                            <label>Статус *</label>
                            <select name="status" id="menuItemStatus" required style="padding: 10px; font-size: 15px; width: 60%; max-width: 400px;">
                                <option value="active">✅ Отображать в меню и продавать</option>
                                <option value="hidden">👁️ Скрыть из меню (не продавать)</option>
                                <option value="out_of_stock">⚠️ Нет в наличии (показывать, но нельзя заказать)</option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- Правая колонка: Состав блюда -->
                    <div class="modal-column">
                        <h3>🧮 Состав блюда</h3>
                        
                        <div class="form-group">
                            <label>Добавление товара в состав</label>
                            <div style="display: flex; gap: 10px; align-items: center; background: #f5f5f5; padding: 10px; border-radius: 8px; position: relative;">
                                <input type="text" id="ingredientSearch" placeholder="Поиск товара..." autocomplete="off" style="flex: 2; padding: 10px; font-size: 15px;">
                                <input type="number" id="ingredientQuantity" placeholder="Кол-во" step="0.001" style="flex: 1; padding: 10px; font-size: 15px;">
                                <select id="ingredientUnit" style="flex: 0.8; padding: 10px; font-size: 15px;">
                                    <option value="г">г</option>
                                    <option value="кг">кг</option>
                                    <option value="мл">мл</option>
                                    <option value="л">л</option>
                                    <option value="шт">шт</option>
                                </select>
                                <button type="button" onclick="addIngredientFromSearch()" class="btn btn-primary" style="padding: 10px 18px; font-size: 15px;">+</button>
                            </div>
                            <div class="search-results" id="searchResults" style="position: relative; z-index: 10;"></div>
                        </div>
                        
                        <div class="ingredients-list" id="ingredientsList" style="margin-top: 15px; max-height: 300px; overflow-y: auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 10px;"></div>
                        
                        <!-- Себестоимость внизу -->
                        <div class="form-group" style="margin-top: 20px;">
                            <label>Себестоимость (сум)</label>
                            <input type="number" name="cost_price" id="menuItemCostPrice" step="1" value="0" readonly style="background: #f5f5f5; padding: 10px; font-size: 15px; width: 60%;">
                            <small style="color: #999; display: block; margin-top: 5px;">Рассчитывается автоматически</small>
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 20px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
                    <button type="submit" class="btn btn-primary" id="menuSubmitBtn" style="flex: 1; padding: 15px; font-size: 18px;">Сохранить</button>
                    <button type="button" class="btn" style="flex: 1; background: #ccc; padding: 15px; font-size: 18px;" onclick="closeModal('menuModal')">Отмена</button>
                </div>
            </form>
        </div>
    </div>

    `;

html = html.substring(0, startIndex) + newModalHTML + html.substring(endIndex);

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('✅ Модальное окно обновлено');
