"use strict";
(async()=>{
 const title=document.getElementById("statusTitle");
 const text=document.getElementById("statusText");
 const order=new URLSearchParams(location.search).get("order_id");
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(order||"")){
  title.textContent="No se pudo identificar tu pedido.";
  text.textContent="Revisa tu confirmación de Stripe o contacta al soporte de NOX cuando esté habilitado.";
  return;
 }
 try{
  const response=await fetch("/api/orders/"+encodeURIComponent(order)+"/status",{cache:"no-store"});
  if(!response.ok)throw new Error("Estado no disponible");
  const data=await response.json();
  if(data.status==="paid"){
   title.textContent="Pago confirmado.";
   text.textContent="El servidor recibió la confirmación de Stripe. Conserva el comprobante del pago.";
  }else if(data.status==="needs_review"){
   title.textContent="Revisión de tu pago.";
   text.textContent="Tu compra requiere verificación manual. No intentes pagar nuevamente hasta aclararla.";
  }else if(["expired","failed"].includes(data.status)){
   title.textContent="Pago no completado.";
   text.textContent="No se confirmó el pago. Puedes regresar a la tienda para revisar las existencias.";
  }else {
   title.textContent="Estamos verificando tu pago.";
   text.textContent="Stripe puede tardar en confirmar algunos métodos. No se marcará como pagado hasta recibir el evento verificado.";
  }
 }catch(_){
  title.textContent="Estado temporalmente no disponible.";
  text.textContent="No repetimos el cobro. Puedes consultar de nuevo esta página más tarde.";
 }
})();
