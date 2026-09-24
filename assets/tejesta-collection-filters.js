(() => {
  const roots = document.querySelectorAll('[data-tejesta-collection-filters]');

  roots.forEach((root) => {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    const items = Array.from(grid.querySelectorAll('[data-tejesta-filter-card]'));
    const selects = Array.from(root.querySelectorAll('[data-filter-key]'));
    const filters = Array.from(root.querySelectorAll('.tejesta-filter'));
    const openButton = root.querySelector('[data-tejesta-filter-open]');
    const closeButtons = root.querySelectorAll('[data-tejesta-filter-close]');
    const panel = root.querySelector('[data-tejesta-filter-panel]');
    const resetButton = root.querySelector('[data-tejesta-filter-reset]');
    const tagContainer = root.querySelector('[data-tejesta-filter-tags]');
    const resultCounts = root.querySelectorAll('[data-tejesta-result-count]');
    const resultLabel = root.querySelector('[data-tejesta-result-label]');

    const normalize = (value) => (value || '').toString().trim();
    const normalizeHandle = (value) => normalize(value).toLowerCase();
    const paramAliases = {
      type: ['type', 'tejesta_type'],
      collection: ['collection', 'tejesta_collection'],
      size: ['size', 'tejesta_size'],
      shape: ['shape', 'tejesta_shape'],
    };

    const closeDropdowns = (except = null) => {
      filters.forEach((filter) => {
        if (filter === except) return;
        filter.classList.remove('is-open');
        filter.querySelector('[data-filter-trigger]')?.setAttribute('aria-expanded', 'false');
      });
    };

    const getState = () => selects.reduce((state, select) => {
      state[select.dataset.filterKey] = normalize(select.value);
      return state;
    }, {});

    const hasActiveFilters = (state) => Object.values(state).some((value) => value && value !== 'all');

    const syncStateFromUrl = () => {
      const params = new URLSearchParams(window.location.search);

      selects.forEach((select) => {
        const key = select.dataset.filterKey;
        const aliases = paramAliases[key] || [key];
        const urlValue = aliases.map((alias) => params.get(alias)).find(Boolean);
        if (!urlValue) return;

        const normalizedValue = normalizeHandle(urlValue);
        const hasOption = Array.from(select.options).some((option) => option.value === normalizedValue);
        if (hasOption) select.value = normalizedValue;
      });
    };

    const writeStateToUrl = (state) => {
      const url = new URL(window.location.href);

      Object.entries(paramAliases).forEach(([key, aliases]) => {
        aliases.forEach((alias) => url.searchParams.delete(alias));
        if (state[key] && state[key] !== 'all') {
          url.searchParams.set(key, state[key]);
        }
      });

      window.history.replaceState({ tejestaFilters: true }, '', `${url.pathname}${url.search}${url.hash}`);
    };

    const setCount = (count) => {
      resultCounts.forEach((node) => {
        node.textContent = count;
      });
    };

    const updateFilterUi = (select) => {
      const filter = select.closest('.tejesta-filter');
      if (!filter) return;

      const current = filter.querySelector('[data-filter-current]');
      const optionButtons = filter.querySelectorAll('[data-filter-option]');
      const selectedOption = select.options[select.selectedIndex];
      const selectedLabel = selectedOption?.textContent?.trim() || 'All';
      const hasSelection = select.value && select.value !== 'all';

      if (current) current.textContent = selectedLabel;
      filter.classList.toggle('has-selection', hasSelection);
      optionButtons.forEach((button) => {
        const isActive = button.dataset.filterOption === select.value;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
    };

    const renderTags = (state) => {
      if (!tagContainer) return;
      tagContainer.innerHTML = '';

      selects.forEach((select) => {
        const key = select.dataset.filterKey;
        const value = state[key];
        if (!value || value === 'all') return;

        const selectedOption = select.options[select.selectedIndex];
        const tag = document.createElement('button');
        tag.type = 'button';
        tag.className = 'tejesta-filter-tag';
        tag.dataset.filterKey = key;
        tag.textContent = `${select.closest('.tejesta-filter')?.querySelector('.tejesta-filter__label')?.textContent || key}: ${selectedOption.textContent}`;
        tag.addEventListener('click', () => {
          select.value = 'all';
          applyFilters();
        });
        tagContainer.appendChild(tag);
      });
    };

    function applyFilters({ updateUrl = true } = {}) {
      const state = getState();
      let visibleCount = 0;

      selects.forEach(updateFilterUi);

      items.forEach((item) => {
        const isVisible = !item.hasAttribute('data-tejesta-non-primary') && Object.entries(state).every(([key, value]) => {
          if (!value || value === 'all') return true;
          const data = normalize(item.dataset[`tejestaFilter${key.charAt(0).toUpperCase()}${key.slice(1)}`]);
          return data.split('|').includes(value);
        });

        item.hidden = !isVisible;
        item.classList.toggle('tejesta-filter-card--hidden', !isVisible);

        if (item.matches('[data-tejesta-editorial-product]')) {
          item.classList.toggle('tejesta-editorial-product--reverse', isVisible && visibleCount % 2 === 1);
        }

        if (isVisible) visibleCount += 1;
      });

      const visibleEditorialItems = items.filter(
        (item) => !item.hidden && item.matches('[data-tejesta-editorial-product]'),
      );

      visibleEditorialItems.forEach((item, index) => {
        item.classList.toggle('tejesta-editorial-product--last-visible', index === visibleEditorialItems.length - 1);
      });

      const active = hasActiveFilters(state);
      root.classList.toggle('has-filter', active);
      if (resetButton) resetButton.hidden = !active;
      if (resultLabel) resultLabel.hidden = !active;
      setCount(visibleCount);
      renderTags(state);
      if (updateUrl) writeStateToUrl(state);
    }

    filters.forEach((filter) => {
      const select = filter.querySelector('[data-filter-key]');
      const trigger = filter.querySelector('[data-filter-trigger]');
      const options = filter.querySelectorAll('[data-filter-option]');

      trigger?.addEventListener('click', () => {
        const willOpen = !filter.classList.contains('is-open');
        closeDropdowns(filter);
        filter.classList.toggle('is-open', willOpen);
        trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      });

      options.forEach((option) => {
        option.addEventListener('click', () => {
          if (!select) return;
          select.value = option.dataset.filterOption || 'all';
          closeDropdowns();
          applyFilters();
        });
      });
    });

    selects.forEach((select) => select.addEventListener('change', applyFilters));

    if (resetButton) {
      resetButton.addEventListener('click', () => {
        selects.forEach((select) => {
          select.value = 'all';
        });
        applyFilters();
      });
    }

    if (openButton && panel) {
      openButton.addEventListener('click', () => {
        panel.classList.add('is-active');
        document.documentElement.classList.add('tejesta-filter-open');
      });
    }

    closeButtons.forEach((button) => {
      button.addEventListener('click', () => {
        if (panel) panel.classList.remove('is-active');
        document.documentElement.classList.remove('tejesta-filter-open');
        closeDropdowns();
      });
    });

    document.addEventListener('click', (event) => {
      if (!root.contains(event.target)) closeDropdowns();
    });

    root.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeDropdowns();
    });

    window.addEventListener('popstate', () => {
      syncStateFromUrl();
      applyFilters({ updateUrl: false });
    });

    document.addEventListener('tejesta:family-visibility-changed', () => {
      applyFilters({ updateUrl: false });
    });

    syncStateFromUrl();
    applyFilters({ updateUrl: false });
  });
})();
