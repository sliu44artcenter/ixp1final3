// ====================================================================
// MOSQUITO HUNTER GAME
// Features: Eye Tracking Scan, Two-Hand Overlap Kill, Sound Destruction
// ====================================================================

// ====================================================================
// CONSTANTS AND CONFIGURATION
// ====================================================================

const CONFIG = {
    MOSQUITO_COUNT: 8,
    KILL_RADIUS: 80,              // Radius around hand to show indicator
    HAND_OVERLAP_THRESHOLD: 150,  // Max distance between hands to consider "overlapping"
    SOUND_FREQ_MIN: 350,          // Minimum frequency for destruction (350 Hz or above)
    SOUND_FREQ_MAX: 100000,       // Maximum frequency (essentially no upper limit)
    SOUND_THRESHOLD: 50,          // Minimum volume threshold
    EYE_SCAN_DURATION: 3000,      // Eye scan duration in milliseconds
    MOSQUITO_SPEED: 1,            // Movement speed
    GHOST_FLOAT_SPEED: 0.5,       // Ghost floating speed
    ALERT_RADIUS: 150,            // Distance at which mosquito starts escaping from hand
    ESCAPE_SPEED_MULTIPLIER: 2.5, // Speed multiplier during escape
    ESCAPE_DURATION: 500,         // Escape burst duration in milliseconds
};

// ====================================================================
// IMAGE ASSETS
// ====================================================================

// Global image storage for mosquito sprites
const IMAGES = {
    mosquito1: null,
    mosquito2: null,
    ghostMosquito1: null,
    ghostMosquito2: null,
    loaded: false
};

// Preload images
function preloadImages() {
    return new Promise((resolve) => {
        let loadedCount = 0;
        const totalImages = 4;

        const checkComplete = () => {
            loadedCount++;
            if (loadedCount === totalImages) {
                IMAGES.loaded = true;
                console.log('✅ Custom mosquito images loaded successfully!');
                resolve(true);
            }
        };

        // Load mosquito animation frame 1
        IMAGES.mosquito1 = new Image();
        IMAGES.mosquito1.onload = checkComplete;
        IMAGES.mosquito1.onerror = () => {
            console.warn('⚠️ Failed to load mosquito1.png, using fallback rendering');
            checkComplete();
        };
        IMAGES.mosquito1.src = 'assets/mosquito1.png';

        // Load mosquito animation frame 2
        IMAGES.mosquito2 = new Image();
        IMAGES.mosquito2.onload = checkComplete;
        IMAGES.mosquito2.onerror = () => {
            console.warn('⚠️ Failed to load mosquito2.png, using fallback rendering');
            checkComplete();
        };
        IMAGES.mosquito2.src = 'assets/mosquito2.png';

        // Load ghost mosquito animation frame 1
        IMAGES.ghostMosquito1 = new Image();
        IMAGES.ghostMosquito1.onload = checkComplete;
        IMAGES.ghostMosquito1.onerror = () => {
            console.warn('⚠️ Failed to load ghostmosquito1.png, using fallback rendering');
            checkComplete();
        };
        IMAGES.ghostMosquito1.src = 'assets/ghostmosquito1.png';

        // Load ghost mosquito animation frame 2
        IMAGES.ghostMosquito2 = new Image();
        IMAGES.ghostMosquito2.onload = checkComplete;
        IMAGES.ghostMosquito2.onerror = () => {
            console.warn('⚠️ Failed to load ghostmosquito2.png, using fallback rendering');
            checkComplete();
        };
        IMAGES.ghostMosquito2.src = 'assets/ghostmosquito2.png';
    });
}

// ====================================================================
// MOSQUITO CLASS
// ====================================================================

class Mosquito {
    constructor(x, y, canvasWidth, canvasHeight) {
        this.x = x;
        this.y = y;
        this.state = 'alive'; // 'alive', 'ghost', 'destroyed'
        this.size = 40;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = CONFIG.MOSQUITO_SPEED;
        this.wingAngle = 0;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        // Random movement
        this.directionChangeTimer = 0;
        this.direction = {
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1
        };

        // Vibration state
        this.vibrating = false;
        this.vibrationTimer = 0;
        this.vibrationOffset = { x: 0, y: 0 };

        // Sound-induced shaking
        this.soundShaking = false;
        this.soundShakeOffset = { x: 0, y: 0 };

        // Escape behavior
        this.escapeMode = false;
        this.escapeDuration = 0;
        this.escapeDirection = { x: 0, y: 0 };

        // Ghost properties
        this.opacity = 1.0;
        this.floatOffset = 0;

        // Particle effect
        this.particles = [];
    }

