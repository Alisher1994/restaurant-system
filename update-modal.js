const fs = require('fs');

// Читаем файл
let html = fs.readFileSync('public/admin.html', 'utf8');

// Новое модальное окно
const newModal = `    <!-- Модальное окно для добавления/редактирования блюда -->
    <div class="modal" id="menuModal">
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
                        
                        <div class="form-group">
                            <label>Название блюда *</label>
                            <input type="text" name="name" id="menuItemName" required style="padding: 12px; font-size: 16px;">
                        </div>
                        
                        <div class="form-group">
                            <label>Категория *</label>
                            <select name="category_id" id="menuItemCategory" required style="padding: 12px; font-size: 16px;"></select>
                        </div>
                        
                        <div class="form-group">
                            <label>Фото блюда</label>
                            <div style="display: flex; gap: 15px; align-items: flex-start;">
                                <div style="width: 200px; height: 200px; border: 2px dashed #ccc; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #f9f9f9; position: relative;">
                                    <img id="menuItemPhotoPreview" style="width: 100%; height: 100%; object-fit: cover; display: none; position: absolute; top: 0; left: 0;">
                                    <span id="photoPlaceholder" style="color: #999; text-align: center; font-size: 14px;">Выберите<br>фото</span>
                                </div>
                                <div style="flex: 1;">
                                    <input type="file" name="photo" id="menuItemPhoto" accept="image/*" style="margin-bottom: 10px;">
                                    <small style="color: #666; display: block;">Рекомендуемый размер: квадратное изображение</small>
                                </div>
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
                            <div class="form-group">
                                <label>Себестоимость (сум)</label>
                                <input type="number" name="cost_price" id="menuItemCostPrice" step="1" value="0" readonly style="background: #f5f5f5; padding: 12px; font-size: 16px;">
                                <small style="color: #999;">Рассчитывается автоматически</small>
                            </div>
                            
                            <div class="form-group">
                                <label>Цена продажи (сум) *</label>
                                <input type="number" name="price" id="menuItemPrice" step="1" required style="padding: 12px; font-size: 16px;">
                            </div>
                        </div>
                        
                        <div class="form-group" style="margin-top: 20px;">
                            <label>Статус *</label>
                            <select name="status" id="menuItemStatus" required style="padding: 12px; font-size: 16px;">
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
                                <input type="text" id="ingredientSearch" placeholder="Поиск товара..." autocomplete="off" style="flex: 2; padding: 12px; font-size: 16px;">
                                <input type="number" id="ingredientQuantity" placeholder="Кол-во" step="0.001" style="flex: 1; padding: 12px; font-size: 16px;">
                                <select id="ingredientUnit" style="flex: 1; padding: 12px; font-size: 16px;">
                                    <option value="г">г</option>
                                    <option value="кг">кг</option>
                                    <option value="мл">мл</option>
                                    <option value="л">л</option>
                                    <option value="шт">шт</option>
                                </select>
                                <button type="button" onclick="addIngredientFromSearch()" class="btn btn-primary" style="padding: 12px 20px; font-size: 16px;">+</button>
                            </div>
                            <div class="search-results" id="searchResults" style="position: relative; z-index: 10;"></div>
                        </div>
                        
                        <div class="ingredients-list" id="ingredientsList" style="margin-top: 20px; max-height: 400px; overflow-y: auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 10px;"></div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 20px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
                    <button type="submit" class="btn btn-primary" id="menuSubmitBtn" style="flex: 1; padding: 15px; font-size: 18px;">Сохранить</button>
                    <button type="button" class="btn" style="flex: 1; background: #ccc; padding: 15px; font-size: 18px;" onclick="closeModal('menuModal')">Отмена</button>
                </div>
            </form>
        </div>
    </div>`;

// Ищем старое модальное окно и заменяем
const startMarker = '<!-- Модальное окно для добавления/редактирования блюда -->';
const endMarker = '</div>\n    </div>';

const startIndex = html.indexOf(startMarker);
if (startIndex === -1) {
    console.log('❌ Не найдено модальное окно меню');
    process.exit(1);
}

// Ищем закрывающий тег после начала модального окна
let depth = 0;
let inModal = false;
let endIndex = startIndex;

for (let i = startIndex; i < html.length; i++) {
    if (html.substr(i, 4) === '<div') {
        depth++;
        inModal = true;
    }
    if (html.substr(i, 6) === '</div>') {
        depth--;
        if (depth === 0 && inModal) {
            endIndex = i + 6;
            break;
        }
    }
}

// Заменяем
html = html.substring(0, startIndex) + newModal + html.substring(endIndex);

// Сохраняем
fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('✅ Модальное окно успешно обновлено');
