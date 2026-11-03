/* Interfaz NOX v0.1: catálogo local, sin pedidos ni cobros. */
(function () {
  "use strict";
  var products = window.NoxCatalog;
  var core = window.NoxStore;
  var storageKey = "nox_demo_cart_v1";
  var cart = {};
  var category = "all";
  var lastFocused = null;
  var toastTimer = null;
  var ui = {
    grid: document.getElementById("productsGrid"),
    search: document.getElementById("searchInput"),
    sort: document.getElementById("sortSelect"),
    filters: document.getElementById("categoryFilters"),
    count: document.getElementById("resultsCount"),
    cartTrigger: document.getElementById("cartToggle"),
    cartPanel: document.getElementById("cartPanel"),
    backdrop: document.getElementById("backdrop"),
    closeCart: document.getElementById("closeCart"),
    cartItems: document.getElementById("cartItems"),
    cartCount: document.getElementById("cartCount"),
    cartHeadingCount: document.getElementById("cartHeadingCount"),
    cartTotal: document.getElementById("cartTotal"),
    checkout: document.getElementById("checkoutBtn"),
    menu: document.getElementById("menuButton"),
    nav: document.getElementById("navLinks"),
    toast: document.getElementById("toast")
  };
  var money = new Intl.NumberFormat("es-MX", { style:"currency", currency:"MXN", maximumFractionDigits:0 });
  function escapeText(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c];
    });
  }
  function categoryLabel(key) {
    return {audio:"Audio",setup:"Setup",accesorios:"Accesorios",smart:"Smart"}[key] || key;
  }
  function renderProducts() {
    var shown = core.filterProducts(products, {query:ui.search.value,category:category,sort:ui.sort.value});
    ui.count.textContent = shown.length + (shown.length === 1 ? " artículo" : " artículos");
    if (!shown.length) {
      ui.grid.innerHTML = '<div class="empty-results"><span aria-hidden="true">⌕</span><h3>No encontramos coincidencias</h3><p>Prueba con otro término o categoría.</p><button type="button" id="clearSearch" class="button button-dark">Ver toda la colección</button></div>';
      return;
    }
    ui.grid.innerHTML = shown.map(function (p,index) {
      return '<article class="product-card"><div class="product-media">'+
        '<img loading="lazy" src="'+escapeText(p.image)+'" alt="Imagen ilustrativa de '+escapeText(p.name)+'" onerror="this.hidden=true">'+
        (p.tag ? '<span class="product-tag">'+escapeText(p.tag)+'</span>' : '')+
        '<span class="product-index">'+String(index+1).padStart(2,"0")+'</span></div>'+
        '<div class="product-detail"><p class="product-category">'+escapeText(categoryLabel(p.category))+'</p>'+
        '<h3>'+escapeText(p.name)+'</h3><p class="product-description">'+escapeText(p.description)+'</p>'+
        '<div class="product-foot"><strong>'+escapeText(money.format(p.price))+'</strong>'+
        '<button class="add-button" type="button" data-add="'+escapeText(p.id)+'" aria-label="Agregar '+escapeText(p.name)+' a mi bolsa">+</button></div></div></article>';
    }).join("");
  }
  function persistCart() {
    try { localStorage.setItem(storageKey, JSON.stringify(cart)); }
    catch (_) { /* almacenamiento opcional: sesión temporal */ }
  }
  function renderCart() {
    var s = core.summary(cart,products);
    ui.cartCount.textContent = s.count;
    ui.cartHeadingCount.textContent = "(" + s.count + ")";
    ui.cartTotal.textContent = money.format(s.subtotal);
    ui.checkout.disabled = true; // No existe un backend de pagos ni pedidos.
    ui.cartItems.innerHTML = s.rows.length ? s.rows.map(function (row) {
      var p = row.product;
      return '<article class="cart-item"><div class="cart-item-media"><img src="'+escapeText(p.image)+'" alt="" onerror="this.hidden=true"></div>'+
        '<div class="cart-item-info"><p class="product-category">'+escapeText(categoryLabel(p.category))+'</p>'+
        '<h3>'+escapeText(p.name)+'</h3><p class="cart-price">'+escapeText(money.format(p.price))+'</p>'+
        '<div class="quantity-controls"><button type="button" data-quantity="'+escapeText(p.id)+'" data-delta="-1" aria-label="Quitar una unidad de '+escapeText(p.name)+'">−</button>'+
        '<span aria-label="Cantidad">'+row.quantity+'</span>'+
        '<button type="button" data-quantity="'+escapeText(p.id)+'" data-delta="1" aria-label="Agregar una unidad de '+escapeText(p.name)+'" '+(row.quantity >= core.MAX_QTY ? "disabled" : "")+'>+</button>'+
        '<button class="remove-button" type="button" data-remove="'+escapeText(p.id)+'">Eliminar</button></div></div></article>';
    }).join("") : '<div class="empty-cart"><span aria-hidden="true">◇</span><h3>Tu bolsa está vacía</h3><p>Encuentra algo especial en la colección.</p><button type="button" class="button button-dark" id="continueShopping">Explorar productos</button></div>';
    persistCart();
  }
  function showToast(message) {
    window.clearTimeout(toastTimer);
    ui.toast.textContent = message;
    ui.toast.hidden = false;
    toastTimer = window.setTimeout(function () { ui.toast.hidden = true; }, 3200);
  }
  function add(id) {
    var product = products.find(function (p) { return p.id === id; });
    if (!product) return;
    if ((cart[id] || 0) >= core.MAX_QTY) { showToast("Máximo de 20 unidades por artículo."); return; }
    cart = core.changeQuantity(cart,id,1,products);
    renderCart();
    showToast(product.name + " agregado a tu bolsa");
  }
  function setCategory(value, shouldScroll) {
    category = value;
    document.querySelectorAll("[data-category].filter-chip").forEach(function (button) {
      var selected = button.dataset.category === category;
      button.classList.toggle("is-active",selected);
      button.setAttribute("aria-pressed",String(selected));
    });
    renderProducts();
    if (shouldScroll) document.getElementById("coleccion").scrollIntoView({behavior:"smooth",block:"start"});
  }
  function openCart() {
    closeMenu();
    lastFocused = document.activeElement;
    ui.cartPanel.classList.add("is-open");
    ui.cartPanel.setAttribute("aria-hidden","false");
    ui.backdrop.hidden = false;
    ui.cartTrigger.setAttribute("aria-expanded","true");
    document.body.classList.add("no-scroll");
    ui.closeCart.focus();
  }
  function closeCart() {
    if (!ui.cartPanel.classList.contains("is-open")) return;
    ui.cartPanel.classList.remove("is-open");
    ui.cartPanel.setAttribute("aria-hidden","true");
    ui.backdrop.hidden = true;
    ui.cartTrigger.setAttribute("aria-expanded","false");
    document.body.classList.remove("no-scroll");
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }
  function closeMenu() {
    ui.nav.classList.remove("is-open");
    ui.menu.setAttribute("aria-expanded","false");
  }
  function trapFocus(event) {
    if (event.key !== "Tab" || !ui.cartPanel.classList.contains("is-open")) return;
    var focusable = Array.prototype.slice.call(ui.cartPanel.querySelectorAll('button:not([disabled]),a[href],input,select,[tabindex="0"]'));
    if (!focusable.length) { event.preventDefault(); ui.cartPanel.focus(); return; }
    var first = focusable[0], last = focusable[focusable.length-1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  ui.search.addEventListener("input",renderProducts);
  ui.sort.addEventListener("change",renderProducts);
  ui.filters.addEventListener("click",function (event) {
    var button = event.target.closest("[data-category]");
    if (button) setCategory(button.dataset.category,false);
  });
  document.querySelector(".category-grid").addEventListener("click",function (event) {
    var button = event.target.closest("[data-category]");
    if (button) setCategory(button.dataset.category,true);
  });
  ui.grid.addEventListener("click",function (event) {
    var button = event.target.closest("[data-add]");
    if (button) add(button.dataset.add);
    if (event.target.id === "clearSearch") { ui.search.value=""; setCategory("all",false); }
  });
  ui.cartItems.addEventListener("click",function (event) {
    var change = event.target.closest("[data-quantity]");
    var remove = event.target.closest("[data-remove]");
    if (change) { cart = core.changeQuantity(cart,change.dataset.quantity,Number(change.dataset.delta),products); renderCart(); }
    if (remove) { cart = core.changeQuantity(cart,remove.dataset.remove,-core.MAX_QTY,products); renderCart(); }
    if (event.target.id === "continueShopping") { closeCart(); document.getElementById("coleccion").scrollIntoView({behavior:"smooth"}); }
  });
  ui.cartTrigger.addEventListener("click",openCart);
  ui.closeCart.addEventListener("click",closeCart);
  ui.backdrop.addEventListener("click",closeCart);
  ui.menu.addEventListener("click",function () {
    var opened = ui.nav.classList.toggle("is-open");
    ui.menu.setAttribute("aria-expanded",String(opened));
  });
  ui.nav.querySelectorAll("a").forEach(function (a) { a.addEventListener("click",closeMenu); });
  document.addEventListener("keydown",function (event) {
    if (event.key === "Escape") { closeCart(); closeMenu(); }
    trapFocus(event);
  });
  window.addEventListener("resize",function () { if (window.innerWidth > 760) closeMenu(); });
  try { cart = core.loadCart(localStorage.getItem(storageKey),products); }
  catch (_) { cart = {}; }
  renderProducts();
  renderCart();
})();