const test = require("node:test");
const assert = require("node:assert/strict");
const store = require("../store-core.js");
const catalog = [
  { id:"a", name:"Audífonos Órbita", description:"Sonido portátil", category:"audio", price:100 },
  { id:"b", name:"Teclado", description:"Oficina", category:"setup", price:250 }
];
test("filtra ignorando acentos, mayúsculas y por categoría", () => {
  assert.deepEqual(store.filterProducts(catalog,{query:"ORBITA",category:"audio"}).map(p=>p.id),["a"]);
  assert.equal(store.filterProducts(catalog,{query:"orbita",category:"setup"}).length,0);
});
test("ordena precios sin mutar catálogo original", () => {
  assert.deepEqual(store.filterProducts(catalog,{sort:"price-desc"}).map(p=>p.id),["b","a"]);
  assert.deepEqual(catalog.map(p=>p.id),["a","b"]);
});
test("rechaza estado persistido corrupto o manipulado", () => {
  assert.deepEqual(store.loadCart("{mal json",catalog),{});
  assert.deepEqual(store.loadCart('{"a":3,"otro":42,"b":-1}',catalog),{a:3});
  assert.deepEqual(store.loadCart('["a","b"]',catalog),{});
});
test("limita cantidades y mantiene únicamente IDs válidos", () => {
  assert.deepEqual(store.changeQuantity({}, "a", 999, catalog),{a:20});
  assert.deepEqual(store.changeQuantity({a:1}, "a", -1, catalog),{});
  assert.deepEqual(store.changeQuantity({}, "inexistente", 1, catalog),{});
  assert.deepEqual(store.changeQuantity({a:2}, "a", NaN, catalog),{a:2});
});
test("calcula subtotal e ítems desde catálogo, no desde datos del navegador", () => {
  const result = store.summary({a:2,b:1,unknown:50},catalog);
  assert.equal(result.count,3);
  assert.equal(result.subtotal,450);
  assert.equal(result.rows.length,2);
});
test("no interpreta cantidades fraccionarias ni strings como enteros", () => {
  assert.deepEqual(store.sanitizeCart({a:"10",b:1.5},catalog),{});
});