// Script para gerar ícones PWA
// Execute: node scripts/generate-icons.js

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// SVG template com o ícone da igreja
const createSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f59e0b"/>
      <stop offset="100%" style="stop-color:#d97706"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.21)}" fill="url(#bg)"/>
  <g transform="translate(${size * 0.25}, ${size * 0.2}) scale(${size / 512})">
    <path fill="white" d="M128 24 L128 80 L48 80 L48 232 L208 232 L208 80 L128 80 L128 24 L160 24 L160 0 L96 0 L96 24 Z M80 112 L112 112 L112 144 L80 144 Z M144 112 L176 112 L176 144 L144 144 Z M80 168 L112 168 L112 200 L80 200 Z M144 168 L176 168 L176 200 L144 200 Z"/>
  </g>
</svg>`;

// Criar diretório se não existir
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Gerar SVGs para cada tamanho (para usar como fallback)
sizes.forEach(size => {
  const svg = createSvg(size);
  const filename = `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, filename), svg);
  console.log(`Criado: ${filename}`);
});

console.log('\\nÍcones SVG gerados! Para converter para PNG, use um serviço online ou ferramentas como sharp/canvas.');
console.log('Por enquanto, os SVGs servirão como placeholder.');
