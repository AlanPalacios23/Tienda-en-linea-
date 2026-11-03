"use strict";
// Tarea de mantenimiento: reconciliar estados de Stripe. No liberar stock solo por reloj.
// Ejecutar periódicamente en la misma infraestructura que el backend.
const Stripe=require("stripe");
const {Pool}=require("pg");
const {settings}=require("./config");
const inventory=require("./inventory");
async function reconcile() {
 const conf=settings();
 if(!conf.databaseUrl || !conf.stripeKey)throw new Error("Stripe y DB requeridos");
 const stripe=new Stripe(conf.stripeKey,{apiVersion:"2026-09-30.endive"});
 const pool=new Pool({connectionString:conf.databaseUrl});
 try {
  const query=await pool.query(
   "SELECT id,stripe_session_id FROM orders WHERE status IN ('pending','payment_pending') "+
   "AND checkout_expires_at<now() - interval '5 minutes' LIMIT 50"
  );
  for(const row of query.rows) {
   try {
    if(!row.stripe_session_id)continue; // Revisión manual: nunca liberar sin verificar Stripe.
    let s=await stripe.checkout.sessions.retrieve(row.stripe_session_id);
    if(s.status==="open")s=await stripe.checkout.sessions.expire(s.id);
    const type=s.payment_status==="paid"?"checkout.session.completed":
      (s.status==="expired"?"checkout.session.expired":null);
    if(!type)continue; // Pago asíncrono pendiente: mantener reserva.
    const event={id:"nox-reconcile-"+s.id+"-"+type,type,data:{object:s}};
    const status=await inventory.handleStripeEvent(pool,event);
    console.log("NOX_RECONCILE",row.id,status);
   }catch(err){console.error("NOX_RECONCILE_RETRY",row.id,err.code||"unknown");}
  }
 }finally {await pool.end();}
}
if(require.main===module)reconcile().catch(err=>{console.error(err.message);process.exitCode=1;});
module.exports={reconcile};
