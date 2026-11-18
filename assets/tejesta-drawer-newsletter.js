/* Keep Shopify's native customer form and spam protection, but receive its
   response in a frame so the visitor stays in the open menu. */
(() => {
  const initialize = () => {
    const form = document.getElementById('ContactDrawer');
    if (!form || form.dataset.inlineNewsletter || window.name === 'TejestaNewsletterResponse') return;
    form.dataset.inlineNewsletter = 'true';
    const field = form.querySelector('.menu-drawer__subscribe-field');
    const button = form.querySelector('button[type="submit"]');
    const status = form.querySelector('[data-newsletter-status]');
    const email = form.querySelector('input[type="email"]');
    const frame = document.createElement('iframe');
    frame.name = 'TejestaNewsletterResponse';
    frame.title = 'Newsletter subscription verification';
    frame.hidden = true;
    frame.className = 'menu-drawer__subscribe-verification';
    form.after(frame);
    form.target = frame.name;
    let timer;
    const message = (text) => { status.textContent = text; status.hidden = false; };
    const release = () => {
      clearTimeout(timer);
      form.removeAttribute('aria-busy');
      button.disabled = false;
      button.textContent = 'Submit';
    };
    form.addEventListener('submit', (event) => {
      clearTimeout(timer); // Shopify may replay submit after CAPTCHA is ready.
      form.querySelector('#ContactDrawer-error')?.remove();
      email.removeAttribute('aria-invalid');
      email.removeAttribute('aria-describedby');
      message('Submitting…');
      form.setAttribute('aria-busy', 'true');
      // Do not cancel the native submission or interfere with Shopify CAPTCHA.
      button.textContent = 'Submitting…';
      timer = setTimeout(() => {
        release();
        message('We could not confirm your subscription yet. Please wait or try again later.');
      }, 45000);
    });
    frame.addEventListener('load', () => {
      let doc, url;
      try { doc = frame.contentDocument; url = new URL(frame.contentWindow.location.href); }
      catch (_) {
        release();
        frame.hidden = false;
        message('Please complete the verification below to finish subscribing.');
        return;
      }
      if (!doc || url.protocol === 'about:') return;
      release();
      if (url.pathname.includes('/challenge')) {
        frame.hidden = false;
        message('Please complete the verification below to finish subscribing.');
        return;
      }
      const responseForm = doc.getElementById('ContactDrawer');
      const error = responseForm?.querySelector('#ContactDrawer-error, .errors');
      if (error) {
        frame.hidden = true;
        message(error.textContent.trim());
        status.id = 'ContactDrawer-inline-error';
        email.setAttribute('aria-invalid', 'true');
        email.setAttribute('aria-describedby', status.id);
        email.focus();
        return;
      }
      // Require Shopify's returned success state, never just a successful load.
      if (responseForm?.querySelector('[data-newsletter-success]') || url.searchParams.get('customer_posted') === 'true') {
        frame.hidden = true;
        field.hidden = true;
        status.removeAttribute('id');
        status.classList.add('menu-drawer__subscribe-message--success');
        message('Thank you');
        status.tabIndex = -1;
        status.focus();
        return;
      }
      frame.hidden = true;
      message('We could not confirm your subscription. Please try again later.');
    });
  };
  initialize();
  document.addEventListener('shopify:section:load', initialize);
})();
