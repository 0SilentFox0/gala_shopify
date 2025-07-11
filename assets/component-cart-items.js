import { Component } from '@theme/component';
import {
  fetchConfig,
  debounce,
  onAnimationEnd,
  prefersReducedMotion,
  resetShimmer,
} from '@theme/utilities';
import { morphSection, sectionRenderer } from '@theme/section-renderer';
import {
  ThemeEvents,
  CartUpdateEvent,
  QuantitySelectorUpdateEvent,
  DiscountUpdateEvent,
} from '@theme/events';
import { cartPerformance } from '@theme/performance';

class CartItemsComponent extends Component {
  #debouncedOnChange = debounce(this.#onQuantityChange, 300).bind(this);

  connectedCallback() {
    super.connectedCallback();

    document.addEventListener(ThemeEvents.cartUpdate, this.#handleCartUpdate);
    document.addEventListener(ThemeEvents.discountUpdate, this.handleDiscountUpdate);
    document.addEventListener(ThemeEvents.quantitySelectorUpdate, this.#debouncedOnChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    document.removeEventListener(ThemeEvents.cartUpdate, this.#handleCartUpdate);
    document.removeEventListener(ThemeEvents.quantitySelectorUpdate, this.#debouncedOnChange);
  }

  #onQuantityChange(event) {
    const { quantity, cartLine: line } = event.detail;
    if (!line) return;

    if (quantity === 0) {
      return this.onLineItemRemove(line);
    }

    this.updateQuantity({ line, quantity, action: 'change' });
    const lineItemRow = this.refs.cartItemRows[line - 1];
    if (!lineItemRow) return;

    const textComponent = lineItemRow.querySelector('text-component');
    textComponent?.shimmer();
  }

  onLineItemRemove(line) {
    this.updateQuantity({ line, quantity: 0, action: 'clear' });

    const cartItemRow = this.refs.cartItemRows[line - 1];
    if (!cartItemRow) return;

    const remove = () => cartItemRow.remove();

    if (prefersReducedMotion()) return remove();

    cartItemRow.style.setProperty('--row-height', `${cartItemRow.clientHeight}px`);
    cartItemRow.classList.add('removing');

    onAnimationEnd(cartItemRow, remove);
  }

  updateQuantity({ line, quantity, action }) {
    const marker = cartPerformance.createStartingMarker(`${action}:user-action`);
    this.#disableCartItems();

    const { cartTotal } = this.refs;
    cartTotal?.shimmer();

    const sectionsToUpdate = new Set([this.sectionId]);
    document.querySelectorAll('cart-items-component').forEach((item) => {
      if (item instanceof HTMLElement && item.dataset.sectionId) {
        sectionsToUpdate.add(item.dataset.sectionId);
      }
    });

    const body = JSON.stringify({
      line,
      quantity,
      sections: Array.from(sectionsToUpdate),
      sections_url: window.location.pathname,
    });

    console.log('[DEBUG] Body JSON:', body);

    fetch(`${Theme.routes.cart_change_url}`, fetchConfig('json', { body }))
        .then(async (response) => {
        const rawText = await response.text();
        console.log('[DEBUG] Raw response text:', rawText);

        try {
          return JSON.parse(rawText); // ручной парсинг, чтобы поймать ошибку
        } catch (e) {
          console.error('[ERROR] JSON parse failed at client:', e);
          throw new Error('Invalid JSON from server');
        }
      })
      .then((response) => response.json())
      .then((data) => {
        resetShimmer(this);

        if (data.errors) {
          this.#handleCartError(line, data);
          return;
        }

        const html = data.sections?.[this.sectionId];
        if (html) {
          morphSection(this.sectionId, html);
        } else {
          sectionRenderer.renderSection(this.sectionId, { cache: false });
        }

        const countText = new DOMParser()
          .parseFromString(html || '', 'text/html')
          .querySelector('[ref="cartItemCount"]')?.textContent;

        const newCount = countText ? parseInt(countText, 10) : 0;
        this.dispatchEvent(
          new CartUpdateEvent({}, this.sectionId, {
            itemCount: newCount,
            source: 'cart-items-component',
            sections: data.sections,
          })
        );
      })
      .catch(console.error)
      .finally(() => {
        this.#enableCartItems();
        cartPerformance.measureFromMarker(marker);
      });
  }

  #handleCartError(line, data) {
    const quantitySelector = this.refs.quantitySelectors[line - 1];
    const input = quantitySelector?.querySelector('input');
    if (input) input.value = input.defaultValue;

    const error = this.refs[`cartItemError-${line}`];
    const container = this.refs[`cartItemErrorContainer-${line}`];

    if (error instanceof HTMLElement) error.textContent = data.errors;
    if (container instanceof HTMLElement) container.classList.remove('hidden');
  }

  handleDiscountUpdate = (event) => {
    this.#handleCartUpdate(event);
  };

  #handleCartUpdate = (event) => {
    if (event instanceof DiscountUpdateEvent) {
      sectionRenderer.renderSection(this.sectionId, { cache: false });
      return;
    }

    if (event.target === this) return;

    const html = event.detail.data.sections?.[this.sectionId];
    if (html) {
      morphSection(this.sectionId, html);
    } else {
      sectionRenderer.renderSection(this.sectionId, { cache: false });
    }
  };

  #disableCartItems() {
    this.classList.add('cart-items-disabled');
  }

  #enableCartItems() {
    this.classList.remove('cart-items-disabled');
  }

  get sectionId() {
    const id = this.dataset.sectionId;
    if (!id) throw new Error('Section id missing');
    return id;
  }
}

if (!customElements.get('cart-items-component')) {
  customElements.define('cart-items-component', CartItemsComponent);
}
