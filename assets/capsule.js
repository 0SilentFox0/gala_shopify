// === Shopify config ===
const SHOP_DOMAIN = 'galadubai.myshopify.com';
const ACCESS_TOKEN = 'b26ae7ded431d669293adf3d21a66b68';

let activeEditProductItem = null;

function showRightLoader() {
  // Удалить старый, если он остался
  hideRightLoader();

  const loader = document.createElement('div');
  loader.className = 'capsule-edit-loader';

  loader.innerHTML = `
    <div class="spinner"></div>
  `;

  // Стилизация (можно убрать, если уже в CSS)
  loader.style.position = 'absolute';
  loader.style.top = '50%';
  loader.style.left = '50%';
  loader.style.transform = 'translate(-50%, -50%)';
  loader.style.zIndex = '1000';
  loader.style.pointerEvents = 'none';

  // Spinner style — можешь заменить на свой
  const style = document.createElement('style');
  style.textContent = `
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(0,0,0,0.1);
      border-top-color: #000;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  const container = document.querySelector('.capsule-edit-right');
  if (container) container.appendChild(loader);
}

function hideRightLoader() {
  const loader = document.querySelector('.capsule-edit-loader');
  if (loader) loader.remove();
}

function recalculateTotalPrice() {
  const items = document.querySelectorAll('.capsule-edit-product-item');
  let total = 0;

  const promises = [...items].map(async (item) => {
    const productId = item.dataset.id;
    if (!productId) return;

    const data = await getProductByIdApp(productId);
    const price = parseFloat(data?.product?.variants?.[0]?.price || 0);
    total += price;
  });

  Promise.all(promises).then(() => {
    const priceElement = document.querySelector('.capsule-edit-price');
    if (priceElement) {
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        useGrouping: true,
        minimumFractionDigits: 0
      }).format(total);

      priceElement.textContent = `${formatted} AED`;
    }
  });
}

async function updateCapsuleTotal() {
  const items = document.querySelectorAll('.capsule-edit-product-item');
  let total = 0;

  for (const item of items) {
    const id = item.dataset.id;
    if (!id) continue;

    const data = await getProductByIdApp(id);
    const price = parseFloat(data?.product?.variants?.[0]?.price || 0);
    total += price;
  }

  const priceElement = document.querySelector('.capsule-edit-price');
  if (priceElement) {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'decimal',
      useGrouping: true,
      minimumFractionDigits: 0
    }).format(total);

    priceElement.innerText = `${formatted} AED`;
  }
}

// === Metafields ===
async function getProductMetafields(productId) {
  const response = await fetch(`/admin/api/2023-10/products/${productId}/metafields.json`, {
    headers: {
      'X-Shopify-Access-Token': ACCESS_TOKEN,
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
}

// === Product (REST) ===
async function getProductByIdApp(productId) {
  const response = await fetch(`/admin/api/2023-10/products/${productId}.json`, {
    headers: {
      'X-Shopify-Access-Token': ACCESS_TOKEN,
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
}

// === Metaobject (GraphQL) ===
async function getMetaobjectByGID(gid) {
  const response = await fetch('/admin/api/2023-10/graphql.json', {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        query {
          metaobject(id: "${gid}") {
            id
            type
            fields {
              key
              value
            }
          }
        }
      `
    })
  });

  const json = await response.json();
  return json.data?.metaobject;
}