    // Update mosquito position and animation
    update(deltaTime) {
        if (this.state === 'destroyed') {
            this.updateParticles();
            return;
        }

        // Handle vibration
        if (this.vibrating) {
            this.vibrationTimer -= deltaTime;
            if (this.vibrationTimer <= 0) {
                this.vibrating = false;
                this.vibrationOffset = { x: 0, y: 0 };
            } else {
                // Create shake effect
                this.vibrationOffset.x = (Math.random() - 0.5) * 6;
                this.vibrationOffset.y = (Math.random() - 0.5) * 6;
            }
        }

        // Handle sound-induced shaking (lighter effect)
        if (this.soundShaking && this.state === 'alive') {
            // Create subtle micro-shake effect when sound is detected
            this.soundShakeOffset.x = (Math.random() - 0.5) * 3;
            this.soundShakeOffset.y = (Math.random() - 0.5) * 3;
        } else {
            this.soundShakeOffset = { x: 0, y: 0 };
        }

        // Update wing animation
        this.wingAngle += deltaTime * 0.02;

        if (this.state === 'alive') {
            this.updateAlive(deltaTime);
        } else if (this.state === 'ghost') {
            this.updateGhost(deltaTime);
        }
    }

    updateAlive(deltaTime) {
        // Handle escape mode
        if (this.escapeMode) {
            this.escapeDuration -= deltaTime;

            if (this.escapeDuration <= 0) {
                // Exit escape mode and return to normal movement
                this.escapeMode = false;
                this.speed = CONFIG.MOSQUITO_SPEED;
            } else {
                // Move in escape direction with increased speed
                this.x += this.escapeDirection.x * this.speed;
                this.y += this.escapeDirection.y * this.speed;
            }
        } else {
            // Normal random zig-zag movement
            this.directionChangeTimer += deltaTime;
            if (this.directionChangeTimer > 1000) {
                this.direction.x = Math.random() * 2 - 1;
                this.direction.y = Math.random() * 2 - 1;
                this.directionChangeTimer = 0;
            }

            // Move with normal speed
            this.x += this.direction.x * this.speed;
            this.y += this.direction.y * this.speed;
        }

        // Bounce off edges
        if (this.x < this.size) {
            this.x = this.size;
            if (this.escapeMode) {
                this.escapeDirection.x *= -1;
            } else {
                this.direction.x *= -1;
            }
        }
        if (this.x > this.canvasWidth - this.size) {
            this.x = this.canvasWidth - this.size;
            if (this.escapeMode) {
                this.escapeDirection.x *= -1;
            } else {
                this.direction.x *= -1;
            }
        }
        if (this.y < this.size) {
            this.y = this.size;
            if (this.escapeMode) {
                this.escapeDirection.y *= -1;
            } else {
                this.direction.y *= -1;
            }
        }
        if (this.y > this.canvasHeight - this.size) {
            this.y = this.canvasHeight - this.size;
            if (this.escapeMode) {
                this.escapeDirection.y *= -1;
            } else {
                this.direction.y *= -1;
            }
        }
    }

    updateGhost(deltaTime) {
        // Gentle floating motion
        this.floatOffset += deltaTime * 0.001;
        this.y += Math.sin(this.floatOffset * 2) * CONFIG.GHOST_FLOAT_SPEED;

        // Keep ghost in bounds
        if (this.y < this.size) this.y = this.size;
        if (this.y > this.canvasHeight - this.size) this.y = this.canvasHeight - this.size;
    }

    // Draw mosquito on canvas
    draw(ctx) {
        if (this.state === 'destroyed') {
            this.drawParticles(ctx);
            return;
        }

        ctx.save();
        ctx.translate(
            this.x + this.vibrationOffset.x + this.soundShakeOffset.x,
            this.y + this.vibrationOffset.y + this.soundShakeOffset.y
        );

        if (this.state === 'alive') {
            this.drawAlive(ctx);
        } else if (this.state === 'ghost') {
            this.drawGhost(ctx);
        }

        ctx.restore();
    }

