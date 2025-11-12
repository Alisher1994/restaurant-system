const fs = require('fs');

// Исправляем admin.js
let adminJs = fs.readFileSync('public/js/admin.js', 'utf8');

adminJs = adminJs.replace(
    /\/\/ Обработчик формы добавления\/редактирования категории\ndocument\.getElementById\('categoryForm'\)\.addEventListener\('submit', async \(e\) => \{/,
    `// Обработчик формы добавления/редактирования категории
const categoryForm = document.getElementById('categoryForm');
if (categoryForm) {
    categoryForm.addEventListener('submit', async (e) => {`
);

// Добавляем закрывающую скобку для if
adminJs = adminJs.replace(
    /\}\);(\s+)\/\/ Обработчик формы добавления\/редактирования блюда/,
    `    });
}$1// Обработчик формы добавления/редактирования блюда`
);

fs.writeFileSync('public/js/admin.js', adminJs, 'utf8');
console.log('✅ admin.js исправлен');

// Исправляем products.js
let productsJs = fs.readFileSync('public/js/products.js', 'utf8');

// Исправляем addEventListener
productsJs = productsJs.replace(
    /\/\/ Обработчик формы добавления\/редактирования товара\ndocument\.getElementById\('productForm'\)\.addEventListener\('submit', async \(e\) => \{/,
    `// Обработчик формы добавления/редактирования товара
const productForm = document.getElementById('productForm');
if (productForm) {
    productForm.addEventListener('submit', async (e) => {`
);

// Исправляем showAddProduct
productsJs = productsJs.replace(
    /const select = document\.getElementById\('productCategory'\);\s+select\.innerHTML/g,
    `const select = document.getElementById('productCategory');
    if (!select) return;
    select.innerHTML`
);

// Добавляем закрывающую скобку для if в конце обработчика формы
productsJs = productsJs.replace(
    /\}\);(\s+)\/\/ Обработчик выбора файла для предпросмотра фото/,
    `    });
}$1// Обработчик выбора файла для предпросмотра фото`
);

fs.writeFileSync('public/js/products.js', productsJs, 'utf8');
console.log('✅ products.js исправлен');
