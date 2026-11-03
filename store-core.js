/* Núcleo puro y comprobable del catálogo y carrito. Precios ilustrativos en pesos MXN. */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.NoxStore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var MAX_QTY = 20;
  function normalize(value) {
    return String(value == null ? "" : value).normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-MX").trim();
  }
  function filterProducts(products, options) {
    options = options || {};
    var query = normalize(options.query);
    var category = options.category || "all";
    var result = products.filter(function (p) {
      return (category === "all" || p.category === category) &&
        (!query || normalize(p.name + " " + p.description).includes(query));
    });
    switch (options.sort) {
      case "price-asc": result.sort(function (a,b) { return a.price-b.price; }); break;
      case "price-desc": result.sort(function (a,b) { return b.price-a.price; }); break;
      case "name": result.sort(function (a,b) { return a.name.localeCompare(b.name,"es-MX"); }); break;
    }
    return result;
  }
  function sanitizeCart(raw, products) {
    var safe = {};
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return safe;
    products.forEach(function (p) {
      var n = raw[p.id];
      if (Number.isSafeInteger(n) && n > 0) safe[p.id] = Math.min(n, MAX_QTY);
    });
    return safe;
  }
  function loadCart(serialized, products) {
    try { return sanitizeCart(JSON.parse(serialized),products); }
    catch (_) { return {}; }
  }
  function changeQuantity(cart, id, delta, products) {
    var next = sanitizeCart(cart, products);
    if (!products.some(function (p) { return p.id === id; }) || !Number.isSafeInteger(delta)) return next;
    var quantity = Math.max(0, Math.min(MAX_QTY, (next[id] || 0) + delta));
    if (quantity === 0) delete next[id]; else next[id] = quantity;
    return next;
  }
  function summary(cart, products) {
    var valid = sanitizeCart(cart, products);
    var rows = products.filter(function (p) { return valid[p.id]; }).map(function (p) {
      return { product:p, quantity:valid[p.id], amount:p.price * valid[p.id] };
    });
    return {
      rows:rows,
      count:rows.reduce(function (total,row) { return total + row.quantity; },0),
      subtotal:rows.reduce(function (total,row) { return total + row.amount; },0)
    };
  }
  return { normalize:normalize, filterProducts:filterProducts, sanitizeCart:sanitizeCart,
    loadCart:loadCart, changeQuantity:changeQuantity, summary:summary, MAX_QTY:MAX_QTY };
});