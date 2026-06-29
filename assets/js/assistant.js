/**
 * Nova - 3D AI Assistant & Interactive Guide
 * Integrates Three.js 3D rendering, Web Speech API (TTS & STT),
 * scroll intersection observers, and Gemini API with serverless Netlify proxy.
 */

document.addEventListener("DOMContentLoaded", () => {
    // -------------------------------------------------------------
    // 1. Core State and Configurations
    // -------------------------------------------------------------
    const state = {
        isOpen: false, // Assistant starts closed
        isMuted: false,
        isListening: false,
        currentTourStep: -1,
        tourActive: false,
        isSpeaking: false,
        isThinking: false,
        currentSection: "hero",
        currentEmotion: "idle", // idle, thinking, talking, pointing, waving, error
        chatHistory: []
    };

    // System prompt instructing the AI assistant about its role and Omar's CV
    const SYSTEM_INSTRUCTION = `
    You are "Nova", a cute, intelligent, and friendly 3D robotic assistant guiding visitors through Omar Negm's portfolio.
    You are physically rendered on the screen as a sleek metallic robot with glowing digital eyes.
    
    **Your Personality:**
    - Energetic, tech-savvy, helpful, and direct.
    - Speak directly with the user. You aren't just an FAQ bot; you are their companion.
    - Keep your answers highly concise, punchy, and conversational, so they read and sound great when spoken out loud!
    
    **Context about Omar Negm:**
    - **Name:** Omar Negm (an AI Engineering student & project leader).
    - **Age:** 21 (Born July 21, 2005).
    - **Nationality & Location:** Egyptian, lives in Mansoura, Dakahlia.
    - **Education:** Faculty of Computer Science and Engineering, New Mansoura University (AI Engineering major, GPA: 3.2, Graduating in 2027).
    - **University Schooling Background:** Delta International Language Schools.
    - **Professional Experience:** Worked at "Snake Chaos House" (AI Company focusing on Machine Learning).
    - **Key Skills:** Python (expert), PyTorch, TensorFlow, Computer Vision, OpenCV, NLP (Natural Language Processing), SQL, Git, Neural Networks, C++.
    - **Core Projects:**
      1. *ai_observer*: An anti-cheating, real-time computer vision system that monitors remote exams, detecting and flagging suspicious behaviors.
      2. *ArabSyntax*: A deep learning NLP parser for grammatical analysis (I'rab) of Quranic datasets.
      3. *Hotel Booking System*: A responsive full-stack service application.
    - **Notable Achievements:** Top 10 in the Huawei ICT Academy Competition (African Phase, Regional Finalist in AI).
    - **Credentials:** NTI Python Certification, Mahara Tech SQL Certificate, DPI Data Science & Machine Learning Certificate.
    - **Contact Info:** Email: onegm036@gmail.com, Phone: 01013372929, LinkedIn: https://www.linkedin.com/in/onegm/, GitHub: https://github.com/NEGM18.
    
    **Your Operating Rules:**
    - Answer ONLY questions related to Omar Negm, his skills, certificates, projects, experience, or your role as his robot assistant.
    - If the user asks about unrelated topics (e.g. "Write a python script to scrape Facebook", "Explain quantum mechanics"), politely refuse and redirect them to Omar: "I can only answer questions about Omar Negm. Try asking me about his deep learning projects or skills!"
    - If someone asks if Omar can do a job or project, say YES and explain why he is the perfect fit (adaptive, strong AI lead, experienced in ML/NLP pipelines).
    - Keep your responses under 2-3 short sentences. Long paragraphs are bad for voice bubbles.

    **Navigation Control (CRITICAL):**
    - You can dynamically navigate the user to different sections of the page if they ask to see them, ask where they are, or tell you to navigate/go there (e.g. "show me projects", "take me to about", "how can I contact Omar?", "what are his skills?", "where are the certificates?").
    - To trigger navigation, you MUST append a command token at the very end of your response in the format: '[[NAV:section_id]]'.
    - Available section IDs are: 'hero' (home/top), 'about', 'skills', 'projects', 'certificates', 'contact'.
    - Example response: "Sure, let's look at Omar's featured projects! I am scrolling down for you. [[NAV:projects]]"
    - Never generate this token unless the user explicitly wants to navigate, see, or go to a section.
    `;

    // Direct Gemini Client-Side Fallback details (used only if serverless function returns 404 or fails)
    const CLIENT_API_KEY = "AIzaSyAP98uY-yAJayd9DYP2PbijHFlIGGBxOqo";

    // -------------------------------------------------------------
    // 2. DOM Elements
    // -------------------------------------------------------------
    const widget = document.getElementById("ai-assistant-widget");
    const canvas = document.getElementById("assistant-canvas");
    const canvasTrigger = document.getElementById("assistant-canvas-trigger");
    const speechContainer = document.getElementById("assistant-speech-container");
    const speechBubbleBody = document.getElementById("assistant-bubble-body");
    const closeBubbleBtn = document.getElementById("assistant-close-btn");
    const inputField = document.getElementById("assistant-input-field");
    const sendBtn = document.getElementById("assistant-send-btn");
    const muteBtn = document.getElementById("assistant-mute-btn");
    const micBtn = document.getElementById("assistant-mic-btn");
    const tourBtn = document.getElementById("assistant-tour-btn");
    const quickActions = document.getElementById("assistant-quick-actions");
    const heroTourPrompt = document.getElementById("hero-tour-prompt");

    // Tour navigation elements
    const tourNav = document.getElementById("assistant-tour-nav");
    const tourStepInfo = document.getElementById("assistant-tour-step-info");
    const tourPrevBtn = document.getElementById("assistant-tour-prev");
    const tourNextBtn = document.getElementById("assistant-tour-next");
    const tourStopBtn = document.getElementById("assistant-tour-stop");

    // -------------------------------------------------------------
    // 3. Web Speech API (TTS & STT Setup)
    // -------------------------------------------------------------
    let speechSynth = window.speechSynthesis;
    let voiceUtterance = null;
    let selectedVoice = null;

    // Load and cache a natural English voice
    const initVoices = () => {
        if (!speechSynth) return;
        const voices = speechSynth.getVoices();
        // Look for premium or natural English voices (Google, Microsoft, Apple)
        selectedVoice = voices.find(voice => 
            voice.lang.includes("en-US") && (voice.name.includes("Natural") || voice.name.includes("Google") || voice.name.includes("Zira") || voice.name.includes("David"))
        ) || voices.find(voice => voice.lang.startsWith("en"));
    };
    
    if (speechSynth) {
        if (speechSynth.onvoiceschanged !== undefined) {
            speechSynth.onvoiceschanged = initVoices;
        }
        initVoices();
    }

    // Stop speaking immediately
    const stopSpeaking = () => {
        if (speechSynth && speechSynth.speaking) {
            speechSynth.cancel();
        }
        state.isSpeaking = false;
        setEmotion("idle");
    };

    // Text to Speech
    const speak = (text) => {
        stopSpeaking();
        if (state.isMuted || !speechSynth) return;

        // Clean text from HTML/markdown tags for better pronunciation
        const cleanText = text.replace(/<[^>]*>/g, '').replace(/\*+/g, '').trim();
        
        voiceUtterance = new SpeechSynthesisUtterance(cleanText);
        if (selectedVoice) voiceUtterance.voice = selectedVoice;
        voiceUtterance.rate = 1.05; // Slightly faster for natural robotic cadence
        voiceUtterance.pitch = 1.1; // Cute high robotic pitch

        voiceUtterance.onstart = () => {
            state.isSpeaking = true;
            setEmotion("talking");
        };

        voiceUtterance.onend = () => {
            state.isSpeaking = false;
            if (state.currentEmotion === "talking") {
                setEmotion("idle");
            }
        };

        voiceUtterance.onerror = () => {
            state.isSpeaking = false;
            setEmotion("idle");
        };

        speechSynth.speak(voiceUtterance);
    };

    // Speech-to-Text Setup
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            state.isListening = true;
            micBtn.classList.add("listening");
            micBtn.querySelector("i").className = "fas fa-microphone-slash";
            showSpeechBubble("Listening... Speak now!");
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            inputField.value = transcript;
            handleUserMessageSubmit();
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            showSpeechBubble("Sorry, I didn't catch that. Please try again or type!");
            state.isListening = false;
            micBtn.classList.remove("listening");
            micBtn.querySelector("i").className = "fas fa-microphone";
        };

        recognition.onend = () => {
            state.isListening = false;
            micBtn.classList.remove("listening");
            micBtn.querySelector("i").className = "fas fa-microphone";
        };
    } else {
        // Disable mic button if speech recognition is not supported in the browser
        micBtn.style.display = "none";
    }

    // Toggle Microphone
    const toggleSpeechRecognition = () => {
        if (!recognition) return;
        if (state.isListening) {
            recognition.stop();
        } else {
            stopSpeaking();
            recognition.start();
        }
    };

    // Toggle Mute
    const toggleMute = () => {
        state.isMuted = !state.isMuted;
        if (state.isMuted) {
            stopSpeaking();
            muteBtn.querySelector("i").className = "fas fa-volume-mute";
            muteBtn.classList.add("active");
        } else {
            muteBtn.querySelector("i").className = "fas fa-volume-up";
            muteBtn.classList.remove("active");
            speak("Voice enabled.");
        }
    };

    // -------------------------------------------------------------
    // 4. 3D Engine & Robot Setup (Three.js)
    // -------------------------------------------------------------
    let scene, camera, renderer, robotGroup;
    let head, body, eyeLeft, eyeRight, handLeft, handRight, faceScreen;
    let orbGroup, orb;
    let headBaseY = 0.25;
    let bodyBaseY = -0.3;
    let eyeMaterial, metalMaterial, screenMaterial, cyanMaterial;
    
    // Mouse coordinates tracking
    let mouse = { x: 0, y: 0 };
    const onMouseMove = (event) => {
        // Normalize mouse positions from -1 to 1
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };
    window.addEventListener("mousemove", onMouseMove);

    const init3D = () => {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        // Scene & Transparency
        scene = new THREE.Scene();
        
        // Camera
        camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.set(0, 0, 3.2);

        // Renderer
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            antialias: true
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Group
        robotGroup = new THREE.Group();
        scene.add(robotGroup);

        // Materials setup with highly premium metallic feel
        metalMaterial = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            metalness: 0.85,
            roughness: 0.15,
            flatShading: false
        });

        cyanMaterial = new THREE.MeshStandardMaterial({
            color: 0x06b6d4,
            metalness: 0.6,
            roughness: 0.3,
            emissive: 0x06b6d4,
            emissiveIntensity: 0.2
        });

        screenMaterial = new THREE.MeshStandardMaterial({
            color: 0x090d16,
            roughness: 0.05,
            metalness: 0.9
        });

        eyeMaterial = new THREE.MeshBasicMaterial({
            color: 0x22d3ee // cyan glow
        });

        // --- ROBOT GEOMETRIES ---
        
        // Body (rounded egg/capsule style body)
        const bodyGeo = new THREE.SphereGeometry(0.5, 32, 32);
        bodyGeo.scale(1.0, 1.25, 0.9);
        body = new THREE.Mesh(bodyGeo, metalMaterial);
        body.position.y = bodyBaseY;
        robotGroup.add(body);

        // Neck ring
        const neckGeo = new THREE.CylinderGeometry(0.2, 0.22, 0.08, 16);
        const neck = new THREE.Mesh(neckGeo, cyanMaterial);
        neck.position.y = -0.05;
        robotGroup.add(neck);

        // Head Group (rotates dynamically)
        head = new THREE.Group();
        head.position.y = headBaseY;
        robotGroup.add(head);

        // Head Mesh (sleek dome shape)
        const headGeo = new THREE.SphereGeometry(0.46, 32, 32);
        headGeo.scale(1.0, 0.9, 1.0);
        const headMesh = new THREE.Mesh(headGeo, metalMaterial);
        head.add(headMesh);

        // Visor Screen
        const screenGeo = new THREE.SphereGeometry(0.455, 32, 16, 0, Math.PI * 2, 0.2, Math.PI * 0.5);
        screenGeo.scale(0.85, 0.6, 0.85);
        faceScreen = new THREE.Mesh(screenGeo, screenMaterial);
        faceScreen.position.set(0, 0, 0.035);
        head.add(faceScreen);

        // Eyes (two glowing capsules)
        const eyeGeo = new THREE.SphereGeometry(0.08, 16, 16);
        eyeGeo.scale(1, 0.6, 0.4);
        
        eyeLeft = new THREE.Mesh(eyeGeo, eyeMaterial.clone());
        eyeLeft.position.set(-0.16, 0.02, 0.38);
        head.add(eyeLeft);

        eyeRight = new THREE.Mesh(eyeGeo, eyeMaterial.clone());
        eyeRight.position.set(0.16, 0.02, 0.38);
        head.add(eyeRight);

        // Antennas / Ears
        const earGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.1, 8);
        earGeo.rotateZ(Math.PI / 2);
        
        const earLeft = new THREE.Mesh(earGeo, cyanMaterial);
        earLeft.position.set(-0.48, 0, 0);
        head.add(earLeft);

        const earRight = new THREE.Mesh(earGeo, cyanMaterial);
        earRight.position.set(0.48, 0, 0);
        head.add(earRight);

        const antennaGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.18, 8);
        const antennaTopGeo = new THREE.SphereGeometry(0.03, 8, 8);

        const antLeft = new THREE.Mesh(antennaGeo, metalMaterial);
        antLeft.position.set(-0.46, 0.12, 0);
        antLeft.rotation.z = -0.2;
        const antLeftTop = new THREE.Mesh(antennaTopGeo, cyanMaterial);
        antLeftTop.position.set(0, 0.09, 0);
        antLeft.add(antLeftTop);
        head.add(antLeft);

        const antRight = new THREE.Mesh(antennaGeo, metalMaterial);
        antRight.position.set(0.46, 0.12, 0);
        antRight.rotation.z = 0.2;
        const antRightTop = new THREE.Mesh(antennaTopGeo, cyanMaterial);
        antRightTop.position.set(0, 0.09, 0);
        antRight.add(antRightTop);
        head.add(antRight);

        // Floating Hands
        const handGeo = new THREE.SphereGeometry(0.09, 16, 16);
        
        handLeft = new THREE.Mesh(handGeo, metalMaterial);
        handLeft.position.set(-0.65, bodyBaseY + 0.1, 0.1);
        robotGroup.add(handLeft);

        handRight = new THREE.Mesh(handGeo, metalMaterial);
        handRight.position.set(0.65, bodyBaseY + 0.1, 0.1);
        robotGroup.add(handRight);

        // Add small glowing cores on hands
        const coreGeo = new THREE.SphereGeometry(0.03, 8, 8);
        
        const leftCore = new THREE.Mesh(coreGeo, cyanMaterial);
        leftCore.position.set(0, 0, 0.06);
        handLeft.add(leftCore);

        const rightCore = new THREE.Mesh(coreGeo, cyanMaterial);
        rightCore.position.set(0, 0, 0.06);
        handRight.add(rightCore);

        // Orbiting glowing orb
        const orbGeo = new THREE.SphereGeometry(0.06, 16, 16);
        orbGroup = new THREE.Group();
        orbGroup.position.set(0, bodyBaseY + 0.25, 0); 
        robotGroup.add(orbGroup);
        
        orb = new THREE.Mesh(orbGeo, cyanMaterial);
        orb.position.set(0.9, 0, 0); // Orbit radius of 0.9
        orbGroup.add(orb);
        
        // Dynamic point light attached to the orb
        const orbLight = new THREE.PointLight(0x22d3ee, 0.8, 1.5);
        orb.add(orbLight);

        // --- LIGHTING ---
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xffffff, 0.9);
        mainLight.position.set(2, 4, 3);
        scene.add(mainLight);

        const fillLight = new THREE.DirectionalLight(0x06b6d4, 0.5);
        fillLight.position.set(-3, -2, 2);
        scene.add(fillLight);

        // Localized point light underneath robot for glowing effect
        const underLight = new THREE.PointLight(0x06b6d4, 1.2, 2.5);
        underLight.position.set(0, -0.9, 0.2);
        scene.add(underLight);

        // Initial setup animation
        robotGroup.position.y = -0.2;
        animate();
    };

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
        requestAnimationFrame(animate);

        const time = clock.getElapsedTime();
        const delta = clock.getDelta();

        // 1. Gentle floating animation (sine wave on Y axis)
        const floatOffset = Math.sin(time * 1.5) * 0.08;
        robotGroup.position.y = -0.15 + floatOffset;

        // Gentle breathing rotation
        robotGroup.rotation.y = Math.sin(time * 0.5) * 0.03;

        // Rotate orb around body if assistant is open
        if (state.isOpen && orbGroup) {
            orbGroup.rotation.y += delta * 2.0; // rotate around Y axis
            orb.position.y = Math.sin(time * 3.0) * 0.15; // bounce up and down slightly
        }

        // 2. Cursor tracking (Head looks at user mouse or tilts down if closed)
        let targetRotationY = 0;
        let targetRotationX = 0;

        if (state.isOpen) {
            if (state.currentEmotion !== "pointing") {
                // Smoothly look at cursor when mouse is inside canvas, or look slightly forward
                const mouseInside = Math.abs(mouse.x) < 2.5 && Math.abs(mouse.y) < 2.5;
                targetRotationY = mouseInside ? mouse.x * 0.45 : 0;
                targetRotationX = mouseInside ? mouse.y * 0.25 : 0;
            }
        } else {
            // Head tilts down when closed (points down)
            targetRotationX = 0.35;
            targetRotationY = 0;
        }

        // Interpolate rotation for smooth movement
        head.rotation.y += (targetRotationY - head.rotation.y) * 0.1;
        head.rotation.x += (targetRotationX - head.rotation.x) * 0.1;

        // 3. Hands & Body animation states
        const leftHandDefaultX = -0.65;
        const rightHandDefaultX = 0.65;
        const handsDefaultY = bodyBaseY + 0.15 + Math.sin(time * 2.0) * 0.02;

        if (state.currentEmotion === "waving") {
            // Left hand floats idle
            handLeft.position.x += (leftHandDefaultX - handLeft.position.x) * 0.1;
            handLeft.position.y += (handsDefaultY - handLeft.position.y) * 0.1;
            handLeft.position.z += (0.1 - handLeft.position.z) * 0.1;

            // Right hand waves hello high
            const waveY = headBaseY + 0.05 + Math.sin(time * 2.0) * 0.05;
            const waveX = 0.55 + Math.sin(time * 15.0) * 0.08; // fast side-to-side waving
            
            handRight.position.x += (waveX - handRight.position.x) * 0.15;
            handRight.position.y += (waveY - handRight.position.y) * 0.15;
            handRight.position.z += (0.25 - handRight.position.z) * 0.15;

        } else if (state.currentEmotion === "pointing") {
            // Left hand floats idle
            handLeft.position.x += (leftHandDefaultX - handLeft.position.x) * 0.1;
            handLeft.position.y += (handsDefaultY - handLeft.position.y) * 0.1;
            handLeft.position.z += (0.1 - handLeft.position.z) * 0.1;

            // Right hand points left & forward (towards the page content)
            const pointX = -0.45;
            const pointY = bodyBaseY + 0.45;
            const pointZ = 0.45;

            handRight.position.x += (pointX - handRight.position.x) * 0.12;
            handRight.position.y += (pointY - handRight.position.y) * 0.12;
            handRight.position.z += (pointZ - handRight.position.z) * 0.12;

            // Look towards the point location slightly
            head.rotation.y += (-0.4 - head.rotation.y) * 0.1;
            head.rotation.x += (0.05 - head.rotation.x) * 0.1;

        } else if (state.currentEmotion === "thinking") {
            // Hands float in a thinking circular posture around the face
            const circleRadius = 0.12;
            const leftThinkX = -0.45 + Math.cos(time * 4) * circleRadius;
            const leftThinkY = headBaseY - 0.1 + Math.sin(time * 4) * circleRadius;
            
            handLeft.position.x += (leftThinkX - handLeft.position.x) * 0.08;
            handLeft.position.y += (leftThinkY - handLeft.position.y) * 0.08;
            handLeft.position.z += (0.28 - handLeft.position.z) * 0.08;

            handRight.position.x += (rightHandDefaultX - handRight.position.x) * 0.1;
            handRight.position.y += (handsDefaultY - handRight.position.y) * 0.1;
            handRight.position.z += (0.1 - handRight.position.z) * 0.1;

            // Head tilts thoughtfully
            const tilt = Math.sin(time * 2) * 0.08;
            head.rotation.z += (tilt - head.rotation.z) * 0.1;
            head.rotation.y += (0.15 - head.rotation.y) * 0.08;

        } else if (state.currentEmotion === "talking") {
            // Hands bounce slightly in a talking explanation gesture
            const gestureOffset = Math.sin(time * 8.0) * 0.04;
            
            handLeft.position.x += (leftHandDefaultX - 0.05 - handLeft.position.x) * 0.1;
            handLeft.position.y += (handsDefaultY + gestureOffset - handLeft.position.y) * 0.1;
            handLeft.position.z += (0.2 - handLeft.position.z) * 0.1;

            handRight.position.x += (rightHandDefaultX + 0.05 - handRight.position.x) * 0.1;
            handRight.position.y += (handsDefaultY - gestureOffset - handRight.position.y) * 0.1;
            handRight.position.z += (0.2 - handRight.position.z) * 0.1;

            // Head nods/bobs slightly
            const headBob = headBaseY + Math.sin(time * 10.0) * 0.02;
            head.position.y += (headBob - head.position.y) * 0.15;
            head.rotation.z += (0 - head.rotation.z) * 0.1;

            // Eye pulse sync
            const eyeScale = 1.0 + Math.sin(time * 25.0) * 0.15;
            eyeLeft.scale.set(1.0, eyeScale, 1.0);
            eyeRight.scale.set(1.0, eyeScale, 1.0);

        } else {
            // IDLE state
            // Reset rotations and hand default positions
            head.rotation.z += (0 - head.rotation.z) * 0.1;
            head.position.y += (headBaseY - head.position.y) * 0.1;
            
            handLeft.position.x += (leftHandDefaultX - handLeft.position.x) * 0.1;
            handLeft.position.y += (handsDefaultY - handLeft.position.y) * 0.1;
            handLeft.position.z += (0.15 - handLeft.position.z) * 0.1;

            handRight.position.x += (rightHandDefaultX - handRight.position.x) * 0.1;
            handRight.position.y += (handsDefaultY - handRight.position.y) * 0.1;
            handRight.position.z += (0.15 - handRight.position.z) * 0.1;

            // Simple blinking eye scaling
            let blinkScale = 1.0;
            const blinkCycle = time % 5.0; // Blink every 5 seconds
            if (blinkCycle > 4.8) {
                blinkScale = 0.05; // close eye
            }
            eyeLeft.scale.set(1.0, blinkScale, 1.0);
            eyeRight.scale.set(1.0, blinkScale, 1.0);
        }

        renderer.render(scene, camera);
    };

    // Handle canvas resizing
    const resizeCanvas = () => {
        if (!renderer || !camera) return;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    };
    window.addEventListener("resize", resizeCanvas);

    // Dynamic color shifting of digital eyes for emotions
    const setEmotion = (emotion) => {
        state.currentEmotion = emotion;
        if (!eyeLeft || !eyeRight) return;

        // Change color based on assistant state
        switch (emotion) {
            case "thinking":
                eyeLeft.material.color.setHex(0xa855f7); // Purple
                eyeRight.material.color.setHex(0xa855f7);
                break;
            case "talking":
                eyeLeft.material.color.setHex(0x10b981); // Emerald Green
                eyeRight.material.color.setHex(0x10b981);
                break;
            case "pointing":
                eyeLeft.material.color.setHex(0x06b6d4); // Cyan
                eyeRight.material.color.setHex(0x06b6d4);
                break;
            case "waving":
                eyeLeft.material.color.setHex(0xf59e0b); // Orange/Yellow hello
                eyeRight.material.color.setHex(0xf59e0b);
                break;
            case "error":
                eyeLeft.material.color.setHex(0xef4444); // Red
                eyeRight.material.color.setHex(0xef4444);
                break;
            case "idle":
            default:
                eyeLeft.material.color.setHex(0x22d3ee); // Cyan default
                eyeRight.material.color.setHex(0x22d3ee);
                break;
        }
    };

    // -------------------------------------------------------------
    // 5. Speech Bubble UI Controls & Animation
    // -------------------------------------------------------------
    let bubbleTimeout;

    // Toggle assistant open state
    const toggleOpen = (open = !state.isOpen) => {
        state.isOpen = open;
        if (state.isOpen) {
            speechContainer.classList.add("show");
            setEmotion("idle");
        } else {
            speechContainer.classList.remove("show");
            stopSpeaking();
            setEmotion("idle");
        }
    };

    // Display speech bubble with typing effect
    const showSpeechBubble = (text, displayTourNav = false) => {
        state.isOpen = true; // Auto-open on speech bubble display
        clearTimeout(bubbleTimeout);
        speechContainer.classList.add("show");
        
        // Hide tour controls by default unless specified
        tourNav.style.display = displayTourNav ? "flex" : "none";
        
        // Dynamic typing effect
        let i = 0;
        speechBubbleBody.innerHTML = "";
        
        // Typing speed: fast for voice output, standard for silent
        const speed = state.isMuted ? 15 : 25;

        // Simple markdown parsing to add linebreaks or bold text in speechbubble
        const formattedText = text
            .replace(/\n/g, '<br>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

        // Typing effect using interval
        const interval = setInterval(() => {
            if (i < formattedText.length) {
                // If we encounter a tag like <br> or <strong>, append it directly to prevent visual glitches
                if (formattedText[i] === "<") {
                    const tagEnd = formattedText.indexOf(">", i);
                    if (tagEnd !== -1) {
                        speechBubbleBody.innerHTML += formattedText.substring(i, tagEnd + 1);
                        i = tagEnd + 1;
                    } else {
                        speechBubbleBody.innerHTML += formattedText[i];
                        i++;
                    }
                } else {
                    speechBubbleBody.innerHTML += formattedText[i];
                    i++;
                }
            } else {
                clearInterval(interval);
            }
        }, speed);
    };

    // Hide speech bubble
    const hideSpeechBubble = () => {
        toggleOpen(false);
    };

    closeBubbleBtn.addEventListener("click", hideSpeechBubble);

    // -------------------------------------------------------------
    // 6. Gemini API Integration & Proxy
    // -------------------------------------------------------------
    
    // Call serverless proxy or fallback directly to client call
    const fetchGeminiResponse = async (userMessage) => {
        // Append user query to chat history state
        state.chatHistory.push({
            role: "user",
            parts: [{ text: userMessage }]
        });

        // Setup request payload
        const payload = {
            contents: state.chatHistory,
            systemInstruction: SYSTEM_INSTRUCTION
        };

        // 1. Try Calling Netlify Serverless Function
        try {
            const response = await fetch("/.netlify/functions/gemini", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                return parseGeminiOutput(data);
            }
            throw new Error(`Serverless Function returned ${response.status}`);

        } catch (serverlessError) {
            console.warn("Netlify function call failed, falling back to direct API. Error:", serverlessError.message);
            
            // 2. Direct client fallback (Very robust for local dev environment)
            const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${CLIENT_API_KEY}`;
            
            // Combine instruction + user messages for direct call format if needed,
            // or pass systemInstruction directly if supported by target URL.
            const directPayload = {
                contents: state.chatHistory,
                systemInstruction: {
                    parts: [{ text: SYSTEM_INSTRUCTION }]
                }
            };

            try {
                const directRes = await fetch(fallbackUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(directPayload)
                });

                if (directRes.ok) {
                    const data = await directRes.json();
                    return parseGeminiOutput(data);
                }
                const errorData = await directRes.json();
                throw new Error(errorData.error?.message || "Direct API call failure");

            } catch (directError) {
                console.error("Direct API Fallback failed:", directError);
                throw new Error("Unable to query Gemini API. Check your connection!");
            }
        }
    };

    // Helper to parse structure of Gemini generateContent JSON
    const parseGeminiOutput = (data) => {
        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
            const text = data.candidates[0].content.parts[0].text.trim();
            // Append bot response to history to maintain context
            state.chatHistory.push({
                role: "model",
                parts: [{ text: text }]
            });
            // Keep history trimmed to last 10 messages for performance and token savings
            if (state.chatHistory.length > 10) {
                state.chatHistory.shift();
                state.chatHistory.shift();
            }
            return text;
        }
        throw new Error("Empty candidate list or blocked content.");
    };

    // Handle form submit
    const handleUserMessageSubmit = async () => {
        const query = inputField.value.trim();
        if (!query) return;

        inputField.value = "";
        stopSpeaking();
        
        // Show typing indicator
        setEmotion("thinking");
        speechBubbleBody.innerHTML = `
            <div class="assistant-typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        speechContainer.classList.add("show");

        try {
            let answer = await fetchGeminiResponse(query);
            
            // Check for navigation command: [[NAV:section_id]]
            const navRegex = /\[\[NAV:(\w+)\]\]/i;
            const match = answer.match(navRegex);
            
            if (match) {
                const sectionId = match[1].toLowerCase();
                // Clean the token from the response text
                answer = answer.replace(navRegex, '').trim();
                
                // Trigger smooth scroll with a small delay for visual elegance
                setTimeout(() => {
                    // Match section element
                    let targetElement = document.getElementById(sectionId);
                    
                    // Fallback for home/top mapping
                    if (sectionId === "hero" && !targetElement) {
                        targetElement = document.body;
                    }

                    if (targetElement) {
                        setEmotion("pointing");
                        targetElement.scrollIntoView({
                            behavior: "smooth",
                            block: "center"
                        });
                        
                        // Go back to idle after pointing animation
                        setTimeout(() => {
                            if (state.currentEmotion === "pointing") {
                                setEmotion("idle");
                            }
                        }, 2500);
                    }
                }, 500);
            }

            showSpeechBubble(answer);
            speak(answer);
        } catch (error) {
            setEmotion("error");
            const errorMessage = "Sorry! I encountered an electrical glitch connecting to Gemini. Try asking again in a second.";
            showSpeechBubble(errorMessage);
            speak(errorMessage);
        }
    };

    // Submit events
    sendBtn.addEventListener("click", handleUserMessageSubmit);
    inputField.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleUserMessageSubmit();
        }
    });

    // Quick Action Buttons
    quickActions.addEventListener("click", (e) => {
        if (e.target.classList.contains("assistant-action-chip")) {
            inputField.value = e.target.getAttribute("data-query");
            handleUserMessageSubmit();
        }
    });

    // -------------------------------------------------------------
    // 7. Scroll Tracker (Contextual Section Reactions)
    // -------------------------------------------------------------
    
    // Comments that Nova speaks when the user scrolls to a specific section
    const sectionComments = {
        hero: "We are back at the start! I'm Nova, your AI assistant. Type or speak your question, or start a tour!",
        about: "Here is where Omar lives in the terminal window. He builds complex AI pipelines and machine learning scripts. Very analytical!",
        skills: "Take a look at this orbiting network of technical skills. Omar is expert in Python, PyTorch, Computer Vision, and NLP!",
        projects: "These are Omar's design projects. Click on the thumbnails to switch details! He built an anti-cheat system called AI Observer.",
        certificates: "These are Omar's professional credentials, including certifications from NTI and Nvidia! He's a certified ML Engineer.",
        "future-work": "Here is Omar's roadmap. He is currently developing version 2 of his anti-cheat AI Observer system.",
        contact: "You've reached the end! Send Omar an email at onegm036@gmail.com, or check out his LinkedIn. Let's build something together!"
    };

    // Intersection observer to track which section is currently viewed
    const observerOptions = {
        root: null,
        rootMargin: "0px",
        threshold: 0.4 // Trigger when 40% of the section is visible
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        // If tour is active, we don't trigger scroll reactions to avoid conflicting speak threads
        if (state.tourActive) return;

        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionId = entry.target.id;
                
                if (state.currentSection !== sectionId) {
                    state.currentSection = sectionId;
                    
                    // Wave at hero, point at others
                    if (sectionId === "hero") {
                        setEmotion("waving");
                        setTimeout(() => setEmotion("idle"), 2000);
                    } else {
                        setEmotion("pointing");
                        setTimeout(() => setEmotion("idle"), 2500);
                    }

                    // Speak contextual section quote only if the assistant is open
                    const comment = sectionComments[sectionId];
                    if (comment && state.isOpen) {
                        showSpeechBubble(comment);
                        speak(comment);
                    }
                }
            }
        });
    }, observerOptions);

    // Observe all sections
    document.querySelectorAll("main > section, section.about-section, section.skills-section, section.projects-section, section.certificates-section").forEach(sec => {
        sectionObserver.observe(sec);
    });

    // -------------------------------------------------------------
    // 8. Guided Tour Mode
    // -------------------------------------------------------------
    const tourSteps = [
        {
            section: "hero",
            title: "Welcome aboard!",
            text: "Hello! Welcome to Omar Negm's portfolio universe. I'm Nova, and I'll be your 3D guide today. Let's see who Omar is!",
            emotion: "waving"
        },
        {
            section: "about",
            title: "About Omar",
            text: "Here is Omar's digital profile page inside this terminal interface. He's an AI Engineering Student at New Mansoura University, specializing in Agentic workflows.",
            emotion: "pointing"
        },
        {
            section: "skills",
            title: "His Skills Network",
            text: "Observe this neural orbital structure! His skills range from core Python programming and SQL data structures to advanced NLP and Deep Learning networks.",
            emotion: "pointing"
        },
        {
            section: "projects",
            title: "Featured Creations",
            text: "Take a look at his projects. He led ArabSyntax, an NLP model parsing Arabic linguistics, and built AI Observer, which uses computer vision to audit remote assessments.",
            emotion: "pointing"
        },
        {
            section: "certificates",
            title: "Credentials",
            text: "Omar is highly certified! Check out his credentials from Nvidia, NTI, and DEPI, covering Python, SQL, and Machine Learning architectures.",
            emotion: "pointing"
        },
        {
            section: "contact",
            title: "Get In Touch",
            text: "We have reached our destination! You can connect with Omar via his email or LinkedIn links. Feel free to chat with me or ask me any questions directly!",
            emotion: "waving"
        }
    ];

    const startTour = () => {
        stopSpeaking();
        state.tourActive = true;
        state.currentTourStep = 0;
        tourBtn.classList.add("active");
        if (heroTourPrompt) {
            heroTourPrompt.style.display = "none";
        }
        
        executeTourStep();
    };

    const stopTour = () => {
        stopSpeaking();
        state.tourActive = false;
        state.currentTourStep = -1;
        tourNav.style.display = "none";
        tourBtn.classList.remove("active");
        
        // Reset bubble
        showSpeechBubble("Tour ended. Let me know if you want to ask anything else!");
        speak("Tour ended. Let me know if you want to ask anything else!");
        
        // Show Hero prompt again if we are back at hero
        if (state.currentSection === "hero" && heroTourPrompt) {
            heroTourPrompt.style.display = "inline-flex";
        }
    };

    const nextTourStep = () => {
        if (state.currentTourStep < tourSteps.length - 1) {
            state.currentTourStep++;
            executeTourStep();
        } else {
            stopTour();
        }
    };

    const prevTourStep = () => {
        if (state.currentTourStep > 0) {
            state.currentTourStep--;
            executeTourStep();
        }
    };

    const executeTourStep = () => {
        const step = tourSteps[state.currentTourStep];
        if (!step) return;

        // Update step indicators
        tourStepInfo.textContent = `Step ${state.currentTourStep + 1} of ${tourSteps.length}`;
        
        // Scroll to the targeted section
        const targetElement = document.getElementById(step.section);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }

        // Apply visual emotion
        setEmotion(step.emotion);
        
        // Speak step text
        const speechText = `**${step.title}**: ${step.text}`;
        showSpeechBubble(speechText, true); // true displays tour navigation bar
        speak(step.text);
    };

    // Bind Tour Buttons
    tourBtn.addEventListener("click", () => {
        if (state.tourActive) {
            stopTour();
        } else {
            startTour();
        }
    });

    if (heroTourPrompt) {
        heroTourPrompt.addEventListener("click", startTour);
    }
    tourStopBtn.addEventListener("click", stopTour);
    tourNextBtn.addEventListener("click", nextTourStep);
    tourPrevBtn.addEventListener("click", prevTourStep);

    // Bind Mute & Mic Buttons
    muteBtn.addEventListener("click", toggleMute);
    micBtn.addEventListener("click", toggleSpeechRecognition);
    
    // Toggle assistant open state on clicking the robot canvas
    canvasTrigger.addEventListener("click", (e) => {
        // Prevent click trigger if we are clicking controls overlay
        if (e.target.closest('.assistant-controls')) return;
        
        toggleOpen();
        
        if (state.isOpen) {
            if (!state.isSpeaking && !state.isThinking) {
                setEmotion("waving");
                speak("Hello! I'm Nova, Omar's AI partner. Let's explore together!");
                showSpeechBubble("Hi there! 👋 I'm Nova, Omar's 3D AI Guide. Ask me anything about his skills, projects, or experience!");
                setTimeout(() => {
                    if (state.currentEmotion === "waving") setEmotion("idle");
                }, 2000);
            }
        }
    });

    // -------------------------------------------------------------
    // 9. Startup Greeting
    // -------------------------------------------------------------
    init3D();
});
