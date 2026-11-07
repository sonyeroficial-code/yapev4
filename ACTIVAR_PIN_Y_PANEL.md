# Acceso con ID del vendedor, correo y PIN — sin enlaces

Entrega separada: **YPFK_App.zip** para clientes y **YPFK_Panel_Admin.zip** para administrar. Ambos usan el proyecto Firebase **loginv3-a7e62**. No se ha modificado ni desplegado la configuración de tu consola desde aquí.

## Actualización 12: vendedores y marcas de agua por app

Además de las funciones de la versión 11, el panel puede agregar, editar,
bloquear y reactivar vendedores. El dueño puede vincular el UID de una cuenta
de Firebase Authentication al ID de vendedor. Con ese permiso el vendedor
puede entrar con correo y PIN para ver **solo** sus clientes, cambiar la
marca predeterminada de su ID y ocultarla a un cliente en Yape, BBVA, BCP,
Interbank o todas. No puede administrar otros vendedores, cambiar licencias,
ni banear usuarios. Revocar el permiso o bloquear su ID retira el acceso.

Para vincular a uno, primero crea su ID; después el vendedor se registra
en el panel y te entrega el UID que se muestra sin permisos. El dueño usa
**Vincular acceso de vendedores** para relacionar UID e ID. El ID público
no es una credencial. El administrador sigue teniendo todos los controles.

Los usuarios con licencia activa no ven el aviso inferior de licencia. Si
todavía no tienen preferencias de marcas por aplicación, esa licencia oculta
las marcas en todas las apps como antes. **Cuando el vendedor o el dueño
configura las marcas por aplicación, su selección tiene prioridad sobre la
licencia global**: únicamente las apps marcadas para quitar la marca quedan
limpias, aunque la licencia esté activa. En las demás aparece la marca del
vendedor o, si está vacía, **SONYER · @bebote19**. **SIMULACIÓN** se mantiene
siempre visible. Las preferencias se leen en tiempo real.

Publica el **firestore.rules** de esta nueva versión, presente en ambos
ZIP. No se conecta ni modifica el otro panel que utiliza un Firebase
diferente; esa integración queda para una etapa posterior.

## Actualización 11: validación antes del PIN y pantalla del candado

El orden ahora es **ID + correo → comprobar PIN actual en el candado → crear y repetir PIN nuevo → pantalla del QR → ingresar con el nuevo PIN**. El QR no se utiliza para comprobar la clave anterior durante este recorrido.

Antes de probar:

1. Publica el nuevo `firestore.rules` incluido. También se entrega como `Reglas_Firebase_YPFK.txt` para copiar.
2. Reemplaza **ambos** paquetes y abre el panel con tu administrador. La preparación automática recorre todas las cuentas anteriores. Espera el mensaje **Validación de cuentas preparada**. Si falla, publica las reglas correctas y pulsa **Preparar accesos**; no borres cuentas.
3. Abre la app actualizada. Los registros nuevos mantienen sus consultas de existencia automáticamente.

## Actualizar desde la versión con correos

1. Extrae cada ZIP en su propia carpeta y reemplaza todos los archivos de la versión anterior.
2. En **Firebase → Firestore Database → Reglas**, sustituye las reglas anteriores por el contenido completo de **firestore.rules** y pulsa **Publicar**. Ambos ZIP incluyen exactamente las mismas reglas. Este paso es necesario: las anteriores exigían correo verificado.
3. Conserva las cuentas y documentos actuales. No borres Authentication, `users`, `vendors` ni `admins`. El permiso administrador concedido a tu UID sigue siendo válido.
4. Abre **ABRIR_AQUI.html** para la app y **panel.html** para el panel, desde la vista previa de Acode en `http://localhost:...`. No abras con `file://`.

Si tu base sirve a otras apps, integra sus reglas antes de reemplazarlas: el archivo incluido deniega los caminos que no utiliza esta entrega. Nunca uses reglas públicas para corregir un error.

