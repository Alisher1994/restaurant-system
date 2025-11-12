const fs = require('fs');

let content = fs.readFileSync('public/js/menu-ingredients-new.js', 'utf8');

// Заменяем все места где показываем/скрываем фото
content = content.replace(
    /const preview = document\.getElementById\('menuItemPhotoPreview'\);\s+preview\.src = e\.target\.result;\s+preview\.style\.display = 'block';\s+const placeholder = document\.getElementById\('photoPlaceholder'\);\s+if \(placeholder\) placeholder\.style\.display = 'none';/g,
    `const preview = document.getElementById('menuItemPhotoPreview');
                    const photoBox = preview.closest('[onclick]');
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                    if (photoBox) photoBox.classList.add('has-photo');
                    const placeholder = document.getElementById('photoPlaceholder');
                    if (placeholder) placeholder.style.display = 'none';`
);

// Заменяем в функции showAddMenuItem
content = content.replace(
    /document\.getElementById\('menuItemPhotoPreview'\)\.style\.display = 'none';\s+const placeholder = document\.getElementById\('photoPlaceholder'\);\s+if \(placeholder\) placeholder\.style\.display = 'block';/g,
    `const preview = document.getElementById('menuItemPhotoPreview');
    const photoBox = preview.closest('[onclick]');
    preview.style.display = 'none';
    if (photoBox) photoBox.classList.remove('has-photo');
    const placeholder = document.getElementById('photoPlaceholder');
    if (placeholder) placeholder.style.display = 'block';`
);

// Заменяем в функции editMenuItem - когда есть фото
content = content.replace(
    /const preview = document\.getElementById\('menuItemPhotoPreview'\);\s+preview\.src = item\.image_url;\s+preview\.style\.display = 'block';\s+const placeholder = document\.getElementById\('photoPlaceholder'\);\s+if \(placeholder\) placeholder\.style\.display = 'none';/g,
    `const preview = document.getElementById('menuItemPhotoPreview');
        const photoBox = preview.closest('[onclick]');
        preview.src = item.image_url;
        preview.style.display = 'block';
        if (photoBox) photoBox.classList.add('has-photo');
        const placeholder = document.getElementById('photoPlaceholder');
        if (placeholder) placeholder.style.display = 'none';`
);

fs.writeFileSync('public/js/menu-ingredients-new.js', content, 'utf8');
console.log('✅ JavaScript обновлен для добавления класса has-photo');
