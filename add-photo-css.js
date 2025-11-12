const fs = require('fs');

let html = fs.readFileSync('public/admin.html', 'utf8');

// Ищем закрывающий тег </style>
const styleEndIndex = html.lastIndexOf('</style>');

if (styleEndIndex === -1) {
    console.log('❌ Не найден тег </style>');
    process.exit(1);
}

const additionalCSS = `
        /* Стили для блока выбора фото */
        .photo-upload-box {
            width: 200px;
            height: 200px;
            border: 2px dashed #ccc;
            border-radius: 8px;
            overflow: hidden;
            position: relative;
            background: #f9f9f9;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .photo-upload-box:hover {
            border-color: #4caf50;
            background: #f0f8f0;
        }
        
        .photo-upload-box:hover #photoPlaceholder {
            color: #4caf50;
        }
        
        .photo-upload-box.has-photo {
            border-style: solid;
            border-color: #4caf50;
        }
        
        .photo-upload-box.has-photo:hover::after {
            content: '📷 Изменить фото';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            font-size: 14px;
            pointer-events: none;
        }

    `;

// Вставляем перед </style>
html = html.substring(0, styleEndIndex) + additionalCSS + html.substring(styleEndIndex);

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('✅ CSS для блока фото добавлен');
