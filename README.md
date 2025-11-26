# 🦟 Mosquito Hunter Game

An interactive browser-based game that combines eye tracking, hand gesture recognition, and sound frequency detection to create a unique mosquito-hunting experience.

## 🎮 Game Overview

**Mosquito Hunter** is a WebXR/WebCam game where players use their eyes, hands, and voice to eliminate pesky mosquitoes and their ghostly remains.

### Game Mechanics

1. **Eye Tracking Scan** - Use eye movements to scan the screen and reveal mosquito locations
2. **Two-Hand Overlap Kill** - Clap both hands together over a mosquito to kill it
3. **Sound Frequency Destruction** - Use your voice (400-1200 Hz) to destroy ghost mosquitoes

## 📁 Project Structure

```
mosquito-hunter/
├── index.html          # Main HTML file with game UI
├── style.css           # Styling and animations
├── script.js           # Game logic and MediaPipe integration
├── assets/             # Assets directory (for custom sprites if needed)
└── README.md           # This file
```

## 🚀 How to Run

### Prerequisites

- Modern web browser (Chrome, Edge, or Firefox recommended)
- Webcam access
- Microphone access (optional, but required for ghost destruction)
- HTTPS or localhost (required for camera/mic permissions)

### Local Setup

1. **Clone or download this repository**

2. **Serve the files using a local web server**

   **Option A: Python 3**
   ```bash
   python -m http.server 8000
   ```

   **Option B: Python 2**
   ```bash
   python -m SimpleHTTPServer 8000
   ```

   **Option C: Node.js (http-server)**
   ```bash
   npx http-server -p 8000
   ```

   **Option D: VS Code Live Server Extension**
   - Install "Live Server" extension
   - Right-click `index.html` → "Open with Live Server"

3. **Open your browser**

   Navigate to `http://localhost:8000`

4. **Grant permissions**

   Allow camera and microphone access when prompted

## 🎯 How to Play

### Step 1: Eye Tracking Scan
1. Click the **"Start Eye Scan"** button
2. Move your eyes around the screen for 3 seconds
3. The game will detect your gaze patterns and spawn mosquitoes

### Step 2: Kill Living Mosquitoes
- **Bring both hands together** (clap or overlap) over a mosquito
- When both hands are close enough (< 150px apart), a red kill zone appears
- If a mosquito is within this zone, it dies and becomes a **ghost**

### Step 3: Destroy Ghost Mosquitoes
- **Make a sound** in the frequency range of **400-1200 Hz**
- This can be humming, singing, or using a tone generator
- Living mosquitoes will only **vibrate** when hit by sound (no damage)
- Ghost mosquitoes are **destroyed permanently** by the sound

### Win Condition
Eliminate all mosquitoes (both alive and ghost forms)!

## 🛠️ Technical Details

### Technologies Used

- **MediaPipe FaceMesh** - Eye tracking and gaze estimation
- **MediaPipe Hands** - Hand landmark detection and tracking
- **Web Audio API** - Microphone input and frequency analysis
- **HTML5 Canvas** - Game rendering
- **Vanilla JavaScript** - Game logic and state management

### Key Features

#### Mosquito States
- **Alive** - Can be killed by two-hand overlap, vibrates when hit by sound
- **Ghost** - Semi-transparent, floats gently, destroyed by sound frequency
- **Destroyed** - Particle effect, then removed from game

#### Hand Detection
- Tracks up to 2 hands simultaneously
- Calculates distance between hands
- Creates kill zone when hands overlap (< 150px apart)
- Visual feedback with hand skeleton overlay

#### Audio Detection
- Real-time frequency analysis using FFT
- Target frequency range: 400-1200 Hz
- Volume threshold to avoid false positives
- Live frequency display in UI

### Configuration

You can adjust game parameters in `script.js`:

