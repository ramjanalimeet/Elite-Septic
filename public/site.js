(() => {
 const $ = (selector, root = document) => root.querySelector(selector);
 const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
 const nav = $('#primary-nav'), toggle = $('#mobile-menu');
 const closeNavigation = () => {
  if (!toggle || !nav) return;
  nav.classList.remove('is-open');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Open navigation');
 };
 toggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
 });
 nav?.addEventListener('click', event => { if (event.target.closest('a')) closeNavigation(); });
 document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (toggle?.getAttribute('aria-expanded') === 'true') { closeNavigation(); toggle.focus(); }
  $$('.nav-dropdown[open]').forEach(el => { el.open = false; $('summary', el).focus(); });
 });
 document.addEventListener('click', event => {
  $$('.nav-dropdown[open]').forEach(el => { if (!el.contains(event.target)) el.open = false; });
 });
 const categories = $$('[data-category]'), services = $$('[data-service-category]');
 categories.forEach(button => button.addEventListener('click', () => {
  let count = 0;
  services.forEach(card => { card.hidden = button.dataset.category !== 'All' && card.dataset.serviceCategory !== button.dataset.category; if (!card.hidden) count++; });
  categories.forEach(other => { const selected = other === button; other.classList.toggle('active', selected); other.setAttribute('aria-pressed', String(selected)); });
  $('#service-result').textContent = `${count} services shown`;
 }));
 const areaInput = $('#area-search');
 areaInput?.addEventListener('input', () => {
  const term = areaInput.value.toLowerCase().trim(); let count = 0;
  $$('[data-area]').forEach(area => { area.hidden = !area.dataset.area.toLowerCase().includes(term); if (!area.hidden) count++; });
  $('#area-result').hidden = count > 0;
 });
 $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
 const topButton = $('.back-top');
 if (topButton) {
  const update = () => topButton.hidden = window.scrollY < 700;
  window.addEventListener('scroll', update, {passive:true}); update();
  topButton.addEventListener('click', () => window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));
 }
 const booking = $('.esb__form');
 if (!booking) return;
 const days = $('.esb__days', booking);
 if (!days) return;
 // The crew serves East Texas. Dates reflect the business's calendar, not UTC rollover.
 const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(p=>[p.type,p.value]));
 const today = new Date(`${parts.year}-${parts.month}-${parts.day}T12:00:00Z`);
 const iso = date => date.toISOString().slice(0,10);
 const minimum = new Date(today); minimum.setUTCDate(minimum.getUTCDate()+1);
 const maximum = new Date(today); maximum.setUTCDate(maximum.getUTCDate()+90);
 days.replaceChildren();
 let date = new Date(today), count = 0;
 while (count < 20) {
  date.setUTCDate(date.getUTCDate()+1); if (date.getUTCDay() === 0) continue;
  const label = document.createElement('label'); label.className = 'esb__day';
  const radio = document.createElement('input'); radio.type='radio';radio.name='bdate';radio.value=iso(date);radio.required=true;
  const span = document.createElement('span');
  for (const [tag,text] of [['em',date.toLocaleDateString('en-US',{weekday:'short',timeZone:'UTC'})],['strong',String(date.getUTCDate())],['em',date.toLocaleDateString('en-US',{month:'short',timeZone:'UTC'})]]) { const e=document.createElement(tag);e.textContent=text;span.append(e); }
  label.append(radio,span); days.append(label); count++;
 }
 const help = document.createElement('p');help.className='booking-date-help';help.textContent='Choose your preferred date. We’ll confirm availability by phone or text. For emergencies, call (936) 208–3153.';days.after(help);
 const customLabel=document.createElement('label');customLabel.className='booking-date-later';customLabel.textContent='Prefer a later date?';
 const custom=document.createElement('input');custom.type='date';custom.min=iso(minimum);custom.max=iso(maximum);custom.setAttribute('aria-label','Choose another preferred booking date');customLabel.append(custom);help.after(customLabel);
 const customValue=document.createElement('input');customValue.type='hidden';customValue.name='bdate';booking.append(customValue);
 const updateSummary=()=>{
  const service=$('input[name=service]:checked',booking), selected=$('input[name=bdate]:checked',booking), window=$('input[name=bwindow]:checked',booking);
  const chosen=selected?.value||customValue.value;
  const pieces=[];
  if(service)pieces.push($('strong',service.closest('label'))?.textContent||service.value);
  if(chosen)pieces.push(new Date(`${chosen}T12:00:00Z`).toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}));
  if(window)pieces.push(window.value==='am'?'Morning · 8am–12pm':'Afternoon · 12pm–5pm');
  const sum=$('[data-sum]',booking);if(sum)sum.textContent=pieces.length?pieces.join(' — '):'Choose your service, preferred date, and arrival window. We’ll confirm your appointment.';
 };
 $$('input[name=bwindow]',booking).forEach(input=>{input.disabled=false;const text=$('.esb__left',input.closest('label'));if(text)text.textContent='Subject to confirmation';});
 custom.addEventListener('change',()=>{
  custom.setCustomValidity('');
  if(custom.value && new Date(custom.value+'T12:00:00Z').getUTCDay()===0){custom.setCustomValidity('For a Sunday visit, please call our team to discuss availability.');}
  $$('input[type=radio][name=bdate]',booking).forEach(input=>{input.required=!custom.value;if(custom.value)input.checked=false;});
  customValue.value=custom.value;updateSummary();
 });
 booking.addEventListener('change',event=>{
  if(event.target.matches('input[type=radio][name=bdate]')){custom.value='';customValue.value='';custom.setCustomValidity('');$$('input[type=radio][name=bdate]',booking).forEach(input=>input.required=true);}
  updateSummary();
 });
 booking.addEventListener('reset',()=>setTimeout(()=>{custom.value='';customValue.value='';custom.setCustomValidity('');$$('input[type=radio][name=bdate]',booking).forEach(input=>input.required=true);updateSummary();},0));
 updateSummary();
})();
