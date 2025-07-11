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


    const oldLink = document.querySelector('.button--AcmZuL1dIRVNhbEx5R__button_P4rdAT');

    if (oldLink && oldLink.tagName === 'A') {
      const href = oldLink.getAttribute('href');
      const button = document.createElement('button');
    
      // Скопировать классы и контент
      button.className = oldLink.className;
      button.innerHTML = oldLink.innerHTML;
      button.style.maxWidth = "fit-content";
    
      // Перенести href в data-href
      button.setAttribute('data-href', href);
    
      // Заменить <a> на <button>
      oldLink.replaceWith(button);
    
      // Назначить обработчик клика
      button.addEventListener('click', () => {
        const topSlide = document.querySelector('.capsule-slider-top .swiper-slide-active');
        const bottomSlide = document.querySelector('.capsule-slider-bottom .swiper-slide-active');
    
        if (!topSlide || !bottomSlide) {
          console.warn('❌ Один из слайдов не найден');
          return;
        }
    
        const capsuleData = {
          top: {
            id: topSlide.dataset.id,
            img: topSlide.querySelector('img').src
          },
          bottom: {
            id: bottomSlide.dataset.id,
            img: bottomSlide.querySelector('img').src
          }
        };
    
        if (!capsuleData.top.id || !capsuleData.bottom.id) {
          console.warn('❌ Не удалось определить ID товаров');
          return;
        }

        console.log(JSON.stringify(capsuleData)));
    
        localStorage.setItem('capsuleSelection', JSON.stringify(capsuleData));
    
        // Переход на сохранённый href
        // const targetHref = button.getAttribute('data-href');
        // requestAnimationFrame(() => {
        //   setTimeout(() => {
        //     if (targetHref) {
        //       window.location.href = targetHref;
        //     }
        //   }, 100);
        // });
      });
    }
})