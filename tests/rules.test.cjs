const {test,before,beforeEach,after}=require('node:test'),fs=require('node:fs'),path=require('node:path');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,setDoc,updateDoc,getDoc,getDocs,collection,deleteDoc,serverTimestamp,Timestamp,writeBatch}=require('firebase/firestore');
const hash=value=>require('node:crypto').createHash('sha256').update(value).digest('hex');
async function createProfile(db,p,user=uid){const batch=writeBatch(db);batch.set(doc(db,'users',user),p);batch.set(doc(db,'accountEmails',hash(p.email)),{registered:true});batch.set(doc(db,'accountPairs',hash(p.vendorId+'\n'+p.email)),{registered:true});return batch.commit()}
let env;const uid='client-one',email='client@example.com',a='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',b='bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
const profile=(time=1000,id=a,extra={})=>({email,name:'CLIENTE PRUEBA',vendorId:'SONYER',createdAt:serverTimestamp(),updatedAt:serverTimestamp(),authTime:time,installation:id,sessionId:id,active:true,license:'inactive',licenseUntil:null,banned:false,managedAt:null,managedBy:'',...extra});
const signed=(time=1000,user=uid,verified=true)=>env.authenticatedContext(user,{email:user==='admin-owner'?'owner@example.com':email,email_verified:verified,auth_time:time}).firestore();
const admin=()=>signed(2000,'admin-owner',false);
const patch=(db,values,user=uid)=>updateDoc(doc(db,'users',user),{...values,updatedAt:serverTimestamp()});
const manage=(db,values)=>patch(db,{...values,managedAt:serverTimestamp(),managedBy:'admin-owner'});
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-ypfk-pin',firestore:{host:'127.0.0.1',port:8085,rules:fs.readFileSync(path.resolve(__dirname,'../firestore.rules'),'utf8')}})});
beforeEach(async()=>{await env.clearFirestore();await env.withSecurityRulesDisabled(async ctx=>{const db=ctx.firestore();await setDoc(doc(db,'admins','admin-owner'),{enabled:true});await setDoc(doc(db,'vendors','SONYER'),{label:'Sonyer',enabled:true,updatedAt:serverTimestamp()})})});
after(async()=>env?.cleanup());
test('Solo el dueño autenticado crea su cuenta; no exige verificar correo',async()=>{
  await assertFails(createProfile(env.unauthenticatedContext().firestore(),profile()));
  await assertFails(createProfile(signed(1000,'other-client'),profile()));
  await assertFails(createProfile(signed(),profile(1000,a,{vendorId:'INVENTADO'})));
  await assertSucceeds(createProfile(signed(1000,uid,false),profile()));
  await assertFails(getDoc(doc(signed(1000,'other-client'),'users',uid)));
});
test('Cliente no puede activar licencia, desbanearse, cambiar vendedor ni convertirse en administrador',async()=>{
  const db=signed();await assertFails(createProfile(db,profile(1000,a,{license:'active'})));
  await createProfile(db,profile());
  await assertFails(patch(db,{license:'active'}));await assertFails(patch(db,{vendorId:'OTRO'}));
  await assertFails(setDoc(doc(db,'admins',uid),{enabled:true}));
  await manage(admin(),{banned:true});await assertFails(patch(db,{banned:false}));
  await assertFails(getDocs(collection(db,'users')));
});
test('Administrador puede listar clientes, activar/renovar y quitar licencia sin alterar identidad',async()=>{
  await createProfile(signed(),profile());const db=admin();
  await assertSucceeds(getDocs(collection(db,'users')));
  await assertSucceeds(manage(db,{license:'active',licenseUntil:Timestamp.fromMillis(Date.now()+86400000)}));
  await assertSucceeds(manage(db,{license:'active',licenseUntil:null}));
  await assertSucceeds(manage(db,{license:'inactive',licenseUntil:null}));
  await assertFails(manage(db,{email:'fake@example.com'}));await assertFails(manage(db,{name:'OTRO TITULAR'}));
  await assertFails(manage(db,{license:'inventada'}));
});
test('Baneo bloquea contactos y reactivación de sesión; desbaneo restablece el acceso',async()=>{
  const db=signed(),p=doc(db,'users',uid,'contacts','900000003');await createProfile(db,profile());await setDoc(p,{celular:'900000003',titular:'CONTACTO'});
  await assertSucceeds(manage(admin(),{banned:true}));
  await assertFails(getDoc(p));await assertFails(getDocs(collection(db,'users',uid,'contacts')));await assertFails(deleteDoc(p));
  await assertFails(patch(signed(1001),{authTime:1001,installation:b,sessionId:b,active:true}));
  await assertSucceeds(getDoc(doc(db,'users',uid))); // UI may read its own ban status.
  await assertSucceeds(manage(admin(),{banned:false}));await assertSucceeds(getDoc(p));
});
test('Sesión posterior sustituye a la anterior; mismo instante no autoriza otra instalación',async()=>{
  const old=signed(),newer=signed(1001);await createProfile(old,profile());
  await assertFails(patch(old,{installation:b,sessionId:b}));
  await assertSucceeds(patch(newer,{authTime:1001,installation:b,sessionId:b}));
  await assertFails(getDocs(collection(old,'users',uid,'contacts')));await assertFails(patch(old,{active:false}));
  await assertSucceeds(getDocs(collection(newer,'users',uid,'contacts')));
});
test('Cierre no puede revertirse con el mismo token; PIN y credenciales no caben en documentos',async()=>{
  const db=signed();await createProfile(db,profile());await assertSucceeds(patch(db,{active:false}));
  await assertFails(patch(db,{active:true}));await assertSucceeds(patch(signed(1001),{active:true,authTime:1001}));
  await assertFails(patch(signed(1001),{pin:'123456'}));
});
test('Vendedores se administran con rol; registros no pueden inventar IDs',async()=>{
  const db=signed();await assertSucceeds(getDoc(doc(env.unauthenticatedContext().firestore(),'vendors','SONYER')));
  await assertFails(getDocs(collection(db,'vendors')));
  await assertFails(setDoc(doc(db,'vendors','OTRO'),{label:'Otro',enabled:true,updatedAt:serverTimestamp()}));
  await assertSucceeds(setDoc(doc(admin(),'vendors','OTRO'),{label:'Otro',enabled:true,updatedAt:serverTimestamp()}));
  await assertSucceeds(createProfile(db,profile(1000,a,{vendorId:'OTRO'})));
  await setDoc(doc(admin(),'vendors','OTRO'),{label:'Otro',enabled:false,updatedAt:serverTimestamp()});
  await assertFails(createProfile(signed(1000,'new-client'),profile(1000,a,{vendorId:'OTRO'}),'new-client'));
});
test('Revocar el rol en consola retira permisos del panel y contactos validan sus campos',async()=>{
  const db=signed();await createProfile(db,profile());
  await assertFails(setDoc(doc(db,'users',uid,'contacts','900000003'),{celular:'900000004',titular:'CONTACTO'}));
  await env.withSecurityRulesDisabled(ctx=>setDoc(doc(ctx.firestore(),'admins','admin-owner'),{enabled:false}));
  await assertFails(getDocs(collection(admin(),'users')));await assertFails(manage(admin(),{license:'active'}));
});

