// The source site's WordPress form handlers cannot run from a static copy.
// Keep requests usable by drafting them in the visitor's email application.
(() => {
  const recipient = 'elitesepticser@gmail.com';
  const forms = document.querySelectorAll('form.frm-fluent-form, form.esb__form');
  const labels = {
    'names_1[first_name]': 'Name',
    phone: 'Phone', email: 'Email', dropdown: 'Service needed',
    message: 'Message', service: 'Service', bdate: 'Preferred date',
    btime: 'Preferred time'
  };

  for (const form of forms) {
    const notice = document.createElement('p');
    notice.className = 'mirror-form-notice';
    notice.textContent = 'This copy opens your email app to send your request.';
    notice.style.cssText = 'font-size:13px;line-height:1.5;margin:12px 0;color:inherit;opacity:.8';
    form.append(notice);
    form.addEventListener('submit', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      const isBooking = form.classList.contains('esb__form');
      const lines = [];
      for (const [key, value] of new FormData(form)) {
        if (!value || key.startsWith('_') || key.startsWith('ak_') ||
            ['esb', 'esb_ts', 'esb_sig', 'website', 'action'].includes(key)) continue;
        lines.push(`${labels[key] || key}: ${value}`);
      }
      const subject = isBooking ? 'Elite Septic booking request' : 'Elite Septic free estimate request';
      const href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
      notice.textContent = 'Your email app should open with your request. Send the draft to complete it.';
      const link = document.createElement('a');
      link.href = href;
      link.textContent = 'Open email draft';
      link.style.marginLeft = '6px';
      notice.append(link);
      window.location.href = href;
    }, true);
  }
})();
