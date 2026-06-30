const fs = require('fs');
const path = require('path');
const root = __dirname;
const files = [path.join(root, 'src', 'pages', 'Agenda.tsx'), path.join(root, 'src', 'pages', 'Admin.tsx')];
const replacements = [
    ['bg-gray-50', 'bg-dark-800'],
    ['bg-gray-100', 'bg-dark-700'],
    ['bg-gray-200', 'bg-dark-700'],
    ['bg-gray-300', 'bg-dark-700'],
    ['bg-gray-400', 'bg-dark-700'],
    ['bg-gray-500', 'bg-dark-700'],
    ['bg-white', 'bg-dark-700'],
    ['bg-pink-50', 'bg-gold-400/10'],
    ['bg-pink-100', 'bg-gold-400/15'],
    ['bg-pink-200', 'bg-gold-400/20'],
    ['bg-pink-500', 'bg-gold-400'],
    ['text-pink-500', 'text-gold-300'],
    ['text-pink-600', 'text-gold-300'],
    ['text-pink-700', 'text-gold-300'],
    ['border-pink-100', 'border-gold-400/20'],
    ['border-pink-200', 'border-gold-400/20'],
    ['border-pink-500', 'border-gold-400'],
    ['hover:bg-pink-100', 'hover:bg-gold-300'],
    ['hover:bg-pink-600', 'hover:bg-gold-300'],
    ['text-gray-900', 'text-gray-100'],
    ['text-gray-800', 'text-gray-100'],
    ['text-gray-700', 'text-gray-200'],
    ['text-gray-600', 'text-gray-300'],
    ['text-gray-500', 'text-gray-400'],
    ['text-gray-400', 'text-gray-300'],
    ['border-gray-200', 'border-gold-400/20'],
    ['border-gray-100', 'border-gold-400/10'],
    ['border-gray-300', 'border-gold-400/20'],
    ['border-gray-400', 'border-gold-400/20'],
    ['hover:bg-gray-50', 'hover:bg-dark-600'],
    ['hover:bg-gray-100', 'hover:bg-dark-600'],
    ['hover:bg-gray-200', 'hover:bg-dark-600'],
    ['bg-red-50', 'bg-red-950/40'],
    ['text-red-700', 'text-red-400'],
    ['border-red-100', 'border-red-400/30'],
    ['bg-green-50', 'bg-green-950/30'],
    ['text-green-700', 'text-green-300'],
    ['border-green-100', 'border-green-300/40'],
    ['bg-yellow-50', 'bg-yellow-950/20'],
    ['text-yellow-700', 'text-gold-300'],
    ['border-yellow-100', 'border-gold-400/20'],
];
for (const filePath of files) {
  const text = fs.readFileSync(filePath, 'utf8');
  let result = text;
  for (const [oldText, newText] of replacements) {
    result = result.split(oldText).join(newText);
  }
  if (result !== text) {
    fs.writeFileSync(filePath, result, 'utf8');
    console.log(`Updated ${filePath}`);
  } else {
    console.log(`No changes for ${filePath}`);
  }
}
const indexPath = path.join(root, 'src', 'index.css');
const css = fs.readFileSync(indexPath, 'utf8');
const extra = `\n/* Premium gold accent overrides */\n.text-pink-500,\n.text-pink-600,\n.text-pink-700 {\n  color: #d4af37 !important;\n}\n.text-red-700 {\n  color: #ff9999 !important;\n}\n.text-green-700 {\n  color: #90e090 !important;\n}\n.border-pink-100,\n.border-pink-200,\n.border-pink-500 {\n  border-color: rgba(212, 175, 55, 0.25) !important;\n}\n.hover\\:bg-pink-600:hover {\n  background-color: #d4af37 !important;\n}\n`;
if (!css.includes(extra)) {
  fs.writeFileSync(indexPath, css + extra, 'utf8');
  console.log('Updated index.css with premium overrides');
} else {
  console.log('index.css already has overrides');
}
