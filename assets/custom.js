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


    document.querySelector('.button--AN2IvRzQ4YSt1K2UyM__button_P4rdAT')?.addEventListener('click', (e) => {
        e.preventDefault();
        const topSlide = document.querySelector('.capsule-slider-top .swiper-slide-active img');
        const bottomSlide = document.querySelector('.capsule-slider-bottom .swiper-slide-active img');

        if (!topSlide || !bottomSlide) return;

        const capsuleData = {
            top: {
            id: topSlide.closest('[data-product-id]')?.dataset.productId,
            img: topSlide.src
            },
            bottom: {
            id: bottomSlide.closest('[data-product-id]')?.dataset.productId,
            img: bottomSlide.src
            }
        };

        localStorage.setItem('capsuleSelection', JSON.stringify(capsuleData));
        requestAnimationFrame(() => {
          setTimeout(() => {
            location.assign(document.querySelector('.button--AN2IvRzQ4YSt1K2UyM__button_P4rdAT').href);
          }, 100); // даже 100ms хватит
        });
    });
})