test('Consulta previa exacta expone solo existencia; no permite listar ni leer perfiles ajenos',async()=>{
 const db=signed(),guest=env.unauthenticatedContext().firestore();await createProfile(db,profile());
 const found=await assertSucceeds(getDoc(doc(guest,'accountPairs',hash('SONYER\n'+email))));require('node:assert/strict').deepEqual(found.data(),{registered:true});
 await assertSucceeds(getDoc(doc(guest,'accountEmails',hash('missing@example.com'))));
 await assertFails(getDocs(collection(guest,'accountEmails')));await assertFails(getDocs(collection(guest,'accountPairs')));await assertFails(getDoc(doc(guest,'users',uid)));
 await assertFails(setDoc(doc(guest,'accountPairs',hash('SONYER\n'+email)),{registered:true}));
});
test('Cliente no puede falsificar índices ni incluir correo, UID o PIN en la consulta pública',async()=>{
 const db=signed();await createProfile(db,profile());
 await assertFails(setDoc(doc(db,'accountPairs',hash('OTRO\n'+email)),{registered:true}));
 await assertFails(setDoc(doc(db,'accountEmails',hash('other@example.com')),{registered:true}));
 await assertFails(setDoc(doc(db,'accountEmails',hash(email)),{registered:true,email}));
 await assertFails(setDoc(doc(db,'accountPairs',hash('SONYER\n'+email)),{registered:true,pin:'123456'}));
 await assertFails(deleteDoc(doc(db,'accountEmails',hash(email))));
});
test('Perfil nuevo exige índices atómicos y panel puede preparar cuentas anteriores con su rol',async()=>{
 const db=signed();await assertFails(setDoc(doc(db,'users',uid),profile()));
 await createProfile(db,profile());const guest=env.unauthenticatedContext().firestore();
 await assertFails(setDoc(doc(db,'system','accountDirectory'),{version:1,count:1,completedAt:serverTimestamp()}));
 await assertSucceeds(setDoc(doc(admin(),'system','accountDirectory'),{version:1,count:1,completedAt:serverTimestamp()}));
 await assertFails(getDoc(doc(guest,'system','accountDirectory')));
});
