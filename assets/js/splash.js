// Splash Screen & Ambient Hero Canvas Animation Controller
document.addEventListener("DOMContentLoaded", () => {
    // -------------------------------------------------------------
    // 1. Vector Helpers
    // -------------------------------------------------------------
    class Vector2D {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
        
        static random(min, max) {
            return min + Math.random() * (max - min);
        }
    }

    class Vector3D {
        constructor(x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
        }
        
        static random(min, max) {
            return min + Math.random() * (max - min);
        }
    }

    // -------------------------------------------------------------
    // 2. Star Object (Procedural Particles)
    // -------------------------------------------------------------
    class Star {
        constructor(cameraZ, cameraTravelDistance) {
            this.angle = Math.random() * Math.PI * 2;
            this.distance = 30 * Math.random() + 15;
            this.rotationDirection = Math.random() > 0.5 ? 1 : -1;
            this.expansionRate = 1.2 + Math.random() * 0.8;
            this.finalScale = 0.7 + Math.random() * 0.6;
            
            this.dx = this.distance * Math.cos(this.angle);
            this.dy = this.distance * Math.sin(this.angle);
            
            this.spiralLocation = (1 - Math.pow(1 - Math.random(), 3.0)) / 1.3;
            this.z = Vector2D.random(0.5 * cameraZ, cameraTravelDistance + cameraZ);
            
            const lerp = (start, end, t) => start * (1 - t) + end * t;
            this.z = lerp(this.z, cameraTravelDistance / 2, 0.3 * this.spiralLocation);
            this.strokeWeightFactor = Math.pow(Math.random(), 2.0);
        }
        
        render(p, controller) {
            const spiralPos = controller.spiralPath(this.spiralLocation);
            const q = p - this.spiralLocation;
            
            if (q > 0) {
                const displacementProgress = controller.constrain(4 * q, 0, 1);
                
                const linearEasing = displacementProgress;
                const elasticEasing = controller.easeOutElastic(displacementProgress);
                const powerEasing = Math.pow(displacementProgress, 2);
                
                let easing;
                if (displacementProgress < 0.3) {
                    easing = controller.lerp(linearEasing, powerEasing, displacementProgress / 0.3);
                } else if (displacementProgress < 0.7) {
                    const t = (displacementProgress - 0.3) / 0.4;
                    easing = controller.lerp(powerEasing, elasticEasing, t);
                } else {
                    easing = elasticEasing;
                }
                
                let screenX, screenY;
                
                if (displacementProgress < 0.3) {
                    screenX = controller.lerp(spiralPos.x, spiralPos.x + this.dx * 0.3, easing / 0.3);
                    screenY = controller.lerp(spiralPos.y, spiralPos.y + this.dy * 0.3, easing / 0.3);
                } else if (displacementProgress < 0.7) {
                    const midProgress = (displacementProgress - 0.3) / 0.4;
                    const curveStrength = Math.sin(midProgress * Math.PI) * this.rotationDirection * 1.5;
                    
                    const baseX = spiralPos.x + this.dx * 0.3;
                    const baseY = spiralPos.y + this.dy * 0.3;
                    const targetX = spiralPos.x + this.dx * 0.7;
                    const targetY = spiralPos.y + this.dy * 0.7;
                    
                    const perpX = -this.dy * 0.4 * curveStrength;
                    const perpY = this.dx * 0.4 * curveStrength;
                    
                    screenX = controller.lerp(baseX, targetX, midProgress) + perpX * midProgress;
                    screenY = controller.lerp(baseY, targetY, midProgress) + perpY * midProgress;
                } else {
                    const finalProgress = (displacementProgress - 0.7) / 0.3;
                    
                    // 基础位置（70%直线距离）
                    const baseX = spiralPos.x + this.dx * 0.7;
                    const baseY = spiralPos.y + this.dy * 0.7;
                    
                    const targetDistance = this.distance * this.expansionRate * 1.5;
                    const spiralTurns = 1.2 * this.rotationDirection;
                    const spiralAngle = this.angle + spiralTurns * finalProgress * Math.PI;
                    
                    const targetX = spiralPos.x + targetDistance * Math.cos(spiralAngle);
                    const targetY = spiralPos.y + targetDistance * Math.sin(spiralAngle);
                    
                    screenX = controller.lerp(baseX, targetX, finalProgress);
                    screenY = controller.lerp(baseY, targetY, finalProgress);
                }
                
                const vx = (this.z - controller.cameraZ) * screenX / controller.viewZoom;
                const vy = (this.z - controller.cameraZ) * screenY / controller.viewZoom;
                
                const position = new Vector3D(vx, vy, this.z);
                
                let sizeMultiplier = 1.0;
                if (displacementProgress < 0.6) {
                    sizeMultiplier = 1.0 + displacementProgress * 0.2;
                } else {
                    const t = (displacementProgress - 0.6) / 0.4;
                    sizeMultiplier = 1.2 * (1.0 - t) + this.finalScale * t;
                }
                
                const dotSize = 8.5 * this.strokeWeightFactor * sizeMultiplier;
                controller.showProjectedDot(position, dotSize);
            }
        }
    }

    // -------------------------------------------------------------
    // 3. Main Animation Engine (Spiral/Universe Zoom)
    // -------------------------------------------------------------
    class AnimationController {
        constructor(canvas, ctx, dpr, size) {
            this.canvas = canvas;
            this.ctx = ctx;
            this.dpr = dpr;
            this.size = size;
            this.time = 0;
            this.stars = [];
            
            // Constants
            this.changeEventTime = 0.32;
            this.cameraZ = -400;
            this.cameraTravelDistance = 3400;
            this.startDotYOffset = 28;
            this.viewZoom = 100;
            this.numberOfStars = 5000;
            this.trailLength = 80;
            
            this.timeline = gsap.timeline({ repeat: -1 });
            this.setupRandomGenerator();
            this.createStars();
            this.setupTimeline();
        }
        
        setupRandomGenerator() {
            const originalRandom = Math.random;
            const customRandom = () => {
                let seed = 1234;
                return () => {
                    seed = (seed * 9301 + 49297) % 233280;
                    return seed / 233280;
                };
            };
            Math.random = customRandom();
            this.createStars();
            Math.random = originalRandom;
        }
        
        createStars() {
            this.stars = [];
            for (let i = 0; i < this.numberOfStars; i++) {
                this.stars.push(new Star(this.cameraZ, this.cameraTravelDistance));
            }
        }
        
        setupTimeline() {
            this.timeline.to(this, {
                time: 1,
                duration: 15,
                repeat: -1,
                ease: "none",
                onUpdate: () => this.render()
            });
        }
        
        ease(p, g) {
            if (p < 0.5) 
                return 0.5 * Math.pow(2 * p, g);
            else
                return 1 - 0.5 * Math.pow(2 * (1 - p), g);
        }
        
        easeOutElastic(x) {
            const c4 = (2 * Math.PI) / 4.5;
            if (x <= 0) return 0;
            if (x >= 1) return 1;
            return Math.pow(2, -8 * x) * Math.sin((x * 8 - 0.75) * c4) + 1;
        }
        
        map(value, start1, stop1, start2, stop2) {
            return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
        }
        
        constrain(value, min, max) {
            return Math.min(Math.max(value, min), max);
        }
        
        lerp(start, end, t) {
            return start * (1 - t) + end * t;
        }
        
        spiralPath(p) {
            p = this.constrain(1.2 * p, 0, 1);
            p = this.ease(p, 1.8);
            const numberOfSpiralTurns = 6;
            const theta = 2 * Math.PI * numberOfSpiralTurns * Math.sqrt(p);
            const r = 170 * Math.sqrt(p);
            
            return new Vector2D(
                r * Math.cos(theta),
                r * Math.sin(theta) + this.startDotYOffset
            );
        }
        
        rotate(v1, v2, p, orientation) {
            const middle = new Vector2D(
                (v1.x + v2.x) / 2,
                (v1.y + v2.y) / 2
            );
            
            const dx = v1.x - middle.x;
            const dy = v1.y - middle.y;
            const angle = Math.atan2(dy, dx);
            const o = orientation ? -1 : 1;
            const r = Math.sqrt(dx * dx + dy * dy);
            
            const bounce = Math.sin(p * Math.PI) * 0.05 * (1 - p);
            
            return new Vector2D(
                middle.x + r * (1 + bounce) * Math.cos(angle + o * Math.PI * this.easeOutElastic(p)),
                middle.y + r * (1 + bounce) * Math.sin(angle + o * Math.PI * this.easeOutElastic(p))
            );
        }
        
        showProjectedDot(position, sizeFactor) {
            const t2 = this.constrain(this.map(this.time, this.changeEventTime, 1, 0, 1), 0, 1);
            const newCameraZ = this.cameraZ + this.ease(Math.pow(t2, 1.2), 1.8) * this.cameraTravelDistance;
            
            if (position.z > newCameraZ) {
                const dotDepthFromCamera = position.z - newCameraZ;
                const x = this.viewZoom * position.x / dotDepthFromCamera;
                const y = this.viewZoom * position.y / dotDepthFromCamera;
                const sw = 400 * sizeFactor / dotDepthFromCamera;
                
                this.ctx.lineWidth = sw;
                this.ctx.beginPath();
                this.ctx.arc(x, y, 0.5, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        drawStartDot() {
            if (this.time > this.changeEventTime) {
                const dy = this.cameraZ * this.startDotYOffset / this.viewZoom;
                const position = new Vector3D(0, dy, this.cameraTravelDistance);
                this.showProjectedDot(position, 2.5);
            }
        }
        
        render() {
            const ctx = this.ctx;
            if (!ctx) return;
            
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, this.size, this.size);
            
            ctx.save();
            ctx.translate(this.size / 2, this.size / 2);
            
            const t1 = this.constrain(this.map(this.time, 0, this.changeEventTime + 0.25, 0, 1), 0, 1);
            const t2 = this.constrain(this.map(this.time, this.changeEventTime, 1, 0, 1), 0, 1);
            
            ctx.rotate(-Math.PI * this.ease(t2, 2.7));
            
            this.drawTrail(t1);
            
            ctx.fillStyle = 'white';
            for (const star of this.stars) {
                star.render(t1, this);
            }
            
            this.drawStartDot();
            
            ctx.restore();
        }
        
        drawTrail(t1) {
            for (let i = 0; i < this.trailLength; i++) {
                const f = this.map(i, 0, this.trailLength, 1.1, 0.1);
                const sw = (1.3 * (1 - t1) + 3.0 * Math.sin(Math.PI * t1)) * f;
                
                this.ctx.fillStyle = 'white';
                this.ctx.lineWidth = sw;
                
                const pathTime = t1 - 0.00015 * i;
                const position = this.spiralPath(pathTime);
                
                const basePos = position;
                const offset = new Vector2D(position.x + 5, position.y + 5);
                const rotated = this.rotate(
                    basePos, 
                    offset, 
                    Math.sin(this.time * Math.PI * 2) * 0.5 + 0.5, 
                    i % 2 === 0
                );
                
                this.ctx.beginPath();
                this.ctx.arc(rotated.x, rotated.y, sw / 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        destroy() {
            this.timeline.kill();
        }
    }

    // -------------------------------------------------------------
    // 4. Ambient Hero Background Starfield
    // -------------------------------------------------------------
    class AmbientStarfield {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext("2d");
            this.stars = [];
            this.numberOfStars = 450;
            this.running = false;
            
            this.resize();
            this.createStars();
            
            window.addEventListener("resize", () => this.resize());
        }
        
        resize() {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            
            const dpr = window.devicePixelRatio || 1;
            this.canvas.width = this.width * dpr;
            this.canvas.height = this.height * dpr;
            
            this.canvas.style.width = `${this.width}px`;
            this.canvas.style.height = `${this.height}px`;
            
            this.ctx.scale(dpr, dpr);
        }
        
        createStars() {
            this.stars = [];
            for (let i = 0; i < this.numberOfStars; i++) {
                this.stars.push({
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    size: 0.6 + Math.random() * 2.2,
                    opacity: 0.3 + Math.random() * 0.7,
                    speedX: (Math.random() - 0.5) * 0.15,
                    speedY: (Math.random() - 0.5) * 0.15,
                    pulseSpeed: 0.005 + Math.random() * 0.015,
                    pulseDir: Math.random() > 0.5 ? 1 : -1
                });
            }
        }
        
        start() {
            this.running = true;
            this.animate();
        }
        
        stop() {
            this.running = false;
        }
        
        animate() {
            if (!this.running) return;
            
            this.ctx.clearRect(0, 0, this.width, this.height);
            
            this.ctx.fillStyle = "#ffffff";
            for (const star of this.stars) {
                // Move stars
                star.x += star.speedX;
                star.y += star.speedY;
                
                // Wrap around edges
                if (star.x < 0) star.x = this.width;
                if (star.x > this.width) star.x = 0;
                if (star.y < 0) star.y = this.height;
                if (star.y > this.height) star.y = 0;
                
                // Pulse opacity
                star.opacity += star.pulseSpeed * star.pulseDir;
                if (star.opacity > 1 || star.opacity < 0.1) {
                    star.pulseDir *= -1;
                }
                
                // Render star
                this.ctx.save();
                this.ctx.globalAlpha = star.opacity;
                this.ctx.beginPath();
                this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            }
            
            requestAnimationFrame(() => this.animate());
        }
    }

    // -------------------------------------------------------------
    // 5. Initialize Splash Screen
    // -------------------------------------------------------------
    const splashScreen = document.getElementById("splash-screen");
    const splashCanvas = document.getElementById("splash-canvas");
    const enterBtn = document.getElementById("splash-enter-btn");
    const heroBgCanvas = document.getElementById("hero-bg-canvas");
    
    if (splashScreen && splashCanvas && enterBtn) {
        const ctx = splashCanvas.getContext("2d");
        
        // Match sizes
        const dpr = window.devicePixelRatio || 1;
        let size = Math.max(window.innerWidth, window.innerHeight);
        
        splashCanvas.width = size * dpr;
        splashCanvas.height = size * dpr;
        splashCanvas.style.width = `${window.innerWidth}px`;
        splashCanvas.style.height = `${window.innerHeight}px`;
        
        ctx.scale(dpr, dpr);
        
        const splashAnimation = new AnimationController(splashCanvas, ctx, dpr, size);
        
        // Handle canvas resize
        const handleResize = () => {
            size = Math.max(window.innerWidth, window.innerHeight);
            splashCanvas.width = size * dpr;
            splashCanvas.height = size * dpr;
            splashCanvas.style.width = `${window.innerWidth}px`;
            splashCanvas.style.height = `${window.innerHeight}px`;
            ctx.scale(dpr, dpr);
            splashAnimation.size = size;
        };
        window.addEventListener("resize", handleResize);
        
        // Fade in Enter Button after 2 seconds
        setTimeout(() => {
            enterBtn.classList.add("show");
        }, 2000);
        
        // Click Enter Button action
        enterBtn.addEventListener("click", () => {
            // Fade out the splash screen overlay
            gsap.to(splashScreen, {
                opacity: 0,
                scale: 1.05,
                duration: 1.2,
                ease: "power2.out",
                onComplete: () => {
                    splashScreen.style.display = "none";
                    window.removeEventListener("resize", handleResize);
                    splashAnimation.destroy(); // Free up web canvas loop
                    
                    // Reveal the main navbar
                    const navbar = document.querySelector(".navbar");
                    if (navbar) {
                        gsap.fromTo(navbar, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 1.0, ease: "power2.out" });
                    }
                }
            });

            // Trigger the Rocket Launch Event if it exists
            if (typeof window.launchRocketTransition === 'function') {
                window.launchRocketTransition();
            }
            
            // Trigger minimalist hero entry animations (down to up image, circle pop, text reveals) if they exist
            if (document.querySelector("#hero-portrait")) {
                gsap.fromTo("#hero-portrait", 
                    { y: "100%", opacity: 0 }, 
                    { y: 0, opacity: 1, duration: 1.6, ease: "power4.out", delay: 0.4 } // Increased delay to follow rocket
                );
            }
            
            if (document.querySelector("#hero .hero-circle")) {
                gsap.fromTo("#hero .hero-circle", 
                    { scale: 0.5, opacity: 0 }, 
                    { scale: 1, opacity: 1, duration: 1.4, ease: "back.out(1.1)", delay: 0.3 }
                );
            }
            
            if (document.querySelector("#hero .hero-left")) {
                gsap.fromTo("#hero .hero-left", 
                    { y: 30, opacity: 0 }, 
                    { y: 0, opacity: 1, duration: 1.2, ease: "power3.out", delay: 0.8 }
                );
            }
            
            if (document.querySelector("#hero .hero-giant-text")) {
                gsap.fromTo("#hero .hero-giant-text", 
                    { x: 50, opacity: 0 }, 
                    { x: 0, opacity: 1, duration: 1.4, ease: "power4.out", delay: 0.6 }
                );
            }
            
            if (document.querySelector("#hero .hero-arrow")) {
                gsap.fromTo("#hero .hero-arrow", 
                    { opacity: 0 }, 
                    { opacity: 1, duration: 1.0, ease: "power2.out", delay: 1.0 }
                );
            }
            
            if (document.querySelector("#hero-tour-prompt")) {
                gsap.fromTo("#hero-tour-prompt", 
                    { xPercent: -50, y: 15, opacity: 0 }, 
                    { xPercent: -50, y: 0, opacity: 1, duration: 1.0, ease: "power3.out", delay: 1.2 }
                );
            }
            
            // Start ambient starfield background in hero section
            if (heroBgCanvas) {
                const ambientStarfield = new AmbientStarfield(heroBgCanvas);
                ambientStarfield.start();
                heroBgCanvas.classList.add("show");
            }
        });
    }
});
