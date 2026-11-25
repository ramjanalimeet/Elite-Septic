const paths={user:'M20 21v-2a7 7 0 0 0-14 0v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',calendar:'M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2',chart:'M5 20v-7 M12 20V4 M19 20v-12',settings:'M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8',search:'M21 21l-5-5 M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13',filter:'M3 4h18l-7 8v7l-4 2V12z',phone:'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.12.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.45c.9.34 1.84.58 2.8.7a2 2 0 0 1 1.7 2.05z',mail:'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2 M2 6l10 7L22 6',message:'M21 3H3v18l5-5h13z',more:'M12 5h.01 M12 12h.01 M12 19h.01',plus:'M12 5v14 M5 12h14',close:'M6 6l12 12 M18 6L6 18',arrow:'M5 12h14 M14 7l5 5-5 5',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7 M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6',download:'M12 3v12 M7 10l5 5 5-5 M4 17v4h16v-4',logout:'M9 3H3v18h6 M9 12h12 M16 7l5 5-5 5',refresh:'M20 7v5h-5 M4 17v-5h5 M6 6a8 8 0 0 1 13 2 M18 18a8 8 0 0 1-13-2'};
const icon=name=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name]||paths.user}"/></svg>`;
function icons(root=document){root.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));}
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={leads:[],tab:'leads',filter:'all',editing:null};
const names={new:'New',called:'Called',scheduled:'Scheduled',done:'Done',spam:'Spam'};
let toastTimer;
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,4000);}
async function api(url,options={}){
 const res=await fetch(url,{...options,headers:{'Content-Type':'application/json',...options.headers}});
 const data=await res.json();
 if(!res.ok){if(res.status===401&&url!='/api/login')showLogin();throw new Error(data.error||'Something went wrong. Try again.');}
 return data;
}
function showLogin(){state.leads=[];$('#app').hidden=true;$('#login').hidden=false;}
async function load(){const d=await api('/api/leads');state.leads=d.leads;$('#login').hidden=true;$('#app').hidden=false;render();}
function date(value){const d=new Date(value);return isNaN(d)?value:d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});}
function monthLead(l){const d=new Date(l.created_at),n=new Date();return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear();}
function card(l){return `<article class="lead-card"><div class="lead-head"><div class="avatar">${esc(l.name.charAt(0).toUpperCase())}</div><div class="lead-title"><h3>${esc(l.name)}</h3><p>${esc(l.service)}</p><small>#${l.id} · ${esc(date(l.created_at))} at ${new Date(l.created_at).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}</small></div><span class="badge ${l.status}">${names[l.status]}</span><button class="menu-button" data-edit="${l.id}" aria-label="Manage ${esc(l.name)}">${icon('more')}</button></div><div class="contact-row"><a class="contact-chip call" href="tel:${esc(l.phone.replace(/[^+\d]/g,''))}">${icon('phone')}Call ${esc(l.phone)}</a>${l.email?`<a class="contact-chip" href="mailto:${esc(l.email)}">${icon('mail')}<span>${esc(l.email)}</span></a>`:''}</div>${l.message?`<div class="message-box">${icon('message')}<p>${esc(l.message)}</p></div>`:''}${l.note?`<div class="note"><b>Note:</b> ${esc(l.note)}</div>`:''}<div class="card-bottom"><span>${l.booking_date?`Preferred date: ${esc(l.booking_date)}`:'No booking date set'}</span><button class="text-button" data-edit="${l.id}">View details</button></div></article>`;}
function empty(title,message){return `<div class="empty"><span class="stat-icon">${icon('users')}</span><h2>${esc(title)}</h2><p>${esc(message)}</p>${state.leads.length?'':'<button class="primary" data-new>Add your first lead</button>'}</div>`;}
function render(){
 const active=state.leads.filter(l=>l.status!=='spam'), scheduled=active.filter(l=>l.status==='scheduled');
 $('#new-count').textContent=active.filter(l=>l.status==='new').length;$('#scheduled-count').textContent=scheduled.length;$('#total-count').textContent=active.length;
 $('#all-count').textContent=active.length;$('#month-count').textContent=active.filter(monthLead).length;$('#month-name').textContent=new Date().toLocaleDateString('en-US',{month:'long'});$('#filter-scheduled-count').textContent=scheduled.length;$('#spam-count').textContent=state.leads.length-active.length;
 const current=$('#service-filter').value;const services=[...new Set(state.leads.map(l=>l.service))].sort();$('#service-filter').innerHTML='<option value="">All services</option>'+services.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('');$('#service-filter').value=services.includes(current)?current:'';
 const q=$('#search').value.trim().toLowerCase();$('#clear-search').hidden=!q;
 const status=$('#status-filter').value,service=$('#service-filter').value;
 const filtered=state.leads.filter(l=>{if(state.filter==='spam'?l.status!=='spam':l.status==='spam')return false;if(state.filter==='scheduled'&&l.status!=='scheduled')return false;if(state.filter==='month'&&!monthLead(l))return false;return(!status||status===l.status)&&(!service||service===l.service)&&(!q||[l.name,l.phone,l.email,l.service,l.message,l.note].join(' ').toLowerCase().includes(q));});
 $('#lead-list').innerHTML=filtered.length?filtered.map(card).join(''):empty(state.leads.length?'No matching leads':'Your inbox is ready',state.leads.length?'Try a different search or clear the filters.':'New quote and booking requests from your website will appear here.');
 $('#result-info').textContent=`${filtered.length} leads shown`;
 const bookings=active.filter(l=>l.status==='scheduled'||(l.booking_date&&l.status==='new')).sort((a,b)=>a.booking_date.localeCompare(b.booking_date));
 $('#booking-list').innerHTML=bookings.length?bookings.map(card).join(''):empty('No bookings yet','Add a booking date or mark a lead as scheduled to organize upcoming work.');
 $('#pipeline').innerHTML=['new','called','scheduled','done'].map(s=>`<button data-pipeline="${s}"><strong>${active.filter(l=>l.status===s).length}</strong><span>${names[s]}</span></button>`).join('');
 $('#recent').innerHTML=active.length?active.slice(0,5).map(l=>`<button class="recent-row" data-edit="${l.id}"><span class="avatar">${esc(l.name.charAt(0))}</span><div><b>${esc(l.name)}</b><p>${esc(l.service)} · ${esc(date(l.created_at))}</p></div><span class="badge ${l.status}">${names[l.status]}</span></button>`).join(''):'<p class="muted" style="margin-top:16px">Your recent requests will appear here.</p>';
 $$('[data-filter]').forEach(el=>el.classList.toggle('active',el.dataset.filter===state.filter));
}
function tab(name){state.tab=name;$('#subtitle').textContent={summary:'Summary',leads:'Leads',bookings:'Bookings',settings:'Settings'}[name];['summary','leads','bookings','settings'].forEach(s=>$(`#${s}-panel`).hidden=s!==name);$$('[data-tab]').forEach(el=>el.classList.toggle('active',el.dataset.tab===name));}
function openLead(id){
 state.editing=id?state.leads.find(l=>l.id===Number(id)):null;
 const form=$('#lead-form');form.reset();const l=state.editing;
 $('#dialog-title').textContent=l?l.name:'Add a lead';$('#dialog-subtitle').textContent=l?`${l.service} · #${l.id}`:'Keep every customer request in one place.';
 $('#new-fields').hidden=!!l;$('#edit-fields').hidden=!l;$('#delete-lead').hidden=!l;$('#form-error').textContent='';
 $('#new-fields').querySelectorAll('[required]').forEach(el=>el.disabled=!!l);
 if(l){form.elements.status.value=l.status;form.elements.note.value=l.note;$('#lead-detail').textContent=[l.phone,l.email,l.message].filter(Boolean).join('\n');}
 const d=l?.booking_date||'';form.elements.booking_date.value=/^\d{4}-\d{2}-\d{2}$/.test(d)?d:'';
 $('#lead-dialog').showModal();
}
icons();
document.addEventListener('click',e=>{
 const button=e.target.closest('button');if(!button)return;
 if(button.dataset.tab)tab(button.dataset.tab);
 if(button.dataset.filter){state.filter=button.dataset.filter;render();}
 if(button.dataset.stat){tab('leads');$('#status-filter').value=button.dataset.stat==='new'?'new':'';state.filter=button.dataset.stat==='scheduled'?'scheduled':'all';render();}
 if(button.dataset.edit)openLead(button.dataset.edit);
 if(button.hasAttribute('data-new')||button.id==='add-lead')openLead();
 if(button.dataset.pipeline){tab('leads');state.filter='all';$('#status-filter').value=button.dataset.pipeline;render();}
});
$('#login-form').addEventListener('submit',async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;$('#login-error').textContent='';try{const f=new FormData(e.target);await api('/api/login',{method:'POST',body:JSON.stringify({password:f.get('password')})});e.target.elements.password.value='';await load();}catch(err){$('#login-error').textContent=err.message;}finally{b.disabled=false;}});
$('#show-password').onclick=()=>{const p=$('#login-form').elements.password;p.type=p.type==='password'?'text':'password';$('#show-password').setAttribute('aria-label',p.type==='password'?'Show password':'Hide password');};
$('#search').oninput=render;$('#clear-search').onclick=()=>{$('#search').value='';render();};
$('#filter-toggle').onclick=()=>{const panel=$('#more-filters');panel.hidden=!panel.hidden;$('#filter-toggle').setAttribute('aria-expanded',String(!panel.hidden));};
$('#status-filter').onchange=render;$('#service-filter').onchange=render;$('#reset-filters').onclick=()=>{$('#status-filter').value='';$('#service-filter').value='';$('#search').value='';state.filter='all';render();};
$('#close-dialog').onclick=()=>$('#lead-dialog').close();
$('#lead-form').addEventListener('submit',async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;$('#form-error').textContent='';try{const d=Object.fromEntries(new FormData(e.target));const l=state.editing;await api(l?`/api/leads/${l.id}`:'/api/leads',{method:l?'PATCH':'POST',body:JSON.stringify(d)});await load();$('#lead-dialog').close();toast(l?'Lead updated':'Lead added');}catch(err){$('#form-error').textContent=err.message;}finally{b.disabled=false;}});
$('#delete-lead').onclick=async()=>{if(!state.editing||!confirm('Permanently delete this lead? This cannot be undone.'))return;try{await api(`/api/leads/${state.editing.id}`,{method:'DELETE'});await load();$('#lead-dialog').close();toast('Lead deleted');}catch(e){$('#form-error').textContent=e.message;}};
$('#sign-out').onclick=async()=>{try{await api('/api/logout',{method:'POST',body:'{}'});showLogin();}catch(e){toast(e.message);}};
$('#refresh').onclick=async()=>{try{await load();toast('Leads refreshed');}catch(e){toast(e.message);}};
$('#export').onclick=()=>{const fields=['id','name','phone','email','service','status','message','note','booking_date','created_at'];const csv=rows=>rows.map(v=>'"'+String(v??'').replace(/^[=+\-@\t\r]/,"'$&").replaceAll('"','""')+'"').join(',');const blob=new Blob(['\uFEFF'+[csv(fields),...state.leads.map(l=>csv(fields.map(k=>l[k])))].join('\r\n')],{type:'text/csv;charset=utf-8'});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='elite-septic-leads.csv';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);};
(async()=>{try{const session=await api('/api/session');if(session.authenticated)await load();else showLogin();}catch(e){showLogin();$('#login-error').textContent=e.message;}})();
