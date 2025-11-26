# Assets Directory

This folder is for custom mosquito sprite images that you can use in the game.

## 📸 Upload Your Images Here

You can upload custom images to replace the programmatically drawn mosquitoes:

### Recommended Images

1. **mosquito_alive.png** - Living mosquito sprite
   - Recommended size: 80x80 pixels
   - Format: PNG with transparency
   - Should show a mosquito with wings

2. **mosquito_ghost.png** - Ghost mosquito sprite
   - Recommended size: 80x80 pixels
   - Format: PNG with transparency
   - Should be semi-transparent/wispy looking

3. **mosquito_dead_effect.png** - Death particle effect (optional)
   - Recommended size: 40x40 pixels
   - Format: PNG with transparency
   - Used for particle animations

## 🎨 Image Specifications

- **Format**: PNG (with alpha transparency recommended)
- **Size**: 40x40 to 100x100 pixels (80x80 is optimal)
- **Style**: Can be realistic, cartoon, pixel art - your choice!
- **Background**: Transparent background works best

## 🔧 How to Use Custom Images

After uploading your images here, you need to modify `script.js` to use them:

### Option 1: Simple Image Loading (for static sprites)

In the `Mosquito` class, add image loading in the constructor:

```javascript
constructor(x, y, canvasWidth, canvasHeight) {
    // ... existing code ...

    // Load images
    this.aliveImage = new Image();
    this.aliveImage.src = 'assets/mosquito_alive.png';

    this.ghostImage = new Image();
    this.ghostImage.src = 'assets/mosquito_ghost.png';
}
```

Then replace the `drawAlive()` and `drawGhost()` methods:

```javascript
drawAlive(ctx) {
    if (this.aliveImage.complete) {
        ctx.drawImage(
            this.aliveImage,
            -this.size/2,
            -this.size/2,
            this.size,
            this.size
        );
    } else {
        // Fallback to programmatic drawing
        // ... keep existing drawing code ...
    }
}

drawGhost(ctx) {
    if (this.ghostImage.complete) {
        ctx.globalAlpha = 0.5;
        ctx.drawImage(
            this.ghostImage,
            -this.size/2,
            -this.size/2,
            this.size,
            this.size
        );
        ctx.globalAlpha = 1.0;
    } else {
        // Fallback to programmatic drawing
        // ... keep existing drawing code ...
    }
}
```

### Option 2: Preload Images (recommended for better performance)

Add a preloader in `GameManager` class before starting the game:

```javascript
async preloadImages() {
    const imagePaths = [
        'assets/mosquito_alive.png',
        'assets/mosquito_ghost.png'
    ];

    const promises = imagePaths.map(path => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load ${path}`));
            img.src = path;
        });
    });

    try {
        const images = await Promise.all(promises);
        this.images = {
            alive: images[0],
            ghost: images[1]
        };
        return true;
    } catch (error) {
        console.warn('Failed to load custom images, using default rendering');
        return false;
    }
}
```

## 📝 Notes

- If no images are uploaded, the game will use the default programmatically drawn mosquitoes
- Make sure image file names match exactly (case-sensitive)
- Images should be optimized for web (keep file size small)
- Test images locally first before deploying

## 🎯 Quick Tips

- Use tools like Photoshop, GIMP, or online sprite editors
- For pixel art style: try Piskel or Aseprite
- For AI-generated: try DALL-E, Midjourney, or Stable Diffusion
- For free sprites: check OpenGameArt.org or itch.io

---

**Upload your images to this folder on GitHub and modify the code as shown above!**
