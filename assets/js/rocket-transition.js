document.addEventListener("DOMContentLoaded", () => {
    // Ensure GSAP ScrollTrigger is available
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined' || typeof THREE === 'undefined') {
        console.warn("GSAP, ScrollTrigger, or Three.js is not loaded.");
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const canvas = document.getElementById('rocket-canvas');
    if (!canvas) return;

    // --- Three.js Scene Setup ---
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 12;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    const rocketGroup = new THREE.Group();
    scene.add(rocketGroup);

    // Initial positioning
    rocketGroup.position.y = -5; // Start near the bottom of the screen
    rocketGroup.rotation.z = 0;

    // --- Dummy Rocket (Fallback) ---
    // A simple geometric representation of a rocket while/if the GLB fails to load
    const bodyGeom = new THREE.CylinderGeometry(0.5, 0.5, 3, 32);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xdddddd });
    const rocketBody = new THREE.Mesh(bodyGeom, bodyMat);
    
    const noseGeom = new THREE.ConeGeometry(0.5, 1.5, 32);
    const noseMat = new THREE.MeshStandardMaterial({ color: 0xff3333 });
    const nose = new THREE.Mesh(noseGeom, noseMat);
    nose.position.y = 2.25;

    const finGeom = new THREE.BoxGeometry(2, 1, 0.1);
    const finMat = new THREE.MeshStandardMaterial({ color: 0xff3333 });
    const fins = new THREE.Mesh(finGeom, finMat);
    fins.position.y = -1;

    const dummyRocket = new THREE.Group();
    dummyRocket.add(rocketBody);
    dummyRocket.add(nose);
    dummyRocket.add(fins);
    rocketGroup.add(dummyRocket);

    // --- Load GLTF Model ---
    const loader = new THREE.GLTFLoader();
    loader.load('assets/models/rocket.glb', (gltf) => {
        // Remove dummy and add real model
        rocketGroup.remove(dummyRocket);
        const rocketModel = gltf.scene;
        
        // Center the model
        const box = new THREE.Box3().setFromObject(rocketModel);
        const center = box.getCenter(new THREE.Vector3());
        rocketModel.position.sub(center);
        
        // Scale model down if it's too large (adjust as needed for real model)
        rocketModel.scale.set(0.5, 0.5, 0.5);
        
        // Wrap in a group to maintain centering
        const modelGroup = new THREE.Group();
        modelGroup.add(rocketModel);
        rocketGroup.add(modelGroup);
    }, undefined, (error) => {
        console.log('Using dummy rocket model (assets/models/rocket.glb not found or failed to load).');
    });

    // --- Particle System for Thrusters ---
    const particleCount = 150;
    const particleGeom = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    for(let i = 0; i < particleCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 0.8;
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({
        size: 0.15,
        color: 0xffaa00,
        transparent: true,
        opacity: 0, // Hidden initially
        blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeom, particleMat);
    particles.position.y = -2; // Position at bottom of rocket
    rocketGroup.add(particles);

    // --- Render Loop ---
    let isRendering = true;
    function animate() {
        if (!isRendering) return;
        requestAnimationFrame(animate);
        
        // Animate particles (fire effect)
        if (particleMat.opacity > 0) {
            const positions = particles.geometry.attributes.position.array;
            for(let i = 1; i < particleCount * 3; i += 3) {
                positions[i] -= 0.15; // Move particles down relative to rocket
                if (positions[i] < -3) {
                    positions[i] = 0; // Reset to top of exhaust
                    positions[i-1] = (Math.random() - 0.5) * 0.8; // Random X
                    positions[i+1] = (Math.random() - 0.5) * 0.8; // Random Z
                }
            }
            particles.geometry.attributes.position.needsUpdate = true;
            
            // Randomly flicker opacity for fire effect
            particleMat.opacity = 0.6 + Math.random() * 0.4;
        }
        
        renderer.render(scene, camera);
    }
    animate();

    // --- Resize Handler ---
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // --- Splash Screen Launch Event ---
    window.launchRocketTransition = function() {
        // Ignite Thrusters
        particleMat.opacity = 1;

        // Animate Rocket Flight
        const tl = gsap.timeline({
            onComplete: () => {
                // End lifecycle
                isRendering = false;
                canvas.style.display = 'none';
            }
        });

        // Add a slight rumble/shake before launching
        tl.to(rocketGroup.position, {
            x: 0.1, duration: 0.05, yoyo: true, repeat: 5
        })
        .to(rocketGroup.position, {
            x: -0.1, duration: 0.05, yoyo: true, repeat: 5
        }, "<")
        // Blast off
        .to(rocketGroup.position, {
            y: 15, // Fly far up out of camera view
            duration: 1.2,
            ease: "power2.in" // Accelerate upwards
        }, "+=0.1");
    };
});
