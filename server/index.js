"use strict";
const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");
const express=require("express");
const helmet=require("helmet");
const {rateLimit}=require("express-rate-limit");
const {Pool}=require("pg");
const Stripe=require("stripe");
const {settings}=require("./config");
const inventory=require("./inventory");
const pricing=require("./pricing");
const config=settings();
const pool=new Pool({connectionString:config.databaseUrl,max:12});
const stripe=config.stripeKey?new Stripe(config.stripeKey,{apiVersion:"2026-09-30.endive"}):null;
const app=express();
if(config.trustProxy)app.set("trust proxy",1);
app.disable("x-powered-by");
app.use(helmet({
 contentSecurityPolicy:{
  directives:{
   defaultSrc:["'self'"],
   styleSrc:["'self'"],
   scriptSrc:["'self'"],
   imgSrc:["'self'","data:"],
   connectSrc:["'self'"],
   baseUri:["'none'"],
   formAction:["'self'","https://checkout.stripe.com"],
   frameAncestors:["'none'"],
   upgradeInsecureRequests:config.baseUrl.startsWith("https:")?[]:null
  }
 }
}));
function jsonError(res,status,code,message){
 res.status(status).json({error:code,message});
}
function isId(value){return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value||"");}
function orderLetters(id){return [...crypto.createHash("sha256").update(id).digest().subarray(0,8)].map(b=>String.fromCharCode(97+b%26)).join("");}
function clientPayload(order) {
 const expiration=Math.floor(new Date(order.checkout_expires_at || order.expiration).getTime()/1000);
 return {
  mode:"payment",
  client_reference_id:order.id,
  expires_at:expiration,
  integration_identifier:"nox_web_"+orderLetters(order.id),
  line_items:order.lines.map(item=>({
   price_data:{
    currency:"mxn",
    unit_amount:item.unit_price_cents,
    product_data:{name:item.name+" · "+item.sku.slice(-1),metadata:{sku:item.sku}}
   },
   quantity:item.quantity
  })),
  shipping_address_collection:{allowed_countries:["MX"]},
  shipping_options:[{
   shipping_rate_data:{
    type:"fixed_amount",
    fixed_amount:{amount:order.shipping_cents,currency:"mxn"},
    display_name:order.shipping_zone==="tala"?
      "Entrega NOX VIP · Tala (sujeta a cobertura)":
      (order.shipping_cents===0?"Envío DHL Express · Gratis":"Envío DHL Express · Nacional")
   }
  }],
  allow_promotion_codes:order.shipping_zone==="tala",
  customer_creation:"always",
  success_url:config.baseUrl+"/success.html?order_id="+order.id+"&session_id={CHECKOUT_SESSION_ID}",
  cancel_url:config.baseUrl+"/cancel.html",
  metadata:{order_id:order.id,shipping_zone:order.shipping_zone},
  custom_text:{submit:{message:order.shipping_zone==="tala"?
    "Si vives en Tala, ingresa NOXTALA para obtener $100 de descuento por playera. Solo válido en la ciudad de Tala, Jalisco.":
    "Envío nacional por DHL Express. Plazo estimado de entrega sujeto a cobertura."}},
  payment_intent_data:{metadata:{order_id:order.id}}
 };
}
async function createStripeSession(order){
 if(!stripe)throw new Error("Stripe no configurado");
 const payload=clientPayload(order);
 // La etiqueta es determinista por orden para respetar la idempotencia.
 const session=await stripe.checkout.sessions.create(payload,{
  idempotencyKey:"nox-order-"+order.id
 });
 if(!session.url)throw new Error("Stripe no devolvió URL");
 // El importe definitivo se verifica en el webhook. Checkout puede aplicar
 // código NOXTALA y escoger envío tras mostrar la pantalla de pago.
 if(session.currency && session.currency!=="mxn")
   throw new Error("Stripe devolvió una moneda diferente a MXN");
 await inventory.attachSession(pool,order.id,session.id);
 return session;
}
app.post("/api/stripe/webhook",express.raw({type:"application/json",limit:"120kb"}),async(req,res)=>{
 if(!stripe || !config.webhookSecret)return res.status(503).end();
 let event;
 try{
  event=stripe.webhooks.constructEvent(req.body,req.headers["stripe-signature"],config.webhookSecret);
 }catch(_){return res.status(400).end();}
 try{
  await inventory.handleStripeEvent(pool,event);
  res.status(200).json({received:true});
 }catch(err){
  console.error("NOX_WEBHOOK_RETRY",err.code||"unhandled");
  res.status(500).end(); // Stripe reintentará.
 }
});
app.use(express.json({limit:"18kb"}));
app.get("/api/healthz",async(req,res)=>{
 try{await pool.query("SELECT 1");res.json({ok:true,checkoutConfigured:config.checkoutEnabled,liveMode:config.liveMode});}
 catch(_){res.status(503).json({ok:false});}
});
app.get("/api/catalog",async(req,res)=>{
 try{
  const q=await pool.query(
   "SELECT d.id,d.name,d.description,d.artwork_path,d.price_cents,i.sku,i.size,"+
   "GREATEST(i.total-i.reserved-i.sold,0)::integer AS available "+
   "FROM designs d JOIN inventory i ON i.design_id=d.id "+
   "WHERE d.active=true ORDER BY d.id,i.size"
  );
  const catalog=new Map();
  for(const row of q.rows) {
   if(!catalog.has(row.id))catalog.set(row.id,{
    id:row.id,name:row.name,description:row.description,image:row.artwork_path,
    price_cents:row.price_cents,variants:[]
   });
   catalog.get(row.id).variants.push({sku:row.sku,size:row.size,available:row.available});
  }
  const products=[...catalog.values()];
  res.set("Cache-Control","no-store");
  res.json({currency:"MXN",products,shipping:{
    national_cents:pricing.NATIONAL_SHIPPING_CENTS,
    free_above_cents:pricing.FREE_SHIPPING_ABOVE_CENTS,
    tala_cents:pricing.LOCAL_SHIPPING_CENTS,
    tala_promo_code:"NOXTALA",
    national_available:config.dhlReady,
    tala_available:config.talaVipReady
   },checkout_enabled:config.checkoutEnabled && !!stripe &&
    (config.talaVipReady || config.dhlReady) && products.length===6 && products.every(p=>p.price_cents===pricing.PRICE_CENTS)});
 }catch(err){
  console.error("NOX_CATALOG_ERROR",err.code||"unknown");
  jsonError(res,503,"CATALOG_UNAVAILABLE","El catálogo no está disponible temporalmente");
 }
});
app.get("/api/orders/:id/status",async(req,res)=>{
 if(!isId(req.params.id))return jsonError(res,400,"INVALID_ID","ID no válido");
 try{
  const row=await pool.query("SELECT status FROM orders WHERE id=$1",[req.params.id]);
  res.set("Cache-Control","no-store");
  if(!row.rows.length)return jsonError(res,404,"NOT_FOUND","Pedido no encontrado");
  res.json({status:row.rows[0].status});
 }catch(_){jsonError(res,503,"TEMPORARY","No se puede consultar el pedido");}
});
const checkoutLimiter=rateLimit({windowMs:15*60*1000,limit:8,standardHeaders:"draft-8",legacyHeaders:false,
  message:{error:"RATE_LIMITED",message:"Demasiados intentos de pago. Intenta nuevamente más tarde."}});
