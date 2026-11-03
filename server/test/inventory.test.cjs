"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");
const {Pool}=require("pg");
const stock=require("../inventory");
const dbURL=process.env.DATABASE_URL;
if(!dbURL)throw new Error("DATABASE_URL is required for PostgreSQL tests");
const pool=new Pool({connectionString:dbURL,max:12});
const NATIONAL={shipping_zone:"national",address:{country:"MX",postal_code:"44100",city:"Guadalajara",state:"Jalisco"}};
const NATIONAL_ADDRESS={shipping_details:{address:NATIONAL.address}};
test("Inventario NOX y protección de checkout",async t=>{
  await pool.query(fs.readFileSync(path.join(__dirname,"../schema.sql"),"utf8"));
  await pool.query(fs.readFileSync(path.join(__dirname,"../migrations/002_nox_commercial_rules.sql"),"utf8"));
  t.after(async()=>{await pool.end();});
  async function reset(){
   await pool.query("TRUNCATE stripe_events,order_items,orders CASCADE");
   await pool.query("UPDATE inventory SET reserved=0,sold=0");
   await pool.query("UPDATE designs SET price_cents=49900");
  }
  await t.test("6 diseños por 3 M + 2 L = 30",async()=>{
   await reset();
   const q=await pool.query("SELECT count(*)::int AS count,sum(total)::int AS total FROM inventory");
   assert.equal(q.rows[0].count,12);
   assert.equal(q.rows[0].total,30);
   const sizes=await pool.query("SELECT size,count(*)::int AS variants,sum(total)::int AS units FROM inventory GROUP BY size");
   const m=new Map(sizes.rows.map(r=>[r.size,r]));
   assert.equal(m.get("M").variants,6);
   assert.equal(m.get("M").units,18);
   assert.equal(m.get("L").variants,6);
   assert.equal(m.get("L").units,12);
  });
  await t.test("cuatro compradores simultáneos no venden cuatro M cuando hay tres",async()=>{
   await reset();
   const jobs=Array.from({length:4},()=>
     stock.reserve(pool,[{sku:"nox-01-M",quantity:1}],crypto.randomUUID(),NATIONAL));
   const results=await Promise.allSettled(jobs);
   assert.equal(results.filter(x=>x.status==="fulfilled").length,3);
   assert.equal(results.filter(x=>x.status==="rejected" && x.reason.code==="OUT_OF_STOCK").length,1);
   const q=await pool.query("SELECT total,reserved,sold FROM inventory WHERE sku='nox-01-M'");
   assert.deepEqual(q.rows[0],{total:3,reserved:3,sold:0});
  });
  await t.test("el mismo identificador no realiza una reserva duplicada",async()=>{
   await reset();
   const id=crypto.randomUUID();
   const a=await stock.reserve(pool,[{sku:"nox-02-L",quantity:1}],id,NATIONAL);
   const b=await stock.reserve(pool,[{sku:"nox-02-L",quantity:1}],id,NATIONAL);
   assert.equal(b.existing,true);
   assert.equal(b.id,a.id);
   const q=await pool.query("SELECT reserved FROM inventory WHERE sku='nox-02-L'");
   assert.equal(q.rows[0].reserved,1);
   assert.equal(a.amountCents,64800);
  });
  await t.test("pago firmado simulado por webhook mueve reservado a vendido una sola vez",async()=>{
   await reset();
   const r=await stock.reserve(pool,[{sku:"nox-03-M",quantity:2}],crypto.randomUUID(),NATIONAL);
   const event={id:"evt_demo_1",type:"checkout.session.completed",data:{object:{
     id:"cs_test_nox_1",metadata:{order_id:r.id},currency:"mxn",
     amount_total:r.amountCents,payment_status:"paid",status:"complete",...NATIONAL_ADDRESS
   }}};
   assert.equal(await stock.handleStripeEvent(pool,event),"paid");
   assert.equal(await stock.handleStripeEvent(pool,event),"duplicate");
   const q=await pool.query("SELECT reserved,sold FROM inventory WHERE sku='nox-03-M'");
   assert.deepEqual(q.rows[0],{reserved:0,sold:2});
  });
  await t.test("evento de pago pendiente mantiene inventario hasta confirmación asíncrona",async()=>{
   await reset();
   const r=await stock.reserve(pool,[{sku:"nox-04-L",quantity:2}],crypto.randomUUID(),NATIONAL);
   const session={id:"cs_test_nox_2",metadata:{order_id:r.id},currency:"mxn",amount_total:r.amountCents,payment_status:"unpaid",status:"complete",...NATIONAL_ADDRESS};
   assert.equal(await stock.handleStripeEvent(pool,{
     id:"evt_async_unpaid",type:"checkout.session.completed",data:{object:session}
   }),"payment_pending");
   let q=await pool.query("SELECT reserved,sold FROM inventory WHERE sku='nox-04-L'");
   assert.deepEqual(q.rows[0],{reserved:2,sold:0});
   session.payment_status="paid";
   assert.equal(await stock.handleStripeEvent(pool,{
     id:"evt_async_paid",type:"checkout.session.async_payment_succeeded",data:{object:session}
   }),"paid");
   q=await pool.query("SELECT reserved,sold FROM inventory WHERE sku='nox-04-L'");
   assert.deepEqual(q.rows[0],{reserved:0,sold:2});
  });
  await t.test("sesión expirada devuelve la reserva sin marcar venta",async()=>{
   await reset();
   const r=await stock.reserve(pool,[{sku:"nox-05-M",quantity:3}],crypto.randomUUID(),NATIONAL);
   const session={id:"cs_test_nox_3",metadata:{order_id:r.id},payment_status:"unpaid",status:"expired"};
   assert.equal(await stock.handleStripeEvent(pool,{
     id:"evt_expire",type:"checkout.session.expired",data:{object:session}
   }),"expired");
   const q=await pool.query("SELECT reserved,sold FROM inventory WHERE sku='nox-05-M'");
   assert.deepEqual(q.rows[0],{reserved:0,sold:0});
  });
  await t.test("importe incorrecto retiene reserva y marca revisión, no entrega",async()=>{
   await reset();
   const r=await stock.reserve(pool,[{sku:"nox-06-L",quantity:1}],crypto.randomUUID(),NATIONAL);
   assert.equal(await stock.handleStripeEvent(pool,{
    id:"evt_mismatch",type:"checkout.session.completed",
    data:{object:{id:"cs_test_bad",metadata:{order_id:r.id},currency:"mxn",
      amount_total:1,payment_status:"paid",status:"complete",...NATIONAL_ADDRESS}}
   }),"needs_review");
   const order=await pool.query("SELECT status FROM orders WHERE id=$1",[r.id]);
   assert.equal(order.rows[0].status,"needs_review");
   const q=await pool.query("SELECT reserved,sold FROM inventory WHERE sku='nox-06-L'");
   assert.deepEqual(q.rows[0],{reserved:1,sold:0});
  });
  await t.test("migración idempotente no restablece existencias vendidas",async()=>{
   await reset();
   const r=await stock.reserve(pool,[{sku:"nox-01-M",quantity:1}],crypto.randomUUID(),NATIONAL);
   await stock.handleStripeEvent(pool,{
    id:"evt_paid_preserve",type:"checkout.session.completed",
    data:{object:{id:"cs_test_preserve",metadata:{order_id:r.id},currency:"mxn",
      amount_total:r.amountCents,payment_status:"paid",status:"complete",...NATIONAL_ADDRESS}}
   });
   await pool.query(fs.readFileSync(path.join(__dirname,"../schema.sql"),"utf8"));
   await pool.query(fs.readFileSync(path.join(__dirname,"../migrations/002_nox_commercial_rules.sql"),"utf8"));
   const row=await pool.query("SELECT sold FROM inventory WHERE sku='nox-01-M'");
   assert.equal(row.rows[0].sold,1);
  });
});
