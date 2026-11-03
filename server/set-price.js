"use strict";
// Comando operativo NOX. No modifica inventario, no interactúa con Stripe.
// Uso: DATABASE_URL=... node set-price.js nox-01 599.00
const {Pool}=require("pg");
async function main(){
  const [id,amount]=process.argv.slice(2);
  if(!/^nox-0[1-6]$/.test(id||""))throw new Error("Diseño válido: nox-01 ... nox-06");
  if(!/^\d{1,6}(\.\d{1,2})?$/.test(amount||""))throw new Error("Precio en MXN, ej. 599.00");
  const cents=Math.round(Number(amount)*100);
  if(!Number.isSafeInteger(cents)||cents<100)throw new Error("Precio mínimo $1.00 MXN");
  if(!process.env.DATABASE_URL)throw new Error("DATABASE_URL requerida");
  const pool=new Pool({connectionString:process.env.DATABASE_URL});
  try{
    const q=await pool.query("UPDATE designs SET price_cents=$2 WHERE id=$1 RETURNING id,name,price_cents",[id,cents]);
    if(!q.rowCount)throw new Error("Diseño no encontrado");
    console.log("NOX_PRICE_UPDATED",q.rows[0]);
  }finally{await pool.end();}
}
if(require.main===module)main().catch(err=>{console.error(err.message);process.exitCode=1;});
