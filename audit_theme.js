const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function scanDirectory(dir) {
  const result = execSync(`grep -rEi "#([0-9a-fA-F]{3}){1,2}\\b|rgba?\\(" "${dir}" || true`, { encoding: 'utf-8' });
  const lines = result.split('\n').filter(line => line.trim() !== '');
  const filtered = lines.filter(line => {
    // Ignore css variables definitions in style.css
    if (line.includes('style.css:') && line.includes('--color-')) return false;
    // Ignore theme-color meta tag in index.html
    if (line.includes('index.html:') && line.includes('theme-color')) return false;
    // Ignore audit script itself
    if (line.includes('audit_theme.js:')) return false;
    return true;
  });
  return filtered;
}

const cssDir = path.join(__dirname, 'css');
const jsDir = path.join(__dirname, 'js');
const indexHtml = path.join(__dirname, 'index.html');

console.log('--- CSS Hardcoded Colors ---');
console.log(scanDirectory(cssDir).join('\n') || 'None found.');

console.log('\n--- JS Hardcoded Colors ---');
console.log(scanDirectory(jsDir).join('\n') || 'None found.');

console.log('\n--- HTML Hardcoded Colors ---');
console.log(scanDirectory(indexHtml).join('\n') || 'None found.');
