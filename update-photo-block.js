const fs = require('fs');

let html = fs.readFileSync('public/admin.html', 'utf8');

const oldPhotoBlock = `                        <div class="form-group">
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
                        </div>`;

const newPhotoBlock = `                        <div class="form-group">
                            <label>Фото блюда</label>
                            <div style="width: 200px; height: 200px; border: 2px dashed #ccc; border-radius: 8px; overflow: hidden; position: relative; background: #f9f9f9; cursor: pointer;" onclick="document.getElementById('menuItemPhoto').click()">
                                <img id="menuItemPhotoPreview" style="width: 100%; height: 100%; object-fit: cover; display: none; position: absolute; top: 0; left: 0;">
                                <div id="photoPlaceholder" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #999; font-size: 14px; pointer-events: none;">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 8px;">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                        <polyline points="21 15 16 10 5 21"></polyline>
                                    </svg>
                                    <span>Нажмите для<br>выбора фото</span>
                                </div>
                                <input type="file" name="photo" id="menuItemPhoto" accept="image/*" style="display: none;">
                            </div>
                            <small style="color: #666; display: block; margin-top: 8px;">Рекомендуемый размер: квадратное изображение</small>
                        </div>`;

html = html.replace(oldPhotoBlock, newPhotoBlock);

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('✅ Блок выбора фото обновлен');
