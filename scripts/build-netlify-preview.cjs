"use strict";
/* Build an allowlisted static visual demo. Never publish server/ or Stripe keys. */
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const dist=path.join(root,"dist-preview");
fs.rmSync(dist,{recursive:true,force:true});
fs.mkdirSync(path.join(dist,"assets"),{recursive:true});
const read=n=>fs.readFileSync(path.join(root,n),"utf8");
const write=(n,s)=>fs.writeFileSync(path.join(dist,n),s,"utf8");
let html=read("index.html");
html=html.replace(/<div class="announcement"[^>]*>[\s\S]*?<\/div>/,
  '<div class="announcement" role="status">NOX / VISTA PREVIA DE DISEÑO · NO ACEPTA PEDIDOS NI PAGOS</div>');
html=html.replace(/<main id="main">/,
 '<main id="main"><div class="shell preview-alert"><strong>VISTA PREVIA</strong><span>Explora la colección y las tallas. El stock es ilustrativo. Los pagos Stripe están deshabilitados en esta demostración.</span></div>');
html=html.replace(/<button id="checkout"([^>]*)>[\s\S]*?<\/button>/,
 '<button id="checkout" class="button checkout-button" type="button" disabled>Compras no disponibles en la vista previa</button>');
html=html.replace(/<meta name="description"/,
 '<meta name="robots" content="noindex,nofollow"><meta name="description"');
write("index.html",html);
let client=read("scrip.js");
if(!client.includes('fetch("/api/catalog"'))throw new Error("Expected catalog endpoint not found");
client=client.replace('fetch("/api/catalog"','fetch("/preview-catalog.json"');
const start=client.indexOf(" async function checkout(){");
const end=client.indexOf(' ui.products.addEventListener("click",event=>{',start);
if(start<0||end<0)throw new Error("Could not safely remove real checkout code");
client=client.slice(0,start)+
 ' async function checkout(){notify("Vista previa: NOX no acepta pagos.");}\n'+client.slice(end);
if(client.includes('fetch("/api/checkout"'))throw new Error("Unsafe payment call");
write("scrip.js",client);
write("style.css",read("style.css")+"\n.preview-alert{display:flex;align-items:center;gap:15px;margin-top:16px;padding:15px 18px;background:#ebdacb;color:#3f3330;font-size:12px;line-height:1.65}.preview-alert strong{font-size:10px;letter-spacing:.13em}@media(max-width:540px){.preview-alert{flex-direction:column;align-items:flex-start;gap:4px}}\n");
const designs=[
 ["nox-01","NOX ECLIPSE","Gráfico circular original en una playera de concepto."],
 ["nox-02","NOX STATIC","Patrón de franjas geométricas sobre una playera."],
 ["nox-03","NOX ORBIT","Órbitas que se encuentran en una composición minimalista."],
 ["nox-04","NOX PULSE","Trazo rítmico y silueta limpia."],
 ["nox-05","NOX SHIFT","Tipografía y bloques desplazados."],
 ["nox-06","NOX VOID","Estrella abstracta y contraste monocromático."]
];
const products=designs.map(([id,name,description])=>({
 id,name,description,image:"/assets/"+id+".svg",price_cents:49900,
 variants:[{sku:id+"-M",size:"M",available:3},{sku:id+"-L",size:"L",available:2}]
}));
for(const item of designs)fs.copyFileSync(path.join(root,"assets",item[0]+".svg"),path.join(dist,"assets",item[0]+".svg"));
write("preview-catalog.json",JSON.stringify({currency:"MXN",products,
 checkout_enabled:false,shipping:{national_cents:14900,tala_cents:4900,
 free_above_cents:139900,tala_promo_code:"NOXTALA",
 national_available:false,tala_available:false}},null,2)+"\n");
write("_headers",[
 "/*",
 "  X-Robots-Tag: noindex, nofollow",
 "  X-Frame-Options: DENY",
 "  X-Content-Type-Options: nosniff",
 "  Referrer-Policy: strict-origin-when-cross-origin",
 "  Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
 ""
].join("\n"));
write("404.html",'<!doctype html><html lang="es-MX"><meta charset="utf-8"><title>NOX / 404</title><body><h1>NOX</h1><p>Esta vista previa no admite pagos.</p><a href="/">Volver</a></body></html>');
console.log("NOX_PREVIEW_READY",products.length,"designs / payments disabled");
