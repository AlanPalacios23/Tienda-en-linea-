const test = require("node:test");
const assert = require("node:assert/strict");
const store = require("../store-core.js");
globalThis.NoxCatalog = undefined;
require("../catalog.js");
const catalog = globalThis.NoxCatalog;
test("catálogo exclusivo de moda y cada variante es única y válida", () => {
  assert.equal(catalog.length,12);
  assert.equal(new Set(catalog.map(p => p.id)).size,catalog.length);
  for (const p of catalog) {
    assert.ok(["ropa","calzado","accesorios"].includes(p.category));
    assert.ok(["mujer","hombre","unisex"].includes(p.audience));
    assert.ok(Number.isSafeInteger(p.price) && p.price > 0);
    assert.ok(p.sizes.length && p.colors.length);
    assert.equal(new Set(p.sizes.map(s => s.id)).size,p.sizes.length);
    assert.equal(new Set(p.colors.map(c => c.id)).size,p.colors.length);
    assert.ok(p.image.startsWith("https://"));
    for (const s of p.sizes) for (const c of p.colors)
      assert.ok(store.resolveKey(store.makeKey(p,s.id,c.id),catalog));
  }
});
test("filtra sin acentos y combina tipo de prenda y público", () => {
  const p = store.filterProducts(catalog,{query:"PANTALON",category:"ropa",audience:"mujer"});
  assert.deepEqual(p.map(x=>x.id),["nox-103"]);
  assert.equal(store.filterProducts(catalog,{query:"botín",audience:"hombre"}).length,0);
});
test("unisex está disponible en cualquier selección de público", () => {
  assert.ok(store.filterProducts(catalog,{audience:"mujer"}).some(p=>p.id==="nox-101"));
  assert.ok(store.filterProducts(catalog,{audience:"hombre"}).some(p=>p.id==="nox-101"));
});
test("ordena por precio y nombre sin modificar catálogo", () => {
  const before = catalog.map(p=>p.id);
  const asc = store.filterProducts(catalog,{sort:"price-asc"});
  assert.ok(asc.every((p,i)=>i===0||asc[i-1].price<=p.price));
  const desc = store.filterProducts(catalog,{sort:"price-desc"});
  assert.ok(desc.every((p,i)=>i===0||desc[i-1].price>=p.price));
  assert.deepEqual(catalog.map(p=>p.id),before);
});
test("no permite meter variaciones inexistentes o IDs arbitrarios", () => {
  const p = catalog[0];
  assert.equal(store.makeKey(p,"xx","negro"),null);
  assert.equal(store.makeKey(p,"m","mal"),null);
  assert.equal(store.resolveKey("__proto__::m::negro",catalog),null);
  assert.equal(store.resolveKey("nox-101::m",catalog),null);
});
test("carrito separa talla y color del mismo producto", () => {
  const a = store.makeKey(catalog[0],"m","negro");
  const b = store.makeKey(catalog[0],"l","hueso");
  let cart=store.changeQuantity({},a,2,catalog);
  cart=store.changeQuantity(cart,b,1,catalog);
  const sum=store.summary(cart,catalog);
  assert.equal(sum.count,3);
  assert.equal(sum.rows.length,2);
  assert.equal(sum.subtotal,1347);
  assert.deepEqual(sum.rows.map(r=>r.size.label),["M","L"]);
});
test("nunca confía en precios guardados por el navegador", () => {
  const key=store.makeKey(catalog[0],"m","negro");
  const sum=store.summary({[key]:2, "fraude::m::negro":1000},catalog);
  assert.equal(sum.subtotal,898);
});
test("carrito inválido, valores negativos y más de diez unidades no sobreviven", () => {
  const key=store.makeKey(catalog[0],"m","negro");
  assert.deepEqual(store.loadCart("{",catalog),{});
  assert.deepEqual(store.loadCart(JSON.stringify({[key]:999,bad:-5}),catalog),{[key]:10});
  assert.deepEqual(store.sanitizeCart({[key]:"2"},catalog),{});
  assert.deepEqual(store.changeQuantity({[key]:1},key,-1,catalog),{});
  assert.deepEqual(store.changeQuantity({},key,Number.NaN,catalog),{});
});
test("favoritos se limitan al catálogo, sin duplicados", () => {
  assert.deepEqual(store.loadFavorites('["nox-101","bad","nox-101"]',catalog),["nox-101"]);
  assert.deepEqual(store.toggleFavorite(["nox-101"],"nox-101",catalog),[]);
  assert.deepEqual(store.toggleFavorite([],"bad",catalog),[]);
});
test("descarta carrito de tecnología v0.1 y JSON mal formado", () => {
  assert.deepEqual(store.loadCart('{"1":3,"nox-001::m::negro":2}',catalog),{});
  assert.deepEqual(store.loadCart("not-json",catalog),{});
});