const fs = require('fs');

// Исправляем admin.js - добавляем проверку для categoryForm
let adminJs = fs.readFileSync('public/js/admin.js', 'utf8');

// Находим строку и заменяем
const oldAdminCode = `document.getElementById('categoryForm').addEventListener('submit', async (e) => {`;
const newAdminCode = `const categoryForm = document.getElementById('categoryForm');
if (categoryForm) {
    categoryForm.addEventListener('submit', async (e) => {`;

if (adminJs.includes(oldAdminCode)) {
    adminJs = adminJs.replace(oldAdminCode, newAdminCode);
    
    // Находим конец обработчика и добавляем закрывающую скобку
    const lines = adminJs.split('\n');
    let bracketCount = 0;
    let startIndex = -1;
    let endIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('categoryForm.addEventListener')) {
            startIndex = i;
            bracketCount = 0;
        }
        if (startIndex > -1) {
            bracketCount += (lines[i].match(/\{/g) || []).length;
            bracketCount -= (lines[i].match(/\}/g) || []).length;
            if (bracketCount === 0 && i > startIndex) {
                endIndex = i;
                lines[i] = lines[i] + '\n}';
                break;
            }
        }
    }
    
    adminJs = lines.join('\n');
    fs.writeFileSync('public/js/admin.js', adminJs, 'utf8');
    console.log('✅ admin.js исправлен');
} else {
    console.log('⚠️ admin.js - код уже исправлен или не найден');
}

// Исправляем products.js
let productsJs = fs.readFileSync('public/js/products.js', 'utf8');

const oldProductsCode = `document.getElementById('productForm').addEventListener('submit', async (e) => {`;
const newProductsCode = `const productForm = document.getElementById('productForm');
if (productForm) {
    productForm.addEventListener('submit', async (e) => {`;

if (productsJs.includes(oldProductsCode)) {
    productsJs = productsJs.replace(oldProductsCode, newProductsCode);
    
    // Находим конец обработчика
    const lines = productsJs.split('\n');
    let bracketCount = 0;
    let startIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('productForm.addEventListener')) {
            startIndex = i;
            bracketCount = 0;
        }
        if (startIndex > -1) {
            bracketCount += (lines[i].match(/\{/g) || []).length;
            bracketCount -= (lines[i].match(/\}/g) || []).length;
            if (bracketCount === 0 && i > startIndex) {
                lines[i] = lines[i] + '\n}';
                break;
            }
        }
    }
    
    productsJs = lines.join('\n');
    fs.writeFileSync('public/js/products.js', productsJs, 'utf8');
    console.log('✅ products.js исправлен');
} else {
    console.log('⚠️ products.js - код уже исправлен или не найден');
}

// Исправляем showAddProduct в products.js
productsJs = fs.readFileSync('public/js/products.js', 'utf8');

const oldSelectCode = `const select = document.getElementById('productCategory');
    select.innerHTML = categories`;

const newSelectCode = `const select = document.getElementById('productCategory');
    if (!select) return;
    select.innerHTML = categories`;

if (productsJs.includes(oldSelectCode)) {
    productsJs = productsJs.replace(oldSelectCode, newSelectCode);
    fs.writeFileSync('public/js/products.js', productsJs, 'utf8');
    console.log('✅ products.js showAddProduct исправлен');
} else {
    console.log('⚠️ products.js showAddProduct - код уже исправлен или не найден');
}