## Configuración de Firebase

- **Authentication → Método de acceso:** activa **Correo electrónico/contraseña**. No necesitas activar enlaces de correo, SMS ni Google. El PIN es la contraseña que comprueba Firebase.
- **Authentication → Configuración → Política de contraseñas:** debe admitir seis caracteres numéricos sin exigir letras ni símbolos. La app rechaza `000000`.
- **Firestore:** base Standard `(default)`, con las reglas incluidas publicadas.
- Esta versión no requiere `appApi`, Cloud Functions, SMTP, Analytics ni Cloud Storage. Está preparada para Spark, dentro de sus cuotas; no es necesario cambiar a Blaze para este flujo. Los accesos requieren internet aunque los archivos de la app estén alojados localmente.

El correo se utiliza como identificador y se normaliza a minúsculas. **No se comprueba que pertenezca a quien lo escribe**, ni se envían enlaces o códigos. La persona necesita el PIN para acceder a una cuenta ya creada. Un PIN de seis números es una clave corta: esta simulación no debe proteger dinero ni cuentas bancarias reales.

## Crear cuenta

**ID del vendedor → titular → correo → Registrar → crear y repetir PIN.**

El formulario conserva la apariencia y el teclado de PIN originales. Primero se valida el vendedor activo y se consulta si el correo ya tiene perfil registrado; la cuenta se crea al confirmar el PIN. Firebase almacena la credencial; Firestore guarda el perfil con licencia inicialmente inactiva. La app no guarda un campo PIN ni contraseñas en Firestore o en su almacenamiento local. No aparece una pantalla adicional de verificación de correo.

Si se corta internet después de crear el usuario de Authentication y antes de guardar el perfil, se puede reintentar el registro con el mismo correo y PIN para completar el perfil. Un registro ya completado no cambia de titular ni de vendedor al volver a intentar.

## Ya tengo una cuenta

1. Escribe **ID del vendedor + correo** y pulsa **Ingresar**.
2. Se comprueba que el vendedor exista y que esa combinación pertenezca a un perfil registrado. Si no coincide, se muestra el error en ese formulario, sin avanzar al PIN.
3. Se muestra la pantalla original del **candado** con **Verifica tu PIN actual**. Firebase comprueba la clave. Un PIN incorrecto no permite cambiarla ni entrar.
4. Aparece **Cambia tu PIN**: crea un PIN nuevo, diferente del anterior, y repítelo. Si la repetición falla no se guarda nada.
5. Tras guardarlo se muestra la pantalla del **QR**. Allí escribe el PIN nuevo para entrar al Home. La verificación anterior no abre el Home.

Este recorrido se aplica cuando eliges **Ya tengo una cuenta**. Al reabrir una instalación ya vinculada se muestra directamente el QR para desbloquear con su PIN; no vuelve a pedir cambiarlo en cada reapertura. Nunca se inicia directamente en Home.

## Validación previa y privacidad

La consulta previa usa `accountEmails` y `accountPairs`, con IDs SHA-256 y documentos cuyo único campo es `registered: true`. Solo se permite consultar una clave exacta; no se permite listar estas colecciones ni leer perfiles públicos. Las reglas verifican que un cliente solo publique las claves que corresponden a su propio perfil autenticado. El administrador puede preparar perfiles anteriores sin modificar su titular, licencia o PIN.

**Esta función permite comprobar la existencia de una cuenta si alguien prueba un correo o una combinación de correo/vendedor.** Los hashes no impiden probar valores conocidos. Esa exposición mínima es necesaria para la comprobación anterior al PIN que se ha solicitado en esta versión sin servidor propio. No publica nombres, UID, PIN, licencias ni datos de contactos, y conocer esa existencia no autoriza entrar o cambiar una clave. No desactiva la protección de enumeración de Firebase Auth ni abre la colección `users`.