app.post("/api/checkout",checkoutLimiter,async(req,res)=>{
 if(!config.checkoutEnabled || !stripe)
  return jsonError(res,503,"CHECKOUT_DISABLED","Próximamente podrás pagar aquí");
 const data=req.body;
 try{
  if(!data||typeof data!=="object")throw new inventory.ShopError(400,"Carrito inválido","INVALID_CART");
  const delivery={
   shipping_zone:data.shipping_zone,
   address:{country:"MX",city:data.city,state:data.state,postal_code:data.postal_code}
  };
  pricing.validateZone(delivery.shipping_zone,delivery.address);
  if(delivery.shipping_zone==="tala" && !config.talaVipReady)
    return jsonError(res,503,"LOCAL_DELIVERY_PENDING","La entrega VIP Tala aún no está habilitada");
  if(delivery.shipping_zone==="national" && !config.dhlReady)
    return jsonError(res,503,"NATIONAL_DELIVERY_PENDING","El envío DHL aún no está habilitado");
  // Validate promotion configured in this Stripe account before reserving stock.
  if(delivery.shipping_zone==="tala"){
   const promo=await stripe.promotionCodes.retrieve(config.localPromoId);
   if(!promo.active || String(promo.code).toUpperCase()!=="NOXTALA" ||
      promo.coupon?.percent_off!==20.04)
      return jsonError(res,503,"PROMO_UNAVAILABLE","La promoción NOXTALA no está configurada en Stripe");
  }
  const result=await inventory.reserve(pool,data.items,data.request_id,delivery);
  let order;
  if(result.existing){
   if(result.status==="paid")
    return jsonError(res,409,"ALREADY_PAID","Este pedido ya fue pagado");
   if(["expired","failed","needs_review","payment_pending"].includes(result.status))
    return jsonError(res,409,"ORDER_NOT_PAYABLE","Inicia un nuevo intento de compra");
   order=await inventory.snapshot(pool,result.id);
   if(result.stripe_session_id){
    const session=await stripe.checkout.sessions.retrieve(result.stripe_session_id);
    if(session.status==="open" && session.url)return res.json({url:session.url,order_id:order.id});
    return jsonError(res,409,"SESSION_CLOSED","Inicia un nuevo intento");
   }
  }else{
   order={
    id:result.id,lines:result.lines,amount_cents:result.amountCents,
    shipping_cents:result.shippingCents,shipping_zone:result.shippingZone,checkout_expires_at:result.expiration
   };
  }
  if(new Date(order.checkout_expires_at).getTime()-Date.now()<30*60*1000)
    return jsonError(res,409,"SESSION_STALE","Intenta nuevamente más tarde; el inventario está reservado");
  const session=await createStripeSession(order);
  res.set("Cache-Control","no-store");
  res.json({url:session.url,order_id:order.id});
 }catch(err){
  if(err instanceof inventory.ShopError || err instanceof pricing.PricingError)
   return jsonError(res,err.httpStatus,err.code,err.message);
  if(err.code==="23505")
   return jsonError(res,409,"DUPLICATE_REQUEST","Este checkout ya se está procesando; inténtalo de nuevo");
  console.error("NOX_CHECKOUT_ERROR",err.code||"unhandled");
  jsonError(res,503,"CHECKOUT_UNAVAILABLE","No se pudo iniciar el pago; se conserva tu intento por seguridad");
 }
});
const root=path.resolve(__dirname,"..");
const pages=["index.html","success.html","cancel.html"];
app.get("/",(_,res)=>res.sendFile(path.join(root,"index.html")));
for(const page of pages)app.get("/"+page,(_,res)=>res.sendFile(path.join(root,page)));
for(const file of ["style.css","scrip.js","success.js"]){
 app.get("/"+file,(_,res)=>res.sendFile(path.join(root,file)));
}
app.use("/assets",express.static(path.join(root,"assets"),{fallthrough:false,maxAge:"1d"}));
app.use((_,res)=>res.status(404).type("text/plain").send("No encontrado"));
const server=app.listen(config.port,()=>console.log("NOX_API_LISTENING",config.port));
function stop(){server.close(()=>pool.end().catch(()=>{}));}
process.on("SIGTERM",stop);
process.on("SIGINT",stop);
