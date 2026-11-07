import{E as St,M as It}from"./chunk-ELW2TH7C.js";import{Pa as yt,Sa as bt,Ta as xt,Ua as k,bb as Ct,c as ut,f as ft,k as ht,r as mt,va as vt,y as gt}from"./chunk-6FZWWC5T.js";import{Ac as z,B as O,Ba as K,Bc as ot,Ea as X,Ec as rt,Fc as st,Gb as T,Hb as _,Hc as at,Ia as N,Ib as A,Kb as D,Lb as tt,Ma as W,Mb as x,Na as J,Oc as lt,P as Y,Pa as w,Qc as dt,Ra as Q,Xb as h,ac as m,ad as ct,bc as p,ca as $,cc as u,dc as g,gd as M,hc as C,hd as f,ia as G,ic as S,jc as U,jd as c,oa as b,ob as l,pa as I,pc as et,qd as pt,ra as E,rc as v,sa as H,sc as it,ta as d,tc as nt,td as j,ua as q,v as F,w as R,yb as Z}from"./chunk-PKUFHZD7.js";var Mt=["*"],y=class{},Et=(()=>{let o=class o extends y{constructor(t){super(),this.http=t}getSvg(t){return this.http.get(t,{responseType:"text"})}};o.\u0275fac=function(e){return new(e||o)(H(gt))},o.\u0275prov=b({token:o,factory:o.\u0275fac});let i=o;return i})(),kt=new E("SERVER_URL"),B=(()=>{let o=class o{constructor(){this.loader=d(y),this.serverUrl=d(kt,{optional:!0}),this.document=d(X),this.iconsByUrl=new Map,this.iconsLoadingByUrl=new Map}addSvg(t,e){if(!this.iconsByUrl.has(t)){let n=this.document.createElement("DIV");n.innerHTML=e;let s=n.querySelector("svg");this.iconsByUrl.set(t,s)}}loadSvg(t,e=t){if(this.serverUrl&&t.match(/^(http(s)?):/)===null&&(t=this.serverUrl+t,e=t),this.iconsByUrl.has(e))return F(this.iconsByUrl.get(e));if(this.iconsLoadingByUrl.has(e))return this.iconsLoadingByUrl.get(e);let n=this.loader.getSvg(t).pipe(O(s=>{let a=this.document.createElement("DIV");return a.innerHTML=s,a.querySelector("svg")}),G(s=>{this.iconsByUrl.set(e,s),this.iconsLoadingByUrl.delete(e)}),Y(s=>(console.error(s),R(s))),$());return this.iconsLoadingByUrl.set(e,n),n}getSvgByName(t){return this.iconsByUrl.has(t)?F(this.iconsByUrl.get(t)):this.iconsLoadingByUrl.has(t)?this.iconsLoadingByUrl.get(t):R(`No svg with name '${t}' has been loaded`)}unloadSvg(t){this.iconsByUrl.has(t)&&this.iconsByUrl.delete(t)}};o.\u0275fac=function(e){return new(e||o)},o.\u0275prov=b({token:o,factory:o.\u0275fac});let i=o;return i})();function Bt(i){return i||new B}var Nt={provide:B,deps:[[new W,new J,B]],useFactory:Bt},L=class{constructor(){this.loaded=!1}},te=(()=>{let o=class o{constructor(){this.element=d(Q),this.differs=d(pt),this.renderer=d(Z),this.iconReg=d(B),this.src=c(),this.name=c(),this.stretch=c(!1),this.applyClass=c(!1),this.svgClass=c(),this.klass=c(void 0,{alias:"class"}),this.viewBox=c(),this.svgAriaLabel=c(),this.onSVGLoaded=c(),this.svg=N(0),this.svgStyle=c(),this.helper=new L,f(()=>{(this.src()||this.name())&&(this.destroy(),this.init(this.src(),this.name()))}),f(()=>{let n=this.viewBox();this.svg()&&this.updateViewBox(n)}),f(()=>{let n=this.svgStyle()||{};this.svg()&&this.applyChanges(this.helper.differ.diff(n))}),f(()=>{let n=this.svg();this.applyClass()?this.setClass(this.elemSvg,null,this.klass()):this.setClass(this.elemSvg,this.klass(),null)});let t;f(()=>{let n=this.svg();this.setClass(this.elemSvg,t,this.svgClass()),t=this.svgClass()});let e;f(()=>{let n=this.svg(),s=this.element.nativeElement;this.setClass(s,e,this.klass()),this.setClass(this.elemSvg,e,this.applyClass()?this.klass():null),e=this.klass()}),f(()=>{let n=this.svg();this.doAria(this.svgAriaLabel())}),f(()=>{let n=this.svg();this.stylize(this.stretch())})}ngOnDestroy(){this.destroy()}get elemSvg(){return this.element.nativeElement.firstChild}init(t,e){if(t&&e){let n=this.iconReg.loadSvg(t,e);n&&(this.helper.icnSub=n.subscribe(s=>this.initSvg(s)))}else if(e){let n=this.iconReg.getSvgByName(e);n&&(this.helper.icnSub=n.subscribe(s=>this.initSvg(s)))}else if(t){let n=this.iconReg.loadSvg(t);n&&(this.helper.icnSub=n.subscribe(s=>this.initSvg(s)))}else this.element.nativeElement.innerHTML="",this.svg.set(0)}initSvg(t){!this.helper.loaded&&t&&this.setSvg(t)}destroy(){this.helper.icnSub?.unsubscribe(),this.helper=new L,this.helper.differ=this.differs.find({}).create()}setSvg(t){if(!this.helper.loaded&&t){this.helper.svg=t;let e=t.cloneNode(!0),n=this.element.nativeElement,s=this?.onSVGLoaded();s&&(e=s(e,n)),n.innerHTML="",this.renderer.appendChild(n,e),this.helper.loaded=!0,this.copyNgContentAttribute(n,e),this.svg.update(a=>a+1)}}updateViewBox(t){if(t){let e=this.elemSvg;if(t==="auto"){let n=e.getAttribute("width"),s=e.getAttribute("height");if(s&&n){let a=`0 0 ${n} ${s}`;this.renderer.setAttribute(e,"viewBox",a),this.renderer.removeAttribute(e,"width"),this.renderer.removeAttribute(e,"height")}}else t!==""&&(this.renderer.setAttribute(e,"viewBox",t),this.renderer.removeAttribute(e,"width"),this.renderer.removeAttribute(e,"height"))}}copyNgContentAttribute(t,e){let n=t.attributes,s=n.length;for(let a=0;a<s;a+=1){let V=n.item(a);if(V&&V.name.startsWith("_ngcontent")){this.setNgContentAttribute(e,V.name);break}}}setNgContentAttribute(t,e){this.renderer.setAttribute(t,e,"");let n=t.childNodes.length;for(let s=0;s<n;s+=1){let a=t.childNodes[s];a instanceof Element&&this.setNgContentAttribute(a,e)}}stylize(t){if(this.helper.svg){let e=this.element.nativeElement.firstChild;t===!0?this.renderer.setAttribute(e,"preserveAspectRatio","none"):t===!1&&this.renderer.removeAttribute(e,"preserveAspectRatio")}}applyChanges(t){t&&(t.forEachRemovedItem(e=>this.setStyle(e.key,null)),t.forEachAddedItem(e=>this.setStyle(e.key,e.currentValue)),t.forEachChangedItem(e=>this.setStyle(e.key,e.currentValue)))}setStyle(t,e){let[n,s]=t.split(".");e=e!==null&&s?`${e}${s}`:e;let a=this.elemSvg;e!==null?this.renderer.setStyle(a,n,e):this.renderer.removeStyle(a,n)}setClass(t,e,n){if(t){if(e){let s=(Array.isArray(e)?e:e.split(" ")).filter(a=>a);for(let a of s)this.renderer.removeClass(t,a)}if(n){let s=(Array.isArray(n)?n:n.split(" ")).filter(a=>a);for(let a of s)this.renderer.addClass(t,a)}}}doAria(t){if(t!==void 0){let e=this.element.nativeElement.firstChild;e&&!e.hasAttribute("aria-label")&&(t===""?(this.renderer.setAttribute(e,"aria-hidden","true"),this.renderer.removeAttribute(e,"aria-label")):(this.renderer.removeAttribute(e,"aria-hidden"),this.renderer.setAttribute(e,"aria-label",t)))}}};o.\u0275fac=function(e){return new(e||o)},o.\u0275cmp=T({type:o,selectors:[["svg-icon"]],inputs:{src:[1,"src"],name:[1,"name"],stretch:[1,"stretch"],applyClass:[1,"applyClass"],svgClass:[1,"svgClass"],klass:[1,"class","klass"],viewBox:[1,"viewBox"],svgAriaLabel:[1,"svgAriaLabel"],onSVGLoaded:[1,"onSVGLoaded"],svgStyle:[1,"svgStyle"]},ngContentSelectors:Mt,decls:1,vars:0,template:function(e,n){e&1&&(it(),nt(0))},encapsulation:2,changeDetection:0});let i=o;return i})();function ee(i={}){return q([Nt,i.loader||{provide:y,useClass:Et}])}var ie=(()=>{let o=class o{static forRoot(t={}){return{ngModule:o,providers:[Nt,t.loader||{provide:y,useClass:Et}]}}};o.\u0275fac=function(e){return new(e||o)},o.\u0275mod=_({type:o}),o.\u0275inj=I({});let i=o;return i})();var Lt=i=>({"text-2xl":i});function Vt(i,o){i&1&&U(0)}function Ft(i,o){if(i&1&&(C(0),x(1,Vt,1,0,"ng-container",2),S()),i&2){v();let r=z(3);l(),m("ngTemplateOutlet",r)}}function Rt(i,o){i&1&&U(0)}function Ut(i,o){if(i&1&&(C(0),p(1,"div",3)(2,"div",4),x(3,Rt,1,0,"ng-container",2),u(),p(4,"div",5),st(5),u()(),S()),i&2){let r=v(),t=z(3);l(),m("ngClass",r.config.containerClass),l(2),m("ngTemplateOutlet",t),l(),m("ngClass",r.config.fontClass),l(),at(" ",r.label," ")}}function zt(i,o){if(i&1&&(C(0),g(1,"i",6),S()),i&2){let r=v(2);l(),ot("color",r.onlyIcon?"#626262":"#00bfa5"),m("ngClass",dt(3,Lt,r.size!=18))}}function jt(i,o){if(i&1&&(C(0),p(1,"div",7),K(),p(2,"svg",8)(3,"rect",9),g(4,"animate",10),u(),p(5,"rect",11),g(6,"animate",12),u(),p(7,"rect",13),g(8,"animate",14),u(),p(9,"rect",15),g(10,"animate",16),u(),p(11,"rect",17),g(12,"animate",18),u(),p(13,"rect",19),g(14,"animate",20),u(),p(15,"rect",21),g(16,"animate",22),u(),p(17,"rect",23),g(18,"animate",24),u()()(),S()),i&2){let r=v(2);l(2),h("width",r.effectiveSize)("height",r.effectiveSize),l(),h("fill",r.loaderColor),l(2),h("fill",r.loaderColor),l(2),h("fill",r.loaderColor),l(2),h("fill",r.loaderColor),l(2),h("fill",r.loaderColor),l(2),h("fill",r.loaderColor),l(2),h("fill",r.loaderColor),l(2),h("fill",r.loaderColor)}}function Pt(i,o){if(i&1&&x(0,zt,2,5,"ng-container",1)(1,jt,19,10,"ng-container",1),i&2){let r=v();m("ngIf",!r.config.useCustomLoader),l(),m("ngIf",r.config.useCustomLoader)}}var Ot={ios:{fontClass:"font-medium",containerClass:"",useCustomLoader:!0,defaultSize:28},android:{fontClass:"font-bold text-xl",containerClass:"my-2",useCustomLoader:!1,defaultSize:36}},wt=class i{device=d(St);onlyIcon=!1;label="Yapeando";size;color;get config(){return Ot[this.device.isIPhone?"ios":"android"]}get effectiveSize(){return this.size??this.config.defaultSize}get loaderColor(){return this.color??(this.onlyIcon?"#626262":"#8B5AAE")}static \u0275fac=function(r){return new(r||i)};static \u0275cmp=T({type:i,selectors:[["app-yape-load"]],inputs:{onlyIcon:"onlyIcon",label:"label",size:"size",color:"color"},decls:4,vars:2,consts:[["loaderTemplate",""],[4,"ngIf"],[4,"ngTemplateOutlet"],[1,"pt-3","text-center",3,"ngClass"],[1,"mt-2"],[1,"mt-3",3,"ngClass"],[1,"pi","pi-spin","pi-spinner","font-bold",3,"ngClass"],[1,"flex","align-items-center","justify-content-center"],["viewBox","0 0 100 100"],["x","44","y","2","width","12","height","28","rx","6","ry","6","transform","rotate(0 50 50)"],["attributeName","opacity","values","1;0.2;0.2","dur","0.8s","begin","0s","repeatCount","indefinite"],["x","44","y","2","width","12","height","28","rx","6","ry","6","transform","rotate(45 50 50)"],["attributeName","opacity","values","1;0.2;0.2","dur","0.8s","begin","0.1s","repeatCount","indefinite"],["x","44","y","2","width","12","height","28","rx","6","ry","6","transform","rotate(90 50 50)"],["attributeName","opacity","values","1;0.2;0.2","dur","0.8s","begin","0.2s","repeatCount","indefinite"],["x","44","y","2","width","12","height","28","rx","6","ry","6","transform","rotate(135 50 50)"],["attributeName","opacity","values","1;0.2;0.2","dur","0.8s","begin","0.3s","repeatCount","indefinite"],["x","44","y","2","width","12","height","28","rx","6","ry","6","transform","rotate(180 50 50)"],["attributeName","opacity","values","1;0.2;0.2","dur","0.8s","begin","0.4s","repeatCount","indefinite"],["x","44","y","2","width","12","height","28","rx","6","ry","6","transform","rotate(225 50 50)"],["attributeName","opacity","values","1;0.2;0.2","dur","0.8s","begin","0.5s","repeatCount","indefinite"],["x","44","y","2","width","12","height","28","rx","6","ry","6","transform","rotate(270 50 50)"],["attributeName","opacity","values","1;0.2;0.2","dur","0.8s","begin","0.6s","repeatCount","indefinite"],["x","44","y","2","width","12","height","28","rx","6","ry","6","transform","rotate(315 50 50)"],["attributeName","opacity","values","1;0.2;0.2","dur","0.8s","begin","0.7s","repeatCount","indefinite"]],template:function(r,t){r&1&&x(0,Ft,2,1,"ng-container",1)(1,Ut,6,4,"ng-container",1)(2,Pt,2,2,"ng-template",null,0,ct),r&2&&(m("ngIf",t.onlyIcon),l(),m("ngIf",!t.onlyIcon))},dependencies:[mt,ut,ft,ht],encapsulation:2})};var Tt=(()=>{class i extends xt{modelValue=N(void 0);$filled=M(()=>vt(this.modelValue()));writeModelValue(r){this.modelValue.set(r)}static \u0275fac=(()=>{let r;return function(e){return(r||(r=w(i)))(e||i)}})();static \u0275dir=A({type:i,features:[D]})}return i})();var _t=`
    .p-inputtext {
        font-family: inherit;
        font-feature-settings: inherit;
        font-size: 1rem;
        color: dt('inputtext.color');
        background: dt('inputtext.background');
        padding-block: dt('inputtext.padding.y');
        padding-inline: dt('inputtext.padding.x');
        border: 1px solid dt('inputtext.border.color');
        transition:
            background dt('inputtext.transition.duration'),
            color dt('inputtext.transition.duration'),
            border-color dt('inputtext.transition.duration'),
            outline-color dt('inputtext.transition.duration'),
            box-shadow dt('inputtext.transition.duration');
        appearance: none;
        border-radius: dt('inputtext.border.radius');
        outline-color: transparent;
        box-shadow: dt('inputtext.shadow');
    }

    .p-inputtext:enabled:hover {
        border-color: dt('inputtext.hover.border.color');
    }

    .p-inputtext:enabled:focus {
        border-color: dt('inputtext.focus.border.color');
        box-shadow: dt('inputtext.focus.ring.shadow');
        outline: dt('inputtext.focus.ring.width') dt('inputtext.focus.ring.style') dt('inputtext.focus.ring.color');
        outline-offset: dt('inputtext.focus.ring.offset');
    }

    .p-inputtext.p-invalid {
        border-color: dt('inputtext.invalid.border.color');
    }

    .p-inputtext.p-variant-filled {
        background: dt('inputtext.filled.background');
    }

    .p-inputtext.p-variant-filled:enabled:hover {
        background: dt('inputtext.filled.hover.background');
    }

    .p-inputtext.p-variant-filled:enabled:focus {
        background: dt('inputtext.filled.focus.background');
    }

    .p-inputtext:disabled {
        opacity: 1;
        background: dt('inputtext.disabled.background');
        color: dt('inputtext.disabled.color');
    }

    .p-inputtext::placeholder {
        color: dt('inputtext.placeholder.color');
    }

    .p-inputtext.p-invalid::placeholder {
        color: dt('inputtext.invalid.placeholder.color');
    }

    .p-inputtext-sm {
        font-size: dt('inputtext.sm.font.size');
        padding-block: dt('inputtext.sm.padding.y');
        padding-inline: dt('inputtext.sm.padding.x');
    }

    .p-inputtext-lg {
        font-size: dt('inputtext.lg.font.size');
        padding-block: dt('inputtext.lg.padding.y');
        padding-inline: dt('inputtext.lg.padding.x');
    }

    .p-inputtext-fluid {
        width: 100%;
    }
`;var Yt=`
    ${_t}

    /* For PrimeNG */
   .p-inputtext.ng-invalid.ng-dirty {
        border-color: dt('inputtext.invalid.border.color');
    }

    .p-inputtext.ng-invalid.ng-dirty::placeholder {
        color: dt('inputtext.invalid.placeholder.color');
    }
`,$t={root:({instance:i})=>["p-inputtext p-component",{"p-filled":i.$filled(),"p-inputtext-sm":i.pSize==="small","p-inputtext-lg":i.pSize==="large","p-invalid":i.invalid(),"p-variant-filled":i.$variant()==="filled","p-inputtext-fluid":i.hasFluid}]},At=(()=>{class i extends yt{name="inputtext";style=Yt;classes=$t;static \u0275fac=(()=>{let r;return function(e){return(r||(r=w(i)))(e||i)}})();static \u0275prov=b({token:i,factory:i.\u0275fac})}return i})();var Dt=new E("INPUTTEXT_INSTANCE"),ke=(()=>{class i extends Tt{hostName="";ptInputText=c();bindDirectiveInstance=d(k,{self:!0});$pcInputText=d(Dt,{optional:!0,skipSelf:!0})??void 0;ngControl=d(It,{optional:!0,self:!0});pcFluid=d(Ct,{optional:!0,host:!0,skipSelf:!0});pSize;variant=c();fluid=c(void 0,{transform:j});invalid=c(void 0,{transform:j});$variant=M(()=>this.variant()||this.config.inputStyle()||this.config.inputVariant());_componentStyle=d(At);constructor(){super(),f(()=>{this.ptInputText()&&this.directivePT.set(this.ptInputText())})}onAfterViewInit(){this.writeModelValue(this.ngControl?.value??this.el.nativeElement.value),this.cd.detectChanges()}onAfterViewChecked(){this.bindDirectiveInstance.setAttrs(this.ptm("root"))}onDoCheck(){this.writeModelValue(this.ngControl?.value??this.el.nativeElement.value)}onInput(){this.writeModelValue(this.ngControl?.value??this.el.nativeElement.value)}get hasFluid(){return this.fluid()??!!this.pcFluid}static \u0275fac=function(t){return new(t||i)};static \u0275dir=A({type:i,selectors:[["","pInputText",""]],hostVars:2,hostBindings:function(t,e){t&1&&et("input",function(s){return e.onInput(s)}),t&2&&rt(e.cx("root"))},inputs:{hostName:"hostName",ptInputText:[1,"ptInputText"],pSize:"pSize",variant:[1,"variant"],fluid:[1,"fluid"],invalid:[1,"invalid"]},features:[lt([At,{provide:Dt,useExisting:i},{provide:bt,useExisting:i}]),tt([k]),D]})}return i})(),Be=(()=>{class i{static \u0275fac=function(t){return new(t||i)};static \u0275mod=_({type:i});static \u0275inj=I({})}return i})();export{te as a,ee as b,ie as c,wt as d,Tt as e,ke as f,Be as g};
