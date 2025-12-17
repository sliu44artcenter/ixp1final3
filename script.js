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
    MOSQUITO_SPEED: 2,            // Movement speed (increased for more noticeable movement)
    GHOST_FLOAT_SPEED: 0.5,       // Ghost floating speed
    ALERT_RADIUS: 200,            // Distance at which mosquito starts escaping from hand (increased)
    ESCAPE_SPEED_MULTIPLIER: 6,   // Speed multiplier during escape (much faster fleeing)
    ESCAPE_DURATION: 800,         // Escape burst duration in milliseconds (increased)
};

// ====================================================================
// IMAGE ASSETS
// ====================================================================

// Global image storage for mosquito sprites
const IMAGES = {
    mosquito1: null,
    mosquito2: null,
    mosquito3: null,
    mosquito4: null,
    mosquitofront: null,
    mosquitoback: null,
    ghostMosquito1: null,
    ghostMosquito2: null,
    loaded: false
};

// Preload images
function preloadImages() {
    return new Promise((resolve) => {
        let loadedCount = 0;
        const totalImages = 8;

        const checkComplete = () => {
            loadedCount++;
            if (loadedCount === totalImages) {
                IMAGES.loaded = true;
                console.log('✅ Custom mosquito images loaded successfully!');
                resolve(true);
            }
        };

        // Load mosquito animation frame 1 (left-facing)
        IMAGES.mosquito1 = new Image();
        IMAGES.mosquito1.onload = checkComplete;
        IMAGES.mosquito1.onerror = () => {
            console.warn('⚠️ Failed to load mosquito1.png, using fallback rendering');
            checkComplete();
        };
        IMAGES.mosquito1.src = 'assets/mosquito1.png';

        // Load mosquito animation frame 2 (left-facing)
        IMAGES.mosquito2 = new Image();
        IMAGES.mosquito2.onload = checkComplete;
        IMAGES.mosquito2.onerror = () => {
            console.warn('⚠️ Failed to load mosquito2.png, using fallback rendering');
            checkComplete();
        };
        IMAGES.mosquito2.src = 'assets/mosquito2.png';

        // Load mosquito animation frame 3 (right-facing)
        IMAGES.mosquito3 = new Image();
        IMAGES.mosquito3.onload = checkComplete;
        IMAGES.mosquito3.onerror = () => {
            console.warn('⚠️ Failed to load mosquito3.png, using fallback rendering');
            checkComplete();
        };
        IMAGES.mosquito3.src = 'assets/mosquito3.png';

        // Load mosquito animation frame 4 (right-facing)
        IMAGES.mosquito4 = new Image();
        IMAGES.mosquito4.onload = checkComplete;
        IMAGES.mosquito4.onerror = () => {
            console.warn('⚠️ Failed to load mosquito4.png, using fallback rendering');
            checkComplete();
        };
        IMAGES.mosquito4.src = 'assets/mosquito4.png';

        // Load mosquito front view
        IMAGES.mosquitofront = new Image();
        IMAGES.mosquitofront.onload = checkComplete;
        IMAGES.mosquitofront.onerror = () => {
            console.warn('⚠️ Failed to load mosquitofront.png, using fallback rendering');
            checkComplete();
        };
        IMAGES.mosquitofront.src = 'assets/mosquitofront.png';

        // Load mosquito backward view
        IMAGES.mosquitoback = new Image();
        IMAGES.mosquitoback.onload = checkComplete;
        IMAGES.mosquitoback.onerror = () => {
            console.warn('⚠️ Failed to load mosquitoback.png, using fallback rendering');
            checkComplete();
        };
        IMAGES.mosquitoback.src = 'assets/mosquitoback.png';

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

        // Facing direction (for choosing left/right sprites)
        this.facingRight = this.direction.x > 0;

        // Forward/backward movement with actual spatial movement
        this.movementMode = 'normal'; // 'normal', 'backward', 'forward', 'holding'
        this.movementTimer = 0;
        this.movementScale = 1.0; // For scaling during forward/backward movement
        this.minScale = 0.5; // Minimum scale when moving backward
        this.maxScale = 1.8; // Maximum scale when moving forward
        this.actionChangeTimer = Math.random() * 1500 + 500;
        this.holdDuration = 0; // How long to hold at forward/backward position

        // Spatial position offset for forward/backward movement
        this.spatialOffsetX = 0;
        this.spatialOffsetY = 0;

        // Vibration state
        this.vibrating = false;
        this.vibrationTimer = 0;
        this.vibrationOffset = { x: 0, y: 0 };

        // Sound-induced shaking
        this.soundShaking = false;
        this.soundShakeOffset = { x: 0, y: 0 };

        // Panic mode (triggered by high frequency sound > 400 Hz)
        this.panicMode = false;
        this.panicDuration = 0;
        this.panicSpeed = CONFIG.MOSQUITO_SPEED * 8; // 8x faster during panic
        this.panicDirection = { x: 0, y: 0 };

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

        // Handle forward/backward movement for alive mosquitoes
        if (this.state === 'alive') {
            this.updateMovementMode(deltaTime);
        }

        if (this.state === 'alive') {
            this.updateAlive(deltaTime);
        } else if (this.state === 'ghost') {
            this.updateGhost(deltaTime);
        }
    }

    updateMovementMode(deltaTime) {
        // Handle ongoing backward movement
        if (this.movementMode === 'backward') {
            this.movementTimer += deltaTime;
            // Shrink and move away over 800ms
            const progress = Math.min(this.movementTimer / 800, 1);
            this.movementScale = 1.0 - (1.0 - this.minScale) * progress;

            // Move mosquito away from center (smaller = further)
            const centerX = this.canvasWidth / 2;
            const centerY = this.canvasHeight / 2;
            const dirFromCenter = {
                x: this.x - centerX,
                y: this.y - centerY
            };
            const dist = Math.sqrt(dirFromCenter.x * dirFromCenter.x + dirFromCenter.y * dirFromCenter.y);
            if (dist > 0) {
                this.spatialOffsetX = -(dirFromCenter.x / dist) * 80 * progress;
                this.spatialOffsetY = -(dirFromCenter.y / dist) * 80 * progress;
            }

            if (this.movementTimer >= 800) {
                // Backward complete - hold this position
                this.movementMode = 'holding';
                this.holdDuration = Math.random() * 2000 + 1500; // Hold 1.5-3.5 seconds
                this.movementTimer = 0;
            }
        } else if (this.movementMode === 'forward') {
            // Handle ongoing forward movement
            this.movementTimer += deltaTime;
            // Expand and move toward viewer over 800ms
            const progress = Math.min(this.movementTimer / 800, 1);
            this.movementScale = this.minScale + (this.maxScale - this.minScale) * progress;

            // Move mosquito toward center (bigger = closer)
            const centerX = this.canvasWidth / 2;
            const centerY = this.canvasHeight / 2;
            const dirFromCenter = {
                x: this.x - centerX,
                y: this.y - centerY
            };
            const dist = Math.sqrt(dirFromCenter.x * dirFromCenter.x + dirFromCenter.y * dirFromCenter.y);
            if (dist > 0) {
                const maxOffset = 80;
                this.spatialOffsetX = (dirFromCenter.x / dist) * maxOffset * (1 - progress);
                this.spatialOffsetY = (dirFromCenter.y / dist) * maxOffset * (1 - progress);
            }

            if (this.movementTimer >= 800) {
                // Forward complete - hold this position
                this.movementMode = 'holding';
                this.holdDuration = Math.random() * 2000 + 1500; // Hold 1.5-3.5 seconds
                this.movementTimer = 0;
            }
        } else if (this.movementMode === 'holding') {
            // Hold at current depth
            this.holdDuration -= deltaTime;
            if (this.holdDuration <= 0) {
                // Return to normal
                this.returnToNormal();
            }
        } else {
            // Normal movement - check if it's time to change action
            this.actionChangeTimer -= deltaTime;
            if (this.actionChangeTimer <= 0) {
                this.chooseRandomAction();
            }
        }
    }

    returnToNormal() {
        this.movementMode = 'normal';
        this.movementScale = 1.0;
        this.spatialOffsetX = 0;
        this.spatialOffsetY = 0;
        this.actionChangeTimer = Math.random() * 1500 + 500;
    }

    chooseRandomAction() {
        const rand = Math.random();

        if (rand < 0.35) {
            // 35% chance: move backward
            this.movementMode = 'backward';
            this.movementTimer = 0;
        } else if (rand < 0.65) {
            // 30% chance: move forward
            this.movementMode = 'forward';
            this.movementTimer = 0;
        } else {
            // 35% chance: normal lateral movement
            this.returnToNormal();
        }
    }

    updateAlive(deltaTime) {
        // Handle panic mode (priority over all other movements)
        if (this.panicMode) {
            this.panicDuration -= deltaTime;

            if (this.panicDuration <= 0) {
                // Exit panic mode and return to normal movement
                this.panicMode = false;
            } else {
                // Move in random panic direction with very high speed
                this.x += this.panicDirection.x * this.panicSpeed;
                this.y += this.panicDirection.y * this.panicSpeed;

                // Change panic direction frequently for erratic movement
                if (Math.random() < 0.1) { // 10% chance per frame to change direction
                    this.panicDirection.x = Math.random() * 2 - 1;
                    this.panicDirection.y = Math.random() * 2 - 1;

                    // Normalize direction
                    const length = Math.sqrt(this.panicDirection.x * this.panicDirection.x +
                                           this.panicDirection.y * this.panicDirection.y);
                    if (length > 0) {
                        this.panicDirection.x /= length;
                        this.panicDirection.y /= length;
                    }

                    // Update facing direction
                    if (this.panicDirection.x !== 0) {
                        this.facingRight = this.panicDirection.x > 0;
                    }
                }
            }
        }
        // Handle escape mode
        else if (this.escapeMode) {
            this.escapeDuration -= deltaTime;

            if (this.escapeDuration <= 0) {
                // Exit escape mode and return to normal movement
                this.escapeMode = false;
                this.speed = CONFIG.MOSQUITO_SPEED;
            } else {
                // Move in escape direction with increased speed
                this.x += this.escapeDirection.x * this.speed;
                this.y += this.escapeDirection.y * this.speed;

                // Update facing direction based on escape direction
                if (this.escapeDirection.x !== 0) {
                    this.facingRight = this.escapeDirection.x > 0;
                }
            }
        } else {
            // Normal random zig-zag movement (reduced when holding depth position)
            const speedMultiplier = this.movementMode === 'holding' ? 0.4 : 1.0;

            this.directionChangeTimer += deltaTime;
            if (this.directionChangeTimer > 1000) {
                this.direction.x = Math.random() * 2 - 1;
                this.direction.y = Math.random() * 2 - 1;
                this.directionChangeTimer = 0;

                // Update facing direction based on horizontal movement
                if (this.direction.x !== 0) {
                    this.facingRight = this.direction.x > 0;
                }
            }

            // Move with normal speed (slower when holding depth)
            this.x += this.direction.x * this.speed * speedMultiplier;
            this.y += this.direction.y * this.speed * speedMultiplier;
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
            this.x + this.vibrationOffset.x + this.soundShakeOffset.x + this.spatialOffsetX,
            this.y + this.vibrationOffset.y + this.soundShakeOffset.y + this.spatialOffsetY
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

            let currentImage;
            let imageSize = this.size * 2; // Base size

            // Choose image based on movement mode
            if (this.movementMode === 'backward') {
                // Moving backward - use backward image with shrinking
                currentImage = IMAGES.mosquitoback;
                imageSize = imageSize * this.movementScale;
            } else if (this.movementMode === 'forward') {
                // Moving forward - use front image with expanding
                currentImage = IMAGES.mosquitofront;
                imageSize = imageSize * this.movementScale;
            } else {
                // Normal movement - use left/right images based on facing direction
                const useFrame1 = Math.sin(this.wingAngle * 10) > 0;

                if (this.facingRight) {
                    // Facing right - use mosquito3 and mosquito4
                    currentImage = useFrame1 ? IMAGES.mosquito3 : IMAGES.mosquito4;
                } else {
                    // Facing left - use mosquito1 and mosquito2
                    currentImage = useFrame1 ? IMAGES.mosquito1 : IMAGES.mosquito2;
                }
            }

            // Draw animated mosquito image with scale
            if (currentImage && currentImage.complete && currentImage.naturalWidth > 0) {
                ctx.drawImage(
                    currentImage,
                    -imageSize / 2,
                    -imageSize / 2,
                    imageSize,
                    imageSize
                );
            }
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

        // Randomly choose escape strategy
        const escapeStrategy = Math.random();

        if (escapeStrategy < 0.4) {
            // 40% chance: Lateral escape (move away from hand horizontally)
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

            // Enter lateral escape mode
            this.escapeMode = true;
            this.escapeDuration = CONFIG.ESCAPE_DURATION;
            this.speed = CONFIG.MOSQUITO_SPEED * CONFIG.ESCAPE_SPEED_MULTIPLIER;
        } else if (escapeStrategy < 0.7) {
            // 30% chance: Escape backward (move into distance)
            // Cancel current depth movement and start backward escape
            this.movementMode = 'backward';
            this.movementTimer = 0;
            this.holdDuration = Math.random() * 1500 + 1000; // Hold 1-2.5 seconds after escape
        } else {
            // 30% chance: Escape forward (move toward viewer)
            // Cancel current depth movement and start forward escape
            this.movementMode = 'forward';
            this.movementTimer = 0;
            this.holdDuration = Math.random() * 1500 + 1000; // Hold 1-2.5 seconds after escape
        }
    }

    // Start panic mode (triggered by high frequency sound > 400 Hz)
    startPanic() {
        if (this.state !== 'alive') return;
        if (this.panicMode) return; // Already in panic mode

        // Set random panic direction
        this.panicDirection.x = Math.random() * 2 - 1;
        this.panicDirection.y = Math.random() * 2 - 1;

        // Normalize direction
        const length = Math.sqrt(this.panicDirection.x * this.panicDirection.x +
                               this.panicDirection.y * this.panicDirection.y);
        if (length > 0) {
            this.panicDirection.x /= length;
            this.panicDirection.y /= length;
        }

        // Enter panic mode for 2 seconds
        this.panicMode = true;
        this.panicDuration = 2000; // 2 seconds
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

    // Check if point is near mosquito (using visual position with spatial offset)
    isNear(x, y, radius) {
        const visualX = this.x + this.spatialOffsetX;
        const visualY = this.y + this.spatialOffsetY;
        const dx = visualX - x;
        const dy = visualY - y;
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
        this.isProcessingFrame = false;  // Flag to prevent frame processing blocking

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

        // Setup title image click handler to start game directly
        const titleImage = document.getElementById('title-image');
        const titleScreen = document.getElementById('title-screen');

        if (titleImage && titleScreen) {
            // Make title image clickable with cursor change
            titleImage.style.cursor = 'pointer';

            titleImage.addEventListener('click', async () => {
                // Hide title screen with fade out
                titleScreen.classList.add('hidden');

                // Wait for fade out animation, then start game
                setTimeout(() => {
                    titleScreen.style.display = 'none';
                    this.startEyeScan();
                }, 500);
            });
        }

        // Setup play again button click handler
        const playAgainButton = document.getElementById('play-again-button');
        if (playAgainButton) {
            playAgainButton.addEventListener('click', () => {
                this.returnToTitle();
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

        // Show eye tracking progress bar
        const progressScreen = document.getElementById('eye-tracking-progress');
        const progressBar = document.getElementById('progress-bar-fill');
        progressScreen.style.display = 'flex';

        // Initialize FaceMesh for eye tracking
        await this.initFaceMesh();

        // Start scan countdown
        const scanInterval = setInterval(() => {
            const elapsed = Date.now() - this.scanStartTime;
            const progress = Math.min(100, (elapsed / CONFIG.EYE_SCAN_DURATION) * 100);
            this.scanProgress = progress;

            // Update progress bar
            progressBar.style.width = progress + '%';

            if (elapsed >= CONFIG.EYE_SCAN_DURATION) {
                clearInterval(scanInterval);
                // Hide progress bar
                progressScreen.style.display = 'none';
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

    async finishScan() {
        // Stop camera first
        if (this.camera) {
            this.camera.stop();
            this.camera = null;
        }

        // Stop face mesh and clean up WebGL resources
        if (this.faceMesh) {
            this.faceMesh.close();
            this.faceMesh = null;
        }

        // Wait a bit for cleanup to complete
        await new Promise(resolve => setTimeout(resolve, 200));

        // Spawn mosquitoes
        this.spawnMosquitoes();

        // Start game
        this.state = 'PLAYING';
        this.updateUI();

        // Initialize hand tracking (which will create a new camera)
        await this.initHandTracking();

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
        // Ensure video is ready
        if (!this.video.srcObject) {
            console.log('Video not ready, reinitializing camera...');
            await this.initializeCamera();
        }

        console.log('Initializing hand tracking...');

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

        // Create new camera instance for hand tracking
        this.camera = new Camera(this.video, {
            onFrame: async () => {
                // Skip frame if still processing previous one
                if (this.isProcessingFrame || !this.hands) {
                    return;
                }

                this.isProcessingFrame = true;
                try {
                    await this.hands.send({ image: this.video });
                } catch (error) {
                    console.error('Hand tracking error:', error);
                } finally {
                    this.isProcessingFrame = false;
                }
            },
            width: 1280,
            height: 720
        });

        console.log('Starting hand tracking camera...');
        this.camera.start();
        console.log('Hand tracking initialized successfully');
    }

    onHandResults(results) {
        console.log('onHandResults called, state:', this.state);

        // Clear hand canvas
        this.handCtx.clearRect(0, 0, this.handCanvas.width, this.handCanvas.height);

        this.leftHand = null;
        this.rightHand = null;
        this.handOverlapPoint = null;

        if (results.multiHandLandmarks && results.multiHandedness) {
            console.log('Hand detected:', results.multiHandLandmarks.length, 'Canvas size:', this.handCanvas.width, 'x', this.handCanvas.height);
            document.getElementById('hands-count').textContent = results.multiHandLandmarks.length;

            results.multiHandLandmarks.forEach((landmarks, index) => {
                const handedness = results.multiHandedness[index].label;

                console.log('Drawing hand:', handedness);

                // Draw hand skeleton
                this.drawHand(landmarks, handedness);

                // Get index finger tip (landmark 8)
                const fingerTip = landmarks[8];

                // Mirror the X coordinate to match the flipped video display
                const handCenter = {
                    x: (1 - fingerTip.x) * this.handCanvas.width,
                    y: fingerTip.y * this.handCanvas.height
                };

                console.log('Hand position:', handCenter);

                if (handedness === 'Left') {
                    this.leftHand = handCenter;
                } else {
                    this.rightHand = handCenter;
                }
            });

            // Draw alert radius around hands (for escape behavior visualization)
            if (this.leftHand) {
                // Draw alert radius (escape zone)
                this.handCtx.strokeStyle = 'rgba(255, 165, 0, 0.3)';
                this.handCtx.lineWidth = 2;
                this.handCtx.setLineDash([5, 5]);
                this.handCtx.beginPath();
                this.handCtx.arc(
                    this.leftHand.x,
                    this.leftHand.y,
                    CONFIG.ALERT_RADIUS,
                    0,
                    Math.PI * 2
                );
                this.handCtx.stroke();
                this.handCtx.setLineDash([]);
            }

            if (this.rightHand) {
                // Draw alert radius (escape zone)
                this.handCtx.strokeStyle = 'rgba(255, 165, 0, 0.3)';
                this.handCtx.lineWidth = 2;
                this.handCtx.setLineDash([5, 5]);
                this.handCtx.beginPath();
                this.handCtx.arc(
                    this.rightHand.x,
                    this.rightHand.y,
                    CONFIG.ALERT_RADIUS,
                    0,
                    Math.PI * 2
                );
                this.handCtx.stroke();
                this.handCtx.setLineDash([]);
            }

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
        console.log('drawHand called for:', handedness, 'with', landmarks.length, 'landmarks');

        // Draw hand landmarks and connections
        this.handCtx.fillStyle = handedness === 'Left' ? '#00ff00' : '#0000ff';
        this.handCtx.strokeStyle = handedness === 'Left' ? '#00ff00' : '#0000ff';
        this.handCtx.lineWidth = 2;

        // Draw landmarks (mirror X coordinate)
        landmarks.forEach((landmark, i) => {
            const x = (1 - landmark.x) * this.handCanvas.width;
            const y = landmark.y * this.handCanvas.height;
            if (i === 0) console.log('Drawing first landmark at:', x, y);
            this.handCtx.beginPath();
            this.handCtx.arc(x, y, 5, 0, Math.PI * 2);
            this.handCtx.fill();
        });

        // Draw connections (simplified, mirror X coordinate)
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
                (1 - startPoint.x) * this.handCanvas.width,
                startPoint.y * this.handCanvas.height
            );
            this.handCtx.lineTo(
                (1 - endPoint.x) * this.handCanvas.width,
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
        // Requires both hand AND sound (350 Hz or above)
        if (!this.isSoundActive) return;
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

            // Use visual position (with spatial offset) for proximity detection
            const visualPos = {
                x: mosquito.x + mosquito.spatialOffsetX,
                y: mosquito.y + mosquito.spatialOffsetY
            };

            // Find nearest hand
            let nearestHandDistance = Infinity;
            let nearestHandX = 0;
            let nearestHandY = 0;

            if (this.leftHand) {
                const distToLeft = this.calculateDistance(visualPos, this.leftHand);
                if (distToLeft < nearestHandDistance) {
                    nearestHandDistance = distToLeft;
                    nearestHandX = this.leftHand.x;
                    nearestHandY = this.leftHand.y;
                }
            }

            if (this.rightHand) {
                const distToRight = this.calculateDistance(visualPos, this.rightHand);
                if (distToRight < nearestHandDistance) {
                    nearestHandDistance = distToRight;
                    nearestHandX = this.rightHand.x;
                    nearestHandY = this.rightHand.y;
                }
            }

            // If hand is within alert radius, trigger escape (allow retriggering every 100ms)
            if (nearestHandDistance < CONFIG.ALERT_RADIUS) {
                // Always update escape direction if hand is nearby
                // This allows continuous fleeing from approaching hands
                if (!mosquito.escapeMode || mosquito.escapeDuration < 100) {
                    mosquito.startEscape(nearestHandX, nearestHandY);
                }
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

        // Trigger panic mode if frequency goes above 900 Hz
        if (frequency >= 900 && maxValue > CONFIG.SOUND_THRESHOLD) {
            this.mosquitoes.forEach(mosquito => {
                if (mosquito.state === 'alive' && !mosquito.panicMode) {
                    mosquito.startPanic();
                }
            });
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
        if (this.mosquitoes.length === 0 && this.state !== 'WON') {
            this.state = 'WON';
            this.showWinScreen();
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
        // Stop everything and clean up WebGL resources
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        // Stop camera first
        if (this.camera) {
            this.camera.stop();
            this.camera = null;
        }

        // Clean up MediaPipe instances
        if (this.faceMesh) {
            this.faceMesh.close();
            this.faceMesh = null;
        }
        if (this.hands) {
            this.hands.close();
            this.hands = null;
        }

        // Clean up audio
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        // Reset state
        this.state = 'WAITING';
        this.mosquitoes = [];
        this.kills = 0;
        this.soulsDestroyed = 0;
        this.leftHand = null;
        this.rightHand = null;
        this.isSoundActive = false;
        this.isProcessingFrame = false;  // Reset frame processing flag
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

    showWinScreen() {
        // Show win screen
        const winScreen = document.getElementById('win-screen');
        winScreen.style.display = 'flex';
        winScreen.classList.remove('hidden');

        // Stop game loop
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    returnToTitle() {
        // Stop everything and clean up WebGL resources
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        // Stop camera first
        if (this.camera) {
            this.camera.stop();
            this.camera = null;
        }

        // Clean up MediaPipe instances
        if (this.faceMesh) {
            this.faceMesh.close();
            this.faceMesh = null;
        }
        if (this.hands) {
            this.hands.close();
            this.hands = null;
        }

        // Clean up audio
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        // Reset state
        this.state = 'WAITING';
        this.mosquitoes = [];
        this.kills = 0;
        this.soulsDestroyed = 0;
        this.leftHand = null;
        this.rightHand = null;
        this.isSoundActive = false;
        this.isProcessingFrame = false;
        this.updateScore();
        this.updateUI();

        // Clear canvases
        this.gameCtx.clearRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
        this.handCtx.clearRect(0, 0, this.handCanvas.width, this.handCanvas.height);

        // Hide win screen
        const winScreen = document.getElementById('win-screen');
        winScreen.classList.add('hidden');
        setTimeout(() => {
            winScreen.style.display = 'none';
        }, 500);

        // Reset progress bar
        const progressBar = document.getElementById('progress-bar-fill');
        if (progressBar) {
            progressBar.style.width = '0%';
        }

        // Show title screen
        const titleScreen = document.getElementById('title-screen');
        titleScreen.style.display = 'flex';
        titleScreen.classList.remove('hidden');

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