    drawAlive(ctx) {
        // Use custom images with animation if loaded, otherwise fall back to programmatic drawing
        if (IMAGES.mosquito1 && IMAGES.mosquito1.complete && IMAGES.mosquito1.naturalWidth > 0 &&
            IMAGES.mosquito2 && IMAGES.mosquito2.complete && IMAGES.mosquito2.naturalWidth > 0) {

            // Alternate between mosquito1 and mosquito2 for animation effect
            // Use wingAngle to determine which frame to show
            const useFrame1 = Math.sin(this.wingAngle * 10) > 0;
            const currentImage = useFrame1 ? IMAGES.mosquito1 : IMAGES.mosquito2;

            // Draw animated mosquito image
            const imageSize = this.size * 2; // Make image larger for visibility
            ctx.drawImage(
                currentImage,
                -imageSize / 2,
                -imageSize / 2,
                imageSize,
                imageSize
            );
        } else {
            // Fallback: Programmatic drawing
            // Body
            ctx.fillStyle = '#2c2c2c';
            ctx.beginPath();
            ctx.ellipse(0, 0, 8, 15, 0, 0, Math.PI * 2);
            ctx.fill();

            // Head
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.arc(0, -15, 6, 0, Math.PI * 2);
            ctx.fill();

            // Wings (animated)
            const wingFlap = Math.sin(this.wingAngle * 20) * 0.3;

            ctx.fillStyle = 'rgba(200, 200, 255, 0.4)';
            ctx.beginPath();
            ctx.ellipse(-5, -5, 12, 20, -0.3 + wingFlap, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.ellipse(5, -5, 12, 20, 0.3 - wingFlap, 0, Math.PI * 2);
            ctx.fill();

            // Legs
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 1;
            for (let i = -1; i <= 1; i++) {
                ctx.beginPath();
                ctx.moveTo(i * 5, 5);
                ctx.lineTo(i * 8, 15);
                ctx.stroke();
            }

            // Proboscis (stinger)
            ctx.strokeStyle = '#8b4513';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -15);
            ctx.lineTo(0, -25);
            ctx.stroke();
        }
    }

