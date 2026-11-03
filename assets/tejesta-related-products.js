window.TejestaRelatedProducts = (section) => {
  const grid = section.querySelector('[data-selection-mode]');
  if (!grid) return;
  const seen = new Set([section.dataset.productId]);
  const cards = Array.from(grid.querySelectorAll('[data-recommendation-id]')).filter((card) => {
    const id = card.dataset.recommendationId;
    if (!id || seen.has(id)) {
      card.remove();
      return false;
    }
    seen.add(id);
    return true;
  });
  if (grid.dataset.selectionMode === 'random') {
    for (let index = cards.length - 1; index > 0; index -= 1) {
      const other = Math.floor(Math.random() * (index + 1));
      [cards[index], cards[other]] = [cards[other], cards[index]];
    }
  }
  const limit = Number(section.dataset.limit) || 4;
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
