"use strict";
/**
 * Reglas comerciales NOX, valores monetarios en CENTAVOS MXN.
 * Promoción NOXTALA: descuento equivalente a $100 por playera.
 * El cliente introduce el código en Stripe Checkout; se verifica el descuento
 * y la dirección capturada por Stripe antes de cumplir el pedido.
 */
const PRICE_CENTS=49900;
const LOCAL_DISCOUNT_CENTS=10000;
const NATIONAL_SHIPPING_CENTS=14900;
const LOCAL_SHIPPING_CENTS=4900;
const FREE_SHIPPING_ABOVE_CENTS=139900;
// Estas claves corresponden a la ciudad de Tala, no al municipio entero;
// las localidades cercanas (incl. Cuisillos) requieren su propia política.
const TALA_CITY_POSTCODES=new Set(["45300","45302","45303","45305","45306","45307","45308"]);
class PricingError extends Error{
 constructor(message,code="INVALID_DELIVERY"){super(message);this.httpStatus=400;this.code=code;}
}
function normalize(s){
 return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase();
}
function isTalaCity(address){
 if(!address || typeof address!=="object")return false;
 const postal=String(address.postal_code||"").trim();
 const city=normalize(address.city);
 const state=normalize(address.state);
 const country=normalize(address.country).toUpperCase();
 return country==="MX" && TALA_CITY_POSTCODES.has(postal) &&
    /^tala(?:\b|,)/.test(city) && ["jalisco","jal","ja"].includes(state);
}
function validateZone(zone,address){
 if(!["tala","national"].includes(zone))throw new PricingError("Selecciona entrega Tala o envío nacional");
 if(zone==="tala" && !isTalaCity(address))
  throw new PricingError("Entrega VIP válida solo para la ciudad de Tala, Jalisco","LOCAL_NOT_ELIGIBLE");
 if(zone==="national" && isTalaCity(address))
  throw new PricingError("En Tala selecciona la entrega local","TALA_USE_LOCAL");
 if(zone==="national" && (
    !address || String(address.country||"").toUpperCase()!=="MX" ||
    !/^\d{5}$/.test(String(address.postal_code||""))
 ))throw new PricingError("Ingresa un código postal válido de México","NATIONAL_ADDRESS_REQUIRED");
 return zone;
}
function shippingFor(zone,subtotalCents){
 if(!Number.isSafeInteger(subtotalCents)||subtotalCents<0)throw new PricingError("Subtotal inválido");
 if(zone==="tala")return LOCAL_SHIPPING_CENTS;
 if(zone==="national")return subtotalCents>FREE_SHIPPING_ABOVE_CENTS?0:NATIONAL_SHIPPING_CENTS;
 throw new PricingError("Zona no válida");
}
function promotionalDiscount(zone,quantity){
 if(!Number.isSafeInteger(quantity)||quantity<0)throw new PricingError("Cantidad no válida");
 return zone==="tala"?LOCAL_DISCOUNT_CENTS*quantity:0;
}
function addressFromStripe(session){
 // Stripe ha evolucionado los campos de dirección; admitir ambos formatos.
 const shipping=session?.collected_information?.shipping_details?.address ||
   session?.shipping_details?.address;
 return shipping || null;
}
function inspectPayment(order,session){
 const stripeAddress=addressFromStripe(session);
 const reason=[];
 if(session?.currency!=="mxn")reason.push("currency_mismatch");
 if(!stripeAddress)reason.push("shipping_address_missing");
 else {
   if(order.shipping_zone==="tala" && !isTalaCity(stripeAddress))reason.push("local_address_mismatch");
   if(order.shipping_zone==="national" && (
     String(stripeAddress.country||"").toUpperCase()!=="MX" || isTalaCity(stripeAddress)
   ))reason.push("national_address_mismatch");
 }
 const discount=Number(session?.total_details?.amount_discount??0);
 const quantity=Number(order.quantity);
 const maxDiscount=promotionalDiscount(order.shipping_zone,quantity);
 const allowed=order.shipping_zone==="tala"?[0,maxDiscount]:[0];
 if(!Number.isSafeInteger(discount) || !allowed.includes(discount))reason.push("discount_mismatch");
 if(!Number.isSafeInteger(session?.amount_total) ||
    session.amount_total!==(order.amount_cents-discount))reason.push("amount_mismatch");
 if(session?.payment_status!=="paid")reason.push("not_paid");
 return {valid:reason.length===0,discount_cents:discount,reason};
}
module.exports={PRICE_CENTS,LOCAL_DISCOUNT_CENTS,NATIONAL_SHIPPING_CENTS,LOCAL_SHIPPING_CENTS,
 FREE_SHIPPING_ABOVE_CENTS,TALA_CITY_POSTCODES,normalize,isTalaCity,validateZone,
 shippingFor,promotionalDiscount,addressFromStripe,inspectPayment,PricingError};
