"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const price=require("../pricing");
const local={country:"MX",city:"Tala",state:"Jalisco",postal_code:"45300"};
const national={country:"MX",city:"Guadalajara",state:"Jalisco",postal_code:"44100"};
test("precio fijo de 499 MXN, solo oversize",()=>{
 assert.equal(price.PRICE_CENTS,49900);
 assert.equal(price.LOCAL_DISCOUNT_CENTS,10000);
});
test("nacional: 1=648 MXN, 2=1147 MXN, 3=1497 MXN envío gratis",()=>{
 assert.equal(price.shippingFor("national",49900),14900);
 assert.equal(49900+price.shippingFor("national",49900),64800);
 assert.equal(99800+price.shippingFor("national",99800),114700);
 assert.equal(149700+price.shippingFor("national",149700),149700);
 assert.equal(price.shippingFor("national",139900),14900);
 assert.equal(price.shippingFor("national",139901),0);
});
test("Tala: envío 49 MXN y cupón 100 MXN por unidad",()=>{
 assert.equal(price.shippingFor("tala",49900),4900);
 assert.equal(price.promotionalDiscount("tala",1),10000);
 assert.equal(49900+4900-10000,44800);
 assert.equal(3*49900+4900-price.promotionalDiscount("tala",3),124600);
 assert.equal(price.promotionalDiscount("national",3),0);
});
test("detecta Tala ciudad, excluye Cuisillos y rechazo de modo incorrecto",()=>{
 assert.equal(price.isTalaCity(local),true);
 for(const cp of ["45300","45302","45303","45305","45306","45307","45308"])
  assert.equal(price.isTalaCity({...local,postal_code:cp}),true);
 assert.equal(price.isTalaCity({...local,postal_code:"45320",city:"Cuisillos"}),false);
 assert.equal(price.isTalaCity({...local,city:"Guadalajara"}),false);
 assert.equal(price.isTalaCity({...local,state:"Michoacán"}),false);
 assert.equal(price.validateZone("tala",local),"tala");
 assert.throws(()=>price.validateZone("tala",national),{code:"LOCAL_NOT_ELIGIBLE"});
 assert.throws(()=>price.validateZone("national",local),{code:"TALA_USE_LOCAL"});
 assert.equal(price.validateZone("national",national),"national");
});
test("Checkout local: acepta solo total completo o código de $100 por prenda",()=>{
 const order={shipping_zone:"tala",quantity:2,amount_cents:104700};
 const session={currency:"mxn",payment_status:"paid",amount_total:84700,
   total_details:{amount_discount:20000},
   shipping_details:{address:local}};
 assert.equal(price.inspectPayment(order,session).valid,true);
 assert.equal(price.inspectPayment(order,{...session,amount_total:104700,
   total_details:{amount_discount:0}}).valid,true);
 assert.equal(price.inspectPayment(order,{...session,amount_total:84600}).valid,false);
 assert.equal(price.inspectPayment(order,{...session,
   shipping_details:{address:national}}).valid,false);
});
test("Checkout nacional jamás permite descuento NOXTALA",()=>{
 const order={shipping_zone:"national",quantity:3,amount_cents:149700};
 const session={currency:"mxn",payment_status:"paid",amount_total:149700,
   total_details:{amount_discount:0},
   collected_information:{shipping_details:{address:national}}};
 assert.equal(price.inspectPayment(order,session).valid,true);
 assert.equal(price.inspectPayment(order,{...session,amount_total:119700,
   total_details:{amount_discount:30000}}).valid,false);
 assert.equal(price.inspectPayment(order,{...session,
   collected_information:{shipping_details:{address:local}}}).valid,false);
});
test("20.04% sobre 499 MXN da $100 de rebaja por prenda en Stripe",()=>{
 assert.equal(Math.round(49900*0.2004),10000);
 for(let qty=1;qty<=5;qty++)
  assert.equal(Math.round(49900*qty*0.2004),qty*10000);
});
