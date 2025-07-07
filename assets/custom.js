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

    const meetSlider = document.querySelector('.meet-section-slider');
    if (meetSlider) {
        new Swiper(meetSlider, {
            loop: true,
            centeredSlides: true,
            slidesPerView: 1,
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            breakpoints: {
                320: {
                    slidesPerView: 1.3,
                },
                768: {
                    slidesPerView: 2.3,
                },
                1024: {
                    lidesPerView: 1
                }
            },
            on: {
                slideChange: function () {
                    const activeSlide = this.slides[this.activeIndex];
                    const activeId = activeSlide.getAttribute('id');

                    document.querySelectorAll('.meet-section-gallery-image img').forEach((img) => {
                    if (img.dataset.id === activeId) {
                        img.classList.add('active');
                    } else {
                        img.classList.remove('active');
                    }
                    });
                },
            },
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