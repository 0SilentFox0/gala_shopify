

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

// === Швидке рендерення з Skeleton та кешем ===
async function renderCapsuleProducts(capsuleProductObjects) {
  const container = document.querySelector('.capsule-edit-product');
  const priceElement = document.querySelector('.capsule-edit-price');
  if (!container) return;

  container.innerHTML = '';
  const skeletonCount = capsuleProductObjects.length;
  for (let i = 0; i < skeletonCount; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'capsule-edit-product-item skeleton';
    container.appendChild(skeleton);
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

  container.innerHTML = '';
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

    const img = document.createElement('img');
    img.src = product.image?.src || '';
    img.alt = product.title || '';
    img.loading = 'lazy';

    item.appendChild(img);
    container.appendChild(item);
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

// === Обробка кліку "Edit the outfit" ===
function handleCapsuleEditClick() {
  document.addEventListener('click', async (event) => {
    if (!event.target.classList.contains('capsule-edit-button')) return;

    const button = event.target;
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

      // Паралельне отримання всіх capsule_product метаоб’єктів
      const capsuleProductObjects = (
        await Promise.all(capsuleProductGIDs.map(gid => getMetaobjectByGID(gid)))
      ).filter(Boolean);

      await renderCapsuleProducts(capsuleProductObjects);

      // UI
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
  });
}

// === DOM Ready ===
document.addEventListener('DOMContentLoaded', () => {
  handleCapsuleEditClick();

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
      }
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
});
