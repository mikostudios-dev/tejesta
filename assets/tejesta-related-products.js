window.TejestaRelatedProducts = (section) => {
  const grid = section.querySelector('[data-selection-mode]');
  if (!grid) return;
  const seen = new Set([section.dataset.productId]);
  const seenFamilies = new Set();
  const cards = Array.from(grid.querySelectorAll('[data-recommendation-id]')).filter((card) => {
    const id = card.dataset.recommendationId;
    const family = card.dataset.recommendationFamily;
    if (!id || seen.has(id) || (family && seenFamilies.has(family))) {
      card.remove();
      return false;
    }
    seen.add(id);
    if (family) seenFamilies.add(family);
    return true;
  });
  if (grid.dataset.selectionMode === 'fallback') {
    for (let index = cards.length - 1; index > 0; index -= 1) {
      const other = Math.floor(Math.random() * (index + 1));
      [cards[index], cards[other]] = [cards[other], cards[index]];
    }
  }
  const limit = Number(section.dataset.limit) || 3;
  cards.forEach((card, index) => {
    if (index < limit) {
      card.hidden = false;
      grid.appendChild(card);
    } else {
      card.remove();
    }
  });
  section.hidden = cards.length === 0;
};


if (!customElements.get('tejesta-recommendations')) {
  customElements.define('tejesta-recommendations', class extends HTMLElement {
    connectedCallback() {
      window.TejestaRelatedProducts(this);
    }
  });
}
