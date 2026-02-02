document.addEventListener('DOMContentLoaded', () => {

    /* --- HERO VIDEO (Play Once) --- */
    const heroVideo = document.getElementById('hero-video');
    if (heroVideo) {
        // Asegurarse de que no se repita
        heroVideo.loop = false;

        // Cuando el video termine, quedarse en el último frame
        heroVideo.addEventListener('ended', () => {
            heroVideo.pause();
            // El video se queda mostrando el último frame
        });
    }

    /* --- CALCULATOR MODULE --- */
    const weightInput = document.getElementById('weight');
    const activityBtns = document.querySelectorAll('.activity-btn');
    const resultBox = document.getElementById('calc-result');
    const proteinGrams = document.getElementById('protein-grams');
    let activityMultiplier = 2.2; // Default to active

    // Handle activity selection
    activityBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            activityBtns.forEach(b => b.classList.remove('active'));
            // Add active to click
            btn.classList.add('active');
            // Update value
            activityMultiplier = parseFloat(btn.dataset.value);
            // Trigger calc if weight exists
            if (weightInput.value) calculateProtein();
        });
    });

    // Handle input change
    weightInput.addEventListener('input', calculateProtein);

    function calculateProtein() {
        const weight = parseFloat(weightInput.value);
        if (weight > 0) {
            const grams = Math.round(weight * activityMultiplier);
            proteinGrams.innerText = grams;
            resultBox.classList.remove('hidden');
        } else {
            resultBox.classList.add('hidden');
        }
    }


    /* --- VISUALIZER MODULE --- */
    const slider = document.getElementById('milk-slider');
    const liquid = document.getElementById('milk-liquid');
    const feedback = document.getElementById('visualizer-feedback');

    slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        liquid.style.height = `${val}%`;

        // Update Text
        if (val < 25) {
            feedback.innerText = "Deslizá para servir";
        } else if (val >= 25 && val < 50) {
            feedback.innerText = "5g de Proteína (Ideal para cortar el café)";
        } else if (val >= 50 && val < 90) {
            feedback.innerText = "10g de Proteína (Tu merienda perfecta)";
        } else if (val >= 90) {
            feedback.innerText = "20g de Proteína (Recuperación total)";
        }
    });


    /* --- RECIPE CARDS INTERACTIVITY --- */
    const recipeCards = document.querySelectorAll('.recipe-card');

    recipeCards.forEach(card => {
        const viewBtn = card.querySelector('.view-recipe-btn');
        const closeBtn = card.querySelector('.close-recipe');

        // Funcionalidad para abrir
        if (viewBtn) {
            viewBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Evitar triggers dobles si hubiese otros listeners
                console.log('Abriendo receta:', card.dataset.recipe);

                // Opcional: Cerrar otras recetas antes de abrir esta
                recipeCards.forEach(otherCard => {
                    if (otherCard !== card) otherCard.classList.remove('expanded');
                });

                card.classList.add('expanded');
            });
        }

        // Funcionalidad para cerrar
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                card.classList.remove('expanded');
            });
        }
    });

});
