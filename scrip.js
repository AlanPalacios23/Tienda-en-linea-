"use strict";
(() => {
 const el=id=>document.getElementById(id);
 const ui={
  products:el("productGrid"),status:el("statusMessage"),search:el("search"),refresh:el("refresh"),
  openCart:el("openCart"),closeCart:el("closeCart"),panel:el("cartPanel"),overlay:el("overlay"),
  cartItems:el("cartItems"),bagCount:el("bagCount"),cartLabelCount:el("cartLabelCount"),
  subtotal:el("subtotal"),checkout:el("checkout"),checkoutStatus:el("checkoutStatus"),
  toast:el("toast")
 };
 const money=new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN"});
 const KEY="nox_live_cart_v1";
 let catalog=[];
 let cart={};
 let checkoutAvailable=false;
 let checkoutRequestId=null;
 let lastFocus=null;
 let timer=null;
 const safe=v=>String(v??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
 function notify(message){
  clearTimeout(timer);
  ui.toast.textContent=message;
  ui.toast.hidden=false;
  timer=setTimeout(()=>ui.toast.hidden=true,3600);
 }
 function persist(){
  try{localStorage.setItem(KEY,JSON.stringify(cart));}catch(_){}
 }
 function loadCart(){
  try{
   const value=JSON.parse(localStorage.getItem(KEY)||"{}");
   if(value && !Array.isArray(value) && typeof value==="object")return value;
  }catch(_){}
  return {};
 }
 function variants(){
  return catalog.flatMap(p=>p.variants.map(v=>({...v,product:p})));
 }
 function pruneCart(){
  const allowed=new Map(variants().map(v=>[v.sku,v]));
  const updated={};
  for(const [sku,qty] of Object.entries(cart)){
   const v=allowed.get(sku);
   if(v && Number.isSafeInteger(qty) && qty>0 && v.available>0)
    updated[sku]=Math.min(qty,v.available,5);
  }
  cart=updated;
  persist();
 }
 function getCartLines(){
  const all=new Map(variants().map(v=>[v.sku,v]));
  return Object.entries(cart).map(([sku,qty])=>({variant:all.get(sku),sku,qty}))
   .filter(row=>row.variant && row.qty>0);
 }
 function escapeImgPath(path){
  return /^\/assets\/nox-0[1-6]\.svg$/.test(path)?path:"";
 }
 function card(p){
  const quantity=p.variants.reduce((sum,v)=>sum+v.available,0);
  const price=p.price_cents===null?"Precio por confirmar":money.format(p.price_cents/100);
  const buttons=p.variants.map(v=>{
   const disabled=v.available<=0?"disabled":"";
   return '<button type="button" class="size-choice" data-add="'+safe(v.sku)+'" '+disabled+
     ' aria-label="Agregar '+safe(p.name)+', talla '+v.size+', '+v.available+' disponibles">'+
     '<b>'+safe(v.size)+'</b><span>'+(v.available>0?v.available+" disponibles":"Agotada")+'</span></button>';
  }).join("");
  return '<article class="product-card"><div class="product-image">'+
    '<img loading="lazy" src="'+escapeImgPath(p.image)+'" alt="Ilustración de la playera '+safe(p.name)+'">'+
    '<span class="design-tag">DISEÑO '+safe(p.id.slice(-2))+'</span></div>'+
    '<div class="product-body"><div class="product-topline"><span>NOX / DROP 001</span><span>'+
    (quantity>0?quantity+" en existencia":"AGOTADO")+'</span></div>'+
    '<h3>'+safe(p.name)+'</h3><p>'+safe(p.description)+'</p>'+
    '<div class="price-row"><strong>'+safe(price)+'</strong><span>MXN</span></div>'+
    '<div class="size-header"><strong>Selecciona una talla</strong><span>M · L</span></div>'+
    '<div class="size-options">'+buttons+'</div></div></article>';
 }
 function renderProducts(){
  const term=(ui.search.value||"").trim().toLocaleLowerCase("es-MX");
  const filtered=catalog.filter(p=>(p.name+" "+p.description).toLocaleLowerCase("es-MX").includes(term));
  ui.products.innerHTML=filtered.length?filtered.map(card).join(""):
    '<div class="no-results">No encontramos diseños con esa búsqueda.</div>';
 }
 function renderCart(){
  const lines=getCartLines();
  const count=lines.reduce((n,r)=>n+r.qty,0);
  const allPriced=lines.length>0 && lines.every(r=>Number.isSafeInteger(r.variant.product.price_cents));
  ui.bagCount.textContent=count;
  ui.cartLabelCount.textContent="("+count+")";
  ui.subtotal.textContent=allPriced?
    money.format(lines.reduce((n,r)=>n+r.qty*r.variant.product.price_cents,0)/100):"Por confirmar";
  ui.cartItems.innerHTML=lines.length?lines.map(({variant,sku,qty})=>
    '<article class="cart-item">'+
    '<img src="'+escapeImgPath(variant.product.image)+'" alt="" loading="lazy">'+
    '<div><h3>'+safe(variant.product.name)+'</h3>'+
    '<p>Talla '+safe(variant.size)+'</p><strong>'+
    (variant.product.price_cents===null?"Precio pendiente":money.format(variant.product.price_cents/100))+'</strong>'+
    '<div class="quantity"><button type="button" data-change="'+safe(sku)+'" data-delta="-1" aria-label="Restar una">−</button>'+
    '<span>'+qty+'</span><button type="button" data-change="'+safe(sku)+'" data-delta="1" '+
    (qty>=variant.available?"disabled":"")+' aria-label="Agregar una">+</button>'+
    '<button type="button" data-remove="'+safe(sku)+'" class="remove">Eliminar</button></div></div></article>'
  ).join(""):'<div class="cart-empty"><span>◇</span><h3>Tu bolsa está vacía</h3><p>Explora nuestros seis diseños.</p><button type="button" id="continue" class="button dark-button">Explorar colección ↗</button></div>';
  const ready=checkoutAvailable && allPriced && lines.length>0;
  ui.checkout.disabled=!ready;
  ui.checkoutStatus.textContent=ready?
    "Stripe comprobará el pago. El pedido se confirmará cuando el servidor reciba su notificación.":
    (checkoutAvailable?"Añade una playera para comprar.":"Los pagos aún no están habilitados; estamos finalizando la tienda.");
  persist();
 }
 function updateQuantity(sku,delta){
  const selected=variants().find(v=>v.sku===sku);
  if(!selected)return;
  const before=cart[sku]||0;
  const next=Math.min(before+delta,selected.available,5);
  if(next>0)cart[sku]=next;
  else delete cart[sku];
  checkoutRequestId=null;
  renderCart();
 }
 async function refresh(){
  ui.status.textContent="Actualizando las existencias…";
  try{
   const response=await fetch("/api/catalog",{headers:{"Accept":"application/json"},cache:"no-store"});
   if(!response.ok)throw new Error("catálogo no disponible");
   const data=await response.json();
   if(!Array.isArray(data.products)||data.products.length!==6)throw new Error("catálogo incompleto");
   catalog=data.products;
   checkoutAvailable=data.checkout_enabled===true;
   pruneCart();
   renderProducts();
   renderCart();
   ui.status.textContent=checkoutAvailable?
     "Seis diseños. Selecciona talla M o L. Las existencias se verifican nuevamente al pagar.":
     "Colección de seis diseños · Las compras se habilitarán cuando se confirmen precios, envíos y Stripe.";
  } catch(_) {
   checkoutAvailable=false;
   catalog=[];
   ui.products.innerHTML="";
   ui.status.textContent="No pudimos consultar el inventario. Intenta actualizar la disponibilidad.";
   renderCart();
  }
 }
 function openCart(){
  lastFocus=document.activeElement;
  ui.panel.classList.add("is-open");
  ui.panel.inert=false;
  ui.panel.setAttribute("aria-hidden","false");
  ui.overlay.hidden=false;
  document.body.classList.add("no-scroll");
  ui.openCart.setAttribute("aria-expanded","true");
  ui.closeCart.focus();
 }
 function closeCart(){
  if(!ui.panel.classList.contains("is-open"))return;
  ui.panel.classList.remove("is-open");
  ui.panel.setAttribute("aria-hidden","true");
  ui.panel.inert=true;
  ui.overlay.hidden=true;
  document.body.classList.remove("no-scroll");
  ui.openCart.setAttribute("aria-expanded","false");
  if(lastFocus?.focus)lastFocus.focus();
 }
 function trap(event){
  if(event.key!=="Tab" || !ui.panel.classList.contains("is-open"))return;
  const items=[...ui.panel.querySelectorAll("button:not([disabled])")];
  if(!items.length)return;
  const first=items[0],last=items[items.length-1];
  if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
  if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
 }
 async function checkout(){
  if(ui.checkout.disabled)return;
  ui.checkout.disabled=true;
  ui.checkout.textContent="Conectando con Stripe…";
  const items=getCartLines().map(row=>({sku:row.sku,quantity:row.qty}));
  try{
   if(!checkoutRequestId)checkoutRequestId=crypto.randomUUID();
   const response=await fetch("/api/checkout",{
    method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},
    body:JSON.stringify({items,request_id:checkoutRequestId})
   });
   const data=await response.json();
   if(!response.ok) {
    if(response.status===409 && data.error!=="DUPLICATE_REQUEST")checkoutRequestId=null;
    throw new Error(data.message||"No fue posible iniciar la compra");
   }
   if(typeof data.url!=="string" || !data.url.startsWith("https://checkout.stripe.com/"))
    throw new Error("No recibimos un enlace seguro de Stripe");
   window.location.assign(data.url);
  }catch(err){
   notify(err.message);
   await refresh();
  }finally{
   ui.checkout.textContent="Comprar con Stripe ↗";
   renderCart();
  }
 }
 ui.products.addEventListener("click",event=>{
  const button=event.target.closest("[data-add]");
  if(!button)return;
  updateQuantity(button.dataset.add,1);
  notify("Playera agregada a tu bolsa");
 });
 ui.search.addEventListener("input",renderProducts);
 ui.refresh.addEventListener("click",refresh);
 ui.openCart.addEventListener("click",openCart);
 ui.closeCart.addEventListener("click",closeCart);
 ui.overlay.addEventListener("click",closeCart);
 ui.cartItems.addEventListener("click",event=>{
  const change=event.target.closest("[data-change]");
  const remove=event.target.closest("[data-remove]");
  if(change)updateQuantity(change.dataset.change,Number(change.dataset.delta));
  else if(remove){delete cart[remove.dataset.remove];checkoutRequestId=null;renderCart();}
  else if(event.target.closest("#continue")){closeCart();document.getElementById("coleccion").scrollIntoView({behavior:"smooth"});}
 });
 document.addEventListener("keydown",event=>{
  if(event.key==="Escape")closeCart();
  trap(event);
 });
 ui.checkout.addEventListener("click",checkout);
 ui.panel.inert=true;
 cart=loadCart();
 refresh();
})();