async function getCollectionsByProductId(productId, targetLevel = null) {
  const gid = `gid://shopify/Product/${productId}`;

  const query = `
    {
      product(id: "${gid}") {
        collections(first: 10) {
          edges {
            node {
              id
              title
              metafield(namespace: "custom", key: "level") {
                value
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch('/admin/api/2023-10/graphql.json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': ACCESS_TOKEN,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    console.error('❌ Error response:', await response.text());
    return [];
  }

  const json = await response.json();

  const edges = json?.data?.product?.collections?.edges || [];

  const collections = edges.map(edge => {
    const node = edge.node;
    return {
      id: node.id,
      title: node.title,
      level: node.metafield?.value || null,
    };
  });

  // 🔍 Якщо передано filter level, то фільтруємо
  const filtered = targetLevel
    ? collections.filter(col => col.level === targetLevel)
    : collections;

  return filtered;
}

async function getCollectionProductsREST(collectionId) {
  const response = await fetch(`/admin/api/2023-10/collections/${collectionId}/products.json`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': ACCESS_TOKEN,
    },
  });

  if (!response.ok) {
    console.error('REST fallback error:', await response.text());
    return [];
  }

  const json = await response.json();
  const basicProducts = json.products;

  // ⚠️ Получаем полные данные по каждому продукту
  const detailedProducts = await Promise.all(
    basicProducts.map(async (p) => {
      const productData = await getProductByIdApp(p.id); // <== используешь уже готовую функцию
      return productData.product;
    })
  );

  return detailedProducts;
}

function renderProductCard(product, currentProductId) {
  const div = document.createElement('div');
  div.className = 'capsule-product-card';
  const variantId = product.variants?.[0]?.id;
  div.dataset.id = variantId;

  const isCurrent = String(product.id) === String(currentProductId);

  if (isCurrent) {
    div.classList.add('current-product');
  }

  const image = product.image?.src || '';
  const title = product.title || '';
  const price = product.variants?.[0]?.price || '0';

  div.innerHTML = `
    <div class="capsule-product-card-inner">
    <div class="capsule-product-card-img">
      <img src="${image}" alt="${title}" loading="lazy">
    </div>
    <div class="capsule-product-card-content">
      <h4 class="capsule-product-card-title">${title}</h4>
      <p class="capsule-product-card-desc">Lorem ipsum dolor sit amet, consectetur</p>
      <p class="capsule-product-card-price">${parseFloat(price).toFixed(0)} AED</p>
    </div>
    </div>
    <button class="${isCurrent ? 'capsule-product-card-delete-btn' : 'capsule-product-card-replace-btn'}">
      ${isCurrent ? 'Delete item' : 'Replace item'}
    </button>
  `;

  return div;

}

// === Швидке рендерення з Skeleton та кешем ===
async function renderCapsuleProducts(capsuleProductObjects) {
  const container = document.querySelector('.capsule-edit-product');
  const list = document.querySelector('.capsule-edit-product-list');
  const priceElement = document.querySelector('.capsule-edit-price');
  if (!container) return;

  list.innerHTML = '';
  const skeletonCount = capsuleProductObjects.length;
  for (let i = 0; i < skeletonCount; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'capsule-edit-product-item skeleton';
    list.appendChild(skeleton);
  }

  const productMap = new Map();
  const productIdSet = new Set();
  const capsuleWithProductIds = capsuleProductObjects.map(meta => {
    const fieldMap = new Map(meta.fields.map(f => [f.key, f.value]));
    const productGID = fieldMap.get('product');
    const productId = productGID?.split('/').pop();
    if (productId) productIdSet.add(productId);
    return { meta, fieldMap, productId };
  });

  await Promise.all([...productIdSet].map(async id => {
    const data = await getProductByIdApp(id);
    if (data?.product) productMap.set(id, data.product);
  }));

  list.innerHTML = '';
  let total = 0;

  for (const { fieldMap, productId } of capsuleWithProductIds) {
    const product = productMap.get(productId);
    if (!product) continue;

    const price = parseFloat(product.variants?.[0]?.price || 0);
    total += price;

    const colStart = Number(fieldMap.get('horizontal_position') || 1);
    const colSpan = Number(fieldMap.get('horizontal_size') || 1);
    const rowStart = Number(fieldMap.get('vertical_position') || 1);
    const rowSpan = Number(fieldMap.get('vertical_size') || 1);

    const item = document.createElement('div');
    item.classList.add('capsule-edit-product-item');
    item.style.gridColumn = `${colStart} / span ${colSpan}`;
    item.style.gridRow = `${rowStart} / span ${rowSpan}`;
    item.dataset.id = productId;

    const img = document.createElement('img');
    img.src = product.image?.src || '';
    img.alt = product.title || '';
    img.loading = 'lazy';

    const hotspot = document.createElement('span');
    hotspot.classList.add('capsule-edit-product-item-hotspot');

    const hotspotSpan = document.createElement('span');

    hotspot.appendChild(hotspotSpan);

    item.appendChild(img);
    item.appendChild(hotspot);
    list.appendChild(item);
  }

  if (priceElement) {
    const formatted = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        useGrouping: true,
        minimumFractionDigits: 0
    }).format(total);

    priceElement.innerText = `${formatted} AED`;
  }
}

function renderFinalizeProduct(product, index) {
  const div = document.createElement('div');
  div.className = 'capsule-product-card';
  const variantId = product.variants?.[0]?.id;
  div.dataset.id = variantId;

  const variants = product.variants || [];
  const image = product.image?.src || '';
  const title = product.title || '';
  const price = variants[0]?.price || '0';

  // Умова: чи є опції для селектора
  const hasOptions = Array.isArray(product.options) && product.options.length > 0;
  const hasVariants = Array.isArray(variants) && variants.length > 1;

  let optionsMarkup = '';
  if (hasOptions && hasVariants) {
    optionsMarkup = product.options.map(option => {
      const name = option.name;
      const values = option.values;
      return `
        <select name="option-${name.toLowerCase()}" data-product-id="${product.id}" data-index="${index}">
          ${values.map(v => `<option value="${v}">${v}</option>`).join('')}
        </select>
      `;
    }).join('');
  }

  div.innerHTML = `
    <div class="capsule-product-card-inner">
    <div class="capsule-product-card-img">
      <img src="${image}" alt="${title}" loading="lazy">
    </div>
    <div class="capsule-product-card-content">
      <h4 class="capsule-product-card-title">${title}</h4>
      <p class="capsule-product-card-desc">Lorem ipsum dolor sit amet, consectetur</p>
      <p class="capsule-product-card-price">${parseFloat(price).toFixed(0)} AED</p>
    </div>
    </div>
    ${optionsMarkup ? `<div class="capsule-product-card-options">${optionsMarkup}</div>` : ''}
  `;

  return div;
}

async function renderFinalizeProducts(products, container) {
  container.innerHTML = '';

  for (let [index, product] of products.entries()) {
    if (!product) continue;
    const card = renderFinalizeProduct(product, index);
    container.appendChild(card);
  }
}

// === Обробка кліку "Edit the outfit" ===
function handleCapsuleEditClick() {
  document.addEventListener('click', async (e) => {
    // === "Edit the outfit"
    if (
      e.target.classList.contains('capsule-edit-button') ||
      e.target.classList.contains('capsule-add-full-button')
    ) {
      const button = e.target;
      const productId = button.getAttribute('data-id');
      if (!productId) return;

      try {
        button.disabled = true;
        button.textContent = 'Loading...';

        const metafieldsObject = await getProductMetafields(productId);
        const metafield = metafieldsObject.metafields.find(m => m.key === 'capsule');
        if (!metafield?.value) return;

        const capsuleMeta = await getMetaobjectByGID(metafield.value);
        const capsuleListField = capsuleMeta.fields.find(f => f.key === 'capsule_products');
        const capsuleProductGIDs = JSON.parse(capsuleListField?.value || '[]');

        const capsuleProductObjects = (
          await Promise.all(capsuleProductGIDs.map(gid => getMetaobjectByGID(gid)))
        ).filter(Boolean);

        await renderCapsuleProducts(capsuleProductObjects);

        const isFull = e.target.classList.contains('capsule-add-full-button');

        if (isFull) {
          // Переходимо одразу на крок 3
          document.querySelectorAll('.capsule-step').forEach((step, i) =>
            step.classList.toggle('active', i === 2)
          );

          document.querySelector('.capsule-edit-wrapper')?.classList.add('active');
          document.querySelector('.capsule-first-step-body')?.classList.add('hidden');
          document.querySelector('.capsule-edit-empty')?.classList.add('hidden');
          document.querySelector('.capsule-edit-right-selector')?.classList.add('hidden');
          document.querySelector('.capsule-review-button')?.classList.add('hidden');
          document.querySelector('.capsule-form')?.classList.remove('hidden');
          document.querySelector('.capsule-edit-finalize')?.classList.remove('hidden');

          const itemEls = document.querySelectorAll('.capsule-edit-product-item');
          const form = document.querySelector('.capsule-form');
          const finalizeGrid = document.querySelector('.capsule-edit-finalize-grid');
          finalizeGrid.innerHTML = '';

          if (form) {
            form.querySelectorAll('input[name^="items["]').forEach(i => i.remove());
            await Promise.all([...itemEls].map(async (el, index) => {
              const productId = el.dataset.id;
              if (!productId) return;

              const data = await getProductByIdApp(productId);
              const variantId = data?.product?.variants?.[0]?.id;
              if (!variantId) return;

              const productIdInput = document.createElement('input');
              productIdInput.type = 'hidden';
              productIdInput.name = `items[${index}][id]`;
              productIdInput.value = variantId;

              const quantityInput = document.createElement('input');
              quantityInput.type = 'hidden';
              quantityInput.name = `items[${index}][quantity]`;
              quantityInput.value = '1';
              quantityInput.id = variantId;

              form.appendChild(productIdInput);
              form.appendChild(quantityInput);
            }));
          }

          const productIds = [...itemEls].map(el => el.dataset.id).filter(Boolean);
          const uniqueIds = [...new Set(productIds)];

          const products = await Promise.all(
            uniqueIds.map(async id => {
              const data = await getProductByIdApp(id);
              return data?.product;
            })
          );

          products.forEach((product, index) => {
            if (!product) return;
            finalizeGrid.appendChild(renderFinalizeProduct(product, index));
          });

          return; // обов’язково!
        }

        document.querySelector('.capsule-edit-wrapper')?.classList.add('active');
        document.querySelectorAll('.capsule-step').forEach((step, i) =>
          step.classList.toggle('active', i === 1)
        );
        document.querySelector('.capsule-first-step-body')?.classList.add('hidden');
      } catch (err) {
        console.error('❌ Помилка при завантаженні капсули:', err);
        alert('Помилка при завантаженні капсули');
      } finally {
        button.disabled = false;
        button.textContent = 'Edit the outfit';
      }

      return; // <<< важливо: перервати, щоб далі не перевіряти інші кліки
    }

    // === Обробка кліка на capsule-edit-product-item
    const item = e.target.closest('.capsule-edit-product-item');
    if (item) {
      activeEditProductItem = item;
      const productId = item.dataset.id;
      if (!productId) return;

      const productData = await getProductByIdApp(productId);
      const product = productData?.product;
      if (!product) return;

      const collections = await getCollectionsByProductId(productId, '1');
      const collection = collections?.[0];
      if (!collection) return;

      const collectionId = collection.id.split('/').pop();

      const collectionProducts = await getCollectionProductsREST(collectionId);
      if (!collectionProducts || !collectionProducts.length) return;

      document.querySelector('.capsule-edit-empty')?.classList.add('hidden');
      document.querySelector('.capsule-edit-right-selector')?.classList.remove('hidden');

      const heading = document.querySelector('.capsule-edit-right-heading');
      const grid = document.querySelector('.capsule-edit-grid');

      if (heading) heading.textContent = collection.title;
      if (grid) {
        showRightLoader();

        requestAnimationFrame(() => {
          setTimeout(async () => {
            grid.innerHTML = '';

            for (const product of collectionProducts) {
              grid.appendChild(renderProductCard(product, productId));
              await new Promise(r => setTimeout(r, 0)); // особенно если их 50+
            }
            hideRightLoader();
          }, 0);
        });
      }
    }

    const replaceBtn = e.target.closest('.capsule-product-card-replace-btn');
    if (replaceBtn && activeEditProductItem) {
      const card = replaceBtn.closest('.capsule-product-card');
      const newProductId = card?.dataset.id;
      if (!newProductId) return;

      // Заміна data-id
      activeEditProductItem.dataset.id = newProductId;

      // Заміна картинки
      const img = activeEditProductItem.querySelector('img');
      const newImg = card.querySelector('img');
      if (img && newImg) {
        img.src = newImg.src;
        img.alt = newImg.alt;
      }

      // Очистити вибір
      activeEditProductItem = null;
      document.querySelector('.capsule-edit-right-selector')?.classList.add('hidden');
      document.querySelector('.capsule-edit-empty')?.classList.remove('hidden');

      await updateCapsuleTotal();
    }



    const deleteBtn = e.target.closest('.capsule-product-card-delete-btn');
    if (deleteBtn && activeEditProductItem) {
      activeEditProductItem.remove(); // видаляємо з DOM

      // Очистити вибір
      activeEditProductItem = null;
      document.querySelector('.capsule-edit-right-selector')?.classList.add('hidden');
      document.querySelector('.capsule-edit-empty')?.classList.remove('hidden');
      await updateCapsuleTotal();
      return;
    }

    const reviewBtn = e.target.closest('.capsule-review-button');
    if (reviewBtn) {
      // 🔁 Крок 3 — активний
      document.querySelectorAll('.capsule-step').forEach((step, i) =>
        step.classList.toggle('active', i === 2)
      );

      const form = document.querySelector('.capsule-form');
      if (form) {
        // 🔁 Очищуємо попередні input-и
        form.querySelectorAll('input[name^="items["]').forEach(i => i.remove());

        const itemEls = document.querySelectorAll('.capsule-edit-product-item');
        await Promise.all([...itemEls].map(async (el, index) => {
          const productId = el.dataset.id;
          if (!productId) return;

          const data = await getProductByIdApp(productId);
          const variantId = data?.product?.variants?.[0]?.id;
          if (!variantId) return;

          const productIdInput = document.createElement('input');
          productIdInput.type = 'hidden';
          productIdInput.name = `items[${index}][id]`;
          productIdInput.value = variantId;

          const quantityInput = document.createElement('input');
          quantityInput.type = 'hidden';
          quantityInput.name = `items[${index}][quantity]`;
          quantityInput.value = '1';
          quantityInput.id = variantId;

          form.appendChild(productIdInput);
          form.appendChild(quantityInput);
        }));
      }

      const finalizeGrid = document.querySelector('.capsule-edit-finalize-grid');
      const items = document.querySelectorAll('.capsule-edit-product-item');
      finalizeGrid.innerHTML = '';

      const productIds = [...items].map(el => el.dataset.id).filter(Boolean);
      const uniqueIds = [...new Set(productIds)];

      const products = await Promise.all(
        uniqueIds.map(async id => {
          const data = await getProductByIdApp(id);
          return data?.product;
        })
      );

      // 👉 Чекаємо завершення рендеру
      showRightLoader();

      requestAnimationFrame(() => {
        setTimeout(async () => {
          await renderFinalizeProducts(products, finalizeGrid);
          hideRightLoader();
        }, 0);
      });

      // UI: приховати / показати блоки
      document.querySelector('.capsule-edit-empty')?.classList.add('hidden');
      document.querySelector('.capsule-edit-right-selector')?.classList.add('hidden');
      document.querySelector('.capsule-review-button')?.classList.add('hidden');
      document.querySelector('.capsule-form')?.classList.remove('hidden');
      document.querySelector('.capsule-edit-finalize')?.classList.remove('hidden');
    }
  });
}

// === DOM Ready ===
document.addEventListener('DOMContentLoaded', () => {
  handleCapsuleEditClick();

  document.addEventListener('change', async function (e) {
    const select = e.target.closest('.capsule-edit-finalize select');
    if (!select) return;

    const container = select.closest('.capsule-product-card');
    const allSelects = container.querySelectorAll('select');
    const productId = select.dataset.productId;
    const index = select.dataset.index;

    const selectedOptions = [...allSelects].map(s => s.value);
    const productData = await getProductByIdApp(productId);
    const variants = productData?.product?.variants || [];

    const matchingVariant = variants.find(variant => {
      const variantOptions = [variant.option1, variant.option2, variant.option3]
        .filter(Boolean)
        .map(opt => opt.trim().toLowerCase());

      return selectedOptions.every((value, i) =>
        value.trim().toLowerCase() === variantOptions[i]
      );
    });

    if (matchingVariant?.id) {
      console.log('🆔 Match variant:', matchingVariant.id);
      const hiddenInput = document.querySelector(`input[name="items[${index}][id]"]`);
      const quantityInput = document.querySelector(`input[name="items[${index}][quantity]"]`);
      if (hiddenInput) hiddenInput.value = matchingVariant.id;
      if (quantityInput) quantityInput.id = matchingVariant.id;
    }
});

  const layoutSelector = document.querySelector('.capsule-layout-selector');
  const layoutSlider = document.querySelector('.capsule-slider-wrapper');
  const layoutGrid = document.querySelector('.capsule-grid-wrapper');

  if (layoutSelector) {
    layoutSelector.querySelectorAll('span').forEach(span => {
      span.addEventListener('click', () => {
        const isSlider = span.classList.contains('capsule-layout-slider');
        layoutSlider.classList.toggle('active', isSlider);
        layoutGrid.classList.toggle('active', !isSlider);
        layoutSelector.querySelectorAll('span').forEach(s => s.classList.remove('active'));
        span.classList.add('active');
      });
    });
  }

  const filtersToggle = document.querySelector('.capsule-facets-toggle');
  const filtersBody = document.querySelector('.facets__filters-wrapper');
  if (filtersToggle && filtersBody) {
    filtersToggle.addEventListener('click', () => {
      filtersBody.classList.toggle('active');
    });
  }

  const stepElements = document.querySelectorAll('.capsule-step');
  if (stepElements.length >= 2) {
    const stepOne = stepElements[0];
    stepOne.addEventListener('click', () => {
      const wrapper = document.querySelector('.capsule-edit-wrapper');
      if (wrapper?.classList.contains('active')) {
        wrapper.classList.remove('active');
        document.querySelector('.capsule-first-step-body')?.classList.remove('hidden');

        stepElements.forEach((step, index) => {
          step.classList.toggle('active', index === 0);
        });

        // Очистка 2-го и 3-го шагов и скрытие блоков
        document.querySelector('.capsule-edit-grid')?.replaceChildren();
        document.querySelector('.capsule-edit-finalize-grid')?.replaceChildren();

        document.querySelector('.capsule-edit-finalize')?.classList.add('hidden');
        document.querySelector('.capsule-edit-right-selector')?.classList.add('hidden');
        document.querySelector('.capsule-form')?.classList.add('hidden');

        document.querySelector('.capsule-edit-empty')?.classList.remove('hidden');
        document.querySelector('.capsule-review-button')?.classList.remove('hidden');
      }
    });

    const stepTwo = stepElements[1];
    stepTwo.addEventListener('click', () => {
      // Переходимо до кроку 2
      document.querySelectorAll('.capsule-step').forEach((step, i) =>
        step.classList.toggle('active', i === 1)
      );

      document.querySelector('.capsule-form')?.classList.add('hidden');
      document.querySelector('.capsule-edit-finalize')?.classList.add('hidden');
      document.querySelector('.capsule-review-button')?.classList.remove('hidden');
      document.querySelector('.capsule-edit-right-selector')?.classList.add('hidden');
      document.querySelector('.capsule-edit-empty')?.classList.remove('hidden');
    });
  }

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

  const hideHotspotsBtn = document.querySelector('.capsule-edit-hide-hotspot');
  const productContainer = document.querySelector('.capsule-edit-product');
  if(hideHotspotsBtn) {
    hideHotspotsBtn.addEventListener('click', () => {
      if(productContainer?.classList.contains('hide-hotspots')) {
        productContainer?.classList.remove('hide-hotspots');
        hideHotspotsBtn.innerHTML = "Hide Hotspots";
      } else {
        productContainer?.classList.add('hide-hotspots');
        hideHotspotsBtn.innerHTML = "Show Hotspots";
      }
    })
  }

  const stored = localStorage.getItem('capsuleQuickStart');
  if (!stored) return;

  (async () => {
    try {
      const { topId, bottomId } = JSON.parse(stored);

      const ids = [topId, bottomId];
      const products = await Promise.all(ids.map(id => getProductByIdApp(id).then(d => d.product)));

      const list = document.querySelector('.capsule-edit-product-list');
      const finalizeGrid = document.querySelector('.capsule-edit-finalize-grid');
      const form = document.querySelector('.capsule-form');

      list.innerHTML = '';
      finalizeGrid.innerHTML = '';

      products.forEach((product, index) => {
        // == Капсула ==
        const item = document.createElement('div');
        item.classList.add('capsule-edit-product-item');
        item.dataset.id = product.id;
        item.style.gridColumn = '3 / span 4';
        item.style.gridRow = index === 0 ? '1 / span 4' : '5 / span 4';

        const img = document.createElement('img');
        img.src = product.image?.src || '';
        img.alt = product.title || '';
        img.loading = 'lazy';
        item.appendChild(img);
        list.appendChild(item);

        // == Finalize ==
        finalizeGrid.appendChild(renderFinalizeProduct(product, index));

        // == Form ==
        const inputId = document.createElement('input');
        inputId.type = 'hidden';
        inputId.name = `items[${index}][id]`;
        inputId.value = product.variants?.[0]?.id;

        const inputQty = document.createElement('input');
        inputQty.type = 'hidden';
        inputQty.name = `items[${index}][quantity]`;
        inputQty.value = '1';
        inputQty.id = product.variants?.[0]?.id;

        form.appendChild(inputId);
        form.appendChild(inputQty);

        localStorage.removeItem('capsuleQuickStart');
      });

      recalculateTotalPrice();

      // == Перехід на крок 3 ==
      document.querySelector('.capsule-edit-wrapper')?.classList.add('active');
      document.querySelectorAll('.capsule-step').forEach((s, i) => s.classList.toggle('active', i === 2));
      document.querySelector('.capsule-first-step-body')?.classList.add('hidden');
      document.querySelector('.capsule-edit-empty')?.classList.add('hidden');
      document.querySelector('.capsule-edit-right-selector')?.classList.add('hidden');
      document.querySelector('.capsule-review-button')?.classList.add('hidden');
      document.querySelector('.capsule-form')?.classList.remove('hidden');
      document.querySelector('.capsule-edit-finalize')?.classList.remove('hidden');

    } catch (err) {
      console.error('Quick start init failed:', err);
    }
  })();
});