Se consultan perfiles completos de esta app. Un usuario creado únicamente en Authentication, sin perfil `users`, no aparece hasta completar un registro válido. Si existe solo en Authentication, la colisión del correo aún puede detectarse al crear el PIN; el SDK cliente no ofrece una consulta privada de todos esos usuarios antes de autenticar.

## Sesiones y otra instalación

Al guardar el cambio se vincula la instalación del navegador y se sustituye la sesión anterior. Los datos protegidos comprueban el instante de autenticación vigente. Se ignoran instantáneas de caché y respuestas atrasadas de una sesión anterior; cada desbloqueo tiene una identificación local distinta para que un sincronizado anterior no cierre el nuevo ingreso.

La instalación guardada localmente no es un identificador físico del teléfono. Borrar datos o cambiar de navegador puede contar como otra instalación. Una persona aún puede compartir voluntariamente sus credenciales; el cliente web no constituye un bloqueo físico imposible de modificar.

El cambio de PIN desde una sesión abierta sigue exigiendo el PIN actual. **Olvido de clave** muestra ayuda para contactar al vendedor; no envía correos y no restablece cuentas solo con ID y correo. El panel no puede restablecer contraseñas de otros usuarios con el SDK cliente. Cualquier recuperación manual requiere que el propietario verifique la identidad por un canal de confianza y utilice una operación administrativa autorizada; esta entrega no automatiza ese proceso.

## Panel separado

Abre **panel.html** o **index.html** del ZIP del panel e ingresa con tu correo y PIN. La sesión del panel es independiente de la sesión de la app.

Una cuenta no obtiene permisos por registrar un correo, usar un ID del vendedor o ser la primera en entrar. El propietario debe habilitar explícitamente su UID:

1. Si aún no tiene cuenta, puede crearla en el panel con correo y PIN repetido; no se envían mensajes.
2. Copia el **UID** mostrado o el de **Authentication → Usuarios**.
3. Desde la consola de confianza crea **admins/{UID}**, campo booleano **enabled = true**.
4. Vuelve al panel y pulsa **Actualizar permisos**. Si ya habías habilitado tu UID, no repitas la creación.

El rol se comprueba por UID; un correo sin verificar no puede apropiarse del UID de otro usuario. Los clientes no pueden crear ni modificar documentos `admins`, incluso si conocen sus IDs.

### Crear ID del vendedor

En el panel pulsa **Crear ID del vendedor**, completa el ID (ejemplo `SONYER`) y un nombre visible, y pulsa **Crear ID**. Usa de 2 a 40 letras, números, guiones o guiones bajos. Se convierte a mayúsculas y se guarda en `vendors` con `enabled = true`.

Desactivarlo impide registros nuevos, pero conserva el acceso y las licencias de clientes existentes. El ID del vendedor es una referencia compartida por sus clientes, no una contraseña ni una autorización administrativa.

### Clientes, licencias y baneo

La tabla muestra vendedor, titular, correo, fecha de registro, licencia y estado de la cuenta. Puedes dar/renovar licencia por 30 días, permanente o hasta una fecha, quitar licencia, banear y desbanear. Los cambios guardan el UID del administrador y la fecha.

La tabla pagina 30 clientes a la vez. El filtro de vendedor se aplica en Firestore; la búsqueda de titular/correo busca en la página cargada. Pulsa **Actualizar** para ver cambios hechos desde otro panel.

Los clientes reciben los cambios de licencia y baneo con conexión a internet. Una licencia vencida se muestra inactiva. El baneo bloquea los datos protegidos y la reactivación de la sesión; no deshabilita globalmente Authentication ni borra datos ya descargados. Revocar `admins/{UID}.enabled` retira permisos del panel.

Las cuentas permiten entrar con licencia activa o inactiva. No se añade una pasarela de cobro. **SIMULACIÓN** permanece en pantallas y comprobantes, también con licencia activa; los saldos y operaciones siguen siendo ficticios y no tienen valor de pago.

