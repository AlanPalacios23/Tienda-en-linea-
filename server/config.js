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
  // Tarifas determinadas exclusivamente por las reglas comerciales del backend.
  const localPromoId=env.STRIPE_NOXTALA_PROMO_ID||"";
  const key=env.STRIPE_API_KEY||"";
  const live=/^(sk|rk)_live_/.test(key);
  const test=/^(sk|rk)_test_/.test(key);
  const enabled=env.CHECKOUT_ENABLED==="true";
  if(enabled && (!env.DATABASE_URL || !env.STRIPE_WEBHOOK_SECRET ||
    !/^promo_[a-zA-Z0-9]+$/.test(localPromoId)||!(live||test)))
    throw new Error("Checkout sin base de datos, webhook, Stripe o promoción NOXTALA configurada");
  if(enabled && live && env.ALLOW_LIVE_CHECKOUT!=="true")
    throw new Error("Protección para dinero real: ALLOW_LIVE_CHECKOUT=true");
  const talaVipReady=env.TALA_VIP_READY==="true";
  const dhlReady=env.DHL_READY==="true";
  return {port:Number(env.PORT||8080),baseUrl:env.PUBLIC_BASE_URL.replace(/\/$/,""),
    databaseUrl:env.DATABASE_URL,checkoutEnabled:enabled,liveMode:live,localPromoId,talaVipReady,dhlReady,
    stripeKey:key,webhookSecret:env.STRIPE_WEBHOOK_SECRET||"",
    trustProxy:env.TRUST_PROXY==="true"};
}
module.exports={settings};
