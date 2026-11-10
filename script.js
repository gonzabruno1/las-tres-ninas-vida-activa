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
       FLECHA DEL HERO — se oculta al primer scroll
       ===================================================== */
    const scrollCue = document.getElementById('hero-scroll-cue');
    if (scrollCue) {
        window.addEventListener('scroll', () => {
            scrollCue.classList.toggle('hidden', window.scrollY > 60);
        }, { passive: true });
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
        '.fade-in-up',
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
    const proteinShare = document.getElementById('protein-share');
    const PROTEIN_PER_SERVING = 11; // g por vaso (200 ml) o por cajita
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
            animateNumber(proteinShare, Math.round(PROTEIN_PER_SERVING / grams * 100));
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
    document.querySelectorAll('.benefit-item, .product-flip').forEach(card => {
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


    /* =====================================================
       PRODUCTOS DE LA LÍNEA — datos compartidos por el
       carrusel y el selector de beneficios
       ===================================================== */
    const PRODUCTS = {
        'leche': {
            img: 'assets/pack-leche-1l.webp',
            alt: 'Vida Activa Leche con Proteína 1L',
            protein: 54,
            stat: '<strong>54g</strong> de proteína por litro',
            note: '54g por litro. Mantenimiento muscular y saciedad.',
            small: false
        },
        'chocolate-1l': {
            img: 'assets/pack-chocolate-1l.webp',
            alt: 'Vida Activa Batido con Proteína Chocolate 1L',
            protein: 54,
            stat: '<strong>54g</strong> de proteína por litro',
            note: '54g por litro, 11g por porción. Mantenimiento muscular y saciedad.',
            small: false
        },
        'chocolate-200': {
            img: 'assets/pack-chocolate-200.webp',
            alt: 'Vida Activa Batido con Proteína Chocolate 200 ml',
            protein: 11,
            stat: '<strong>11g</strong> de proteína por cajita',
            note: '11g por cajita. Mantenimiento muscular y saciedad.',
            small: true
        },
        'latte': {
            img: 'assets/pack-latte-200.webp',
            alt: 'Vida Activa Latte con Proteína sabor Vainilla 200 ml',
            protein: 11,
            stat: '<strong>11g</strong> de proteína por cajita',
            note: '11g por cajita. Mantenimiento muscular y saciedad.',
            small: true
        }
    };


    /* =====================================================
       CARRUSEL DE PRODUCTOS — la card centrada se "activa"
       (sube el pack, aparece el splash, flotan gotas/granos)
       ===================================================== */
    const productsSection = document.getElementById('productos');
    const track = document.getElementById('products-track');
    const productCards = Array.from(document.querySelectorAll('.product-card'));
    const dots = Array.from(document.querySelectorAll('.products-dot'));

    if (productsSection && track) {
        // Los efectos arrancan recién cuando la sección entra en pantalla
        const sectionObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                productsSection.classList.add('in-view');
                sectionObserver.disconnect();
            }
        }, { threshold: 0.25 });
        sectionObserver.observe(productsSection);

        // Card activa: la que ocupa la mayor parte del carrusel
        const cardObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                entry.target.classList.toggle('is-active', entry.intersectionRatio >= 0.6);
            });
            const activeIndex = productCards.findIndex(c => c.classList.contains('is-active'));
            if (activeIndex >= 0) {
                dots.forEach((d, i) => d.classList.toggle('active', i === activeIndex));
            }
        }, { root: track, threshold: [0, 0.6, 1] });
        productCards.forEach(card => cardObserver.observe(card));

        // Tocar el pack: saltito
        productCards.forEach(card => {
            const stage = card.querySelector('.product-stage');
            const img = card.querySelector('.product-card-pack');
            stage.addEventListener('click', () => {
                if (prefersReducedMotion) return;
                img.classList.remove('is-poked');
                void img.offsetWidth; // reinicia la animación
                img.classList.add('is-poked');
            });
            img.addEventListener('animationend', () => img.classList.remove('is-poked'));
        });

        // Batido de chocolate: cambio de formato 1L / 200 ml
        document.querySelectorAll('.format-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const card = btn.closest('.product-card');
                const product = PRODUCTS[btn.dataset.format];
                const img = card.querySelector('.product-card-pack');
                card.querySelectorAll('.format-btn').forEach(b => b.classList.toggle('active', b === btn));
                card.querySelector('.product-card-stat').innerHTML = product.stat;
                card.querySelector('.product-card-cta').dataset.goto = btn.dataset.format;

                img.classList.add('is-swapping');
                setTimeout(() => {
                    img.src = product.img;
                    img.alt = product.alt;
                    img.classList.toggle('is-small', product.small);
                    img.classList.remove('is-swapping');
                }, 250);
            });
        });

        // "Ver beneficios": elige ese producto en la sección de beneficios
        document.querySelectorAll('.product-card-cta').forEach(btn => {
            btn.addEventListener('click', () => {
                selectProduct(btn.dataset.goto);
                document.getElementById('beneficios').scrollIntoView({ behavior: 'smooth' });
            });
        });
    }


    /* =====================================================
       BENEFICIOS — selector de producto (cambia el pack,
       los gramos de proteína y la tabla nutricional)
       ===================================================== */
    const pickerBtns = document.querySelectorAll('.picker-btn');
    const productFlip = document.getElementById('product-flip');
    const benefitsPack = document.getElementById('benefits-pack');
    const proteinValue = document.getElementById('benefit-protein');
    const proteinNote = document.getElementById('benefit-protein-note');

    function selectProduct(key) {
        const product = PRODUCTS[key];
        if (!product) return;

        pickerBtns.forEach(b => {
            const active = b.dataset.product === key;
            b.classList.toggle('active', active);
            b.setAttribute('aria-selected', active);
            // En celular la fila de botones scrollea: centrar el elegido
            if (active) {
                const picker = b.parentElement;
                picker.scrollTo({ left: b.offsetLeft - (picker.clientWidth - b.offsetWidth) / 2, behavior: 'smooth' });
            }
        });

        // Pack: se desvanece, cambia y vuelve (y se muestra de frente)
        productFlip.classList.remove('flipped');
        productFlip.classList.add('is-swapping');
        setTimeout(() => {
            benefitsPack.src = product.img;
            benefitsPack.alt = product.alt;
            productFlip.classList.toggle('is-small', product.small);
            productFlip.classList.remove('is-swapping');
        }, 250);

        // Tabla nutricional del producto, o aviso si todavía no está cargada
        const tables = productFlip.querySelectorAll('.nutrition[data-nutrition]');
        let found = false;
        tables.forEach(t => {
            const match = t.dataset.nutrition === key;
            t.hidden = !match;
            if (match) found = true;
        });
        productFlip.querySelector('.nutrition-pending').hidden = found;

        // Gramos de proteína
        proteinValue.dataset.odometer = product.protein;
        if (prefersReducedMotion) {
            proteinValue.innerText = product.protein;
        } else {
            animateNumber(proteinValue, product.protein);
        }
        proteinNote.textContent = product.note;
    }

    pickerBtns.forEach(btn => {
        btn.addEventListener('click', () => selectProduct(btn.dataset.product));
    });

});
