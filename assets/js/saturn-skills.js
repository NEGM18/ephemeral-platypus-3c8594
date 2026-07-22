// Saturn Skills Scene — skill icons ride Saturn's ring as it spins
document.addEventListener('DOMContentLoaded', () => {
    if (typeof THREE === 'undefined' || !THREE.GLTFLoader) {
        console.warn('Three.js/GLTFLoader not available; Saturn skills scene skipped.');
        return;
    }

    const canvas = document.getElementById('saturn-canvas');
    const container = document.getElementById('skills-orbit-container');
    const skillNodes = document.querySelectorAll('.node.orbiting-node');
    if (!canvas || !container || skillNodes.length === 0) return;

    // "Saturn Rings" mesh's own local radius (from its POSITION accessor min/max),
    // i.e. the ring's flat disc geometry before that node's own 100x scale is applied.
    const RING_LOCAL_MESH_RADIUS = 11.2;
    const TARGET_RING_DIAMETER = 7; // world units the ring's outer edge maps to after normalizing

    // --- Renderer / Scene / Camera ---
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 2.9, 10.4);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const sunLight = new THREE.DirectionalLight(0xfff2d6, 1.1);
    sunLight.position.set(6, 5, 4);
    scene.add(sunLight);
    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.3);
    fillLight.position.set(-5, -2, -4);
    scene.add(fillLight);

    function resize() {
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (!w || !h) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
    }
    window.addEventListener('resize', resize);
    resize();

    // --- Skill data, sourced from the DOM nodes already in the page ---
    const levels = Array.from(skillNodes).map(n => parseFloat(n.dataset.level));
    const minLevel = Math.min(...levels);
    const maxLevel = Math.max(...levels);

    const skills = Array.from(skillNodes).map(node => {
        const track = node.dataset.track; // 'inner' | 'outer'
        const phase = parseFloat(node.dataset.phase);
        const level = parseFloat(node.dataset.level);
        const t = maxLevel > minLevel ? (level - minLevel) / (maxLevel - minLevel) : 0.5;
        const baseSize = track === 'inner' ? 32 : 38;
        const maxSize = track === 'inner' ? 44 : 56;
        const size = baseSize + t * (maxSize - baseSize);
        node.style.width = `${size}px`;
        node.style.height = `${size}px`;
        return { node, track, phase, marker: null };
    });

    let ringAngle = 0;
    let spinPivot = null;
    let cloudsNode = null;
    let sceneReady = false;
    let planetWorldRadius = 0;
    const planetWorldPos = new THREE.Vector3();

    const loader = new THREE.GLTFLoader();
    loader.load('assets/models/saturn_planet.glb', (gltf) => {
        const model = gltf.scene;

        // Drop the orbiting moons - they'd skew framing and clutter the ring view
        // Note: GLTFLoader sanitizes node names, replacing spaces with underscores.
        ['Sphere_Mimas', 'Sphere_Enceladus', 'Sphere_Dione', 'Sphere_Rhea', 'Sphere_Tethys'].forEach(name => {
            const moon = model.getObjectByName(name);
            if (moon && moon.parent) moon.parent.remove(moon);
        });

        // The Sketchfab export bakes an extra unit-conversion matrix (FBX -> glTF)
        // at the scene root, so rather than hand-track every ancestor transform,
        // measure the ring's actual on-load world size and normalize from that.
        const modelGroup = new THREE.Group();
        modelGroup.add(model);
        scene.add(modelGroup);
        modelGroup.updateMatrixWorld(true);

        const ringNode = model.getObjectByName('Saturn_Rings');
        cloudsNode = model.getObjectByName('Saturn_Clouds');

        if (ringNode) {
            const ringBox = new THREE.Box3().setFromObject(ringNode);
            const ringSize = ringBox.getSize(new THREE.Vector3());
            const ringWorldDiameter = Math.max(ringSize.x, ringSize.y, ringSize.z);
            const normalizeScale = TARGET_RING_DIAMETER / ringWorldDiameter;
            modelGroup.scale.setScalar(normalizeScale);
            modelGroup.updateMatrixWorld(true);

            const planetNode = model.getObjectByName('Saturn');
            if (planetNode) {
                const planetBox = new THREE.Box3().setFromObject(planetNode);
                const planetSize = planetBox.getSize(new THREE.Vector3());
                planetWorldRadius = Math.max(planetSize.x, planetSize.y, planetSize.z) / 2;
                planetBox.getCenter(planetWorldPos);
            }

            // Spin the ring around its own normal (world-vertical once normalized)
            // without disturbing its baked equatorial tilt.
            const ringParent = ringNode.parent;
            spinPivot = new THREE.Group();
            ringParent.add(spinPivot);
            spinPivot.add(ringNode);

            // Markers live as children of the ring mesh itself, in its own local
            // (flat, Z=0) disc space, so they're guaranteed to sit in the ring's
            // true plane and spin with it under any parent transform.
            const innerRadius = RING_LOCAL_MESH_RADIUS * 0.62;
            const outerRadius = RING_LOCAL_MESH_RADIUS * 0.94;
            skills.forEach(skill => {
                const radius = skill.track === 'inner' ? innerRadius : outerRadius;
                const marker = new THREE.Object3D();
                marker.position.set(Math.cos(skill.phase) * radius, Math.sin(skill.phase) * radius, 0);
                ringNode.add(marker);
                skill.marker = marker;
            });
        }

        sceneReady = true;
    }, undefined, (error) => {
        console.warn('Saturn model failed to load:', error);
    });

    // --- Animation Loop ---
    const worldPos = new THREE.Vector3();
    let lastTime = performance.now();
    let paused = false;
    container.addEventListener('mouseenter', () => { paused = true; });
    container.addEventListener('mouseleave', () => { paused = false; });

    function animate(now) {
        requestAnimationFrame(animate);
        const dt = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;

        if (sceneReady && !paused) {
            ringAngle += dt * 0.25; // shared angular speed - ring & skill icons move together
            if (spinPivot) spinPivot.rotation.y = ringAngle;
            if (cloudsNode) cloudsNode.rotation.y += dt * 0.04;
        }

        renderer.render(scene, camera);

        if (sceneReady && spinPivot) {
            const w = container.clientWidth;
            const h = container.clientHeight;

            // Planet's screen-space center/radius, to fade out icons passing behind it
            const camRight = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
            const planetProjCenter = planetWorldPos.clone().project(camera);
            const planetEdgeWorld = planetWorldPos.clone().addScaledVector(camRight, planetWorldRadius);
            const planetProjEdge = planetEdgeWorld.project(camera);
            const planetCenterPx = [(planetProjCenter.x * 0.5 + 0.5) * w, (-planetProjCenter.y * 0.5 + 0.5) * h];
            const planetEdgePx = [(planetProjEdge.x * 0.5 + 0.5) * w, (-planetProjEdge.y * 0.5 + 0.5) * h];
            const planetScreenRadius = Math.hypot(planetEdgePx[0] - planetCenterPx[0], planetEdgePx[1] - planetCenterPx[1]);
            const camToPlanetDist = camera.position.distanceTo(planetWorldPos);

            skills.forEach(skill => {
                skill.marker.getWorldPosition(worldPos);
                const projected = worldPos.clone().project(camera);
                const x = (projected.x * 0.5 + 0.5) * w;
                const y = (-projected.y * 0.5 + 0.5) * h;
                const depth = (projected.z + 1) / 2; // 0 near .. 1 far

                const camToMarkerDist = camera.position.distanceTo(worldPos);
                const screenDist = Math.hypot(x - planetCenterPx[0], y - planetCenterPx[1]);
                const occluded = camToMarkerDist > camToPlanetDist && screenDist < planetScreenRadius * 0.92;

                skill.node.style.left = `${x}px`;
                skill.node.style.top = `${y}px`;
                skill.node.style.opacity = occluded ? '0' : String(Math.max(0.4, 1.05 - depth * 0.55));
                skill.node.style.pointerEvents = occluded ? 'none' : 'auto';
                skill.node.style.setProperty('--depth-scale', (1.15 - depth * 0.4).toFixed(3));
                skill.node.style.zIndex = String(Math.round((1 - depth) * 100) + 5);
            });
        }
    }

    requestAnimationFrame(animate);
});
