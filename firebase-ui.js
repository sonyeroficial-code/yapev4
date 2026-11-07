// Preserve the original form layout. Authentication uses vendor ID, email and PIN.
export function prepareVendorForm(){
  const apply=()=>{
    const field=document.getElementById('vendorId');if(!field||field.dataset.ordered)return;
    field.dataset.ordered='true';field.autocomplete='off';field.inputMode='text';
    const group=field.parentElement,form=field.closest('form');if(group&&form&&group.parentElement===form)form.prepend(group);
  };
  const start=()=>{apply();new MutationObserver(apply).observe(document.body,{childList:true,subtree:true})};
  if(document.body)start();else document.addEventListener('DOMContentLoaded',start,{once:true});
}
