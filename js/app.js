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
    
    if (document.getElementById('story-container')) {
        initStoryPage();
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
    // STORYTELLING NARRATIVE PAGE LOGIC (index.html)
    // ==========================================================================
    function initStoryPage() {
        const bee = document.getElementById('bee-character');
        const beePath = document.getElementById('bee-path');
        const storyContainer = document.getElementById('story-container');

        if (!bee || !beePath || !storyContainer) return;

        // Set initial state for the bee
        gsap.set(bee, { opacity: 0, scale: 0.8 });

        // Set initial state for the gold thread path trail
        const pathLength = beePath.getTotalLength();
        gsap.set(beePath, {
            strokeDasharray: pathLength,
            strokeDashoffset: pathLength
        });

        let beeFlipped = false;
        // MASTER NARRATIVE TIMELINE: Scrubbed flights & thread drawing
        const masterTl = gsap.timeline({
            scrollTrigger: {
                trigger: storyContainer,
                start: "top top",
                end: "bottom bottom",
                scrub: 1.2, // Ultra-smooth drag
                onUpdate: (self) => {
                    const img = bee.querySelector('.bee-img');
                    
                    // Handle 3D flipping based on scroll direction
                    if (self.direction === -1 && !beeFlipped) {
                        gsap.to(img, { rotationX: 180, duration: 0.3 });
                        beeFlipped = true;
                    } else if (self.direction === 1 && beeFlipped) {
                        gsap.to(img, { rotationX: 0, duration: 0.3 });
                        beeFlipped = false;
                    }
                    
                    // Handle realistic physics - stop wings when landed
                    if (self.progress > 0.99) {
                        img.style.animationPlayState = 'paused';
                    } else {
                        img.style.animationPlayState = 'running';
                    }
                }
            }
        });

        // 1. Fade in the bee at the top cover
        masterTl.to(bee, {
            opacity: 1,
            scale: 1,
            duration: 0.05,
            ease: "power2.out"
        }, 0);

        // 2. Animate the realistic bee along the custom winding SVG path
        masterTl.to(bee, {
            motionPath: {
                path: beePath,
                align: beePath,
                alignOrigin: [0.5, 0.5],
                autoRotate: 90 // Points bee in flight direction, offset 90deg for UP-facing logo
            },
            ease: "none",
            duration: 1
        }, 0);

        // 3. Animate Zari thread drawing trail behind the flying bee
        masterTl.to(beePath, {
            strokeDashoffset: 0,
            ease: "none",
            duration: 1
        }, 0);

        // 4. Realistic 3D Flight Depth Scaling:
        // Animate bee size up/down to represent distance depth as it traverses chapters
        const scaleTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: storyContainer,
                start: "top top",
                end: "bottom bottom",
                scrub: 1.2
            }
        });

        scaleTimeline
            .to(bee, { scale: 1.3, duration: 0.2, ease: "sine.inOut" }) // Chapter 1: Fly close
            .to(bee, { scale: 0.7, duration: 0.2, ease: "sine.inOut" }) // Chapter 2: Retreat into background
            .to(bee, { scale: 1.4, duration: 0.2, ease: "sine.inOut" }) // Chapter 3: Zoom extremely close
            .to(bee, { scale: 0.9, duration: 0.2, ease: "sine.inOut" }) // Chapter 4: Medium hover
            .to(bee, { 
                scale: 0.5, // Match realistic size of embroidered bee
                opacity: 0.9, // Blend slightly into the jacket texture
                duration: 0.2, 
                ease: "back.out(1.5)" // Physics-based realistic landing bounce
            }); // Climax: land on blazer

        // CHAPTER-SPECIFIC TEXT & BACKGROUND PARALLAX REVEALS
        
        // Hero Text Cover
        gsap.to("#hero-text-1", {
            scrollTrigger: { trigger: "#chapter-hero", start: "top 40%", end: "center center", scrub: true },
            opacity: 1, y: 0
        });
        gsap.to("#hero-text-2", {
            scrollTrigger: { trigger: "#chapter-hero", start: "center center", end: "bottom 30%", scrub: true },
            opacity: 1, y: 0
        });

        // Chapter 1: The Soul of Zari
        gsap.to("#chapter-1 .fade-text", {
            scrollTrigger: { trigger: "#chapter-1", start: "top 60%", end: "center 40%", scrub: true },
            opacity: 1, y: 0
        });
        gsap.to("#ch1-pattern", {
            scrollTrigger: { trigger: "#chapter-1", start: "top 70%", end: "center center", scrub: true },
            opacity: 1
        });
        gsap.to("#ch1-pattern img", {
            scrollTrigger: { trigger: "#chapter-1", start: "top bottom", end: "bottom top", scrub: true },
            y: -50, scale: 1.05
        });

        // Chapter 2: Craft & Memory (Collage)
        gsap.to("#chapter-2 .fade-text", {
            scrollTrigger: { trigger: "#chapter-2", start: "top 60%", end: "center 40%", scrub: true },
            opacity: 1, y: 0
        });
        gsap.to("#ch2-artisan", {
            scrollTrigger: { trigger: "#chapter-2", start: "top 70%", end: "center center", scrub: true },
            opacity: 1
        });
        // Asymmetrical parallax collage shifts
        gsap.to("#ch2-artisan .layer-1", {
            scrollTrigger: { trigger: "#chapter-2", start: "top bottom", end: "bottom top", scrub: true },
            y: -100, rotate: 1
        });
        gsap.to("#ch2-artisan .layer-2", {
            scrollTrigger: { trigger: "#chapter-2", start: "top bottom", end: "bottom top", scrub: true },
            y: 80, rotate: 14
        });

        // Chapter 3: Silhouettes Zoom Reveal
        gsap.to("#chapter-3 .fade-text", {
            scrollTrigger: { trigger: "#chapter-3", start: "top 60%", end: "center 40%", scrub: true },
            opacity: 1, y: 0
        });
        gsap.to("#ch3-garment", {
            scrollTrigger: { trigger: "#chapter-3", start: "top 70%", end: "center center", scrub: true },
            opacity: 1
        });
        gsap.to("#ch3-garment img", {
            scrollTrigger: { trigger: "#chapter-3", start: "top bottom", end: "bottom top", scrub: true },
            scale: 1.15, y: -40
        });

        // Chapter 4: The Signature Emblem
        gsap.to("#chapter-4 .fade-text", {
            scrollTrigger: { trigger: "#chapter-4", start: "top 60%", end: "center 40%", scrub: true },
            opacity: 1, y: 0
        });
        gsap.to("#ch4-emblem", {
            scrollTrigger: { trigger: "#chapter-4", start: "top 70%", end: "center center", scrub: true },
            opacity: 1
        });

        // Final Climax & Entrance sequence
        const finalTl = gsap.timeline({
            scrollTrigger: {
                trigger: "#chapter-final",
                start: "top center",
                end: "center center",
                scrub: true,
                onEnter: () => bee.classList.add("shimmer"),
                onLeaveBack: () => bee.classList.remove("shimmer")
            }
        });

        finalTl.to("#final-text", { opacity: 1, y: 0, duration: 1 }, 0);
        finalTl.to("#end-sequence", { opacity: 1, y: 0, duration: 0.8 }, 0.5);

        // Jacket Landing Scene Fade In
        gsap.to("#jacket-image", {
            scrollTrigger: {
                trigger: "#chapter-jacket",
                start: "top bottom",
                end: "center center",
                scrub: true
            },
            opacity: 1
        });
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
        const wrapper = document.getElementById('wrapper');        if (track && wrapper) {
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
        window.handleInquirySubmit = function() {
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
