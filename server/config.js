"use strict";
function validURL(value) {
  try {
    const u=new URL(value);
    return (u.protocol==="https:" ||
      (u.protocol==="http:" && ["localhost","127.0.0.1"].includes(u.hostname))) &&
      !u.username && !u.password && !u.search && !u.hash && u.pathname==="/";
  } catch (_) {return false;}
}
function settings(env=process.env) {
  if(!validURL(env.PUBLIC_BASE_URL)) throw new Error("PUBLIC_BASE_URL debe usar HTTPS o localhost HTTP sin rutas");
  const shipping=/^\d+$/.test(env.SHIPPING_CENTS||"")?Number(env.SHIPPING_CENTS):null;
  const key=env.STRIPE_API_KEY||"";
  const live=/^(sk|rk)_live_/.test(key);
  const test=/^(sk|rk)_test_/.test(key);
  const enabled=env.CHECKOUT_ENABLED==="true";
  if(enabled && (!env.DATABASE_URL || !env.STRIPE_WEBHOOK_SECRET ||
    !Number.isSafeInteger(shipping)||shipping<0||shipping>10000000||!(live||test)))
    throw new Error("Checkout sin base de datos, webhook, Stripe o costo de envío");
  if(enabled && live && env.ALLOW_LIVE_CHECKOUT!=="true")
    throw new Error("Protección para dinero real: ALLOW_LIVE_CHECKOUT=true");
  return {port:Number(env.PORT||8080),baseUrl:env.PUBLIC_BASE_URL.replace(/\/$/,""),
    databaseUrl:env.DATABASE_URL,checkoutEnabled:enabled,liveMode:live,shippingCents:shipping,
    stripeKey:key,webhookSecret:env.STRIPE_WEBHOOK_SECRET||"",
    trustProxy:env.TRUST_PROXY==="true"};
}
module.exports={settings};
