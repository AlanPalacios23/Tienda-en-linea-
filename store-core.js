/* NOX Fashion — lógica pura; nunca procesa pedidos ni pagos. */
(function(root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.NoxStore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function() {
  "use strict";
  const MAX_QTY = 10;
  const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

  function normalize(value) {
    return String(value == null ? "" : value).normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-MX").trim();
  }
  function filterProducts(products, opts = {}) {
    const query = normalize(opts.query);
    const category = opts.category || "all";
    const audience = opts.audience || "all";
    const result = products.filter(p =>
      (category === "all" || p.category === category) &&
      (audience === "all" || p.audience === audience || p.audience === "unisex") &&
      (!query || normalize([p.name,p.description,p.category,p.audience,...(p.tags || [])].join(" ")).includes(query))
    );
    if (opts.sort === "price-asc") result.sort((a,b) => a.price-b.price);
    if (opts.sort === "price-desc") result.sort((a,b) => b.price-a.price);
    if (opts.sort === "name") result.sort((a,b) => a.name.localeCompare(b.name,"es-MX"));
    return result;
  }
  function makeKey(product, sizeId, colorId) {
    if (!product || !Array.isArray(product.sizes) || !Array.isArray(product.colors)) return null;
    if (!product.sizes.some(size => size.id === sizeId) ||
        !product.colors.some(color => color.id === colorId)) return null;
    // Los identificadores de catálogo son código controlado, no entrada libre.
    if (![product.id,sizeId,colorId].every(value =>
      typeof value === "string" && /^[a-z0-9-]+$/.test(value))) return null;
    return [product.id,sizeId,colorId].join("::");
  }
  function resolveKey(key, products) {
    if (typeof key !== "string") return null;
    const parts = key.split("::");
    if (parts.length !== 3) return null;
    const product = products.find(p => p.id === parts[0]);
    if (!product || makeKey(product, parts[1], parts[2]) !== key) return null;
    return {
      key,
      product,
      size: product.sizes.find(s => s.id === parts[1]),
      color: product.colors.find(c => c.id === parts[2])
    };
  }
  function sanitizeCart(raw, products) {
    const safe = {};
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return safe;
    Object.keys(raw).forEach(key => {
      if (resolveKey(key,products) && own(raw,key) &&
          Number.isSafeInteger(raw[key]) && raw[key] > 0)
        safe[key] = Math.min(raw[key], MAX_QTY);
    });
    return safe;
  }
  function loadCart(serialized, products) {
    if (typeof serialized !== "string") return {};
    try { return sanitizeCart(JSON.parse(serialized),products); }
    catch (_) { return {}; }
  }
  function changeQuantity(cart, key, delta, products) {
    const next = sanitizeCart(cart,products);
    if (!resolveKey(key,products) || !Number.isSafeInteger(delta)) return next;
    const qty = Math.max(0,Math.min(MAX_QTY,(next[key] || 0)+delta));
    if (qty === 0) delete next[key]; else next[key] = qty;
    return next;
  }
  function summary(cart, products) {
    const valid = sanitizeCart(cart,products);
    const rows = Object.keys(valid).map(key => {
      const variant = resolveKey(key,products);
      return { ...variant, quantity:valid[key], amount:valid[key]*variant.product.price };
    });
    return {
      rows,
      count:rows.reduce((sum,row) => sum+row.quantity,0),
      subtotal:rows.reduce((sum,row) => sum+row.amount,0)
    };
  }
  function toggleFavorite(favorites, id, products) {
    const ids = sanitizeFavorites(favorites,products);
    if (!products.some(p => p.id === id)) return ids;
    return ids.includes(id) ? ids.filter(value => value !== id) : [...ids,id];
  }
  function sanitizeFavorites(raw,products) {
    if (!Array.isArray(raw)) return [];
    const allowed = new Set(products.map(p => p.id));
    return [...new Set(raw.filter(id => typeof id === "string" && allowed.has(id)))];
  }
  function loadFavorites(serialized,products) {
    if (typeof serialized !== "string") return [];
    try { return sanitizeFavorites(JSON.parse(serialized),products); }
    catch (_) { return []; }
  }
  return { MAX_QTY,normalize,filterProducts,makeKey,resolveKey,sanitizeCart,loadCart,
    changeQuantity,summary,toggleFavorite,sanitizeFavorites,loadFavorites };
});