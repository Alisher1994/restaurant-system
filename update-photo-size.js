const fs = require('fs');

let html = fs.readFileSync('public/admin.html', 'utf8');

// Заменяем размер photo-upload-box с 200px на 150px
html = html.replace(
    /\.photo-upload-box \{\s+width: 200px;\s+height: 200px;/g,
    `.photo-upload-box {
            width: 150px;
            height: 150px;`
);

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('✅ Размер блока фото изменен на 150x150px');
