const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');

const root=path.resolve(__dirname,'..');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function main(){
  const page=`<!doctype html><html><body><app-yape-resources>
    <div class="home-icon-item"><div class="home-icon-content"><img class="home-icon-image"></div><span class="home-icon-label">Créditos</span></div>
    <div class="home-icon-item"><div class="home-icon-content"><img class="home-icon-image"></div><span class="home-icon-label">Tienda</span></div>
  </app-yape-resources></body></html>`;
  const dom=new JSDOM(page,{url:'http://localhost:8080/proyecto/ABRIR_AQUI.html',pretendToBeVisual:true,runScripts:'outside-only'});
  const w=dom.window,requested=[],loaded=[];
  try{
    w.fetch=async url=>{
      const file=String(url).split('/').pop();
      assert(['creditos.json','tienda-cyber.json'].includes(file));
      requested.push(String(url));
      return {ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(root,'iconos-home',file),'utf8'))};
    };
    w.__YPFK_HOME_LOTTIE__={loadAnimation(opts){
      assert.equal(opts.renderer,'svg');assert.equal(opts.loop,true);assert.equal(opts.autoplay,true);
      assert(opts.animationData.layers.length>0);
      const svg=w.document.createElementNS('http://www.w3.org/2000/svg','svg');opts.container.append(svg);
      const record={opts,speed:null,destroyed:false};loaded.push(record);
      return{setSpeed(value){record.speed=value},destroy(){record.destroyed=true},addEventListener(event,callback){if(event==='DOMLoaded')queueMicrotask(callback)}};
    }};
    w.eval(fs.readFileSync(path.join(root,'iconos-home/animaciones-home.js'),'utf8'));
    w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
    await sleep(80);
    assert.deepEqual(requested.sort(),[
      'http://localhost:8080/proyecto/iconos-home/creditos.json',
      'http://localhost:8080/proyecto/iconos-home/tienda-cyber.json'
    ].sort(),'Both JSON files are requested externally through the correct relative path');
    assert.equal(loaded.length,2,'Créditos and Tienda both initialize a Lottie animation');
    assert(loaded.every(a=>a.speed===0.85),'Both use the expected playback speed');
    assert.equal(w.document.querySelectorAll('.home-lottie-animation svg').length,2);
    assert([...w.document.querySelectorAll('.home-icon-image')].every(x=>x.style.visibility==='hidden'),'Hide each static image only after its animation is loaded');
    assert(fs.readFileSync(path.join(root,'app-local.js'),'utf8').includes('__YPFK_HOME_LOTTIE__'),'The app bundle exposes its existing Lottie renderer');
    assert(!fs.readFileSync(path.join(root,'entrada-local.js'),'utf8').includes('creditos.json'),'The JSON animations are kept as external assets, not embedded');
    console.log('PASS: Tienda/Créditos use external JSON assets, the Lottie renderer is exposed, animations start and fallback icons hide on load.');
  } finally {dom.window.close()}
}
main().catch(err=>{console.error(err);process.exitCode=1});
