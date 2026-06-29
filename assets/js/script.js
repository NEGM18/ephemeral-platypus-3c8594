document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.querySelector('i').classList.toggle('fa-bars');
            hamburger.querySelector('i').classList.toggle('fa-times');
        });
    }

    // Smooth Scrolling for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            // Close mobile menu if open
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                hamburger.querySelector('i').classList.add('fa-bars');
                hamburger.querySelector('i').classList.remove('fa-times');
            }

            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // Scroll Reveal Animation using Intersection Observer
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    revealElements.forEach(el => observer.observe(el));

    /* -------------------------------------------------------------------------- */
    /*                         Code Background Animation                          */
    /* -------------------------------------------------------------------------- */
    const codeContainer = document.getElementById('code-background');
    if (codeContainer) {
        const pythonSnippets = [
            "import numpy as np",
            "import pandas as pd",
            "def neural_network(x):",
            "    return 1 / (1 + np.exp(-x))",
            "model = Sequential()",
            "model.add(Dense(64, activation='relu'))",
            "optimizer = Adam(lr=0.001)",
            "loss = 'categorical_crossentropy'",
            "model.fit(X_train, y_train, epochs=10)",
            "plt.plot(history.history['loss'])",
            "with tf.GradientTape() as tape:",
            "    predictions = model(images)",
            "    loss = loss_object(labels, predictions)",
            "cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)",
            "if __name__ == '__main__':",
            "print('Hello, AI World!')",
            "class Agent(object):",
            "    def __init__(self, action_space):",
            "        self.action_space = action_space",
            "data = json.load(f)",
            "response = requests.get(url)",
            "soup = BeautifulSoup(html, 'html.parser')",
            "for i in range(len(dataset)):",
            "    batch = dataset[i]",
            "torch.nn.functional.softmax(x, dim=1)"
        ];

        function createCodeSnippet() {
            const snippet = document.createElement('div');
            snippet.classList.add('code-snippet');
            snippet.innerText = pythonSnippets[Math.floor(Math.random() * pythonSnippets.length)];

            // Random horizontal position
            snippet.style.left = Math.random() * 95 + 'vw';

            // Random text size variability
            const baseSize = 0.8 + Math.random() * 0.6; // 0.8rem to 1.4rem
            snippet.style.fontSize = baseSize + 'rem';

            // Random opacity variability
            snippet.style.opacity = 0.1 + Math.random() * 0.3; // 0.1 to 0.4

            // Random animation duration (speed)
            const duration = 15 + Math.random() * 20; // 15s to 35s
            snippet.style.animationDuration = duration + 's';

            // Random animation delay (start time) if checking initially, otherwise 0
            // but here we spawn continuously so we want them to start now.
            // However, we can add a slight negative delay to simulate pre-existing ones if we spawn in batch.

            codeContainer.appendChild(snippet);

            // Remove element after animation ends to keep DOM clean
            setTimeout(() => {
                snippet.remove();
            }, duration * 1000);
        }

        // Initial population: Spawn a bunch immediately to fill the screen
        for (let i = 0; i < 25; i++) {
            const snippet = document.createElement('div');
            snippet.classList.add('code-snippet');
            snippet.innerText = pythonSnippets[Math.floor(Math.random() * pythonSnippets.length)];
            snippet.style.left = Math.random() * 95 + 'vw';
            snippet.style.fontSize = (0.8 + Math.random() * 0.6) + 'rem';
            snippet.style.opacity = 0.1 + Math.random() * 0.3;
            const duration = 15 + Math.random() * 20;
            snippet.style.animationDuration = duration + 's';

            // Simulate that they started some time ago so they are scattered vertically
            const randomDelay = Math.random() * duration * -1;
            snippet.style.animationDelay = randomDelay + 's';

            codeContainer.appendChild(snippet);

            // We need to set a timeout to remove these initial ones too based on their remaining time
            // Remaining time = duration + randomDelay (randomDelay is negative)
            // If remaining time is small, they will disappear soon.
            // For simplicity, just set a timeout for the full duration from now, 
            // though they will jump to end position earlier.
            // Actually, animation-delay with negative value advances the animation.
            // So we just need to wait (duration + delay) seconds.
            // Since delay is negative, it's subtraction.
            const remainingTime = duration + randomDelay;
            if (remainingTime > 0) {
                setTimeout(() => {
                    snippet.remove();
                }, remainingTime * 1000);
            } else {
                snippet.remove();
            }
        }

        // Continuous spawning
        setInterval(createCodeSnippet, 800); // 1 new snippet every 800ms
    }
    /* -------------------------------------------------------------------------- */
    /*                         Orbiting Skills Animation                          */
    /* -------------------------------------------------------------------------- */
    const skillsContainer = document.getElementById('skills-orbit-container');
    const orbitingNodes = document.querySelectorAll('.orbiting-node');
    let isSkillsPaused = false;
    let skillTime = 0;

    if (skillsContainer && orbitingNodes.length > 0) {
        skillsContainer.addEventListener('mouseenter', () => {
            isSkillsPaused = true;
        });

        skillsContainer.addEventListener('mouseleave', () => {
            isSkillsPaused = false;
        });

        let lastTime = performance.now();

        function animateOrbit(currentTime) {
            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;

            if (!isSkillsPaused) {
                skillTime += deltaTime;
            }

            orbitingNodes.forEach(node => {
                const radius = parseFloat(node.getAttribute('data-orbit-radius'));
                const speed = parseFloat(node.getAttribute('data-speed'));
                const phase = parseFloat(node.getAttribute('data-phase'));
                
                const angle = (skillTime * speed) + phase;
                
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                node.style.left = `calc(50% + ${x}px)`;
                node.style.top = `calc(50% + ${y}px)`;
            });

            requestAnimationFrame(animateOrbit);
        }

        requestAnimationFrame(animateOrbit);
    }

    // Skills Tooltip Logic
    const skillNodes = document.querySelectorAll('.node');
    const tooltip = document.getElementById('skill-tooltip');
    const tooltipName = document.getElementById('tooltip-name');
    const tooltipLevelText = document.getElementById('tooltip-level-text');
    const tooltipBar = document.getElementById('tooltip-bar');

    if (skillNodes.length > 0 && tooltip) {
        skillNodes.forEach(node => {
            node.addEventListener('mouseenter', (e) => {
                const skill = node.getAttribute('data-skill');
                const level = node.getAttribute('data-level');

                // Update tooltip content
                if (tooltipName) tooltipName.textContent = skill;
                if (tooltipLevelText) tooltipLevelText.textContent = level;
                if (tooltipBar) tooltipBar.style.width = `${level}%`;

                // Show tooltip
                tooltip.classList.add('active');
            });

            node.addEventListener('mouseleave', () => {
                // Hide tooltip
                tooltip.classList.remove('active');

                // Reset bar for animation next time
                if (tooltipBar) {
                    setTimeout(() => {
                        tooltipBar.style.width = '0%';
                    }, 400); // Wait for fade out
                }
            });
        });
    }

    // Master-Detail Projects Logic
    const projectData = [
        {
            id: 1,
            title: "ai_observer",
            desc: "A real-time, computer vision-based system designed to ensure the integrity of remote assessments by automatically detecting and flagging suspicious behavior during online exams.",
            tags: ["AI", "Python", "Computer Vision"],
            link: "https://github.com/NEGM18/ai_observer",
            image: "https://i.ibb.co/6JTQ9jc5/ai-observer.png"
        },
        {
            id: 2,
            title: "hotelbookingsystem",
            desc: "A comprehensive system for managing hotel reservations, room availability, and customer bookings with a user-friendly interface.",
            tags: ["System Design", "Database", "Web"],
            link: "https://github.com/NEGM18/hotelbookingsystem",
            image: "https://i.ibb.co/8ndrVw3D/hotel-booking.jpg"
        },
        {
            id: 3,
            title: "ArabSyntax",
            desc: "A deep learning model for Arabic grammatical analysis (I'rab) utilizing Quranic datasets, implementing advanced Natural Language Processing (NLP) pipelines.",
            tags: ["Deep Learning", "NLP", "Python"],
            link: "https://github.com/NEGM18/ArabSyntax",
            image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600&h=800"
        }
    ];

    const thumbnails = document.querySelectorAll('.thumbnail-item');
    const mainImage = document.getElementById('main-project-image');
    const mainLink = document.getElementById('main-project-link');
    const detailsContainer = document.getElementById('project-details');

    // Elements to update
    const detailTitle = detailsContainer.querySelector('.detail-title');
    const detailDesc = detailsContainer.querySelector('.detail-desc');
    const detailTags = detailsContainer.querySelector('.detail-tags');
    const detailLink = detailsContainer.querySelector('.project-link');

    // Connecting Lines
    const verticalLine = document.getElementById('vertical-line');
    const horizontalLine = document.getElementById('horizontal-line');

    if (thumbnails.length > 0) {
        thumbnails.forEach((thumb, index) => {
            thumb.addEventListener('click', () => {
                // 1. Update Active State
                thumbnails.forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');

                // 2. Move Connecting Lines
                // Vertical line height/position based on index
                // Base top is 75px. Each item is 70px + 24px gap = 94px roughly.
                // Better to use calculation or just set fixed steps since we have few items.
                // But let's just slide the vertical connector's height or position?
                // The CSS 'active-line-connector' is positioned at top.
                // Let's just move the horizontal connector to align with the clicked thumb.

                // 75px start + (index * (70 height + 24 gap)) + 35 (half height)
                const baseTop = 75;
                const itemHeight = 70;
                const gap = 24; // 1.5rem
                // actually we simply want to move the "horizontal-connector" top position
                // The active-line-connector stays at top but stretches? 
                // Or acts as the "spine". Let's say vertical line is the spine.

                // Let's adjust the master vertical line height to reach this item
                // and move the horizontal line to this item.
                const offset = index * (itemHeight + gap);

                if (verticalLine) verticalLine.style.height = `${50 + offset}px`;
                if (horizontalLine) horizontalLine.style.top = `${125 + offset}px`;
                if (horizontalLine) horizontalLine.style.width = '30px'; // Expand to touch content

                // 3. Get Data
                const projectId = parseInt(thumb.getAttribute('data-id'));
                const data = projectData.find(p => p.id === projectId);

                if (data) {
                    // 4. Animate Out
                    mainImage.style.opacity = 0;
                    mainImage.style.transform = 'scale(0.95)';
                    detailsContainer.style.opacity = 0;
                    detailsContainer.style.transform = 'translateY(10px)';

                    setTimeout(() => {
                        // 5. Update Content
                        mainImage.src = data.image;
                        mainLink.href = data.link;

                        detailTitle.textContent = data.title;
                        detailDesc.textContent = data.desc;
                        detailLink.href = data.link;

                        // Update Tags
                        detailTags.innerHTML = '';
                        data.tags.forEach(tag => {
                            const span = document.createElement('span');
                            span.classList.add('detail-tag');
                            span.textContent = tag;
                            detailTags.appendChild(span);
                        });

                        // 6. Animate In
                        mainImage.onload = () => {
                            mainImage.style.opacity = 1;
                            mainImage.style.transform = 'scale(1)';
                        };
                        // Fallback if cached
                        setTimeout(() => {
                            mainImage.style.opacity = 1;
                            mainImage.style.transform = 'scale(1)';
                        }, 50);

                        detailsContainer.style.opacity = 1;
                        detailsContainer.style.transform = 'translateY(0)';
                    }, 300);
                }
            });
        });
    }

    // Old Chatbot Logic replaced by 3D Robot Assistant (Nova) in assistant.js

    // Remove Spline Viewer logo watermark from Shadow DOM
    const hideSplineLogo = setInterval(() => {
        const splineViewer = document.querySelector('spline-viewer');
        if (splineViewer && splineViewer.shadowRoot) {
            const shadowRoot = splineViewer.shadowRoot;
            const logo = shadowRoot.getElementById('logo');
            if (logo) {
                logo.style.display = 'none';
                clearInterval(hideSplineLogo);
            }
        }
    }, 100);
    // Stop polling after 10 seconds as a fallback
    setTimeout(() => clearInterval(hideSplineLogo), 10000);

    // Spotlight Cursor Canvas Effect
    const canvas = document.getElementById('spotlight-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            let animationFrameId;
            let mouseX = -1000;
            let mouseY = -1000;

            const resizeCanvas = () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            };

            const handleMouseMove = (event) => {
                mouseX = event.clientX;
                mouseY = event.clientY;
            };

            const handleMouseLeave = () => {
                mouseX = -1000;
                mouseY = -1000;
            };

            const draw = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                if (mouseX !== -1000 && mouseY !== -1000) {
                    const gradient = ctx.createRadialGradient(
                        mouseX, mouseY, 0,
                        mouseX, mouseY, 200 // radius
                    );
                    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
                    gradient.addColorStop(1, 'rgba(0,0,0,0)');

                    ctx.fillStyle = gradient;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                animationFrameId = requestAnimationFrame(draw);
            };

            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseleave', handleMouseLeave);
            animationFrameId = requestAnimationFrame(draw);
        }
    }

    // 3D Parallax Tilt Effect for Hero Photo Card
    const photoCard = document.querySelector('.photo-card');
    if (photoCard) {
        photoCard.addEventListener('mousemove', (e) => {
            const rect = photoCard.getBoundingClientRect();
            const x = e.clientX - rect.left; // x position within element
            const y = e.clientY - rect.top;  // y position within element
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -15; // Max 15 degrees
            const rotateY = ((x - centerX) / centerX) * 15;  // Max 15 degrees
            
            photoCard.style.transform = `scale(1.05) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
        
        photoCard.addEventListener('mouseleave', () => {
            photoCard.style.transform = 'scale(1) rotateX(0deg) rotateY(0deg)';
        });
    }
});
