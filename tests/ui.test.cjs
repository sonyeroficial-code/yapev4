const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom'),esbuild=require('esbuild');
const root=path.resolve(__dirname,'..'),wait=ms=>new Promise(r=>setTimeout(r,ms));
const text=w=>w.document.body.textContent.replace(/\s+/g,' ').trim();
function click(w,label){const nodes=[...w.document.querySelectorAll('button,a,span,div')],el=nodes.find(e=>['BUTTON','A'].includes(e.tagName)&&e.textContent.trim()===label)||nodes.find(e=>e.textContent.trim()===label&&!e.children.length);assert(el,'Missing '+label+' / '+text(w).slice(0,500));el.dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true}));}
function input(w,id,value){const el=w.document.getElementById(id);assert(el,'Missing '+id);el.value=value;el.dispatchEvent(new w.Event('input',{bubbles:true}));el.dispatchEvent(new w.Event('change',{bubbles:true}));}
async function pin(w,value){for(const n of value){click(w,n);await wait(35)}await wait(400)}
async function password(w,value,create=false){await wait(100);input(w,'firebase-password',value);if(create)input(w,'firebase-repeat',value);w.document.querySelector('#firebase-access form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(200)}
async function main(){
  const accounts=new Map(),documents=new Map([['vendors/SONYER',{label:'Sonyer',enabled:true}],['vendors/OTRO',{label:'Otro',enabled:true}]]),listeners=new Set(),emails=[];let time=1000,resetEmail=null;
  const snapshot=p=>({exists:()=>documents.has(p),data:()=>structuredClone(documents.get(p)),metadata:{hasPendingWrites:false}});
  const update=(p,d)=>{documents.set(p,structuredClone(d));for(const l of listeners)if(l.path===p)queueMicrotask(()=>l.cb(snapshot(p)))};
  const authModule=`const s=globalThis.__TEST_SDK__;export const initializeAuth=()=>s.auth;export const browserLocalPersistence={};export const createUserWithEmailAndPassword=(a,e,p)=>s.create(e,p);export const signInWithEmailAndPassword=(a,e,p)=>s.login(e,p);export const signOut=async a=>{a.currentUser=null};export const sendEmailVerification=u=>s.sendVerification(u);export const sendPasswordResetEmail=(a,e)=>s.reset(e);export const reload=async u=>{u.emailVerified=s.accounts.get(u.email).verified};export const updateProfile=async(u,p)=>{Object.assign(u,p);Object.assign(s.accounts.get(u.email),p)};export const EmailAuthProvider={credential:(email,password)=>({email,password})};export const reauthenticateWithCredential=(u,c)=>s.reauth(u,c);export const updatePassword=(u,p)=>s.updatePIN(u,p);export const verifyPasswordResetCode=(a,c)=>s.verifyReset(c);export const confirmPasswordReset=(a,c,p)=>s.confirmReset(c,p);`;
  const firestoreModule=`const s=globalThis.__TEST_SDK__;export const getFirestore=()=>({});export const doc=(_, ...a)=>a.join('/');export const collection=(_, ...a)=>a.join('/');export const getDocFromServer=p=>s.get(p);export const getDocsFromServer=p=>s.list(p);export const query=(p,...a)=>p;export const limit=()=>{};export const serverTimestamp=()=>s.time();export const runTransaction=(_,f)=>s.transaction(f);export const onSnapshot=(p,options,cb,err)=>s.listen(p,cb);export const deleteDoc=p=>s.remove(p);export const writeBatch=()=>s.batch();`;
  const plugin={name:'test-sdk',setup(b){b.onResolve({filter:/^firebase\/(app|auth|firestore)$/},a=>({path:a.path,namespace:'test-sdk'}));b.onLoad({filter:/.*/,namespace:'test-sdk'},a=>({contents:a.path==='firebase/app'?'export const initializeApp=()=>({});':a.path==='firebase/auth'?authModule:firestoreModule,loader:'js'}))}};
  const runtime=(await esbuild.build({stdin:{contents:"import './entrada-local.js';export {firebaseRequest} from './firebase-client.js?v=logout-persistente-1'",resolveDir:root},bundle:true,format:'iife',globalName:'testApp',target:'es2020',write:false,logLevel:'silent',plugins:[plugin]})).outputFiles[0].text;
  function create(saved={},session=null){
    const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));vc.on('error',(...a)=>errors.push(a.join(' ')));
    const html=fs.readFileSync(path.join(root,'ABRIR_AQUI.html'),'utf8'),dom=new JSDOM(html,{url:'http://localhost:8159/primary:Download/YPFK_PIN_PANEL/ABRIR_AQUI.html',pretendToBeVisual:true,runScripts:'outside-only',virtualConsole:vc}),w=dom.window;
    for(const[k,v]of Object.entries(saved))w.localStorage.setItem(k,v);
    Object.defineProperty(w,'crypto',{value:require('node:crypto').webcrypto});w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.alert=()=>{};
    w.matchMedia=q=>({matches:false,media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});w.scrollTo=()=>{};w.ResizeObserver=class{observe(){}disconnect(){}unobserve(){}};w.IntersectionObserver=w.ResizeObserver;
    w.URL.createObjectURL=()=> 'blob:http://localhost:8159/test';w.URL.revokeObjectURL=()=>{};w.fetch=async()=>{throw Error('Unexpected external request')};
    w.HTMLMediaElement.prototype.load=function(){};w.HTMLMediaElement.prototype.play=function(){return Promise.resolve()};w.HTMLMediaElement.prototype.pause=function(){};
    const ctx=new Proxy({measureText:()=>({width:80}),getImageData:()=>({data:new Uint8ClampedArray(4)}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});w.HTMLCanvasElement.prototype.getContext=()=>ctx;
    const auth={currentUser:null,authStateReady:()=>Promise.resolve()};
    function user(email,authTime){const a=accounts.get(email);return{email,uid:a.uid,emailVerified:a.verified,displayName:a.displayName||null,authTime,getIdToken:async()=> 'test-real-sdk-token',getIdTokenResult:async()=>({claims:{sub:a.uid,email,email_verified:accounts.get(email).verified,auth_time:auth.currentUser?.authTime||authTime,iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600}})}};
    if(session)auth.currentUser=user(session.email,session.authTime);
    const check=(p,write=false)=>{if(p.startsWith('vendors/')||p.startsWith('accountEmails/')||p.startsWith('accountPairs/'))return;const u=auth.currentUser;if(!u||p.split('/')[1]!==u.uid)throw Object.assign(Error('Denied'),{code:'permission-denied'});if(p.split('/').length>2){const a=documents.get('users/'+u.uid);if(!a?.active||a.authTime!==u.authTime)throw Object.assign(Error('Inactive'),{code:'permission-denied'})}};
    const sdk={auth,accounts,time:()=>time,
      async create(email,p){if(accounts.has(email))throw Object.assign(Error('Exists'),{code:'auth/email-already-in-use'});accounts.set(email,{uid:'user-'+accounts.size,password:p,verified:false});auth.currentUser=user(email,++time);return{user:auth.currentUser}},
      async login(email,p){if(accounts.get(email)?.password!==p)throw Object.assign(Error('Incorrect'),{code:'auth/invalid-credential'});auth.currentUser=user(email,++time);return{user:auth.currentUser}},
      async sendVerification(u){emails.push({type:'verify',email:u.email})},async reset(email){resetEmail=email;emails.push({type:'reset',email})},async verifyReset(c){assert.equal(c,'test-reset-code');return resetEmail},async confirmReset(c,p){assert.equal(c,'test-reset-code');accounts.get(resetEmail).password=p;resetEmail=null},async updatePIN(u,p){accounts.get(u.email).password=p},async reauth(u,c){if(accounts.get(c.email).password!==c.password)throw Object.assign(Error('Incorrect'),{code:'auth/invalid-credential'});u.authTime=++time;auth.currentUser=u;return{user:u}},
      async get(p){check(p);return snapshot(p)},async list(p){check(p+'/x');return{docs:[...documents.keys()].filter(k=>k.startsWith(p+'/')).map(k=>snapshot(k))}},
      async transaction(f){const changes=[];const result=await f({get:async p=>{check(p);return snapshot(p)},set:(p,d)=>{check(p,true);changes.push([p,d])}});for(const[p,d]of changes)update(p,d);return result},
      listen(p,cb){const l={path:p,cb,window:w};listeners.add(l);queueMicrotask(()=>cb(snapshot(p)));return()=>listeners.delete(l)},
      async remove(p){check(p,true);documents.delete(p)},batch(){const items=[];return{set:(p,d)=>items.push(['set',p,d]),delete:p=>items.push(['delete',p]),async commit(){for(const[,p]of items)check(p,true);for(const[k,p,d]of items)k==='set'?update(p,d):documents.delete(p)}}}
    };w.__TEST_SDK__=sdk;const close=w.close.bind(w);w.close=()=>{for(const l of listeners)if(l.window===w)listeners.delete(l);close()};
    w.eval(html.match(/<script id="local-preview-bootstrap">([\s\S]*?)<\/script>/)[1]);w.eval(fs.readFileSync(path.join(root,'arranque.js'),'utf8'));w.eval(runtime);
    return{w,dom,errors,sdk,snapshot:()=>Object.fromEntries(Object.keys(w.localStorage).map(k=>[k,w.localStorage.getItem(k)])),session:()=>auth.currentUser&&({email:auth.currentUser.email,authTime:auth.currentUser.authTime})};
  }
  let a=create(),b;const email='persona@example.com';
  try{
    let w=a.w;await wait(650);assert(w.__YPFK_BOOTED__);click(w,'Crear una cuenta');await wait(150);
    assert.deepEqual([...w.document.querySelectorAll('form input')].map(e=>e.id),['vendorId','titular','email'],'Registration order matches requested fields');
    input(w,'vendorId','SONYER');input(w,'titular','PERSONA PRUEBA');input(w,'email',email);const submit=[...w.document.querySelectorAll('button')].find(e=>/Registrar/.test(e.textContent));assert(submit);submit.click();await wait(200);
    assert(!w.document.getElementById('firebase-password'),'No extra password screen');
    await pin(w,'456789');await wait(300);await pin(w,'456789');await wait(250);
    assert.equal(accounts.get(email).password,'456789','Firebase account uses exactly the entered PIN');assert.equal(emails.length,0);assert(!text(w).includes('Verifica tu correo'));await wait(1350);
    assert(w.location.hash.includes('/login'));await pin(w,'111111');assert(text(w).includes('no coinciden'));click(w,'ENTENDIDO');await wait(100);await pin(w,'456789');await wait(600);assert(text(w).includes('Mostrar saldo'));
    assert.equal(documents.get('users/user-0').vendorId,'SONYER');assert.equal(documents.get('users/user-0').license,'inactive');assert(!('pin' in documents.get('users/user-0')));
    assert(w.document.getElementById('ypfk-watermark'),'Without a license the default owner watermark appears');
    assert(w.document.getElementById('ypfk-watermark').textContent.includes('@bebote19'));
    assert(w.document.querySelectorAll('#ypfk-watermark .ypfk-watermark-label').length>=12,'Watermark repeats over the whole screen');
    assert([...w.document.querySelectorAll('#ypfk-watermark .ypfk-watermark-label')].every(e=>e.textContent.includes('@bebote19')),'Each tile uses the owner brand');
    const testVoucher=w.document.createElement('app-voucher'),testCard=w.document.createElement('div');
    testCard.id='tour-receipt-card';testVoucher.append(testCard);w.document.body.append(testVoucher);
    w.__YPFK_DECORATE_VOUCHER__(testCard);
    assert(testCard.querySelectorAll('.ypfk-voucher-watermark-label').length>=8,'The downloaded receipt is decorated inside its capture element');
    assert.equal(testCard.querySelector('.ypfk-voucher-watermark-label').style.opacity,'0.34','Receipt watermarks have higher contrast');
    update('users/user-0',{...documents.get('users/user-0'),license:'active',licenseUntil:null});await wait(100);
    assert.equal(w.document.getElementById('ypfk-watermark'),null,'Legacy global license keeps all apps clean when no per-app preferences exist');
    assert.equal(testCard.querySelector('.ypfk-voucher-watermark'),null,'Legacy global license also clears the receipt');
    update('users/user-0',{...documents.get('users/user-0'),license:'inactive',licenseUntil:null});await wait(100);
    assert(w.document.getElementById('ypfk-watermark'),'An inactive license restores marks without a per-app preference');
    update('vendors/SONYER',{label:'Sonyer',enabled:true,watermarkText:'@VENDEDOR'});await wait(60);
    assert(w.document.getElementById('ypfk-watermark').textContent.includes('@VENDEDOR'));
    assert([...w.document.querySelectorAll('#ypfk-watermark .ypfk-watermark-label')].every(e=>e.textContent==='@VENDEDOR'),'Seller brand updates every tile');
    assert([...testCard.querySelectorAll('.ypfk-voucher-watermark-label')].every(e=>e.textContent==='@VENDEDOR'),'Seller brand updates the receipt watermark');
    update('users/user-0/preferences/watermark',{hiddenApps:['yape']});await wait(60);
    assert.equal(w.document.getElementById('ypfk-watermark'),null,'Per-client exclusion hides only the active app');
    assert.equal(testCard.querySelector('.ypfk-voucher-watermark'),null,'Per-client exclusion also removes the receipt watermark');
    for(const [bank,tag] of [['BBVA','app-bbva'],['BCP','app-bcp'],['Interbank','app-ibk']]){
      const shell=w.document.createElement(tag);w.document.body.append(shell);
      update('users/user-0/preferences/watermark',{hiddenApps:['yape']});await wait(60);
      assert(w.document.getElementById('ypfk-watermark'),`${bank} retains its watermark when only Yape is excluded`);
      assert(testCard.querySelector('.ypfk-voucher-watermark'),`${bank} receipt retains its watermark`);
      shell.remove();
    }
    update('users/user-0/preferences/watermark',{hiddenApps:['yape']});await wait(60);
    assert.equal(w.document.getElementById('ypfk-watermark'),null,'Returning to Yape hides only Yape again');
    update('users/user-0/preferences/watermark',{hiddenApps:[]});await wait(60);
    assert(w.document.getElementById('ypfk-watermark'));
    assert(testCard.querySelector('.ypfk-voucher-watermark'));
    await w.testApp.firebaseRequest('search/contacts','POST',{celular:'900000003',titular:'CONTACTO PRUEBA'});assert.equal((await w.testApp.firebaseRequest('search/contacts','GET'))[0].titular,'CONTACTO PRUEBA');
    update('users/user-0',{...documents.get('users/user-0'),license:'active',licenseUntil:null});await wait(100);
    assert(!text(w).includes('LICENCIA ACTIVA'),'Active license has no visible license badge');
    assert(w.document.getElementById('ypfk-watermark'),'Explicit per-app preferences override active license: unchecked Yape retains watermark');
    assert(testCard.querySelector('.ypfk-voucher-watermark'),'Explicit per-app preferences override active license on vouchers');
    update('users/user-0/preferences/watermark',{hiddenApps:['yape']});await wait(100);
    assert.equal(w.document.getElementById('ypfk-watermark'),null,'With active license, Yape-only exclusion clears Yape');
    assert.equal(testCard.querySelector('.ypfk-voucher-watermark'),null,'With active license, Yape-only exclusion clears Yape receipt');
    for(const [bank,tag] of [['BBVA','app-bbva'],['BCP','app-bcp'],['Interbank','app-ibk']]){
      const shell=w.document.createElement(tag);w.document.body.append(shell);
      update('users/user-0/preferences/watermark',{hiddenApps:['yape']});await wait(65);
      assert(w.document.getElementById('ypfk-watermark'),`${bank} shows its watermark despite active global license when only Yape is excluded`);
      assert(testCard.querySelector('.ypfk-voucher-watermark'),`${bank} receipt shows its watermark despite active global license`);
      shell.remove();
    }
    update('users/user-0/preferences/watermark',{hiddenApps:['yape']});await wait(65);
    assert.equal(w.document.getElementById('ypfk-watermark'),null,'Returning to Yape after checking banks keeps Yape clean');
    testVoucher.remove();
    const saved=a.snapshot();assert(!JSON.stringify(saved).includes('456789'),'PIN is not persisted by app storage');
    a.dom.window.close();a=create(saved);w=a.w;await wait(650);assert(w.location.hash.includes('/login'));await pin(w,'456789');await wait(600);assert(text(w).includes('Mostrar saldo'),'PIN signs in even without a persisted Auth session');
    // Cached and late callbacks must not invalidate this installation's new session.
    const originalGet=a.sdk.get;let releaseOldRead,readStarted;const started=new Promise(r=>readStarted=r);a.sdk.get=async p=>{a.sdk.get=originalGet;const snap=await originalGet(p);readStarted();await new Promise(r=>releaseOldRead=r);return snap};const staleRequest=w.testApp.firebaseRequest('auth/verifyToken','GET');await started;const staleOutcome=assert.rejects(staleRequest,e=>e.code==='SESSION_STALE');await w.testApp.firebaseRequest('auth/login','POST',{email,pin:'456789'});releaseOldRead();await staleOutcome;assert(w.__YPFK_DEMO_STORAGE__.getItem('token'),'A stale sync response cannot invalidate a new login');
    const active=documents.get('users/user-0'),oldListener=[...listeners].find(l=>l.window===w);
    oldListener.cb({exists:()=>true,data:()=>({...active,authTime:0}),metadata:{hasPendingWrites:false,fromCache:true}});await wait(30);assert(text(w).includes('Mostrar saldo'));
    await w.testApp.firebaseRequest('auth/login','POST',{email,pin:'456789'});oldListener.cb({exists:()=>true,data:()=>({...active,authTime:0}),metadata:{hasPendingWrites:false,fromCache:false}});await wait(30);assert(w.__YPFK_DEMO_STORAGE__.getItem('token'),'Unsubscribed callbacks cannot close a newer session');
    b=create();w=b.w;await wait(650);click(w,'Ya tengo una cuenta');await wait(100);
    assert.deepEqual([...w.document.querySelectorAll('form input')].map(e=>e.id),['vendorId','email']);
    input(w,'vendorId','INVENTADO');input(w,'email',email);click(w,'Ingresar');await wait(250);assert(text(w).includes('no existe'));click(w,'ENTENDIDO');await wait(50);
    input(w,'vendorId','OTRO');click(w,'Ingresar');await wait(250);assert(text(w).includes('No existe una cuenta'),'Wrong seller rejected before PIN');assert(w.document.getElementById('vendorId'));click(w,'ENTENDIDO');await wait(50);
    input(w,'vendorId','SONYER');input(w,'email','missing@example.com');click(w,'Ingresar');await wait(250);assert(text(w).includes('No existe una cuenta'));click(w,'ENTENDIDO');await wait(50);
    input(w,'email',email);click(w,'Ingresar');await wait(250);assert(w.location.hash.includes('/register'));assert(text(w).includes('Verifica tu PIN actual'));assert(!w.location.hash.includes('/login'),'QR screen is not shown before verifying and changing PIN');
    await assert.rejects(w.testApp.firebaseRequest('auth/create_pin','POST',{email,pin:'654321'}),e=>e.code==='REGISTER_REQUIRED');
    await pin(w,'111111');assert(text(w).includes('no coinciden'));click(w,'ENTENDIDO');await wait(70);assert(text(w).includes('Verifica tu PIN actual'));
    await pin(w,'456789');assert(text(w).includes('Cambia tu PIN'));assert(!w.__YPFK_DEMO_STORAGE__.getItem('token'),'Verifying current PIN does not enter Home');assert.equal(accounts.get(email).password,'456789');
    await pin(w,'654321');await wait(300);await pin(w,'654322');await wait(550);assert(text(w).includes('Los PIN no coinciden'));assert.equal(accounts.get(email).password,'456789');click(w,'ENTENDIDO');await wait(80);
    await pin(w,'654321');await wait(300);await pin(w,'654321');await wait(1250);assert(w.location.hash.includes('/login'));assert(text(w).includes('Ingresa tu clave'));assert.equal(accounts.get(email).password,'654321');
    await pin(w,'456789');assert(text(w).includes('no coinciden'));click(w,'ENTENDIDO');await wait(80);await pin(w,'654321');await wait(650);assert(text(w).includes('Mostrar saldo'));await wait(1000);assert(!w.location.hash.includes('/session'),'The successful login remains active');
    await wait(500);assert(a.w.location.hash.includes('/session'));assert(!a.w.__YPFK_DEMO_STORAGE__.getItem('token'));await assert.rejects(a.w.testApp.firebaseRequest('search/contacts','GET'),e=>e.code==='UNAUTHENTICATED');
    update('users/user-0',{...documents.get('users/user-0'),banned:true});await wait(500);assert(!w.__YPFK_DEMO_STORAGE__.getItem('token'),'Ban ends the unlocked client session');
    await assert.rejects(w.testApp.firebaseRequest('auth/login','POST',{email,pin:'654321'}),e=>e.code==='BANNED');update('users/user-0',{...documents.get('users/user-0'),banned:false});
    await w.testApp.firebaseRequest('auth/login','POST',{email,pin:'654321'});await w.testApp.firebaseRequest('auth/logout','POST');assert.equal(w.__TEST_SDK__.auth.currentUser,null);assert.equal(documents.get('users/user-0').active,false);
    await assert.rejects(w.testApp.firebaseRequest('auth/recoverPin','POST',{email}),e=>e.code==='RECOVERY_SUPPORT_REQUIRED');
    await assert.rejects(w.testApp.firebaseRequest('auth/verifyClient','POST',{email,vendorId:''}),e=>e.code==='INVALID_VENDOR');
    await assert.rejects(w.testApp.firebaseRequest('auth/verifyClient','POST',{email:'missing@example.com',vendorId:'SONYER'}),e=>e.code==='ACCOUNT_MISMATCH');await assert.rejects(w.testApp.firebaseRequest('auth/login','POST',{email:'missing@example.com',pin:'654321'}),e=>e.code==='auth/invalid-credential');assert(!accounts.has('missing@example.com'),'Login never creates an account');
    await assert.rejects(w.testApp.firebaseRequest('auth/register','POST',{email,vendorId:'SONYER',titular:'OTRO TITULAR'}),e=>e.code==='ACCOUNT_EXISTS');
    assert.equal(emails.length,0,'Registration, login and recovery send no emails');
    assert.deepEqual(a.errors,[]);assert.deepEqual(b.errors,[]);
    console.log('PASS: early seller/email lookup, native current-PIN verification and mandatory PIN change/repeat before QR, cached/late listener protection; vendor/name/email only, original PIN keyboard, PIN as Firebase password, no emails, matching seller/email/PIN login, restart, contact access, live license, replacement, ban/unban, logout and safe support-only recovery without an extra password. Auth/Firestore/mail are test doubles.');
  }finally{a.dom.window.close();b?.dom.window.close();listeners.clear()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