La marca de agua del vendedor (o `SONYER · @bebote19` de forma predeterminada) aparece repetida en el panel y en el baucher tiene mayor contraste, incorporada al contenido capturado para compartir o descargar. Cuando hay preferencias individuales, solo desaparece de las apps seleccionadas aunque la licencia global esté activa; sin esas preferencias se respeta la licencia general. El aviso **SIMULACIÓN** nunca se retira.

## Abrir en PC y recompilar

Los ZIP ya contienen los paquetes compilados y todos los recursos recuperados. En PC: `python3 servir.py` y abre `http://localhost:8080/ABRIR_AQUI.html` o `http://localhost:8080/panel.html`, según la carpeta. Node no es necesario para abrirlos.

Las animaciones de **Créditos** y **Tienda** siguen siendo archivos JSON externos a `app-local.js`, en `iconos-home/creditos.json` y `iconos-home/tienda-cyber.json`. La app reutiliza el reproductor Lottie de su código original. Mantén la carpeta `iconos-home` junto al HTML; para que `fetch` pueda leer archivos JSON en Android, abre la vista previa con un servidor local HTTP (por ejemplo, la vista previa web de Acode) y no con un enlace `file://` que bloquee las peticiones.

Para editar/recompilar, con Node 22 o posterior: `npm ci`, `npm run build` y `npm test`. Para reglas, con Firebase CLI y Java compatible: `firebase emulators:exec --only firestore --project demo-ypfk-pin "npm run test:rules"`.

Se conservan los módulos Angular, imágenes, iconos, personajes con billetes, anuncios y demás recursos recuperados. No se reconstruye el repositorio TypeScript original. Los perfiles de versiones antiguas que no cumplen el esquema actual requieren migración por el propietario conservando sus datos; no borres usuarios o contactos para corregirlos. Las cuentas ficticias offline nunca se convierten automáticamente en cuentas Firebase.

## Validación

Las pantallas Angular se probaron con servicios de prueba: errores de vendedor/correo antes del PIN, PIN actual incorrecto, cambio con repetición, llegada al QR solo después del cambio, rechazo del PIN antiguo, reapertura, contactos, licencia, baneo y cierre. También se simularon respuestas de sincronización atrasadas e instantáneas de caché; no cierran una sesión nueva.

Once pruebas contra el emulador oficial Firestore verifican permisos, consulta pública mínima, prohibición de listar índices, rechazo de índices falsificados, creación atómica del perfil/índices y restricciones de administración. El panel prepara los perfiles anteriores y conserva sus controles de licencias/vendedores.

La integración del módulo de acceso con los SDK reales de Auth/Firestore y ambos emuladores comprueba registro, ingreso inicial y repetido, validación de PIN, cambio y acceso con el nuevo PIN, y cierre de la instalación anterior. Esta prueba utiliza persistencia en memoria para aislar cada cliente en Node; las pantallas se comprueban por separado. No crea usuarios ni cambia reglas en tu proyecto real. La prueba completa de red en un navegador DOM emulado no se completó; queda pendiente verificar en tu Android/Acode.

La app compilada se comprueba además al arrancar con el SDK real sin acceder a la nube. Las cuotas Spark se comparten entre todas las cuentas. La consulta y las reglas añaden lecturas, y crear/actualizar los índices añade escrituras; no equivalen a un número fijo de usuarios.

Para probar la integración, con emuladores Auth/Firestore abiertos: `npm run test:integration`. Para arrancarlos con Firebase CLI y Java compatible: `firebase emulators:exec --only auth,firestore --project demo-ypfk-pin "npm run test:integration"`.

Documentación oficial: https://firebase.google.com/docs/auth/web/password-auth , https://firebase.google.com/docs/reference/rules/rules.hashing y https://firebase.google.com/docs/firestore/security/rules-conditions .
