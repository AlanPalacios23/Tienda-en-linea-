"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const html=fs.readFileSync("index.html","utf8");
const browser=fs.readFileSync("scrip.js","utf8");
const backend=fs.readFileSync("server/index.js","utf8");
const pricing=fs.readFileSync("server/pricing.js","utf8");
test("la interfaz de envío y código exclusivo de Tala están disponibles",()=>{
 for(const word of ['value="national"','value="tala"','id="shippingPostal"','NOXTALA','id="shippingTotal"','id="grandTotal"'])
  assert.ok(html.includes(word),word);
 assert.match(browser,/shipping_zone:selectedZone\(\)/);
 assert.match(browser,/postal_code:ui\.postal\.value\.trim\(\)/);
});
test("Stripe solo muestra campo de promoción para pedidos Tala",()=>{
 assert.match(backend,/allow_promotion_codes:order\.shipping_zone==="tala"/);
 assert.match(backend,/promotionCodes\.retrieve\(config\.localPromoId\)/);
 assert.match(backend,/promo\.coupon\?\.percent_off!==20\.04/);
 assert.match(pricing,/inspectPayment/);
});
test("backend controla precios y envío; no se admiten cobros LIVE por defecto",()=>{
 const sql=fs.readFileSync("server/migrations/002_nox_commercial_rules.sql","utf8");
 assert.match(sql,/price_cents=49900/);
 const env=fs.readFileSync("server/.env.example","utf8");
 assert.match(env,/CHECKOUT_ENABLED=false/);
 assert.match(env,/ALLOW_LIVE_CHECKOUT=false/);
});