```javascript
const CONFIG = {
    MOSQUITO_COUNT: 8,              // Number of mosquitoes to spawn
    KILL_RADIUS: 80,                // Kill zone radius in pixels
    HAND_OVERLAP_THRESHOLD: 150,    // Max distance for hand overlap
    SOUND_FREQ_MIN: 400,            // Min frequency for ghost destruction
    SOUND_FREQ_MAX: 1200,           // Max frequency for ghost destruction
    SOUND_THRESHOLD: 50,            // Minimum volume threshold
    EYE_SCAN_DURATION: 3000,        // Scan duration in milliseconds
    MOSQUITO_SPEED: 1,              // Mosquito movement speed
    GHOST_FLOAT_SPEED: 0.5,         // Ghost floating speed
};
```

## 🎨 Customization

### Replace Mosquito Sprites

The game currently uses **programmatically drawn mosquitoes**. To use custom images:

1. Add your images to the `assets/` folder:
   - `mosquito_alive.png` - Living mosquito sprite
   - `mosquito_ghost.png` - Ghost mosquito sprite
   - `mosquito_dead_effect.png` - Death particle effect

2. Modify the `draw()` methods in the `Mosquito` class in `script.js`:

```javascript
// In drawAlive() method
const img = new Image();
img.src = 'assets/mosquito_alive.png';
ctx.drawImage(img, -this.size/2, -this.size/2, this.size, this.size);

// In drawGhost() method
const ghostImg = new Image();
ghostImg.src = 'assets/mosquito_ghost.png';
ctx.drawImage(ghostImg, -this.size/2, -this.size/2, this.size, this.size);
```

### Adjust Styling

Modify `style.css` to change:
- Color schemes
- UI layout
- Button styles
- Animations

## 🐛 Troubleshooting

### Camera Not Working
- Ensure you're accessing via HTTPS or localhost
- Check browser permissions for camera access
- Try a different browser (Chrome/Edge recommended)

### Microphone Not Working
- Grant microphone permissions in browser
- Check system microphone settings
- Verify microphone is not muted

### Hands Not Detected
- Ensure good lighting conditions
- Keep hands visible in camera frame
- Try adjusting hand detection confidence in `script.js`:
  ```javascript
  this.hands.setOptions({
      minDetectionConfidence: 0.3,  // Lower for easier detection
      minTrackingConfidence: 0.3
  });
  ```

### Eye Tracking Not Working
- Look directly at the camera during scan
- Ensure your face is well-lit and visible
- Move your eyes (not your head) during the scan

### Performance Issues
- Close other browser tabs
- Reduce `MOSQUITO_COUNT` in config
- Use a more powerful device
- Try Chrome for best MediaPipe performance

## 📊 Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome  | ✅ Full | Recommended |
| Edge    | ✅ Full | Recommended |
| Firefox | ⚠️ Partial | MediaPipe may have issues |
| Safari  | ⚠️ Partial | Limited WebRTC support |

## 🔧 Development

### Code Structure

**script.js** is organized into:
- `CONFIG` - Global configuration constants
- `Mosquito` class - Individual mosquito entity with states and rendering
- `GameManager` class - Main game controller
  - Camera initialization
  - MediaPipe integration (FaceMesh, Hands)
  - Audio analysis
  - Game loop and state management
  - Collision detection
  - UI updates

### Adding Features

To add new features:
1. Define new constants in `CONFIG`
2. Extend the `Mosquito` class for new behaviors
3. Add event handlers in `GameManager`
4. Update UI elements in `index.html` and `style.css`

## 📝 License

This project is open source and available for educational purposes.

## 🙏 Credits

- **MediaPipe** by Google for hand and face tracking
- **Web Audio API** for frequency detection
- **HTML5 Canvas** for rendering

## 🎓 Learning Resources

- [MediaPipe Hands Documentation](https://google.github.io/mediapipe/solutions/hands)
- [MediaPipe Face Mesh Documentation](https://google.github.io/mediapipe/solutions/face_mesh)
- [Web Audio API Guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [HTML5 Canvas Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

## 📧 Support

For issues or questions, please check the troubleshooting section or review the code comments in `script.js`.

---

**Happy Hunting! 🦟🎯**
