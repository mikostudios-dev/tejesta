(() => {
  const cacheLifetime = 2 * 60 * 1000;
  const indexRequests = new Map();

  function readCache(indexUrl) {
    try {
      const cached = JSON.parse(sessionStorage.getItem(`tejesta-family-index:${indexUrl}`));
      if (cached && Date.now() - cached.savedAt < cacheLifetime && Array.isArray(cached.products)) {
        return cached.products;
      }
    } catch (error) {
      // Storage can be unavailable in private browsing; fetch the index directly.
    }

    return null;
  }

  async function fetchIndexPage(indexUrl, page) {
    const url = new URL(indexUrl, window.location.origin);
    url.searchParams.set('page', String(page));

    // Shopify's application/json response is the collection API object, not
    // the alternate Liquid view that contains the family product index.
    const response = await fetch(url.toString(), {
      credentials: 'same-origin',
      headers: { Accept: 'text/html' },
    });

    if (!response.ok) throw new Error(`Family index returned ${response.status}`);

    const pageData = JSON.parse(await response.text());
    if (!Array.isArray(pageData.products)) throw new Error('Family index has an invalid product list');
    return pageData;
  }

  async function fetchFamilyIndex(indexUrl) {
    const firstPage = await fetchIndexPage(indexUrl, 1);
    const totalPages = Math.max(1, Number(firstPage.pages) || 1);
    const remainingPages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) => fetchIndexPage(indexUrl, index + 2)),
    );
    const allProducts = [firstPage, ...remainingPages].flatMap((pageData) => pageData.products);
    const uniqueProducts = Array.from(new Map(allProducts.map((item) => [String(item.id), item])).values());

    try {
      sessionStorage.setItem(
        `tejesta-family-index:${indexUrl}`,
        JSON.stringify({ savedAt: Date.now(), products: uniqueProducts }),
      );
    } catch (error) {
      // Rendering works without caching if browser storage is full or disabled.
    }

    return uniqueProducts;
  }

  function getFamilyIndex(indexUrl) {
    const cached = readCache(indexUrl);
    if (cached) return Promise.resolve(cached);

    if (!indexRequests.has(indexUrl)) {
      const request = fetchFamilyIndex(indexUrl);
      indexRequests.set(indexUrl, request);
      request.then(
        () => indexRequests.delete(indexUrl),
        () => indexRequests.delete(indexUrl),
      );
    }

    return indexRequests.get(indexUrl);
  }

  class TejestaFamilyThumbnails extends HTMLElement {
    connectedCallback() {
      if (this.dataset.familyLoadStarted) return;
      this.dataset.familyLoadStarted = 'true';

      getFamilyIndex(this.dataset.familyIndexUrl)
        .then((products) => this.renderFamily(products))
        .catch(() => {
          delete this.dataset.familyLoadStarted;
        });
    }

    renderFamily(products) {
      const key = (this.dataset.familyKey || '').trim().toLowerCase();
      const currentId = String(this.dataset.familyCurrentId || '');
      const family = products.filter((item) => {
        return String(item.key || '').trim().toLowerCase() === key
          && (item.inStock || String(item.id) === currentId)
          && item.url;
      });

      const editorialCard = this.closest('[data-tejesta-editorial-product]');
      if (editorialCard && family.length && String(family[0].id) !== currentId) {
        editorialCard.dataset.tejestaNonPrimary = 'true';
        document.dispatchEvent(new Event('tejesta:family-visibility-changed'));
      }

      if (family.length < 2) return;

      const limit = Number(this.dataset.familyLimit) || 0;
      let visibleFamily = family;

      if (limit > 0 && family.length > limit) {
        const visibleLimit = limit - 1;
        visibleFamily = family.slice(0, visibleLimit);
        if (!visibleFamily.some((item) => String(item.id) === currentId)) {
          const currentProduct = family.find((item) => String(item.id) === currentId);
          if (currentProduct) {
            visibleFamily[visibleLimit - 1] = currentProduct;
            visibleFamily.sort((first, second) => family.indexOf(first) - family.indexOf(second));
          }
        }
      }

      visibleFamily.forEach((item) => this.appendProductLink(item, String(item.id) === currentId));

      if (this.dataset.familyPlacement === 'card' && family.length > visibleFamily.length) {
        const overflow = document.createElement('span');
        const overflowCount = family.length - visibleFamily.length;
        overflow.className = 'tejesta-collection-card__variant-overflow';
        overflow.textContent = '+';
        overflow.setAttribute('role', 'img');
        overflow.setAttribute('aria-label', `${overflowCount} more colorways available`);
        this.append(overflow);
      }

      if (this.dataset.familyPlacement === 'editorial' && family.length <= 6) {
        this.classList.add('tejesta-editorial-product__colorways--single-row');
      }

      this.hidden = false;
    }

    appendProductLink(item, isCurrent) {
      const link = document.createElement('a');
      const placement = this.dataset.familyPlacement;
      const label = item.label || item.title;
      link.href = item.url;
      link.title = label;
      link.setAttribute('aria-label', label);

      if (placement === 'card') {
        link.className = 'tejesta-collection-card__variant tejesta-family-thumbnails__link';
      } else if (placement === 'editorial') {
        link.className = 'tejesta-editorial-product__colorway-button tejesta-family-thumbnails__link';
      } else {
        link.className = 'tejesta-family-thumbnails__product-link';
      }

      if (isCurrent) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'page');
      }

      if (item.image) {
        const image = document.createElement('img');
        image.src = item.image;
        image.alt = label;
        image.loading = 'lazy';
        image.decoding = 'async';
        image.className = placement === 'card'
          ? 'tejesta-collection-card__variant-image'
          : placement === 'editorial'
            ? 'tejesta-editorial-product__colorway-image'
            : 'tejesta-family-thumbnails__product-image';
        link.append(image);
      } else {
        const fallback = document.createElement('span');
        fallback.className = placement === 'card'
          ? 'tejesta-collection-card__fallback'
          : placement === 'editorial'
            ? 'tejesta-editorial-product__colorway-fallback'
            : 'tejesta-family-thumbnails__product-fallback';
        fallback.setAttribute('aria-hidden', 'true');
        link.append(fallback);
      }

      this.append(link);
    }
  }

  if (!customElements.get('tejesta-family-thumbnails')) {
    customElements.define('tejesta-family-thumbnails', TejestaFamilyThumbnails);
  }
})();

