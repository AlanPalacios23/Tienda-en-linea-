"use strict";
const crypto=require("node:crypto");
const pricing=require("./pricing");
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SKU=/^nox-0[1-6]-(M|L)$/;
class ShopError extends Error{
  constructor(httpStatus,message,code){super(message);this.httpStatus=httpStatus;this.code=code;}
}
function parseItems(raw){
  if(!Array.isArray(raw) || raw.length<1 || raw.length>12)
    throw new ShopError(400,"Carrito no válido","INVALID_CART");
  const counted=new Map();
  for(const item of raw){
    if(!item || !SKU.test(item.sku) || !Number.isSafeInteger(item.quantity) ||
      item.quantity<1 || item.quantity>5)
      throw new ShopError(400,"Variante o cantidad incorrecta","INVALID_ITEM");
    counted.set(item.sku,(counted.get(item.sku)||0)+item.quantity);
  }
  if([...counted.values()].some(q=>q>5))
    throw new ShopError(400,"Cantidad excesiva","INVALID_QUANTITY");
  return [...counted.entries()].sort((a,b)=>a[0].localeCompare(b[0]))
    .map(([sku,quantity])=>({sku,quantity}));
}
function verifyRequestId(id){
  if(typeof id!=="string" || !UUID.test(id))
    throw new ShopError(400,"Identificador de compra no válido","INVALID_REQUEST_ID");
  return id;
}
async function transaction(pool,fn){
  const client=await pool.connect();
  try{
    await client.query("BEGIN");
    const result=await fn(client);
    await client.query("COMMIT");
    return result;
  } catch(e) {
    try{await client.query("ROLLBACK");}catch(_){}
    throw e;
  } finally {client.release();}
}
async function reserve(pool,cart,requestId,delivery){
  if(!delivery || typeof delivery!=="object")throw new pricing.PricingError("Dirección necesaria");
  const zone=pricing.validateZone(delivery.shipping_zone,delivery.address);
  const {city,state,postal_code}=delivery.address;
  const items=parseItems(cart);
  verifyRequestId(requestId);

  return transaction(pool,async db=>{
    const previous=await db.query("SELECT id,status,stripe_session_id FROM orders WHERE request_id=$1 FOR UPDATE",[requestId]);
    if(previous.rows.length) return {existing:true,...previous.rows[0]};
    const found=await db.query(
      "SELECT i.sku,i.total,i.reserved,i.sold,d.name,d.price_cents "+
      "FROM inventory i JOIN designs d ON d.id=i.design_id "+
      "WHERE i.sku=ANY($1::text[]) AND d.active=true ORDER BY i.sku FOR UPDATE OF i",
      [items.map(x=>x.sku)]
    );
    if(found.rows.length!==items.length)
      throw new ShopError(409,"Algunos productos ya no están disponibles","UNKNOWN_SKU");
    const indexed=new Map(found.rows.map(row=>[row.sku,row]));
    let itemsCents=0;
    const lines=items.map(item=>{
      const row=indexed.get(item.sku);
      if(!Number.isSafeInteger(row.price_cents)||row.price_cents<1)
        throw new ShopError(409,"Precio por confirmar","PRICE_PENDING");
      if(row.total-row.reserved-row.sold<item.quantity)
        throw new ShopError(409,"Sin suficientes piezas de "+item.sku,"OUT_OF_STOCK");
      itemsCents+=row.price_cents*item.quantity;
      if(!Number.isSafeInteger(itemsCents)||itemsCents>100000000)
        throw new ShopError(400,"Importe fuera del rango permitido","AMOUNT_LIMIT");
      return {...item,name:row.name,unit_price_cents:row.price_cents};
    });
    const quantity=lines.reduce((n,i)=>n+i.quantity,0);
    const shippingCents=pricing.shippingFor(zone,itemsCents);
    const id=crypto.randomUUID();
    const expiration=new Date(Date.now()+35*60*1000);
    await db.query(
      "INSERT INTO orders(id,request_id,status,items_cents,shipping_cents,amount_cents,checkout_expires_at,"+
      "shipping_zone,postal_code,shipping_city,shipping_state,quantity) "+
      "VALUES($1,$2,'creating',$3,$4,$5,$6,$7,$8,$9,$10,$11)",
      [id,requestId,itemsCents,shippingCents,itemsCents+shippingCents,expiration,
       zone,postal_code,city,state,quantity]
    );
    for(const line of lines) {
      await db.query("INSERT INTO order_items(order_id,sku,quantity,unit_price_cents) VALUES($1,$2,$3,$4)",
        [id,line.sku,line.quantity,line.unit_price_cents]);
      await db.query("UPDATE inventory SET reserved=reserved+$2 WHERE sku=$1",
        [line.sku,line.quantity]);
    }
    return {existing:false,id,status:"creating",expiration,lines,itemsCents,
      shippingCents,shippingZone:zone,quantity,amountCents:itemsCents+shippingCents};
  });
}
async function snapshot(pool,orderId){
  const q=await pool.query("SELECT * FROM orders WHERE id=$1",[orderId]);
  if(!q.rows.length)throw new ShopError(404,"Pedido no encontrado","NOT_FOUND");
  const items=await pool.query(
    "SELECT oi.sku,oi.quantity,oi.unit_price_cents,d.name FROM order_items oi "+
    "JOIN inventory i ON i.sku=oi.sku JOIN designs d ON d.id=i.design_id "+
    "WHERE oi.order_id=$1 ORDER BY oi.sku",[orderId]);
  return {...q.rows[0],lines:items.rows};
}
async function attachSession(pool,id,sessionId){
  const r=await pool.query(
    "UPDATE orders SET stripe_session_id=$2,status='pending',updated_at=now() "+
    "WHERE id=$1 AND status='creating' AND stripe_session_id IS NULL "+
    "RETURNING id",[id,sessionId]);
  return r.rowCount>0;
}
async function handleStripeEvent(pool,event){
  const handled=[
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
    "checkout.session.async_payment_failed",
    "checkout.session.expired"
  ];
  if(!handled.includes(event?.type))return "ignored";
  const session=event.data?.object;
  const id=session?.metadata?.order_id;
  if(typeof id!=="string" || !UUID.test(id))return "ignored";
  return transaction(pool,async db=>{
    const marker=await db.query(
      "INSERT INTO stripe_events(id,event_type) VALUES($1,$2) ON CONFLICT DO NOTHING RETURNING id",
      [event.id,event.type]);
    if(!marker.rowCount)return "duplicate";
    const found=await db.query("SELECT * FROM orders WHERE id=$1 FOR UPDATE",[id]);
    if(!found.rowCount)throw new ShopError(409,"Pedido del webhook no existe","ORDER_MISSING");
    const order=found.rows[0];
    if(order.stripe_session_id && order.stripe_session_id!==session.id)
      throw new ShopError(409,"Sesión de Stripe incorrecta","SESSION_MISMATCH");
    // Guardar contacto y dirección desde Stripe, exclusivamente para
    // operaciones internas. No se exportan en el endpoint público de estado.
    const shippingInfo=session?.collected_information?.shipping_details||session?.shipping_details||{};
    const address=pricing.addressFromStripe(session);
    const email=typeof session?.customer_details?.email==="string"?
      session.customer_details.email.slice(0,320):null;
    const recipient=typeof shippingInfo?.name==="string"?
      shippingInfo.name.slice(0,160):null;
    const phone=typeof shippingInfo?.phone==="string"?
      shippingInfo.phone.slice(0,35):null;
    if(address || email || recipient || phone) {
      await db.query(
        "UPDATE orders SET fulfillment_address=COALESCE($2::jsonb,fulfillment_address),"+
        "customer_email=COALESCE($3,customer_email),recipient_name=COALESCE($4,recipient_name),"+
        "recipient_phone=COALESCE($5,recipient_phone),updated_at=now() WHERE id=$1",
        [id,address?JSON.stringify(address):null,email,recipient,phone]
      );
    }
    const paid=session.payment_status==="paid" &&
      ["checkout.session.completed","checkout.session.async_payment_succeeded"].includes(event.type);
    const expired=event.type==="checkout.session.expired" && session.status==="expired";
    const failed=event.type==="checkout.session.async_payment_failed";
    let appliedDiscount=0;
    if(paid) {
      const inspected=pricing.inspectPayment(order,session);
      if(!inspected.valid) {
        // Paga pero hay inconsistencia de dirección/descuento/importe: retener reserva,
        // bloquear cumplimiento y requerir revisión / eventual devolución.
        await db.query("UPDATE orders SET status='needs_review',updated_at=now() WHERE id=$1",[id]);
        return "needs_review";
      }
      appliedDiscount=inspected.discount_cents;
    }
    if(order.status==="paid")return "paid";
    if(["expired","failed","needs_review"].includes(order.status)){
      if(paid)await db.query("UPDATE orders SET status='needs_review',updated_at=now() WHERE id=$1",[id]);
      return paid?"needs_review":order.status;
    }
    if(event.type==="checkout.session.completed" && !paid){
      await db.query(
        "UPDATE orders SET status='payment_pending',stripe_session_id=COALESCE(stripe_session_id,$2),updated_at=now() WHERE id=$1",
        [id,session.id]);
      return "payment_pending";
    }
    if(!paid&&!expired&&!failed)return order.status;
    const lines=await db.query("SELECT sku,quantity FROM order_items WHERE order_id=$1 ORDER BY sku",[id]);
    for(const line of lines.rows){
      const q=paid?"UPDATE inventory SET reserved=reserved-$2,sold=sold+$2 WHERE sku=$1 AND reserved>=$2":
        "UPDATE inventory SET reserved=reserved-$2 WHERE sku=$1 AND reserved>=$2";
      const updated=await db.query(q,[line.sku,line.quantity]);
      if(updated.rowCount!==1)throw new ShopError(409,"Inconsistencia de inventario","INVENTORY_REVIEW");
    }
    const status=paid?"paid":(expired?"expired":"failed");
    await db.query(
      "UPDATE orders SET status=$2,stripe_session_id=COALESCE(stripe_session_id,$3),"+
      "stripe_payment_intent_id=COALESCE(stripe_payment_intent_id,$4),discount_cents=$5,updated_at=now() WHERE id=$1",
      [id,status,session.id,typeof session.payment_intent==="string"?session.payment_intent:null,appliedDiscount]);
    return status;
  });
}
module.exports={ShopError,parseItems,verifyRequestId,transaction,reserve,snapshot,attachSession,handleStripeEvent};
