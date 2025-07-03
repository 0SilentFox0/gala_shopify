document.addEventListener('DOMContentLoaded', () => {
    const capsuleSliderTop = document.querySelector('.capsule-slider-top ');
    if (capsuleSliderTop) {
        new Swiper(capsuleSliderTop, {
            loop: true,
            centeredSlides: true,
            slidesPerView: 1,
            navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
            }
        });
    }

    const capsuleSliderBottom = document.querySelector('.capsule-slider-bottom ');
    if (capsuleSliderBottom) {
        new Swiper(capsuleSliderBottom, {
            loop: true,
            centeredSlides: true,
            slidesPerView: 1,
            navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
            }
        });
    }


   document.querySelectorAll('.button--AcmZuL1dIRVNhbEx5R__button_P4rdAT').forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault();

        const topSlide = document.querySelector('.capsule-slider-top .swiper-slide-active');
        const bottomSlide = document.querySelector('.capsule-slider-bottom .swiper-slide-active');

        if (!topSlide || !bottomSlide) return;

        const topId = topSlide.dataset.id;
        const bottomId = bottomSlide.dataset.id;

        if (!topId || !bottomId) return;

        try {
        localStorage.setItem('capsuleQuickStart', JSON.stringify({ topId, bottomId }));
        } catch (err) {
        console.error('⚠️ Ошибка записи в localStorage:', err);
        }

        // Выполняем переход принудительно, уже точно после записи
        setTimeout(() => {
        location.assign(button.href); // не window.location.href — безопаснее
        }, 200);
    });
    });
})