document.addEventListener('DOMContentLoaded', () => {

  const storedCapsule = localStorage.getItem('capsuleSelection');

  if (storedCapsule) {
    try {
      const { top, bottom } = JSON.parse(storedCapsule);

      const capsuleList = document.querySelector('.capsule-edit-product-dynamic .capsule-edit-product-list');

      if (capsuleList) {
        [top, bottom].forEach((item, index) => {
          const div = document.createElement('div');
          div.className = 'capsule-edit-product-item';
          div.dataset.id = item.id;
          div.dataset.price = '0'; // можно заменить, если есть доступ
          div.dataset.title = '';
          div.dataset.img = item.img;
          div.style.gridColumn = '4 / span 2';
          div.style.gridRow = `${1 + index * 3} / span 2`;

          div.innerHTML = `
            <img src="${item.img}" alt="" loading="lazy">
            <span class="capsule-edit-product-item-hotspot"><span></span></span>
          `;
          capsuleList.appendChild(div);
        });

        document.querySelector('.capsule-first-step-body')?.classList.add('hidden');
        document.querySelector('.capsule-edit-wrapper')?.classList.add('active');

        document.querySelectorAll('.capsule-step').forEach((step, i) =>
          step.classList.toggle('active', i === 1)
        );
      }

      // Удаляем, чтобы не повторно использовать
      // localStorage.removeItem('capsuleSelection');
    } catch (err) {
      console.error('Invalid capsuleSelection data', err);
    }
  }
  
  let activeEditProductItem = null;

  const layoutSelector = document.querySelector('.capsule-layout-selector');

  if (layoutSelector) {
    const sliderBtn = layoutSelector.querySelector('.capsule-layout-slider');
    const gridBtn = layoutSelector.querySelector('.capsule-layout-grid');

    const sliderWrapper = document.querySelector('.capsule-slider-wrapper');
    const gridWrapper = document.querySelector('.capsule-grid-wrapper');

    sliderBtn?.addEventListener('click', () => {
      sliderBtn.classList.add('active');
      gridBtn.classList.remove('active');

      sliderWrapper?.classList.add('active');
      gridWrapper?.classList.remove('active');
    });

    gridBtn?.addEventListener('click', () => {
      gridBtn.classList.add('active');
      sliderBtn.classList.remove('active');

      gridWrapper?.classList.add('active');
      sliderWrapper?.classList.remove('active');
    });
  }

  const filtersToggle = document.querySelector('.capsule-facets-toggle');
  const filtersBody = document.querySelector('.facets__filters-wrapper');
  if (filtersToggle && filtersBody) {
    filtersToggle.addEventListener('click', () => {
      filtersBody.classList.toggle('active');
    });
  }

  function recalculateTotalPrice() {
    let total = 0;

    document.querySelectorAll('.capsule-edit-product-item').forEach(item => {
      const price = parseFloat((item.dataset.price || '0').replace(/,/g, ''));
      total += price;
    });

    const priceElement = document.querySelector('.capsule-edit-price');
    if (priceElement) {
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        useGrouping: true,
        minimumFractionDigits: 0
      }).format(total);
      priceElement.textContent = `${formatted} AED`;
    }
  }

  document.addEventListener('click', (e) => {

    const filtersToggle = document.querySelector('.capsule-facets-toggle');
    const filtersBody = document.querySelector('.facets__filters-wrapper');

    if (!filtersBody || !filtersToggle) return;

    const isClickInside = filtersBody.contains(e.target) || filtersToggle.contains(e.target);

    if (!isClickInside && filtersBody.classList.contains('active')) {
      filtersBody.classList.remove('active');
    }

    const hideHotspotBtn = e.target.closest('.capsule-edit-hide-hotspot');
    if (hideHotspotBtn) {
      const parentCapsule = hideHotspotBtn.closest('.capsule-edit-product');
      if (!parentCapsule) return;

      const isHidden = parentCapsule.classList.toggle('hide-hotspots');

      // Зміна тексту
      hideHotspotBtn.textContent = isHidden ? 'Show hotspots' : 'Hide hotspots';
    }

    const editBtn = e.target.closest('.capsule-edit-button');
    if (editBtn) {
      const productGridItem = editBtn.closest('.product-grid__item');
      const capsuleHandle = productGridItem?.dataset.capsule;
      const capsuleEditProducts = document.querySelectorAll('.capsule-edit-product');

      capsuleEditProducts.forEach(block => {
        block.classList.remove('active');
      });

      const activeBlock = document.querySelector(`.capsule-edit-product[data-capsule="${capsuleHandle}"]`);
      if (activeBlock) {
        activeBlock.classList.add('active');

        let total = 0;
        const items = activeBlock.querySelectorAll('.capsule-edit-product-item');
        items.forEach(item => {
          total += parseFloat((item.dataset.price || '0').replace(/,/g, ''));
        });

        const priceEl = document.querySelector('.capsule-edit-price');
        if (priceEl) {
          const formatted = new Intl.NumberFormat('en-US', {
            style: 'decimal',
            useGrouping: true,
            minimumFractionDigits: 0
          }).format(total);
          priceEl.textContent = `${formatted} AED`;
        }
      }

      document.querySelector('.capsule-edit-wrapper')?.classList.add('active');
      document.querySelector('.capsule-first-step-body')?.classList.add('hidden');

      document.querySelectorAll('.capsule-step').forEach((step, i) => {
        step.classList.toggle('active', i === 1);
      });

      return;
    }

    const replaceBtn = e.target.closest('.capsule-product-card-replace-btn');
    if (replaceBtn && activeEditProductItem) {
      const card = replaceBtn.closest('.capsule-product-card');
      const newId = card.dataset.id;
      const newImg = card.querySelector('img');

      activeEditProductItem.dataset.id = newId;
      activeEditProductItem.dataset.price = (card.dataset.price || '0').replace(/,/g, '');
      activeEditProductItem.dataset.title = card.dataset.title;
      activeEditProductItem.dataset.img = newImg.src;

      const img = activeEditProductItem.querySelector('img');
      if (img && newImg) {
        img.src = newImg.src;
        img.alt = newImg.alt;
      }

      activeEditProductItem = null;
      document.querySelector('.capsule-edit-right-selector')?.classList.add('hidden');
      document.querySelector('.capsule-edit-empty')?.classList.remove('hidden');

      recalculateTotalPrice();
    }

    const deleteBtn = e.target.closest('.capsule-product-card-delete-btn');
    if (deleteBtn && activeEditProductItem) {
      activeEditProductItem.remove();
      activeEditProductItem = null;
      document.querySelector('.capsule-edit-right-selector')?.classList.add('hidden');
      document.querySelector('.capsule-edit-empty')?.classList.remove('hidden');
      recalculateTotalPrice();
    }

    const item = e.target.closest('.capsule-edit-product-item');
    if (item) {
      activeEditProductItem = item;
      const heading = document.querySelector('.capsule-edit-right-heading');
      const grid = document.querySelector('.capsule-edit-grid');
      const allCards = document.querySelectorAll('.capsule-edit-grid .capsule-product-card');

      const collectionName = item.dataset.collection;
      const activeId = item.dataset.id;

      heading.textContent = collectionName || 'Collection';

      allCards.forEach(card => {
        if (card.dataset.collection === collectionName) {
          const replaceBtn = card.querySelector('.capsule-product-card-replace-btn');
          const deleteBtn = card.querySelector('.capsule-product-card-delete-btn');

          if (card.dataset.id === activeId) {
            if (replaceBtn) {
              replaceBtn.classList.add('hidden');
            }
            if (deleteBtn) {
              deleteBtn.classList.remove('hidden');
            }
          } else {
            if (replaceBtn) {
              replaceBtn.classList.remove('hidden');
            }
            if (deleteBtn) {
              deleteBtn.classList.add('hidden');
            }
          }

          card.classList.add('active');
        } else {
          card.classList.remove('active');
        }
        
      });

      document.querySelector('.capsule-edit-empty')?.classList.add('hidden');
      document.querySelector('.capsule-edit-right-selector')?.classList.remove('hidden');
      document.querySelector('.capsule-edit-finalize')?.classList.add('hidden');
      document.querySelector('.capsule-review-button')?.classList.remove('hidden');
      document.querySelector('.capsule-form')?.classList.add('hidden');

      document.querySelectorAll('.capsule-step').forEach((step, i) => {
        step.classList.toggle('active', i === 1);
      });
    }

    const reviewBtn = e.target.closest('.capsule-review-button');
    if (reviewBtn) {
      const items = document.querySelectorAll('.capsule-edit-product-item');
      const form = document.querySelector('.capsule-form');
      const finalizeGrid = document.querySelector('.capsule-edit-finalize-grid');
      let inputs = form?.querySelectorAll('input');
      if (inputs) {
        inputs.forEach(input => input.remove());
      }

      items.forEach((item, index) => {
        const id = item.dataset.id;
        const title = item.dataset.title;
        const img = item.dataset.img;
        const price = item.dataset.price;
        const options = JSON.parse(item.dataset.options || '[]');

        const inputId = document.createElement('input');
        inputId.type = 'hidden';
        inputId.name = `items[${index}][id]`;
        inputId.value = id;

        const inputQty = document.createElement('input');
        inputQty.type = 'hidden';
        inputQty.name = `items[${index}][quantity]`;
        inputQty.value = '1';

        form.appendChild(inputId);
        form.appendChild(inputQty);

        // Скрыть правую панель и подсказку
        document.querySelector('.capsule-edit-empty')?.classList.add('hidden');
        document.querySelector('.capsule-edit-right-selector')?.classList.add('hidden');

        // Подсветить карточки, которые присутствуют в capsule-edit-product-list
        const selectedIds = Array.from(document.querySelectorAll('.capsule-edit-product-item'))
          .map(item => item.dataset.id);

        document.querySelectorAll('.capsule-edit-finalize-grid .capsule-product-card').forEach(card => {
          const cardId = card.dataset.id;
          if (selectedIds.includes(cardId)) {
            card.classList.add('active');
          } else {
            card.classList.remove('active');
          }
        });
      });

      document.querySelectorAll('.capsule-step').forEach((s, i) =>
        s.classList.toggle('active', i === 2)
      );
      document.querySelector('.capsule-first-step-body')?.classList.add('hidden');
      document.querySelector('.capsule-edit-finalize')?.classList.remove('hidden');
      document.querySelector('.capsule-form')?.classList.remove('hidden');
      document.querySelector('.capsule-review-button')?.classList.add('hidden');
    }
  });

  document.addEventListener('change', (e) => {
    const select = e.target.closest('.capsule-product-card-options select');
    if (!select) return;

    const card = select.closest('.capsule-product-card');
    const allSelects = card.querySelectorAll('select');

    // Получаем все выбранные значения по порядку
    const selectedOptions = Array.from(allSelects).map(sel => sel.value);

    if (selectedOptions.includes('Select')) return; // не все выбраны

    // Получаем все варианты
    const variantsJson = card.dataset.variants;
    let variants = [];
    try {
      variants = JSON.parse(variantsJson);
    } catch (e) {
      console.warn('Invalid variant data', e);
      return;
    }

    // Сравниваем с вариантом
    const matched = variants.find(v => {
      return v.options.every((opt, idx) => opt === selectedOptions[idx]);
    });

    if (matched) {
      const newId = matched.id;

      // Обновляем data-id карточки
      const oldId = card.dataset.id;

      // Присваиваем новый id карточке
      card.dataset.id = newId;

      // Обновляем hidden input в форме
      const input = document.querySelector(`.capsule-form input[name*="[id]"][value="${oldId}"]`);
      if (input) {
        input.value = newId;
      }
    }
  });

  const capsuleSlider = document.querySelector('.capsule-slider');
  if (capsuleSlider) {
    new Swiper(capsuleSlider, {
      loop: true,
      centeredSlides: true,
      slidesPerView: 1,
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      }
    });
  }
});
