(function(){
  var finished=false;
  window.__YPFK_FAIL__=function(error){
    if(finished)return;
    var host=document.querySelector('app-root');if(!host)return;
    host.innerHTML='<section style="margin:25vh auto 0;max-width:340px;padding:24px;background:white;border-radius:16px;color:#35203d;font:16px sans-serif;text-align:center"><h2>No terminó de abrir</h2><p>Vuelve a intentarlo desde este mismo archivo.</p><button id="reintentar-inicio" style="padding:12px 24px;border:0;border-radius:8px;background:#660185;color:white">Reintentar</button><details style="margin-top:16px"><summary>Ver detalle</summary><p id="detalle-inicio" style="overflow-wrap:anywhere;font-size:12px"></p></details></section>';
    document.getElementById('detalle-inicio').textContent=String(error&&error.message||error||'No se completó el inicio');
    document.getElementById('reintentar-inicio').onclick=function(){location.reload()};
  };
  window.addEventListener('ypfk-ready',function(){finished=true});
  window.addEventListener('error',function(e){if(!finished)window.__YPFK_FAIL__(e.error||e.message||'No se pudo leer un archivo local')});
  window.addEventListener('unhandledrejection',function(e){if(!finished)window.__YPFK_FAIL__(e.reason)});
  setTimeout(function(){if(!finished)window.__YPFK_FAIL__('El inicio tardó demasiado. Extrae la carpeta completa y abre ABRIR_AQUI.html.');},12000);
}());
