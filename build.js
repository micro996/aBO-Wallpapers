const fs = require('fs');
const path = require('path');

const srcFiles = ['index.html', 'sw.js', 'css', 'js', 'docs']; // Add any other folders like 'assets' if needed
const distDir = path.join(__dirname, 'dist');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest);
    fs.readdirSync(src).forEach(function(childItemName) {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else if (exists) {
    fs.copyFileSync(src, dest);
  }
}

srcFiles.forEach(file => {
  copyRecursiveSync(path.join(__dirname, file), path.join(distDir, file));
});

console.log('✅ Successfully copied web assets to the "dist" folder!');
