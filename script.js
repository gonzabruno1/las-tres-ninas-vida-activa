document.addEventListener('DOMContentLoaded', () => {

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

    function calculateProtein() {
        const weight = parseFloat(weightInput.value);
        if (weight > 0) {
            const grams = Math.round(weight * activityMultiplier);
            animateNumber(proteinGrams, grams);
            resultBox.classList.remove('hidden');
        } else {
            resultBox.classList.add('hidden');
        }
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

    slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        liquid.style.height = `${val}%`;

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

});
