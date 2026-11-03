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
    display_name:"Envío de NOX"
   }
  }],
  customer_creation:"always",
  success_url:config.baseUrl+"/success.html?order_id="+order.id+"&session_id={CHECKOUT_SESSION_ID}",
  cancel_url:config.baseUrl+"/cancel.html",
  metadata:{order_id:order.id},
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
 if(session.amount_total!==order.amount_cents)
  throw new Error("Stripe total no coincide con total de NOX");
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
  res.json({currency:"MXN",products,checkout_enabled:config.checkoutEnabled && !!stripe &&
    products.length===6 && products.every(p=>Number.isSafeInteger(p.price_cents)&&p.price_cents>0)});
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
  const result=await inventory.reserve(pool,data.items,data.request_id,config.shippingCents);
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
    shipping_cents:result.shippingCents,checkout_expires_at:result.expiration
   };
  }
  if(new Date(order.checkout_expires_at).getTime()-Date.now()<30*60*1000)
    return jsonError(res,409,"SESSION_STALE","Intenta nuevamente más tarde; el inventario está reservado");
  const session=await createStripeSession(order);
  res.set("Cache-Control","no-store");
  res.json({url:session.url,order_id:order.id});
 }catch(err){
  if(err instanceof inventory.ShopError)
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
