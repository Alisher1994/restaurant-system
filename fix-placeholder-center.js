const fs = require('fs');

let html = fs.readFileSync('public/admin.html', 'utf8');

// Убираем padding из photoPlaceholder для идеального центрирования
html = html.replace(
    /id="photoPlaceholder" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #999; font-size: 13px; pointer-events: none; text-align: center; padding: 10px;"/g,
    'id="photoPlaceholder" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #999; font-size: 13px; pointer-events: none; text-align: center;"'
);

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('✅ Padding удален из photoPlaceholder для идеального центрирования');
