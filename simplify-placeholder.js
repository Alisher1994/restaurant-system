const fs = require('fs');

let html = fs.readFileSync('public/admin.html', 'utf8');

// Ищем блок с SVG иконкой и заменяем на простой текст
const oldPlaceholder = `<div id="photoPlaceholder" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #999; font-size: 12px; pointer-events: none; text-align: center; padding: 10px;">
                                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 8px;">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                        <polyline points="21 15 16 10 5 21"></polyline>
                                    </svg>
                                    <span>Нажмите для<br>выбора фото</span>
                                </div>`;

const newPlaceholder = `<div id="photoPlaceholder" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #999; font-size: 13px; pointer-events: none; text-align: center; padding: 10px;">
                                    Нажмите для выбора фото
                                </div>`;

html = html.replace(oldPlaceholder, newPlaceholder);

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('✅ Placeholder обновлен - оставлен только текст');
