import {firebaseRequest} from './firebase-client.js?v=logout-persistente-1';
import { __DemoHttpResponse as HttpResponse, __DemoHttpError as HttpErrorResponse } from './chunk-6FZWWC5T.js';
import { l as Observable, v as of, w as throwError } from './chunk-PKUFHZD7.js';

export function demoInterceptor(request, next) {
  const url = new URL(request.url, document.baseURI);
  if (!url.href.startsWith(globalThis.__YPFK_DEMO_API__ + '/')) return next(request);
  const path = url.href.slice((globalThis.__YPFK_DEMO_API__ + '/').length).split('?')[0];
  const { read, store, root } = globalThis.__YPFK_DEMO_STATE__;
  const body = request.body || {};
  const image = file => new URL(file, root).href;
  const ok = data => of(new HttpResponse({ status: 200, body: data, url: request.url }));
  const fail = (msg, status = 400) => throwError(() => new HttpErrorResponse({
    status, url: request.url, error: { msg, code: 'LOCAL_DEMO' }
  }));
  const remotePath=path.startsWith('auth/')||path.startsWith('search/contacts')||path==='search/osiptel';
  if(remotePath){
    return new Observable(observer=>{
      let cancelled=false;
      firebaseRequest(path,request.method,body,url.searchParams).then(result=>{
        if(!cancelled){observer.next(new HttpResponse({status:200,body:result,url:request.url}));observer.complete();}
      }).catch(error=>{
        if(!cancelled)observer.error(new HttpErrorResponse({status:error.status||503,url:request.url,error:{...error.details,code:error.code||'CONNECTION_ERROR',msg:error.message}}));
      });
      return()=>{cancelled=true};
    });
  }
  switch (path) {
    case 'resources/get_resellers': return ok({
      supplier: '000000000000000000000000', resellers: [{ username: 'DEMO LOCAL', whatsapp: '', telegram: 'bebote19', instagram: '', tiktok: '' }],
      apk: '', support: 'default', qr: null, payments: null, logo: image('branding/bebote-sonyer.png')
    });
    case 'resources/get_resources': return ok({
      icons: [
        { title: "Recargar celular", img: image("iconos-home/recargar-celular.jpg") },
        { title: "Yapear servicios", img: image("iconos-home/yapear-servicios.svg") },
        { title: "Promos", img: image("iconos-home/promos.jpg") },
        { title: "Aprobar compras", img: image("iconos-home/aprobar-compras.jpg") },
        { title: "Créditos", img: image("bcp/icons/credit.svg") },
        // Gaming y Tienda intercambian posiciones para separar ambas animaciones.
        { title: "Gaming", img: image("iconos-home/gaming.png") },
        { title: "Dólares", img: image("iconos-home/dolares.jpg") },
        { title: "Remesas", img: image("iconos-home/remesas.jpg") },
        { title: "SOAT", img: image("iconos-home/soat.jpg") },
        { title: "Recargar Transportes", img: image("iconos-home/recargar-transportes.jpg") },
        { title: "Tienda", img: image("font-icons/box.svg") },
        { title: "Ver todo", img: image("iconos-home/ver-todo.jpg") }
      ],
      // Los anuncios del comprobante nunca se mezclan con el carrusel del inicio.
      banners: [
        {id:'original-banner',img:image('anuncios/anuncios-baucher/anuncio_1.webp')},
        {id:'original-publicidad',img:image('anuncios/anuncios-baucher/anuncio_2.webp')}
      ],
      publicitys: [
        {id:'home-recargar',img:image('anuncios/anuncios-home/anuncio_1.jpg')},
        {id:'home-servicios',img:image('anuncios/anuncios-home/anuncio_2.jpg')},
        {id:'home-gaming',img:image('anuncios/anuncios-home/anuncio_3.jpg')},
        {id:'home-seguro-lg',img:image('anuncios/anuncios-home/anuncio_4.webp')},
        {id:'home-seguro-vida',img:image('anuncios/anuncios-home/anuncio_5.webp')},
        {id:'home-limagas',img:image('anuncios/anuncios-home/anuncio_6.webp')}
      ],
      tutorials: []
    });
    case 'products/get_products': return ok([]);
    case 'notifications/get_notifications': return ok([]);
    case 'store/get_store': return ok({ useOwn: true, items: [] });
    case 'search/osiptel': return fail('No hay consultas de personas en la demo. Introduce un contacto de prueba manualmente.');
    default:
      return fail('Esta función requiere un servicio externo y no está disponible en la demo local.', 501);
  }
}
