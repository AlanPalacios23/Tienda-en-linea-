const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const html=fs.readFileSync("index.html","utf8");
const script=fs.readFileSync("scrip.js","utf8");
const sql=fs.readFileSync("server/schema.sql","utf8");
test("frontend muestra solo playeras en tallas M y L",()=>{
 assert.match(html,/Seis playeras|seis diseños|Seis diseños/i);
 assert.match(sql,/size IN \('M','L'\)/);
 assert.doesNotMatch(html,/iPhone|MacBook|Consola|Blazer|Calzado/);
});
test("el catálogo real se consulta a API, no se basa en precios ficticios",()=>{
 assert.match(script,/fetch\("\/api\/catalog"/);
 assert.match(script,/fetch\("\/api\/checkout"/);
 assert.match(script,/request_id:checkoutRequestId/);
 assert.match(script,/checkoutAvailable/);
 assert.doesNotMatch(script,/¡Compra realizada!/);
});
test("existen seis imágenes originales de conceptos",()=>{
 for(let i=1;i<=6;i++){
  const file="assets/nox-0"+i+".svg";
  const svg=fs.readFileSync(file,"utf8");
  assert.match(svg,/<svg/);
  assert.match(svg,/NOX/);
  assert.match(svg,/PREVIEW/);
 }
});
