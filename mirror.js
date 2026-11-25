// Submit quote and booking requests to the same-origin lead inbox.
(() => {
 const forms=document.querySelectorAll('form.frm-fluent-form, form.esb__form');
 for(const form of forms){
  const notice=document.createElement('p');notice.className='mirror-form-notice';notice.setAttribute('role','status');notice.style.cssText='font-size:13px;line-height:1.5;margin:12px 0;color:inherit';form.append(notice);
  form.addEventListener('submit',async event=>{
   event.preventDefault();event.stopImmediatePropagation();if(!form.reportValidity())return;
   const f=new FormData(form),booking=form.classList.contains('esb__form');
   const button=form.querySelector('[type="submit"]');if(button)button.disabled=true;notice.textContent='Sending your request…';
   const value=(...keys)=>keys.map(k=>f.get(k)).find(Boolean)||'';
   const payload={name:value('names_1[first_name]','name','full_name','b_name'),phone:value('phone','b_phone'),email:value('email','b_email'),service:value('dropdown','service'),message:value('message','notes','bnotes'),booking_date:value('bdate','booking_date'),website:value('website')};
   if(booking){payload.message+='\nAddress: '+value('b_address')+', '+value('b_city')+' '+value('b_zip');if(f.get('bwindow'))payload.message+='\nPreferred time: '+f.get('bwindow');}
   try{const res=await fetch('/api/submissions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const data=await res.json();if(!res.ok)throw new Error(data.error||'Unable to send your request. Please call us.');form.reset();notice.textContent=booking?'Your booking request has been received. We will contact you to confirm availability.':'Thank you! Your request has been received. We will contact you shortly.';}catch(e){notice.textContent=e.message||'Unable to send your request. Please call us.';}finally{if(button)button.disabled=false;}
  },true);
 }
})();
