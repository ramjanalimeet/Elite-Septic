// Submit quote and booking requests to the same-origin lead inbox.
(() => {
  const forms = document.querySelectorAll('form.frm-fluent-form, form.esb__form');
  const contactPage = location.pathname === '/' || location.pathname.replace(/\/$/, '') === '/contact';
  for (const form of forms) {
    if (contactPage && form.classList.contains('frm-fluent-form')) {
      form.classList.add('elite-contact-form');
      const fields = [
        ['names_1[first_name]', 'name', 'Your full name'],
        ['phone', 'tel', '(936) 555-0123'],
        ['email', 'email', 'you@example.com']
      ];
      for (const [name, autocomplete, placeholder] of fields) {
        const field = form.elements.namedItem(name);
        if (field) { field.autocomplete = autocomplete; field.placeholder = placeholder; }
      }
      for (const field of form.querySelectorAll('input[aria-required="true"], select[aria-required="true"]')) {
        field.required = true;
      }
      const message = form.elements.namedItem('message');
      if (message) message.placeholder = 'Your location, the problem, or a good time to call…';
      const reassurance = document.createElement('p');
      reassurance.className = 'elite-form-reassurance';
      reassurance.textContent = 'Free estimate · No payment required';
      form.append(reassurance);
    }
    const notice = document.createElement('p');
    notice.className = 'mirror-form-notice';
    notice.setAttribute('role', 'status');
    notice.tabIndex = -1;
    notice.style.cssText = 'font-size:13px;line-height:1.5;margin:12px 0;color:inherit';
    form.append(notice);
    let sending = false;
    form.addEventListener('submit', async event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (sending || !form.reportValidity()) return;
      const data = new FormData(form);
      const booking = form.classList.contains('esb__form');
      const button = form.querySelector('[type="submit"]');
      sending = true;
      if (button) button.disabled = true;
      form.setAttribute('aria-busy', 'true');
      notice.dataset.error = 'false';
      notice.textContent = 'Sending your request…';
      const value = (...keys) => keys.map(key => data.get(key)).find(Boolean) || '';
      const payload = {
        name: value('names_1[first_name]', 'name', 'full_name', 'b_name'),
        phone: value('phone', 'b_phone'), email: value('email', 'b_email'),
        service: value('dropdown', 'service'), message: value('message', 'notes', 'bnotes'),
        booking_date: value('bdate', 'booking_date'), website: value('website')
      };
      if (booking) {
        payload.message += '\nAddress: ' + value('b_address') + ', ' + value('b_city') + ' ' + value('b_zip');
        if (data.get('bwindow')) payload.message += '\nPreferred time: ' + data.get('bwindow');
      }
      try {
        const response = await fetch('/api/submissions', {
          method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to send your request. Please call us.');
        form.reset();
        notice.textContent = booking
          ? 'Your booking request has been received. We will contact you to confirm availability.'
          : 'Thank you! Your request has been received. We will contact you shortly.';
        notice.focus({preventScroll: true});
      } catch (error) {
        notice.dataset.error = 'true';
        notice.textContent = error.message === 'Failed to fetch'
          ? 'We couldn’t connect. Please try again, or call (936) 208–3153.'
          : error.message || 'Unable to send your request. Please call us.';
        notice.focus({preventScroll: true});
      } finally {
        sending = false;
        form.removeAttribute('aria-busy');
        if (button) button.disabled = false;
      }
    }, true);
  }
})();
