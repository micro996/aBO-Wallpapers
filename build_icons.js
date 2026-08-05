const { Jimp } = require('jimp');
const fs = require('fs');

async function processIcons() {
  const imagePath = 'assets/icon.jpg';
  console.log('Loading image:', imagePath);
  
  if (!fs.existsSync(imagePath)) {
    console.error('File not found:', imagePath);
    return;
  }
  
  const image = await Jimp.read(imagePath);
  
  const writeImg = (img, path) => new Promise((res, rej) => img.write(path, (err) => err ? rej(err) : res()));

  // 1. Convert to PNG for Capacitor
  await writeImg(image, 'assets/icon.png');
  console.log('Saved assets/icon.png');
  
  await writeImg(image.clone(), 'assets/splash.png');
  console.log('Saved assets/splash.png');

  // 2. Generate Monochrome Silhouette
  const monochrome = image.clone();
  monochrome.scan(0, 0, monochrome.bitmap.width, monochrome.bitmap.height, function(x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
    
    if (luminance > 40) { 
      this.bitmap.data[idx + 0] = 255;
      this.bitmap.data[idx + 1] = 255;
      this.bitmap.data[idx + 2] = 255;
      this.bitmap.data[idx + 3] = 255;
    } else {
      this.bitmap.data[idx + 0] = 0;
      this.bitmap.data[idx + 1] = 0;
      this.bitmap.data[idx + 2] = 0;
      this.bitmap.data[idx + 3] = 0; 
    }
  });
  
  await writeImg(monochrome, 'assets/icon-dark.png');
  await writeImg(monochrome.clone(), 'assets/icon-foreground.png');
  console.log('Saved monochrome assets');

  // 3. Generate Web Favicons
  await writeImg(image.clone().resize(512, 512), 'assets/favicon-512x512.png');
  await writeImg(image.clone().resize(192, 192), 'assets/favicon-192x192.png');
  await writeImg(image.clone().resize(32, 32), 'assets/favicon-32x32.png');
  await writeImg(image.clone().resize(32, 32), 'assets/favicon.ico');
  await writeImg(image.clone().resize(180, 180), 'assets/apple-touch-icon.png');
  console.log('Saved web favicons');
}

processIcons().catch(console.error);
