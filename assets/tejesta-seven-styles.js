(() => {
  if (customElements.get('tejesta-seven-style')) return;
  class SevenStyle extends HTMLElement {
    connectedCallback() {
      if (this.initialized) return;
      const data = this.querySelector('[data-colorways]');
      if (!data) return;
      try { this.colors = JSON.parse(data.textContent); } catch (_) { return; }
      if (!Array.isArray(this.colors) || !this.colors.length) return;
      this.initialized = true;
      this.storageKey = `tejesta:seven-color:${this.dataset.styleKey}`;
      let previous;
      try { previous = sessionStorage.getItem(this.storageKey); } catch (_) { /* Private storage may be unavailable. */ }
      const choices = this.colors.map((color, index) => index).filter(index => String(this.colors[index].id) !== previous);
      this.index = choices.length ? choices[Math.floor(Math.random() * choices.length)] : 0;
      this.render();
      const controls = this.querySelector('.tejesta-seven-style__controls');
      controls.hidden = this.colors.length < 2;
      controls.querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
        this.index = (this.index + Number(button.dataset.direction) + this.colors.length) % this.colors.length;
        this.render();
      }));
    }
    render() {
      const color = this.colors[this.index];
      this.querySelectorAll('[data-product-link]').forEach(link => { link.href = color.url; link.setAttribute('aria-label', color.title); });
      this.querySelector('[data-product-title]').textContent = color.title;
      this.querySelector('[data-product-price]').textContent = color.price;
      const image = this.querySelector('img');
      image.removeAttribute('srcset');
      image.src = color.image;
      image.alt = color.title;
      this.dataset.selectedProduct = String(color.id);
      try { sessionStorage.setItem(this.storageKey, String(color.id)); } catch (_) { /* Random selection still works without storage. */ }
    }
  }
  customElements.define('tejesta-seven-style', SevenStyle);
})();
