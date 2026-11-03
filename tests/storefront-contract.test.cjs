const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const html=fs.readFileSync("index.html","utf8");
const js=fs.readFileSync("scrip.js","utf8");
const catalog=fs.readFileSync("catalog.js","utf8");
test("documento enlaza scripts y diálogos utilizados en la interfaz",()=>{
  for(const file of ["store-core.js","catalog.js","scrip.js","style.css"])
    assert.ok(html.includes(file));
  for(const id of ["productsGrid","cartPanel","cartItems","productPanel","colorOptions","sizeOptions","addSelectedToCart","audienceFilter","favoritesToggle","backdrop"])
    assert.match(html,new RegExp('id="'+id+'"'));
  assert.match(html,/lang="es-MX"/);
});
test("No revive TechStore, catálogo de tecnología ni una compra simulada",()=>{
  assert.doesNotMatch(html,/TechStore|Los Mejores Productos Tecnológicos/);
  assert.doesNotMatch(catalog,/MacBook|RTX 4080|iPhone 15/);
  assert.match(html,/Compra en línea próximamente/);
  assert.match(html,/<button id="checkoutBtn"[^>]*disabled>/);
  assert.doesNotMatch(js,/¡Compra realizada!|Gracias por tu compra/);
});
test("la lógica cliente usa selecciones verificadas, almacenamiento aislado y no cobra",()=>{
  assert.match(js,/core\.makeKey\(currentProduct,currentSize,currentColor\)/);
  assert.match(js,/core\.changeQuantity/);
  assert.match(js,/nox_fashion_demo_cart_v2/);
  assert.match(js,/ui\.checkout\.disabled=true/);
});
