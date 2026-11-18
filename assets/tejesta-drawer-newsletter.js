/* Use Shopify's native customer form and CAPTCHA flow. Restore the open drawer
   after the server response; never infer subscription success from a click. */
(() => {
  const key = 'tejesta:drawer-newsletter:pending';
  const initialize = () => {
    const form = document.getElementById('ContactDrawer');
    if (!form || form.dataset.drawerNewsletter) return;
    form.dataset.drawerNewsletter = 'true';
    const drawer = form.closest('header-drawer');
    const details = drawer?.querySelector('details');
    const summary = details?.querySelector('summary');
    const success = form.querySelector('[data-newsletter-success]');
    const error = form.querySelector('#ContactDrawer-error');
    const status = form.querySelector('[data-newsletter-status]');
    let pending = false;
    try {
      const started = Number(sessionStorage.getItem(key));
      pending = started > 0 && Date.now() - started < 10 * 60 * 1000;
      sessionStorage.removeItem(key);
    } catch (_) { /* Native submission also works when storage is unavailable. */ }

    const showResponse = () => {
      if (!details || !summary) return;
      details.open = true;
      drawer.openMenuDrawer(summary);
      const response = success || error || status;
      response.tabIndex = -1;
      response.focus();
      response.scrollIntoView({block: 'nearest'});
    };
    if (success) {
      form.querySelector('.menu-drawer__subscribe-field').hidden = true;
    }
    if (pending) {
      if (!success && !error) {
        status.textContent = 'We could not confirm your subscription. Please try again or contact us.';
        status.hidden = false;
      }
      // Wait for the theme's drawer custom element to be ready.
      customElements.whenDefined('header-drawer').then(showResponse);
    }
    form.addEventListener('submit', () => {
      try { sessionStorage.setItem(key, String(Date.now())); } catch (_) {}
      // No preventDefault, frame target, custom request, or CAPTCHA interception.
    });
  };
  initialize();
  document.addEventListener('shopify:section:load', initialize);
})();
