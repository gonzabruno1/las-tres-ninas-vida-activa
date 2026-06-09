document.addEventListener('DOMContentLoaded', () => {

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* =====================================================
       PARALLAX EN SCROLL — liviano, GPU, throttle con rAF
       ===================================================== */
    const parallaxEls = Array.from(document.querySelectorAll('[data-parallax]'));

    if (parallaxEls.length && !prefersReducedMotion) {
        let ticking = false;

        const updateParallax = () => {
            const vh = window.innerHeight;
            parallaxEls.forEach(el => {
                const rect = el.getBoundingClientRect();
                // Solo calcular si está cerca del viewport (perf)
                if (rect.bottom < -vh || rect.top > vh * 2) return;
                const speed = parseFloat(el.dataset.parallax) || 0.1;
                // progress: 0 cuando el centro del elemento está en el centro del viewport
                const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
                const translateY = (progress * speed * 100).toFixed(1);
                el.style.transform = `translate3d(0, ${translateY}px, 0)`;
            });
            ticking = false;
        };

        const onScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(updateParallax);
                ticking = true;
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        updateParallax(); // posición inicial
    }

    /* =====================================================
       SCROLL ANIMATIONS — Intersection Observer
       ===================================================== */
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                scrollObserver.unobserve(entry.target); // observar una sola vez
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    const animatedSelectors = [
        '.manifesto-block',
        '.benefit-item',
        '.calculator-module',
        '.visualizer-module',
        '.recipe-card',
        '.footer-cta'
    ];

    animatedSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => scrollObserver.observe(el));
    });


    /* =====================================================
       CALCULADORA DE PROTEÍNA
       ===================================================== */
    const weightInput = document.getElementById('weight');
    const activityBtns = document.querySelectorAll('.activity-btn');
    const resultBox = document.getElementById('calc-result');
    const proteinGrams = document.getElementById('protein-grams');
    let activityMultiplier = 2.0;

    activityBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            activityBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activityMultiplier = parseFloat(btn.dataset.value);
            if (weightInput.value) calculateProtein();
        });
    });

    weightInput.addEventListener('input', calculateProtein);

    let lastResultShown = false;
    function calculateProtein() {
        const weight = parseFloat(weightInput.value);
        if (weight > 0) {
            const grams = Math.round(weight * activityMultiplier);
            animateNumber(proteinGrams, grams);
            resultBox.classList.remove('hidden');
            // Festejo solo la primera vez que aparece el resultado
            if (!lastResultShown && !prefersReducedMotion) {
                burstConfetti(resultBox);
            }
            lastResultShown = true;
        } else {
            resultBox.classList.add('hidden');
            lastResultShown = false;
        }
    }

    /* =====================================================
       CONFETTI — burst liviano en canvas (sin librerías)
       ===================================================== */
    function burstConfetti(originEl) {
        const rect = originEl.getBoundingClientRect();
        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999';
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        const colors = ['#ffffff', '#002366', '#1a44a0', '#cdd9f0'];
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const particles = [];
        for (let i = 0; i < 60; i++) {
            const angle = (Math.PI * 2 * i) / 60 + (i % 3);
            const speed = 4 + (i % 7);
            particles.push({
                x: cx, y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 4,
                size: 4 + (i % 4),
                color: colors[i % colors.length],
                rot: i, vr: (i % 2 ? 1 : -1) * 0.2,
                life: 1
            });
        }

        const start = performance.now();
        function frame(now) {
            const t = now - start;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.vy += 0.18;          // gravedad
                p.vx *= 0.99;
                p.x += p.vx;
                p.y += p.vy;
                p.rot += p.vr;
                p.life = Math.max(0, 1 - t / 1400);
                ctx.save();
                ctx.globalAlpha = p.life;
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.4);
                ctx.restore();
            });
            if (t < 1400) {
                requestAnimationFrame(frame);
            } else {
                canvas.remove();
            }
        }
        requestAnimationFrame(frame);
    }

    // Número que "cuenta" animadamente hasta el resultado
    function animateNumber(el, target) {
        const duration = 600;
        const start = parseInt(el.innerText) || 0;
        const startTime = performance.now();
        function update(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            el.innerText = Math.round(start + (target - start) * eased);
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }


    /* =====================================================
       VISUALIZADOR DE VASO
       ===================================================== */
    const slider = document.getElementById('milk-slider');
    const liquid = document.getElementById('milk-liquid');
    const feedback = document.getElementById('visualizer-feedback');

    if (liquid) liquid.classList.add('empty'); // arranca vacío

    slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        liquid.style.height = `${val}%`;
        liquid.classList.toggle('empty', val === 0);

        if (val < 25) {
            feedback.innerText = 'Deslizá para servir';
        } else if (val < 50) {
            feedback.innerText = '~5g de Proteína — ideal para el café';
        } else if (val < 90) {
            feedback.innerText = '~10g de Proteína — tu merienda perfecta';
        } else {
            feedback.innerText = '~20g de Proteína — recuperación total';
        }
    });


    /* =====================================================
       RECETAS — EXPANDIR / CERRAR
       ===================================================== */
    const recipeCards = document.querySelectorAll('.recipe-card');

    recipeCards.forEach(card => {
        const viewBtn = card.querySelector('.view-recipe-btn');
        const closeBtn = card.querySelector('.close-recipe');

        if (viewBtn) {
            viewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                recipeCards.forEach(other => {
                    if (other !== card) other.classList.remove('expanded');
                });
                card.classList.add('expanded');
                // Scroll suave a la card en mobile
                setTimeout(() => {
                    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 100);
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                card.classList.remove('expanded');
            });
        }
    });


    /* =====================================================
       FLIP CARDS de beneficios — tocá/click para dar vuelta
       (un tap no interrumpe el scroll: el scroll es un arrastre)
       ===================================================== */
    document.querySelectorAll('.benefit-item').forEach(card => {
        const toggle = () => card.classList.toggle('flipped');
        card.addEventListener('click', toggle);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle();
            }
        });
    });


    /* =====================================================
       PACK 3D — tilt con giroscopio (mobile) y mouse (desktop)
       ===================================================== */
    const pack = document.querySelector('.product-center-img');

    if (pack && !prefersReducedMotion) {
        const MAX = 14; // grados máximos de inclinación
        let tx = 0, ty = 0;

        const applyTilt = (rx, ry) => {
            pack.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
        };

        // Desktop: seguir el mouse sobre la sección de beneficios
        const benefits = document.querySelector('.benefits-section');
        if (benefits && window.matchMedia('(pointer: fine)').matches) {
            benefits.addEventListener('mousemove', (e) => {
                const r = benefits.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width - 0.5;   // -0.5..0.5
                const py = (e.clientY - r.top) / r.height - 0.5;
                applyTilt(-py * MAX, px * MAX);
            });
            benefits.addEventListener('mouseleave', () => applyTilt(0, 0));
        }

        // Mobile: giroscopio
        const handleOrientation = (e) => {
            if (e.gamma == null || e.beta == null) return;
            // gamma: izq/der (-90..90), beta: adelante/atrás (-180..180)
            const ry = Math.max(-MAX, Math.min(MAX, e.gamma / 3));
            const rx = Math.max(-MAX, Math.min(MAX, (e.beta - 45) / 4));
            applyTilt(-rx, ry);
        };

        const enableGyro = () => {
            // iOS 13+ requiere permiso tras gesto del usuario
            if (typeof DeviceOrientationEvent !== 'undefined' &&
                typeof DeviceOrientationEvent.requestPermission === 'function') {
                DeviceOrientationEvent.requestPermission()
                    .then(state => {
                        if (state === 'granted') {
                            window.addEventListener('deviceorientation', handleOrientation);
                        }
                    }).catch(() => {});
            } else if (typeof DeviceOrientationEvent !== 'undefined') {
                window.addEventListener('deviceorientation', handleOrientation);
            }
        };

        // En iOS pedimos permiso en el primer toque; en Android arranca solo
        if (typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            window.addEventListener('touchend', enableGyro, { once: true });
        } else {
            enableGyro();
        }
    }


    /* =====================================================
       ODÓMETRO — el número cuenta al entrar en pantalla
       ===================================================== */
    const odometers = document.querySelectorAll('[data-odometer]');
    if (odometers.length) {
        const odoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const target = parseInt(el.dataset.odometer) || 0;
                    if (!prefersReducedMotion) {
                        animateNumber(el, target);
                    }
                    odoObserver.unobserve(el);
                }
            });
        }, { threshold: 0.6 });
        odometers.forEach(el => {
            if (!prefersReducedMotion) el.innerText = '0';
            odoObserver.observe(el);
        });
    }


    /* =====================================================
       REVEAL DE TEXTO — títulos palabra por palabra
       ===================================================== */
    const titles = document.querySelectorAll('.section-title');
    if (titles.length && !prefersReducedMotion) {
        titles.forEach(title => {
            const words = title.textContent.trim().split(/\s+/);
            title.innerHTML = words
                .map(w => `<span class="word-reveal">${w}</span>`)
                .join(' ');
        });

        const wordObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const spans = entry.target.querySelectorAll('.word-reveal');
                    spans.forEach((s, i) => {
                        s.style.transitionDelay = `${i * 0.08}s`;
                        s.classList.add('is-revealed');
                    });
                    wordObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.4 });

        titles.forEach(t => wordObserver.observe(t));
    }

});
