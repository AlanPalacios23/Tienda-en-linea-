"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const Stripe=require("stripe");
const stock=require("../inventory");
const {settings}=require("../config");
test("rechaza carrito alterado o cantidades fuera del stock",()=>{
 assert.throws(()=>stock.parseItems([{sku:"nox-01-XL",quantity:1}]),{code:"INVALID_ITEM"});
 assert.throws(()=>stock.parseItems([{sku:"nox-01-M",quantity:0}]),{code:"INVALID_ITEM"});
 assert.throws(()=>stock.parseItems([{sku:"nox-01-M",quantity:3},{sku:"nox-01-M",quantity:3}]),{code:"INVALID_QUANTITY"});
 assert.deepEqual(stock.parseItems([{sku:"nox-02-L",quantity:1},{sku:"nox-01-M",quantity:2}]),
  [{sku:"nox-01-M",quantity:2},{sku:"nox-02-L",quantity:1}]);
});
test("ID de pedido debe ser UUID v4 generado por el cliente",()=>{
 assert.equal(stock.verifyRequestId(crypto.randomUUID()).length,36);
 assert.throws(()=>stock.verifyRequestId("abc"),{code:"INVALID_REQUEST_ID"});
});
test("modo live requiere habilitación separada y envío explícito",()=>{
 const env={
  PUBLIC_BASE_URL:"https://nox.example.com",DATABASE_URL:"postgres://example",
  STRIPE_WEBHOOK_SECRET:"whsec_testplaceholder",STRIPE_API_KEY:"rk_live_placeholder",
  CHECKOUT_ENABLED:"true",SHIPPING_CENTS:"0"
 };
 assert.throws(()=>settings(env),/ALLOW_LIVE_CHECKOUT/);
 assert.equal(settings({...env,ALLOW_LIVE_CHECKOUT:"true"}).checkoutEnabled,true);
 assert.throws(()=>settings({...env,ALLOW_LIVE_CHECKOUT:"true",SHIPPING_CENTS:""}),/Checkout sin/);
 assert.throws(()=>settings({...env,PUBLIC_BASE_URL:"http://example.com",ALLOW_LIVE_CHECKOUT:"true"}),/PUBLIC_BASE_URL/);
});
test("Stripe rechaza firmas falsas de webhook (sin tráfico real)",()=>{
 const stripe=new Stripe("sk_test_dummy",{apiVersion:"2026-09-30.endive"});
 const secret="whsec_dummy_test";
 const payload=JSON.stringify({id:"evt_test",type:"checkout.session.completed",data:{object:{}}});
 const header=stripe.webhooks.generateTestHeaderString({payload,secret});
 const verified=stripe.webhooks.constructEvent(payload,header,secret);
 assert.equal(verified.id,"evt_test");
 assert.throws(()=>stripe.webhooks.constructEvent(payload+" ",header,secret),/signature/i);
});