    drawGhost(ctx) {
        // Use custom ghost images with animation if loaded, otherwise fall back to programmatic drawing
        if (IMAGES.ghostMosquito1 && IMAGES.ghostMosquito1.complete && IMAGES.ghostMosquito1.naturalWidth > 0 &&
            IMAGES.ghostMosquito2 && IMAGES.ghostMosquito2.complete && IMAGES.ghostMosquito2.naturalWidth > 0) {

            // Alternate between ghostmosquito1 and ghostmosquito2 for animation effect
            // Use floatOffset to determine which frame to show (slower animation for ghost)
            const useFrame1 = Math.sin(this.floatOffset * 3) > 0;
            const currentImage = useFrame1 ? IMAGES.ghostMosquito1 : IMAGES.ghostMosquito2;

            // Draw custom ghost mosquito image with transparency
            ctx.globalAlpha = 0.7; // Semi-transparent for ghost effect
            const imageSize = this.size * 2; // Make image larger for visibility
            ctx.drawImage(
                currentImage,
                -imageSize / 2,
                -imageSize / 2,
                imageSize,
                imageSize
            );
            ctx.globalAlpha = 1.0;
        } else {
            // Fallback: Programmatic drawing
            // Semi-transparent ghost version
            ctx.globalAlpha = 0.5;

            // Ghost body (wispy)
            ctx.fillStyle = '#e0e0ff';
            ctx.beginPath();
            ctx.ellipse(0, 0, 12, 18, 0, 0, Math.PI * 2);
            ctx.fill();

            // Ghost face
            ctx.fillStyle = '#4a4a6a';
            ctx.beginPath();
            ctx.arc(-4, -5, 2, 0, Math.PI * 2); // Left eye
            ctx.arc(4, -5, 2, 0, Math.PI * 2);  // Right eye
            ctx.fill();

            // Wispy tail
            ctx.strokeStyle = '#c0c0ff';
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(0, 10);
                ctx.quadraticCurveTo(
                    (i - 1) * 8,
                    15 + Math.sin(this.floatOffset + i) * 5,
                    (i - 1) * 6,
                    25
                );
                ctx.stroke();
            }

            ctx.globalAlpha = 1.0;
        }
    }

    // Trigger vibration effect (when hit by sound while alive)
    vibrate() {
        this.vibrating = true;
        this.vibrationTimer = 400; // Vibrate for 400ms (about 2 cycles)
    }

    // Trigger escape mode when hand approaches
    startEscape(handX, handY) {
        if (this.state !== 'alive') return;

        // Calculate direction away from hand
        const dx = this.x - handX;
        const dy = this.y - handY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            // Normalize direction and set escape direction
            this.escapeDirection.x = (dx / distance);
            this.escapeDirection.y = (dy / distance);
        } else {
            // If on exact same position, escape in random direction
            this.escapeDirection.x = Math.random() * 2 - 1;
            this.escapeDirection.y = Math.random() * 2 - 1;
        }

        // Enter escape mode
        this.escapeMode = true;
        this.escapeDuration = CONFIG.ESCAPE_DURATION;
        this.speed = CONFIG.MOSQUITO_SPEED * CONFIG.ESCAPE_SPEED_MULTIPLIER;
    }

    // Convert to ghost
    becomeGhost() {
        this.state = 'ghost';
        this.speed = 0;
        this.createPoofEffect();
    }

    // Destroy ghost (with particles)
    destroy() {
        this.state = 'destroyed';
        this.createDestructionParticles();
    }

    createPoofEffect() {
        // Simple poof when becoming ghost
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: this.x + (Math.random() - 0.5) * 20,
                y: this.y + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                life: 500,
                maxLife: 500,
                size: Math.random() * 4 + 2,
                color: '#aaaaaa'
            });
        }
    }

    createDestructionParticles() {
        // Particles for ghost destruction
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: this.x + (Math.random() - 0.5) * 30,
                y: this.y + (Math.random() - 0.5) * 30,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4 - 2,
                life: 800,
                maxLife: 800,
                size: Math.random() * 6 + 3,
                color: '#c0c0ff'
            });
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // Gravity
            p.life -= 16; // Assume ~60fps

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    drawParticles(ctx) {
        this.particles.forEach(p => {
            const alpha = p.life / p.maxLife;
            ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    isFullyDestroyed() {
        return this.state === 'destroyed' && this.particles.length === 0;
    }

    // Check if point is near mosquito
    isNear(x, y, radius) {
        const dx = this.x - x;
        const dy = this.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < radius;
    }
}

// ====================================================================
// GAME STATE MANAGER
// ====================================================================

class GameManager {
    constructor() {
        // Canvas setup
        this.gameCanvas = document.getElementById('game-canvas');
        this.handCanvas = document.getElementById('hand-canvas');
        this.video = document.getElementById('video');
        this.gameCtx = this.gameCanvas.getContext('2d');
        this.handCtx = this.handCanvas.getContext('2d');

        // Game state
        this.state = 'WAITING'; // WAITING, SCANNING, PLAYING
        this.mosquitoes = [];
        this.kills = 0;
        this.soulsDestroyed = 0;

        // Hand tracking
        this.leftHand = null;
        this.rightHand = null;
        this.handOverlapPoint = null;

        // MediaPipe
        this.faceMesh = null;
        this.hands = null;
        this.camera = null;

        // Audio
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.dataArray = null;
        this.currentFrequency = 0;
        this.isSoundActive = false; // Track if sound is in active range

        // Animation
        this.lastTime = Date.now();
        this.animationId = null;

        // Eye tracking scan
        this.scanProgress = 0;
        this.scanStartTime = 0;
        this.scannedPositions = [];

        this.init();
    }

    async init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Setup UI event listeners (hidden but functional)
        document.getElementById('start-scan-btn').addEventListener('click', () => this.startEyeScan());
        document.getElementById('restart-btn').addEventListener('click', () => this.restart());

        // Setup play icon click handler
        const playIcon = document.getElementById('play-icon');
        const titleScreen = document.getElementById('title-screen');
        const instructionsScreen = document.getElementById('instructions-screen');

        if (playIcon && titleScreen && instructionsScreen) {
            playIcon.addEventListener('click', async () => {
                // Hide title screen with fade out
                titleScreen.classList.add('hidden');

                // Wait for fade out animation, then show instructions
                setTimeout(() => {
                    titleScreen.style.display = 'none';
                    instructionsScreen.style.display = 'flex';
                }, 500);
            });

            // Setup instructions screen click handler
            instructionsScreen.addEventListener('click', () => {
                // Hide instructions screen with fade out
                instructionsScreen.classList.add('hidden');

                // Wait for fade out animation, then start game
                setTimeout(() => {
                    instructionsScreen.style.display = 'none';
                    this.startEyeScan();
                }, 500);
            });
        }

        await this.initializeCamera();
        this.updateUI();
    }

    resizeCanvas() {
        const wrapper = document.getElementById('canvas-wrapper');
        const rect = wrapper.getBoundingClientRect();

        this.gameCanvas.width = rect.width;
        this.gameCanvas.height = rect.height;
        this.handCanvas.width = rect.width;
        this.handCanvas.height = rect.height;
    }

    async initializeCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 },
                audio: false
            });
            this.video.srcObject = stream;
            await this.video.play();
        } catch (error) {
            console.error('Camera access denied:', error);
            alert('Camera access is required for this game!');
        }
    }

    async startEyeScan() {
        this.state = 'SCANNING';
        this.scanStartTime = Date.now();
        this.scannedPositions = [];
        this.updateUI();

        // Initialize FaceMesh for eye tracking
        await this.initFaceMesh();

        // Start scan countdown
        const scanInterval = setInterval(() => {
            const elapsed = Date.now() - this.scanStartTime;
            const progress = Math.min(100, (elapsed / CONFIG.EYE_SCAN_DURATION) * 100);
            this.scanProgress = progress;

            document.getElementById('mode-text').textContent =
                `Eye Scanning... ${progress.toFixed(0)}% - Move your eyes around the screen!`;

            if (elapsed >= CONFIG.EYE_SCAN_DURATION) {
                clearInterval(scanInterval);
                this.finishScan();
            }
        }, 100);
    }

    async initFaceMesh() {
        this.faceMesh = new FaceMesh({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            }
        });

        this.faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        this.faceMesh.onResults((results) => this.onFaceMeshResults(results));

        this.camera = new Camera(this.video, {
            onFrame: async () => {
                if (this.faceMesh) {
                    await this.faceMesh.send({ image: this.video });
                }
                if (this.hands) {
                    await this.hands.send({ image: this.video });
                }
            },
            width: 1280,
            height: 720
        });

        this.camera.start();
    }

    onFaceMeshResults(results) {
        if (this.state !== 'SCANNING') return;

        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0];

            // Use iris landmarks for gaze estimation (indices 468-477 for eyes)
            // Simplified: use eye center position as gaze point
            const leftEye = landmarks[468];  // Left iris center
            const rightEye = landmarks[473]; // Right iris center

            if (leftEye && rightEye) {
                // Map to canvas coordinates
                const gazeX = ((leftEye.x + rightEye.x) / 2) * this.gameCanvas.width;
                const gazeY = ((leftEye.y + rightEye.y) / 2) * this.gameCanvas.height;

                this.scannedPositions.push({ x: gazeX, y: gazeY, time: Date.now() });
            }
        }
    }

    finishScan() {
        // Stop face mesh
        if (this.faceMesh) {
            this.faceMesh.close();
            this.faceMesh = null;
        }

        // Spawn mosquitoes
        this.spawnMosquitoes();

        // Start game
        this.state = 'PLAYING';
        this.updateUI();

        // Initialize hand tracking
        this.initHandTracking();

        // Initialize audio
        this.initAudio();

        // Start game loop
        this.startGameLoop();

        document.getElementById('restart-btn').style.display = 'inline-block';
    }

    spawnMosquitoes() {
        this.mosquitoes = [];
        const margin = 50;

        for (let i = 0; i < CONFIG.MOSQUITO_COUNT; i++) {
            const x = margin + Math.random() * (this.gameCanvas.width - margin * 2);
            const y = margin + Math.random() * (this.gameCanvas.height - margin * 2);

            this.mosquitoes.push(
                new Mosquito(x, y, this.gameCanvas.width, this.gameCanvas.height)
            );
        }
    }

    async initHandTracking() {
        this.hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        this.hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        this.hands.onResults((results) => this.onHandResults(results));
    }

    onHandResults(results) {
        // Clear hand canvas
        this.handCtx.clearRect(0, 0, this.handCanvas.width, this.handCanvas.height);

        this.leftHand = null;
        this.rightHand = null;
        this.handOverlapPoint = null;

        if (results.multiHandLandmarks && results.multiHandedness) {
            document.getElementById('hands-count').textContent = results.multiHandLandmarks.length;

            results.multiHandLandmarks.forEach((landmarks, index) => {
                const handedness = results.multiHandedness[index].label;

                // Draw hand skeleton
                this.drawHand(landmarks, handedness);

                // Get index finger tip (landmark 8)
                const fingerTip = landmarks[8];
                const handCenter = {
                    x: fingerTip.x * this.handCanvas.width,
                    y: fingerTip.y * this.handCanvas.height
                };

                if (handedness === 'Left') {
                    this.leftHand = handCenter;
                } else {
                    this.rightHand = handCenter;
                }
            });

            // Check for hand touching mosquitoes (with sound requirement)
            // Draw indicators for each hand if sound is active
            if (this.isSoundActive) {
                if (this.leftHand) {
                    // Draw active indicator for left hand
                    this.handCtx.fillStyle = 'rgba(0, 255, 0, 0.3)';
                    this.handCtx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
                    this.handCtx.lineWidth = 3;
                    this.handCtx.beginPath();
                    this.handCtx.arc(
                        this.leftHand.x,
                        this.leftHand.y,
                        CONFIG.KILL_RADIUS,
                        0,
                        Math.PI * 2
                    );
                    this.handCtx.fill();
                    this.handCtx.stroke();
                }

                if (this.rightHand) {
                    // Draw active indicator for right hand
                    this.handCtx.fillStyle = 'rgba(0, 100, 255, 0.3)';
                    this.handCtx.strokeStyle = 'rgba(0, 100, 255, 0.8)';
                    this.handCtx.lineWidth = 3;
                    this.handCtx.beginPath();
                    this.handCtx.arc(
                        this.rightHand.x,
                        this.rightHand.y,
                        CONFIG.KILL_RADIUS,
                        0,
                        Math.PI * 2
                    );
                    this.handCtx.fill();
                    this.handCtx.stroke();
                }
            }

            // Check for mosquito interactions with hands + sound
            this.checkMosquitoInteractions();
        } else {
            document.getElementById('hands-count').textContent = '0';
        }
    }

    drawHand(landmarks, handedness) {
        // Draw hand landmarks and connections
        this.handCtx.fillStyle = handedness === 'Left' ? '#00ff00' : '#0000ff';
        this.handCtx.strokeStyle = handedness === 'Left' ? '#00ff00' : '#0000ff';
        this.handCtx.lineWidth = 2;

        // Draw landmarks
        landmarks.forEach(landmark => {
            const x = landmark.x * this.handCanvas.width;
            const y = landmark.y * this.handCanvas.height;
            this.handCtx.beginPath();
            this.handCtx.arc(x, y, 5, 0, Math.PI * 2);
            this.handCtx.fill();
        });

        // Draw connections (simplified)
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],  // Thumb
            [0, 5], [5, 6], [6, 7], [7, 8],  // Index
            [0, 9], [9, 10], [10, 11], [11, 12],  // Middle
            [0, 13], [13, 14], [14, 15], [15, 16],  // Ring
            [0, 17], [17, 18], [18, 19], [19, 20],  // Pinky
        ];

        connections.forEach(([start, end]) => {
            const startPoint = landmarks[start];
            const endPoint = landmarks[end];
            this.handCtx.beginPath();
            this.handCtx.moveTo(
                startPoint.x * this.handCanvas.width,
                startPoint.y * this.handCanvas.height
            );
            this.handCtx.lineTo(
                endPoint.x * this.handCanvas.width,
                endPoint.y * this.handCanvas.height
            );
            this.handCtx.stroke();
        });
    }

    calculateDistance(point1, point2) {
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    checkMosquitoInteractions() {
        // Only interact with mosquitoes if sound is active (350 Hz or above)
        if (!this.isSoundActive) return;

        // Check if no hands are detected
        if (!this.leftHand && !this.rightHand) return;

        this.mosquitoes.forEach(mosquito => {
            // Check if either hand is touching this mosquito
            // Use larger detection radius (mosquito size * 2.5) for easier touch detection
            const touchRadius = mosquito.size * 2.5;
            let isTouchedByHand = false;

            if (this.leftHand && mosquito.isNear(this.leftHand.x, this.leftHand.y, touchRadius)) {
                isTouchedByHand = true;
            }

            if (this.rightHand && mosquito.isNear(this.rightHand.x, this.rightHand.y, touchRadius)) {
                isTouchedByHand = true;
            }

            // If hand is touching and sound is active, destroy mosquito immediately
            if (isTouchedByHand) {
                if (mosquito.state === 'alive') {
                    // Alive mosquito + hand touch + sound (≥350 Hz) = destroy immediately
                    mosquito.destroy();
                    this.kills++;
                    this.updateScore();
                } else if (mosquito.state === 'ghost') {
                    // Ghost mosquito + hand touch + sound (≥350 Hz) = destroy
                    mosquito.destroy();
                    this.soulsDestroyed++;
                    this.updateScore();
                }
            }
        });
    }

    checkHandProximity() {
        // Check if any hands are detected
        if (!this.leftHand && !this.rightHand) return;

        this.mosquitoes.forEach(mosquito => {
            if (mosquito.state !== 'alive') return;

            // Find nearest hand
            let nearestHandDistance = Infinity;
            let nearestHandX = 0;
            let nearestHandY = 0;

            if (this.leftHand) {
                const distToLeft = this.calculateDistance(
                    { x: mosquito.x, y: mosquito.y },
                    this.leftHand
                );
                if (distToLeft < nearestHandDistance) {
                    nearestHandDistance = distToLeft;
                    nearestHandX = this.leftHand.x;
                    nearestHandY = this.leftHand.y;
                }
            }

            if (this.rightHand) {
                const distToRight = this.calculateDistance(
                    { x: mosquito.x, y: mosquito.y },
                    this.rightHand
                );
                if (distToRight < nearestHandDistance) {
                    nearestHandDistance = distToRight;
                    nearestHandX = this.rightHand.x;
                    nearestHandY = this.rightHand.y;
                }
            }

            // If hand is within alert radius and mosquito is not already escaping, trigger escape
            if (nearestHandDistance < CONFIG.ALERT_RADIUS && !mosquito.escapeMode) {
                mosquito.startEscape(nearestHandX, nearestHandY);
            }
        });
    }

    async initAudio() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;

            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);

            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);

            document.getElementById('audio-status').textContent = 'ON';
            document.getElementById('audio-status').className = 'status-on';

            this.detectFrequency();
        } catch (error) {
            console.error('Microphone access denied:', error);
            alert('Microphone access is optional but required for ghost destruction!');
        }
    }

    detectFrequency() {
        if (!this.analyser) return;

        this.analyser.getByteFrequencyData(this.dataArray);

        // Find peak frequency
        let maxValue = 0;
        let maxIndex = 0;

        for (let i = 0; i < this.dataArray.length; i++) {
            if (this.dataArray[i] > maxValue) {
                maxValue = this.dataArray[i];
                maxIndex = i;
            }
        }

        // Convert index to frequency
        const nyquist = this.audioContext.sampleRate / 2;
        let frequency = (maxIndex * nyquist) / this.dataArray.length;

        // Reset frequency to 0 if volume is too low (no sound detected)
        if (maxValue <= CONFIG.SOUND_THRESHOLD) {
            frequency = 0;
        }

        this.currentFrequency = frequency;
        document.getElementById('frequency-display').textContent = frequency.toFixed(0) + ' Hz';

        // Update volume bar
        const volumePercent = (maxValue / 255) * 100; // maxValue is 0-255
        const volumeBar = document.getElementById('volume-bar-fill');
        const volumeLabel = document.getElementById('volume-label');

        if (volumeBar) {
            volumeBar.style.width = volumePercent + '%';
        }

        if (volumeLabel) {
            const inRange = frequency >= CONFIG.SOUND_FREQ_MIN && frequency <= CONFIG.SOUND_FREQ_MAX;
            const isLoudEnough = maxValue > CONFIG.SOUND_THRESHOLD;

            if (inRange && isLoudEnough) {
                volumeLabel.textContent = `🎤 ${frequency.toFixed(0)} Hz - ACTIVE! (≥350 Hz)`;
                volumeLabel.style.color = '#4CAF50';
            } else {
                volumeLabel.textContent = `Sound: ${frequency.toFixed(0)} Hz (${volumePercent.toFixed(0)}%)`;
                volumeLabel.style.color = 'white';
            }
        }

        // Update sound active state based on frequency and volume
        if (
            frequency >= CONFIG.SOUND_FREQ_MIN &&
            frequency <= CONFIG.SOUND_FREQ_MAX &&
            maxValue > CONFIG.SOUND_THRESHOLD
        ) {
            this.isSoundActive = true;
        } else {
            this.isSoundActive = false;
        }

        requestAnimationFrame(() => this.detectFrequency());
    }

    startGameLoop() {
        const gameLoop = () => {
            if (this.state !== 'PLAYING') return;

            const currentTime = Date.now();
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;

            this.update(deltaTime);
            this.render();

            this.animationId = requestAnimationFrame(gameLoop);
        };

        gameLoop();
    }

    update(deltaTime) {
        // Apply sound-induced shaking to all living mosquitoes
        this.mosquitoes.forEach(mosquito => {
            if (mosquito.state === 'alive') {
                mosquito.soundShaking = this.isSoundActive;
            }
        });

        // Check for hand proximity and trigger escape behavior
        this.checkHandProximity();

        // Update all mosquitoes
        this.mosquitoes.forEach(mosquito => mosquito.update(deltaTime));

        // Remove fully destroyed mosquitoes
        this.mosquitoes = this.mosquitoes.filter(m => !m.isFullyDestroyed());

        // Check win condition
        if (this.mosquitoes.length === 0) {
            this.state = 'WON';
            this.updateUI();
            document.getElementById('mode-text').textContent =
                '🎉 Victory! All mosquitoes eliminated!';
        }
    }

    render() {
        // Clear canvas
        this.gameCtx.clearRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);

        // Draw mosquitoes
        this.mosquitoes.forEach(mosquito => mosquito.draw(this.gameCtx));

        // Draw game info
        this.gameCtx.fillStyle = 'white';
        this.gameCtx.font = '20px Arial';
        this.gameCtx.fillText(`Alive: ${this.countAlive()}`, 10, 30);
        this.gameCtx.fillText(`Ghosts: ${this.countGhosts()}`, 10, 60);
    }

    countAlive() {
        return this.mosquitoes.filter(m => m.state === 'alive').length;
    }

    countGhosts() {
        return this.mosquitoes.filter(m => m.state === 'ghost').length;
    }

    updateScore() {
        document.getElementById('kills').textContent = this.kills;
        document.getElementById('souls').textContent = this.soulsDestroyed;
    }

    updateUI() {
        document.getElementById('game-state').textContent = this.state;

        const startBtn = document.getElementById('start-scan-btn');

        if (this.state === 'WAITING') {
            startBtn.disabled = false;
            document.getElementById('mode-text').textContent = 'Click "Start Eye Scan" to begin';
        } else if (this.state === 'SCANNING') {
            startBtn.disabled = true;
        } else if (this.state === 'PLAYING') {
            startBtn.style.display = 'none';
            document.getElementById('mode-text').innerHTML =
                '👏 <strong>Clap hands together</strong> to kill mosquitoes<br>' +
                '🎤 <strong>Make sound (400-1200 Hz)</strong> to destroy ghosts';
        }
    }

    restart() {
        // Stop everything
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.hands) {
            this.hands.close();
        }
        if (this.audioContext) {
            this.audioContext.close();
        }

        // Reset state
        this.state = 'WAITING';
        this.mosquitoes = [];
        this.kills = 0;
        this.soulsDestroyed = 0;
        this.updateScore();
        this.updateUI();

        // Clear canvases
        this.gameCtx.clearRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
        this.handCtx.clearRect(0, 0, this.handCanvas.width, this.handCanvas.height);

        // Reset UI
        document.getElementById('start-scan-btn').style.display = 'inline-block';
        document.getElementById('audio-status').textContent = 'OFF';
        document.getElementById('audio-status').className = 'status-off';
        document.getElementById('frequency-display').textContent = '0 Hz';
        document.getElementById('hands-count').textContent = '0';
        document.getElementById('hand-distance').textContent = '-';

        // Restart camera
        this.initializeCamera();
    }
}

// ====================================================================
// INITIALIZE GAME
// ====================================================================

let game;

window.addEventListener('DOMContentLoaded', async () => {
    // Preload custom mosquito images before starting game
    await preloadImages();

    // Initialize game after images are loaded
    game = new GameManager();
});
