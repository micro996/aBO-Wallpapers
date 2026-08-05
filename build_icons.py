from PIL import Image
import os

img = Image.open('assets/icon.png').convert('RGBA')

# 2. Generate Monochrome Silhouette
monochrome = img.copy()
pixels = monochrome.load()
for y in range(monochrome.height):
    for x in range(monochrome.width):
        r, g, b, a = pixels[x, y]
        l = (0.299*r + 0.587*g + 0.114*b)
        if l > 40:
            pixels[x, y] = (255, 255, 255, 255)
        else:
            pixels[x, y] = (0, 0, 0, 0)

monochrome.save('assets/icon-dark.png')
monochrome.save('assets/icon-foreground.png')

# 3. Generate Web Favicons
img.resize((512, 512)).save('assets/favicon-512x512.png')
img.resize((192, 192)).save('assets/favicon-192x192.png')
img.resize((32, 32)).save('assets/favicon-32x32.png')
img.resize((32, 32)).save('assets/favicon.ico')
img.resize((180, 180)).save('assets/apple-touch-icon.png')

print("All assets generated successfully!")
