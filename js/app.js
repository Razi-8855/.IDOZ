/* ==========================================================================
   IDOZ - MULTI-PAGE CINEMATIC BRAND INTERACTION LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // 1. Initialize Lenis Smooth Scroll
    const lenis = new Lenis({
        duration: 1.4,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // High premium deceleration curve
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1.1,
        smoothTouch: false,
        touchMultiplier: 1.5,
        infinite: false,
    });



    // 2. Initialize GSAP Plugins
    if (typeof gsap !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        if (typeof MotionPathPlugin !== 'undefined') {
            gsap.registerPlugin(MotionPathPlugin);
        }

        // Sync GSAP with Lenis Smooth Scroll
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0, 0);
    }

    // 3. Page Router / Activation
    initGlobalNav();

    if (document.getElementById('particles-canvas')) {
        initParticles();
    }
    if (document.getElementById('bee-journey')) {
        initBeeJourney();
        initVideoManager();
    }
    if (document.getElementById('collection-grid')) {
        initCollectionPage();
    }
    if (document.getElementById('stages-accordion')) {
        initAboutPage();
    }

    // ==========================================================================
    // GLOBAL NAVIGATION & ACTIVE STATES
    // ==========================================================================
    function initGlobalNav() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-links a');

        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (currentPath.includes(href) && href !== 'index.html') {
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            } else if (href === 'index.html' && (currentPath.endsWith('/') || currentPath.endsWith('index.html') || currentPath === '')) {
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    }



    // ==========================================================================
    // PARTICLES CANVAS
    // ==========================================================================
    function initParticles() {
        const pCanvas = document.getElementById('particles-canvas');
        if (!pCanvas) return;
        const pCtx = pCanvas.getContext('2d');
        let particles = [];

        function resizeParticles() {
            pCanvas.width = window.innerWidth;
            pCanvas.height = window.innerHeight;
            createParticles();
        }

        function createParticles() {
            particles = [];
            const count = Math.floor((pCanvas.width * pCanvas.height) / 12000);
            for (let i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * pCanvas.width,
                    y: Math.random() * pCanvas.height,
                    vx: (Math.random() - 0.5) * 0.3,
                    vy: (Math.random() - 0.5) * 0.3,
                    size: Math.random() * 1.5 + 0.5,
                    opacity: Math.random() * 0.6 + 0.2
                });
            }
        }

        function animateParticles() {
            pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
            for (const p of particles) {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0) p.x = pCanvas.width;
                if (p.x > pCanvas.width) p.x = 0;
                if (p.y < 0) p.y = pCanvas.height;
                if (p.y > pCanvas.height) p.y = 0;
                pCtx.beginPath();
                pCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                pCtx.fillStyle = `rgba(255,255,255,${p.opacity})`;
                pCtx.fill();
            }
            requestAnimationFrame(animateParticles);
        }

        resizeParticles();
        window.addEventListener('resize', resizeParticles);
        animateParticles();
    }

    // ==========================================================================
    // VIDEO PERFORMANCE MANAGER (CULL OFF-SCREEN VIDEOS)
    // ==========================================================================
    function initVideoManager() {
        const videos = document.querySelectorAll('.fs-parallax-bg');
        if (videos.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target;
                if (entry.isIntersecting) {
                    video.play().catch(e => console.log('Autoplay prevented:', e));
                } else {
                    video.pause();
                }
            });
        }, {
            root: null,
            rootMargin: '100px 0px', // Buffer to start playing slightly before entering
            threshold: 0.0
        });

        videos.forEach(video => {
            observer.observe(video);
        });
    }

    // ==========================================================================
    // BEE'S JOURNEY 3D (SCROLL-SCRUBBED PARALLAX)
    // ==========================================================================
    function initBeeJourney() {
        const journeyContainer = document.getElementById('bee-journey');
        const canvas = document.getElementById('bee-3d-canvas');

        if (!journeyContainer || !canvas || typeof THREE === 'undefined') return;

        // 1. Setup Three.js Scene
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.set(0, 0, 10);

        const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Limit for performance

        // 2. Luxury Lighting Setup (PBR)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(0xfff0e6, 1.5);
        keyLight.position.set(5, 5, 5);
        scene.add(keyLight);

        const rimLight = new THREE.SpotLight(0xe6f0ff, 2);
        rimLight.position.set(-5, 5, -5);
        rimLight.angle = 0.5;
        rimLight.penumbra = 1;
        scene.add(rimLight);

        // Environment Map (HDRI approximation)
        new THREE.RGBELoader().load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/equirectangular/venice_sunset_1k.hdr', function (texture) {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            scene.environment = texture;
        });

        // 3. Load 3D Bee Model
        let beeModel = null;
        const beeGroup = new THREE.Group();
        beeGroup.scale.setScalar(1.0); // Make the bee much smaller
        scene.add(beeGroup);

        const loader = new THREE.GLTFLoader();

        loader.load('assets/Hitem3d-1781946782368.glb', function (gltf) {
            beeModel = gltf.scene;
            beeGroup.add(beeModel);

            // Tune PBR Materials
            beeModel.traverse((child) => {
                if (child.isMesh) {
                    if (child.name.toLowerCase().includes('body') || child.material.name.toLowerCase().includes('body')) {
                        child.material.metalness = 0.8;
                        child.material.roughness = 0.3;
                        child.material.color.set('#c17b5f'); // Copper/Bronze
                    }
                    if (child.name.toLowerCase().includes('wing') || child.material.name.toLowerCase().includes('wing')) {
                        child.material.metalness = 0.1;
                        child.material.roughness = 0.8;
                        child.material.color.set('#f5d6d6'); // Blush pink
                        child.material.transparent = true;
                        child.material.opacity = 0.9;
                    }
                }
            });

            // Initial positioning (Above the "I DREAM OF ZARI" text)
            beeGroup.position.set(0, 2.5, 5);
        });

        // 3.5 Responsive Resize Handling
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            ScrollTrigger.refresh();
        });

        // 4. Procedural Wing Flap Loop & Performance Observer
        let isVisible = true;
        const observer = new IntersectionObserver((entries) => {
            isVisible = entries[0].isIntersecting;
        }, { threshold: 0 });
        observer.observe(journeyContainer);

        const clock = new THREE.Clock();
        function animate() {
            requestAnimationFrame(animate);
            if (!isVisible) return; // Pause rendering when off-screen

            if (beeModel) {
                const time = clock.getElapsedTime();
                // Idle wandering animation (flies around here and there when not scrolling)
                // Using stacked sine waves for a smooth but dynamic realistic bee flight pattern
                const t1 = time * 2.0;
                const t2 = time * 3.2;
                beeModel.position.x = Math.sin(t1) * 1.5 + Math.cos(t2) * 0.8;
                beeModel.position.y = Math.cos(t1 * 0.8) * 1.0 + Math.sin(t2 * 1.1) * 0.6;
                beeModel.position.z = Math.sin(t1 * 1.3) * 0.5;
                
                // Add rapid idle rotation to match the darting movement
                beeModel.rotation.y = Math.sin(t1) * 0.5;
                beeModel.rotation.z = Math.cos(t1 * 0.8) * 0.3;
                beeModel.rotation.x = Math.sin(t2) * 0.2;
                // Fake flutter via scale oscillation
                const flutterSpeed = 30;
                const flutterAmount = 0.02;
                beeModel.scale.z = 1 + Math.sin(time * flutterSpeed) * flutterAmount;
                beeModel.scale.x = 1 + Math.sin(time * flutterSpeed) * flutterAmount;

                renderer.render(scene, camera);
            }
        }
        animate();

        // Handle Resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // 5. GSAP Scroll Path Integration (Responsive)
        const isMobile = window.matchMedia("(max-width: 768px)").matches;
        
        // Define Desktop vs Mobile flight paths
        const desktopPath = [
            new THREE.Vector3(0, 2.5, 5),    // Scene 1 (Start above the text)
            new THREE.Vector3(3.5, 0, 2),    // Scene 2 (Sweep far right)
            new THREE.Vector3(-3.5, -2, 0),  // Scene 3 (Sweep far left)
            new THREE.Vector3(1.5, -4, -2),  // Scene 3 exit
            new THREE.Vector3(0, 0.2, -2)    // Scene 4 (Landing point centered for new jacket image)
        ];
        
        const mobilePath = [
            new THREE.Vector3(0, 2.5, 5),    // Scene 1 (Start above the text)
            new THREE.Vector3(-0.5, 0, 2),   // Scene 2 (Tighter sweep)
            new THREE.Vector3(0.5, -2, 0),   // Scene 3 (Tighter sweep)
            new THREE.Vector3(-0.5, -4, -2), // Scene 3 exit
            new THREE.Vector3(0, -5.5, -4)   // Scene 4 (Landing)
        ];
        
        const pathPoints = isMobile ? mobilePath : desktopPath;
        const flightCurve = new THREE.CatmullRomCurve3(pathPoints);
        const dummy = new THREE.Object3D();
        const scrollObj = { progress: 0 };

        let lastProgress = 0;
        let smoothedVelocity = 0;

        gsap.to(scrollObj, {
            progress: 1,
            ease: "none", // Must be none for linear scrub mapping!
            scrollTrigger: {
                trigger: journeyContainer,
                start: "top top",
                end: "bottom bottom",
                scrub: true // Locked 1:1 with scrolling, no inertia lag
            },
            onUpdate: () => {
                if (!beeModel) return;

                // 1. Position along curve
                const pos = flightCurve.getPointAt(scrollObj.progress);
                beeGroup.position.copy(pos);

                // 2. Velocity-based Banking/Rotation
                // Calculate direction of travel to bank towards it
                const velocity = scrollObj.progress - lastProgress;
                lastProgress = scrollObj.progress;
                
                // Lerp the velocity for smooth momentum when changing directions
                smoothedVelocity = THREE.MathUtils.lerp(smoothedVelocity, velocity, 0.05);
                
                // If moving backwards, look behind. If forwards, look ahead.
                // Added a small baseline lookAhead so it doesn't default to 0 when stopped
                let lookAheadAmount = 0.05; 
                if (Math.abs(smoothedVelocity) > 0.0001) {
                    lookAheadAmount = smoothedVelocity > 0 ? 0.05 : -0.05;
                }

                const lookAtProgress = THREE.MathUtils.clamp(scrollObj.progress + lookAheadAmount, 0, 1);
                const lookAtPos = flightCurve.getPointAt(lookAtProgress);
                
                dummy.position.copy(pos);
                dummy.lookAt(lookAtPos);
                
                // Highly damped slerp for premium, unhurried rotation
                beeGroup.quaternion.slerp(dummy.quaternion, 0.04);

                // Fade in from Scene 1 to Scene 2
                if (scrollObj.progress < 0.15) {
                    const fade = Math.max(0, (scrollObj.progress - 0.05) * 10); // Fade in from 0.05 to 0.15
                    beeGroup.scale.setScalar(1.5);
                    beeGroup.visible = fade > 0; 
                    beeGroup.traverse(child => {
                        if (child.isMesh && child.material) {
                            child.material.transparent = true;
                            let targetOpacity = fade;
                            if (child.name.toLowerCase().includes('wing') || child.material.name.toLowerCase().includes('wing')) {
                                targetOpacity = fade * 0.9;
                            }
                            child.material.opacity = Math.min(1, targetOpacity);
                        }
                    });
                } else if (scrollObj.progress > 0.9) { // Fade out at landing
                    const fade = (scrollObj.progress - 0.9) * 10;
                    beeGroup.scale.setScalar(1.5);
                    beeGroup.visible = fade < 0.95; 
                    beeGroup.traverse(child => {
                        if (child.isMesh && child.material) {
                            child.material.transparent = true;
                            child.material.opacity = Math.max(0, 1 - fade);
                        }
                    });
                } else {
                    beeGroup.visible = true;
                    beeGroup.scale.setScalar(1.5); 
                    beeGroup.traverse(child => {
                        if (child.isMesh && child.material) {
                            child.material.opacity = 1; 
                            if (child.name.toLowerCase().includes('wing') || child.material.name.toLowerCase().includes('wing')) {
                                child.material.opacity = 0.9;
                            }
                        }
                    });
                }
            }
        });

        // Background Parallax Layers in Scene 2 & 3
        const layers = journeyContainer.querySelectorAll('.pl-layer');
        layers.forEach(layer => {
            const speed = parseFloat(layer.getAttribute('data-speed')) || 0;
            if (speed !== 0) {
                gsap.fromTo(layer,
                    { y: `${speed * 50}vh` },
                    {
                        y: `-${speed * 50}vh`, ease: "none",
                        scrollTrigger: {
                            trigger: layer.closest('.journey-scene'),
                            start: "top bottom",
                            end: "bottom top",
                            scrub: true
                        }
                    }
                );
            }
        });

        // Jacket mask reveal
        const maskContainer = document.getElementById('jacket-build-mask');
        if (maskContainer) {
            gsap.fromTo(maskContainer,
                { clipPath: "inset(100% 0 0 0)" },
                {
                    clipPath: "inset(0% 0 0 0)", ease: "none",
                    scrollTrigger: {
                        trigger: "#scene-3",
                        start: "top top",
                        end: "bottom center",
                        scrub: true
                    }
                }
            );
        }
    }


    // ==========================================================================
    // COLLECTION LANDING PAGE LOGIC (collection.html)
    // ==========================================================================
    function initCollectionPage() {
        // ==========================================================================
        // INFINITE SLIDER MARQUEE LOGIC
        // ==========================================================================
        const jackets = [
            { img: "assets/tr Bl.png", name: "The Midnight Cartographer", detail: "Navy · Floral Embroidery", tag: "Piece 01" },
            { img: "assets/Tr R.png", name: "The Obsidian Ritual", detail: "Black · Velvet & Silk", tag: "Piece 02" },
            { img: "assets/tr Bb.png", name: "The Sapphire Scribe", detail: "Navy · Geometric Sleeves", tag: "Piece 03" },
            { img: "assets/tr B.png", name: "The Desert Heirloom", detail: "Sand · Cashmere Wool", tag: "Piece 04" },
            { img: "assets/Tr G.png", name: "The Botanical Alchemist", detail: "Dark Green · Heritage Silk", tag: "Piece 05" },
            { img: "assets/Tr C.png", name: "The Empress Crimson", detail: "Crimson · Silk Wool", tag: "Piece 06" },
            { img: "assets/tr Bbb.png", name: "The Dark Geometry", detail: "Navy · Deep Embroidery", tag: "Piece 07" }
        ];

        const track = document.getElementById('track');
        const wrapper = document.getElementById('wrapper'); if (track && wrapper) {
            function makeCard(j) {
                const card = document.createElement('div');
                card.className = 'jacket-card';
                card.innerHTML = `
                    <img src="${j.img}" alt="${j.name}">
                    <div class="jacket-overlay">
                        <div class="jacket-name">${j.name}</div>
                        <div class="jacket-detail">${j.detail}</div>
                        <span class="jacket-tag">${j.tag}</span>
                    </div>
                `;
                return card;
            }

            [...jackets, ...jackets].forEach(j => track.appendChild(makeCard(j)));

            wrapper.addEventListener('mouseenter', () => track.classList.add('paused'));
            wrapper.addEventListener('mouseleave', () => {
                track.classList.remove('paused');
            });
        }

        // ==========================================================================
        // EXISTING LIGHTBOX & GRID LOGIC
        // ==========================================================================
        const cards = document.querySelectorAll('.product-card');
        const lightbox = document.getElementById('luxury-lightbox');
        const closeBtn = document.getElementById('lightbox-close');

        // Element bindings inside details popup
        const lbImg = document.getElementById('lightbox-main-img');
        const lbTag = document.getElementById('lightbox-piece-tag');
        const lbTitle = document.getElementById('lightbox-piece-title');
        const lbDesc = document.getElementById('lightbox-piece-desc');
        const lbStory = document.getElementById('lightbox-piece-story');

        const inquiryForm = document.getElementById('inquiry-form');
        const successMsg = document.getElementById('inquiry-success-msg');

        if (!lightbox || cards.length === 0) return;

        // Open Lightbox Event Handler
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const name = card.getAttribute('data-name');
                const tag = card.getAttribute('data-tag');
                const img = card.getAttribute('data-image');
                const desc = card.getAttribute('data-desc');
                const story = card.getAttribute('data-story');

                // Populate popup parameters
                if (lbImg) lbImg.setAttribute('src', img);
                if (lbTag) lbTag.textContent = tag;
                if (lbTitle) lbTitle.textContent = name;
                if (lbDesc) lbDesc.innerHTML = desc;
                if (lbStory) lbStory.innerHTML = story;

                // Reset forms
                if (inquiryForm) {
                    inquiryForm.style.display = 'block';
                    inquiryForm.reset();
                }
                if (successMsg) successMsg.style.display = 'none';

                // Open Modal
                lightbox.classList.add('active');
                lenis.stop(); // Lock scroll while reading details
            });
        });

        // Close Lightbox Event Handler
        function closeLightbox() {
            lightbox.classList.remove('active');
            lenis.start(); // Unlock scroll
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', closeLightbox);
        }

        // Close on background mask click
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });

        // Close on ESC key press
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('active')) {
                closeLightbox();
            }
        });

        // Handle Custom Inquiry Submission
        window.handleInquirySubmit = function () {
            if (inquiryForm && successMsg) {
                // Fade out inputs, show premium Zari feedback
                gsap.to(inquiryForm, {
                    opacity: 0,
                    duration: 0.4,
                    onComplete: () => {
                        inquiryForm.style.display = 'none';
                        inquiryForm.style.opacity = 1; // reset for next open
                        successMsg.style.display = 'block';
                        gsap.fromTo(successMsg, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6 });
                    }
                });
            }
        };
    }

    // ==========================================================================
    // ABOUT & CRAFT PAGE LOGIC (about.html)
    // ==========================================================================
    function initAboutPage() {
        const accordionItems = document.querySelectorAll('.stage-item');

        accordionItems.forEach(item => {
            const header = item.querySelector('.stage-header');

            header.addEventListener('click', () => {
                const isActive = item.classList.contains('active');

                // Close all accordion stages
                accordionItems.forEach(i => {
                    i.classList.remove('active');
                    // Smoothly retract body if setting max-height
                    const body = i.querySelector('.stage-body');
                    if (body) {
                        body.style.maxHeight = null;
                    }
                });

                // Open the clicked stage if it wasn't active
                if (!isActive) {
                    item.classList.add('active');
                    const body = item.querySelector('.stage-body');
                    if (body) {
                        body.style.maxHeight = body.scrollHeight + 'px';
                    }

                    // Center scroll target smoothly onto open stage
                    setTimeout(() => {
                        const topPos = item.getBoundingClientRect().top + window.pageYOffset - 120;
                        lenis.scrollTo(topPos, { duration: 1.2 });
                    }, 300);
                }
            });
        });

        // Initialize the first stage's scrollHeight height calculations
        const initialActive = document.querySelector('.stage-item.active');
        if (initialActive) {
            const body = initialActive.querySelector('.stage-body');
            if (body) {
                body.style.maxHeight = body.scrollHeight + 'px';
            }
        }
    }

});
