const fs = require('fs');

let productsJS = fs.readFileSync('public/js/products.js', 'utf8');
productsJS = productsJS.replace('/ Р¤СѓРЅРєС†РёРё РґР»СЏ СЂР°Р±РѕС‚С‹ СЃ С‚РѕРІР°СЂР°РјРё', '// Р¤СѓРЅРєС†РёРё РґР»СЏ СЂР°Р±РѕС‚С‹ СЃ С‚РѕРІР°СЂР°РјРё');

fs.writeFileSync('public/js/products.js', productsJS, 'utf8');
console.log('✅ products.js: исправлено сломанное регулярное выражение');
