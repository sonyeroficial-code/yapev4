import {initializeApp} from 'firebase/app';
import {initializeAuth,browserLocalPersistence,createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut,updateProfile,updatePassword,reauthenticateWithCredential,EmailAuthProvider} from 'firebase/auth';
import {getFirestore,doc,collection,getDocFromServer,getDocsFromServer,query,limit,runTransaction,serverTimestamp,onSnapshot,deleteDoc,writeBatch} from 'firebase/firestore';
import {firebaseConfig} from './firebase-config.js';
import {directoryKeys,writeDirectory} from './account-directory.js';
import {prepareVendorForm} from './firebase-ui.js';

const app=initializeApp(firebaseConfig),auth=initializeAuth(app,{persistence:browserLocalPersistence}),db=getFirestore(app);
auth.languageCode='es';prepareVendorForm();
const ready=auth.authStateReady(),store=globalThis.__YPFK_DEMO_STORAGE__,state=globalThis.__YPFK_DEMO_STATE__;
let unsubscribe,unsubscribeVendor,unsubscribeMarks,context=null,lastPin=null,pendingChange=null,licenseTimer,watermarkRouteTimer;
const DEFAULT_WATERMARK='SONYER · @bebote19';
let watermarkState={active:true,text:DEFAULT_WATERMARK,hiddenApps:[],hasCustomMarks:false};
const fail=(code,msg,status=400)=>Object.assign(new Error(msg),{code,status});
const read=(key,fallback)=>state.read(key,fallback),put=(key,v)=>store.setItem(key,JSON.stringify(v));
const emailOf=v=>String(v||store.getItem('email')||'').trim().toLowerCase();
const vendorOf=v=>String(v||'').trim().toUpperCase();
const validPin=(p,allowLegacyCurrent=false)=>{p=String(p||'');if(!/^\d{6}$/.test(p)||(!allowLegacyCurrent&&p==='000000'))throw fail('INVALID_PIN','Usa un PIN de seis dígitos diferente de 000000.');return p};
const installation=()=>{let id=store.getItem('pin-installation');if(!id){id=crypto.randomUUID();store.setItem('pin-installation',id)}return id};
const ref=uid=>doc(db,'users',uid),contactRef=(uid,phone)=>doc(db,'users',uid,'contacts',phone);
const data=s=>s.exists()?s.data():null;
export function errorMessage(e){return({
  'auth/invalid-credential':'El correo o el PIN no coinciden.',
  'auth/wrong-password':'El correo o el PIN no coinciden.',
  'auth/user-not-found':'El correo o el PIN no coinciden.',
  'auth/email-already-in-use':'Este correo ya tiene cuenta. Usa «Ya tengo una cuenta» e ingresa con su PIN.',
  'auth/invalid-email':'Escribe un correo válido.',
  'auth/weak-password':'Configura Firebase para admitir el PIN de seis dígitos. Consulta la guía incluida.',
  'auth/password-does-not-meet-requirements':'La política de Firebase no admite ese PIN. Revisa la política indicada en la guía.',
  'auth/operation-not-allowed':'Activa Correo electrónico/contraseña en Firebase Authentication. El PIN se usa como esa clave.',
  'auth/too-many-requests':'Demasiados intentos. Espera un momento y vuelve a intentar.',
  'auth/network-request-failed':'Comprueba tu conexión a internet.',
  'auth/user-token-expired':'Tu sesión venció. Ingresa nuevamente con tu PIN.',
  'auth/invalid-user-token':'Tu sesión venció. Ingresa nuevamente con tu PIN.',
  'auth/user-disabled':'La cuenta está deshabilitada.',
  'auth/requires-recent-login':'Ingresa nuevamente con tu PIN antes de cambiarlo.',
  'permission-denied':'Firebase rechazó la operación. Comprueba las reglas incluidas, tu cuenta y sus permisos.',
  'unavailable':'No se pudo conectar con la base de datos. Comprueba internet.'
})[e?.code]||e?.message||'No se pudo completar la solicitud.'}
const normalize=e=>Object.assign(new Error(errorMessage(e)),{code:e?.code||'CONNECTION_ERROR',status:e?.status||400,details:e?.details});
async function checkedVendor(value,requireEnabled=true){const id=vendorOf(value);if(!/^[A-Z0-9_-]{2,40}$/.test(id))throw fail('INVALID_VENDOR','Escribe un ID del vendedor válido.');const v=data(await getDocFromServer(doc(db,'vendors',id)));if(!v||(requireEnabled&&!v.enabled))throw fail('INVALID_VENDOR','El ID del vendedor no existe o está desactivado.');return id}
function stop(){
  unsubscribe?.();unsubscribe=null;unsubscribeVendor?.();unsubscribeVendor=null;unsubscribeMarks?.();unsubscribeMarks=null;
  context=null;lastPin=null;clearTimeout(licenseTimer);clearInterval(watermarkRouteTimer);watermarkRouteTimer=null;
  watermarkState={active:true,text:DEFAULT_WATERMARK,hiddenApps:[],hasCustomMarks:false};store.removeItem('token');
  document.getElementById('license-access-note')?.remove();document.getElementById('ypfk-watermark')?.remove();clearVoucherWatermarks();
}
function ended(reason='replaced'){stop();window.dispatchEvent(new CustomEvent('ypfk-session-ended',{detail:{reason}}))}
function currentApp(){
  // These are the actual bank shells mounted by Angular. Detecting the visible
  // shell also works when an embedded browser keeps its URL on the Yape route.
  if(document.querySelector('app-bbva'))return 'bbva';
  if(document.querySelector('app-bcp'))return 'bcp';
  if(document.querySelector('app-ibk'))return 'ibk';
  const path=location.pathname.toLowerCase()+' '+location.hash.toLowerCase();
  if(/(?:\/|#\/)(?:bbva)(?:\/|\b)/.test(path))return 'bbva';
  if(/(?:\/|#\/)(?:bcp)(?:\/|\b)/.test(path))return 'bcp';
  if(/(?:\/|#\/)(?:ibk|interbank)(?:\/|\b)/.test(path))return 'ibk';
  return 'yape';
}
function clearVoucherWatermarks(){
  for(const overlay of document.querySelectorAll('.ypfk-voucher-watermark')){
    const host=overlay.parentElement;overlay.remove();
    if(host&&Object.prototype.hasOwnProperty.call(host.dataset,'ypfkOriginalPosition')){
      host.style.position=host.dataset.ypfkOriginalPosition;delete host.dataset.ypfkOriginalPosition;
    }
  }
}
// Once a seller configures apps individually, that choice overrides the
// legacy all-apps license switch. Without a saved choice, retain legacy behavior.
function watermarkVisible(){
  return !!context&&(!watermarkState.active||watermarkState.hasCustomMarks)&&!watermarkState.hiddenApps.includes(currentApp());
}
function decorateVoucher(target){
  if(!target||target.nodeType!==1||!watermarkVisible())return target;
  if(!target.querySelector('.ypfk-voucher-watermark')&&!Array.from(target.children).some(c=>c.classList.contains('ypfk-voucher-watermark'))){
    if(getComputedStyle(target).position==='static'){
      target.dataset.ypfkOriginalPosition=target.style.position;target.style.position='relative';
    }
    const overlay=document.createElement('div');overlay.className='ypfk-voucher-watermark';overlay.setAttribute('aria-hidden','true');
    overlay.style.cssText='position:absolute;inset:0;display:grid;grid-auto-rows:minmax(90px,1fr);place-items:center;overflow:hidden;pointer-events:none;user-select:none;z-index:9';
    target.append(overlay);
  }
  const overlay=Array.from(target.children).find(c=>c.classList.contains('ypfk-voucher-watermark'));
  if(!overlay)return target;
  const columns=target.clientWidth>620?3:2;
  const tileCount=Math.min(96,columns*Math.max(4,Math.ceil((target.scrollHeight||target.clientHeight||450)/115)));
  if(overlay.dataset.tiles!==String(tileCount)){
    overlay.style.gridTemplateColumns=`repeat(${columns},minmax(0,1fr))`;
    const fragment=document.createDocumentFragment();
    for(let i=0;i<tileCount;i++){
      const label=document.createElement('span');label.className='ypfk-voucher-watermark-label';
      label.style.cssText='display:block;max-width:95%;text-align:center;overflow-wrap:anywhere;transform:rotate(-22deg);font:bold clamp(16px,4.2vw,24px) Arial,sans-serif;line-height:1.25;color:#53116b;text-shadow:0 1px 1px #fff9;opacity:.34';
      fragment.append(label);
    }
    overlay.replaceChildren(fragment);overlay.dataset.tiles=String(tileCount);delete overlay.dataset.watermarkText;
  }
  if(overlay.dataset.watermarkText!==watermarkState.text){
    for(const label of overlay.children)label.textContent=watermarkState.text;
    overlay.dataset.watermarkText=watermarkState.text;
  }
  return target;
}
// The receipt export service calls this immediately before creating the image.
globalThis.__YPFK_DECORATE_VOUCHER__=target=>{
  if(target?.closest?.('app-voucher')||target?.querySelector?.('#tour-receipt-card'))decorateVoucher(target);
  return target;
};
function renderVoucherWatermarks(){
  const candidates=document.querySelectorAll('#tour-receipt-card,app-voucher .ticket,app-voucher .min-h-screen.bg-white,app-voucher .bbva.bg-white');
  for(const candidate of candidates)decorateVoucher(candidate);
}
function renderWatermark(){
  const show=watermarkVisible();
  let el=document.getElementById('ypfk-watermark');
  if(!show){el?.remove();clearVoucherWatermarks();return}
  if(!el){
    el=document.createElement('div');el.id='ypfk-watermark';el.setAttribute('aria-hidden','true');
    el.style.cssText='position:fixed;inset:-32vmax;display:grid;grid-template-columns:repeat(auto-fill,minmax(175px,1fr));grid-auto-rows:145px;place-items:center;pointer-events:none;user-select:none;z-index:2147481990;overflow:hidden;transform:rotate(-19deg)';
    document.body.append(el);
  }
  // Cover the full viewport (including its rotated corners), on phones and desktops.
  const edge=Math.max(innerWidth,innerHeight)*.64;
  const tiles=Math.min(600,Math.ceil((innerWidth+edge)/175)*Math.ceil((innerHeight+edge)/145));
  if(el.dataset.tiles!==String(tiles)){
    const fragment=document.createDocumentFragment();
    for(let i=0;i<tiles;i++){
      const mark=document.createElement('span');mark.className='ypfk-watermark-label';
      mark.style.cssText='display:block;width:165px;max-width:100%;text-align:center;overflow-wrap:anywhere;font:bold clamp(15px,2.4vw,23px) Arial,sans-serif;line-height:1.25;letter-spacing:.4px;color:#191427;text-shadow:0 1px 1px #fff9;opacity:.24';
      fragment.append(mark);
    }
    el.replaceChildren(fragment);el.dataset.tiles=String(tiles);delete el.dataset.watermarkText;
  }
  if(el.dataset.watermarkText!==watermarkState.text){
    for(const mark of el.children)mark.textContent=watermarkState.text;
    el.dataset.watermarkText=watermarkState.text;
  }
  renderVoucherWatermarks();
}
function watchWatermark(user,active){
  unsubscribeVendor?.();unsubscribeMarks?.();clearInterval(watermarkRouteTimer);
  watermarkState.text=DEFAULT_WATERMARK;watermarkState.hiddenApps=[];watermarkState.hasCustomMarks=false;renderWatermark();
  unsubscribeVendor=onSnapshot(doc(db,'vendors',active.vendorId),{includeMetadataChanges:true},s=>{
    if(context!==active)return;const text=data(s)?.watermarkText;
    watermarkState.text=typeof text==='string'&&text.trim()?text.trim().slice(0,80):DEFAULT_WATERMARK;renderWatermark();
  },()=>{if(context===active){watermarkState.text=DEFAULT_WATERMARK;renderWatermark()}});
  unsubscribeMarks=onSnapshot(doc(db,'users',user.uid,'preferences','watermark'),{includeMetadataChanges:true},s=>{
    if(context!==active)return;const hidden=data(s)?.hiddenApps;
    watermarkState.hasCustomMarks=Array.isArray(hidden);
    watermarkState.hiddenApps=Array.isArray(hidden)?hidden.filter(id=>['yape','bbva','bcp','ibk'].includes(id)):[];renderWatermark();
  },()=>{if(context===active){watermarkState.hasCustomMarks=false;watermarkState.hiddenApps=[];renderWatermark()}});
  watermarkRouteTimer=setInterval(renderWatermark,750);
}
function licenseView(record){
  clearTimeout(licenseTimer);document.getElementById('license-access-note')?.remove();
  const until=record.licenseUntil?.toMillis?.()??null,active=record.license==='active'&&(!until||until>Date.now());
  watermarkState.active=active;renderWatermark();
  globalThis.__YPFK_LICENSE_ACTIVE__=active;
  if(active&&until)licenseTimer=setTimeout(()=>licenseView(record),Math.min(until-Date.now()+50,2147483647));
}
async function lookup(email,vendorId){const keys=await directoryKeys(db,email,vendorId);return{keys,email:data(await getDocFromServer(keys.email))?.registered===true,pair:data(await getDocFromServer(keys.pair))?.registered===true}}
function profileFor(existing){
  if(!existing)throw fail('ACCOUNT_NOT_REGISTERED','Esta cuenta no tiene un registro completo. Usa «Crear una cuenta».');
  if(!existing.vendorId||!existing.createdAt)throw fail('LEGACY_ACCOUNT','Esta cuenta necesita migración. Comunícate con tu vendedor.');
  if(existing.vendorId!==vendorOf(store.getItem('pin-vendor')))throw fail('ACCOUNT_MISMATCH','El ID del vendedor, el correo o el PIN no coinciden.');
  return{name:existing.name,vendorId:existing.vendorId};
}
async function claim(user,profile,pin){
  let authTime=Number((await user.getIdTokenResult()).claims.auth_time);const id=installation(),sid=store.getItem('pin-session:'+user.uid)||crypto.randomUUID();store.setItem('pin-session:'+user.uid,sid);
  const keys=await directoryKeys(db,user.email,profile.vendorId);
  const activate=()=>runTransaction(db,async tx=>{
    const current=data(await tx.get(ref(user.uid)));
    if(current?.banned)throw fail('BANNED','Tu cuenta está baneada. Comunícate con tu vendedor.',403);
    if(current&&authTime<current.authTime)throw fail('SESSION_REPLACED','Tu cuenta tiene una sesión más reciente. Ingresa nuevamente.',401);
    if(current&&authTime===current.authTime&&(current.installation!==id||current.sessionId!==sid||!current.active))throw fail('SESSION_TIME_COLLISION','Vuelve a ingresar con tu PIN.',401);
    const next=current?{...current,authTime,installation:id,sessionId:sid,active:true,updatedAt:serverTimestamp()}:{email:emailOf(user.email),name:profile.name,vendorId:profile.vendorId,createdAt:serverTimestamp(),updatedAt:serverTimestamp(),authTime,installation:id,sessionId:sid,active:true,license:'inactive',licenseUntil:null,banned:false,managedAt:null,managedBy:''};
    if(!current||current.authTime!==authTime||!current.active)tx.set(ref(user.uid),next);
    writeDirectory(tx,keys);
    return{...next,uid:user.uid};
  });
  try{return await activate()}catch(e){if(e.code!=='SESSION_TIME_COLLISION'||!pin)throw e;await new Promise(r=>setTimeout(r,1100));await reauthenticateWithCredential(user,EmailAuthProvider.credential(user.email,pin));authTime=Number((await user.getIdTokenResult(true)).claims.auth_time);return activate()}
}
// Legacy simulation UI adapter; never used to authenticate Firestore requests.
async function uiToken(user){const payload={...(await user.getIdTokenResult()).claims,sub:user.uid,email:user.email,status:true,payment:true,bcp:true,ibk:true,bbva:true,simulation:true,clientSession:context?.uiGeneration,reseller:'',showTour:false,autocompleteEnabled:false,storeEnabled:false,external:false};const enc=v=>btoa(unescape(encodeURIComponent(JSON.stringify(v)))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');return enc({alg:'none',typ:'SIMULATION'})+'.'+enc(payload)+'.simulation'}
async function enter(user,active){
  active={...active,uiGeneration:crypto.randomUUID()};context=active;const token=await uiToken(user);if(context!==active)throw fail('SESSION_STALE','La solicitud anterior ya terminó.',409);store.setItem('token',token);put('datos',{...read('datos',{}),titular:active.name});licenseView(active);watchWatermark(user,active);
  unsubscribe?.();unsubscribe=onSnapshot(ref(user.uid),{includeMetadataChanges:true},s=>{if(context!==active||s.metadata.hasPendingWrites||s.metadata.fromCache)return;const a=data(s);if(a?.banned){ended('banned');return}if(!a?.active||a.authTime!==active.authTime||a.installation!==active.installation||a.sessionId!==active.sessionId){ended();return}licenseView(a)},e=>{if(context===active&&e.code==='permission-denied')ended('ended')});
  return{status:true,token,hidden:false,products:[]};
}
async function current(){await ready;const u=auth.currentUser;if(!u||!context||emailOf(u.email)!==emailOf())throw fail('UNAUTHENTICATED','Ingresa nuevamente con tu PIN.',401);return u}
const contact=c=>{const celular=String(c.celular||''),titular=String(c.titular||'').trim();if(!/^9\d{8}$/.test(celular)||titular.length<2||titular.length>100)throw fail('INVALID_CONTACT','Completa el nombre y un celular válido.');return{celular,titular}};

async function sonyerGlobalRequest(user,action,data){
  const token=await user.getIdToken();
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),14000);
  try{
    const response=await fetch('https://zsbtgznbqsbkqbpfnume.supabase.co/functions/v1/sonyer-global',{
      method:'POST',
      headers:{'Content-Type':'application/json',apikey:'sb_publishable__R2O4H6CNwKvWJh3Zczu3A_Jr4fnITf',Authorization:'Bearer '+token},
      body:JSON.stringify({action,...data}),signal:controller.signal
    });
    const result=await response.json().catch(()=>({}));
    if(!response.ok||result.ok===false)throw Object.assign(new Error(result.error||'Supabase no disponible.'),{status:response.status,code:'SONYER_SUPABASE_ERROR'});
    return result;
  }finally{clearTimeout(timeout)}
}

export async function firebaseRequest(path,method,body={},params){
  body=body||{};const email=emailOf(body.email);
  try{
    await ready;
    if(path==='auth/register'){const name=String(body.titular||'').trim();if(name.length<2||name.length>100)throw fail('INVALID_NAME','Completa tu nombre.');const vendorId=await checkedVendor(body.vendorId);if((await lookup(email,vendorId)).email)throw fail('ACCOUNT_EXISTS','Este correo ya está registrado. Usa «Ya tengo una cuenta».');put('pin-registration',{email,name,vendorId});store.setItem('email',email);store.setItem('pin-vendor',vendorId);pendingChange=null;return{status:true,nextPin:true,phone:''};}
    if(path==='auth/verifyClient'){
      const vendorId=await checkedVendor(body.vendorId,false),found=await lookup(email,vendorId);
      if(!found.pair)throw fail('ACCOUNT_MISMATCH','No existe una cuenta con ese ID del vendedor y correo.');
      stop();store.removeItem('pin-registration');store.setItem('email',email);store.setItem('pin-vendor',vendorId);pendingChange=null;return{status:true,needsPin:true,verifyPin:true};
    }
    if(path==='auth/check_pin'){
      const pin=validPin(body.pin);stop();pendingChange=null;
      const user=(await signInWithEmailAndPassword(auth,email,pin)).user,existing=data(await getDocFromServer(ref(user.uid)));
      if(existing?.banned)throw fail('BANNED','Tu cuenta está baneada. Comunícate con tu vendedor.',403);
      profileFor(existing);pendingChange={email,uid:user.uid,oldPin:pin};return{status:true};
    }
    if(path==='auth/create_pin'){
      const pin=validPin(body.pin);stop();let user;
      if(pendingChange&&pendingChange.email===email){const change=pendingChange;user=auth.currentUser;if(!user||user.uid!==change.uid)throw fail('PIN_REQUIRED','Ingresa nuevamente con tu PIN actual.');if(!change.passwordUpdated&&pin===change.oldPin)throw fail('PIN_UNCHANGED','Crea un PIN diferente del anterior para activar esta instalación.');await reauthenticateWithCredential(user,EmailAuthProvider.credential(email,change.oldPin));if(!change.passwordUpdated){await updatePassword(user,pin);change.oldPin=pin;change.passwordUpdated=true}else if(pin!==change.oldPin)throw fail('PIN_REQUIRED','Repite el PIN nuevo que acabas de crear.');}
      else{const p=read('pin-registration',null);if(!p||p.email!==email)throw fail('REGISTER_REQUIRED','Completa el registro.');await checkedVendor(p.vendorId);
        try{user=(await createUserWithEmailAndPassword(auth,email,pin)).user}catch(e){if(e.code!=='auth/email-already-in-use')throw e;try{user=(await signInWithEmailAndPassword(auth,email,pin)).user}catch{throw e}if(data(await getDocFromServer(ref(user.uid))))throw e}
        await updateProfile(user,{displayName:p.name});store.setItem('pin-vendor',p.vendorId);
      }
      const existing=data(await getDocFromServer(ref(user.uid))),p=read('pin-registration',null),profile=existing?profileFor(existing):{name:p.name,vendorId:p.vendorId};await claim(user,profile,pin);store.setItem('email',email);store.removeItem('pin-registration');pendingChange=null;return{status:true,msg:profile.name};
    }
    if(path==='auth/login'){
      const pin=validPin(body.pin);stop();pendingChange=null;const user=(await signInWithEmailAndPassword(auth,email,pin)).user;store.setItem('email',email);
      const existing=data(await getDocFromServer(ref(user.uid)));if(existing?.banned)throw fail('BANNED','Tu cuenta está baneada. Comunícate con tu vendedor.',403);
      const profile=profileFor(existing);if(existing&&existing.installation!==installation())throw fail('PIN_CHANGE_REQUIRED','Valida tu cuenta y cambia el PIN para activar esta instalación.');const active=await claim(user,profile,pin);store.removeItem('pin-registration');return enter(user,active);
    }
    if(path==='auth/recoverPin')throw fail('RECOVERY_SUPPORT_REQUIRED','Comunícate con tu vendedor para recibir ayuda con tu PIN. No se envían enlaces ni se restablece una cuenta solo con el correo o el ID.');
    if(path==='auth/verifyToken'||path==='auth/refresh'){const active=context,user=await current(),a=data(await getDocFromServer(ref(user.uid)));if(context!==active)throw Object.assign(fail('SESSION_STALE','La solicitud pertenece a una sesión anterior.',409),{details:{deprecated:true}});if(a?.banned){ended('banned');throw fail('BANNED','Tu cuenta está baneada.',403)}if(!a?.active||a.authTime!==context.authTime||a.installation!==context.installation||a.sessionId!==context.sessionId){ended();throw fail('SESSION_REPLACED','Tu sesión se cerró.',401)}const token=await uiToken(user);store.setItem('token',token);return{status:true,refresh:false,token,products:[]};}
    if(path==='auth/logout'){
      const user=auth.currentUser,active=context;
      stop();
      try{
        // Al salir después de reabrir la app, el contexto puede ser nulo,
        // pero Firebase puede conservar un usuario autenticado en el móvil.
        if(user&&active)await runTransaction(db,async tx=>{
          const a=data(await tx.get(ref(user.uid)));
          if(a?.authTime===active.authTime&&a.installation===active.installation&&a.sessionId===active.sessionId&&!a.banned)
            tx.set(ref(user.uid),{...a,active:false,updatedAt:serverTimestamp()});
        });
      }finally{
        try{if(user)await signOut(auth)}finally{
          // El arranque consulta email/pin-vendor para elegir QR o bienvenida.
          for(const key of ['email','pin-vendor','pin-registration','firebase-flow'])store.removeItem(key);
          pendingChange=null;
        }
      }
      return{status:true};
    }
    if(path==='auth/validate_pin'){lastPin=null;const user=await current(),pin=validPin(body.pin,true);await reauthenticateWithCredential(user,EmailAuthProvider.credential(user.email,pin));lastPin=pin;return{status:true};}
    if(path==='auth/update_pin'){const user=await current(),pin=validPin(body.pin);if(!lastPin)throw fail('PIN_REQUIRED','Verifica primero tu PIN actual.');if(pin===lastPin)throw fail('PIN_UNCHANGED','El PIN nuevo debe ser diferente del PIN actual.');await reauthenticateWithCredential(user,EmailAuthProvider.credential(user.email,lastPin));await updatePassword(user,pin);lastPin=null;unsubscribe?.();unsubscribe=null;const profile={name:context.name,vendorId:context.vendorId};const active=await claim(user,profile,pin);return enter(user,active);}
    if(path==='search/osiptel'){
      const user=await current();
      let phone=String(params?.get('telefono')||body.telefono||'').replace(/\D/g,'');
      if(phone.length===11&&phone.startsWith('51'))phone=phone.slice(2);
      if(!/^9\d{8}$/.test(phone))return{titular:''};
      const result=await sonyerGlobalRequest(user,'lookup',{phone});
      return {titular:String(result.contact?.name||'')};
    }
    if(path.startsWith('search/contacts')){
      const user=await current();
      if(path==='search/contacts'&&method==='GET')return(await getDocsFromServer(query(collection(db,'users',user.uid,'contacts'),limit(200)))).docs.map(s=>s.data());
      if(path==='search/contacts'&&method!=='GET'){const c=contact(body);await sonyerGlobalRequest(user,'save-contact',{phone:c.celular,name:c.titular,destino:'Yape'});const batch=writeBatch(db);batch.set(contactRef(user.uid,c.celular),c);if(body.original&&body.original!==c.celular)batch.delete(contactRef(user.uid,String(body.original)));await batch.commit();return c;}
      if(path==='search/contacts/migrate'){if(!Array.isArray(body.contacts)||body.contacts.length>200)throw fail('INVALID_CONTACTS','Se permiten hasta 200 contactos por importación.');const batch=writeBatch(db);for(const c of body.contacts.map(contact))batch.set(contactRef(user.uid,c.celular),c);await batch.commit();return{status:true};}
      if(method==='DELETE'){await deleteDoc(contactRef(user.uid,decodeURIComponent(path.split('/').pop())));return{status:true};}
    }
    throw fail('NOT_SUPPORTED','Esta función no está disponible en la simulación.');
  }catch(e){throw normalize(e)}
}
