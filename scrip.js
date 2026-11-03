/* NOX Fashion v0.2 — frontend de demostración; sin checkout real. */
(function () {
  "use strict";
  const products = window.NoxCatalog;
  const core = window.NoxStore;
  const CART_KEY = "nox_fashion_demo_cart_v2";
  const FAV_KEY = "nox_fashion_demo_favorites_v2";
  const fmt = new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:0});
  const $ = id => document.getElementById(id);
  const ui = {
    grid:$("productsGrid"), search:$("searchInput"),sort:$("sortSelect"),
    categories:$("categoryFilters"),audience:$("audienceFilter"),
    results:$("resultsCount"),reset:$("resetFilters"),
    favoriteToggle:$("favoritesToggle"),favoriteCount:$("favoritesCount"),
    cartToggle:$("cartToggle"),cartPanel:$("cartPanel"),cartCount:$("cartCount"),
    cartHeadingCount:$("cartHeadingCount"),cartTotal:$("cartTotal"),cartItems:$("cartItems"),
    backdrop:$("backdrop"),closeCart:$("closeCart"),checkout:$("checkoutBtn"),
    menu:$("menuButton"),nav:$("mainNav"),toast:$("toast"),
    productPanel:$("productPanel"),closeProduct:$("closeProduct"),detailImage:$("detailImage"),
    detailCategory:$("detailCategory"),detailTitle:$("detailTitle"),
    detailPrice:$("detailPrice"),detailDescription:$("detailDescription"),
    colorOptions:$("colorOptions"),sizeOptions:$("sizeOptions"),
    selectedColor:$("selectedColor"),selectedSize:$("selectedSize"),
    sizeGuideButton:$("sizeGuideButton"),sizeGuide:$("sizeGuide"),
    selectionError:$("selectionError"),addSelected:$("addSelectedToCart")
  };
  let cart = {};
  let favorites = [];
  let category = "all";
  let audience = "all";
  let onlyFavorites = false;
  let currentProduct = null;
  let currentSize = null;
  let currentColor = null;
  let activePanel = null;
  let returnFocus = null;
  let toastTimeout = 0;

  function escape(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g,
      char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  }
  function label(categoryName) {
    return {ropa:"Ropa",calzado:"Calzado",accesorios:"Accesorios"}[categoryName] || categoryName;
  }
  function store(key,value) {
    try {localStorage.setItem(key,JSON.stringify(value));} catch (_) {
      /* Modo privado: el carrito permanece en memoria. */
    }
  }
  function read(key) {
    try {return localStorage.getItem(key);}catch (_) {return null;}
  }
  function setToast(message) {
    clearTimeout(toastTimeout);
    ui.toast.textContent = message;
    ui.toast.hidden = false;
    toastTimeout = setTimeout(() => {ui.toast.hidden = true;},3200);
  }
  function syncFilters() {
    ui.categories.querySelectorAll("[data-category]").forEach(button => {
      const selected = button.dataset.category === category;
      button.classList.toggle("is-active",selected);
      button.setAttribute("aria-pressed",String(selected));
    });
    ui.audience.value = audience;
    ui.favoriteToggle.setAttribute("aria-pressed",String(onlyFavorites));
    ui.favoriteToggle.classList.toggle("is-active",onlyFavorites);
    ui.favoriteCount.textContent = favorites.length;
  }
  function renderProducts() {
    const results = core.filterProducts(products,{
      query:ui.search.value,sort:ui.sort.value,category,audience
    }).filter(p => !onlyFavorites || favorites.includes(p.id));
    ui.results.textContent = results.length + (results.length===1?" producto":" productos");
    syncFilters();
    if (!results.length) {
      ui.grid.innerHTML = '<div class="empty-results"><span aria-hidden="true">✳</span>'+
        '<h3>No encontramos piezas con esos filtros.</h3>'+
        '<p>Explora otras categorías o vuelve a la colección completa.</p>'+
        '<button type="button" id="emptyReset" class="button button-dark">Ver colección completa ↗</button></div>';
      return;
    }
    ui.grid.innerHTML = results.map((p,index) =>
      '<article class="product-card">'+
        '<div class="product-media">'+
          '<button class="view-media" type="button" data-view="'+escape(p.id)+'" aria-label="Ver detalles de '+escape(p.name)+'">'+
            '<img src="'+escape(p.image)+'" alt="Foto ilustrativa: '+escape(p.name)+'" loading="lazy">'+
          '</button>'+
          (p.tag ? '<span class="product-tag">'+escape(p.tag)+'</span>' : '')+
          '<button class="favorite-button '+(favorites.includes(p.id)?"is-favorite":"")+'" type="button" data-favorite="'+escape(p.id)+'" aria-pressed="'+favorites.includes(p.id)+'" aria-label="'+(favorites.includes(p.id)?"Quitar "+escape(p.name)+" de favoritos":"Guardar "+escape(p.name)+" en favoritos")+'">'+(favorites.includes(p.id)?"♥":"♡")+'</button>'+
        '</div>'+
        '<div class="product-card-info"><div class="product-caption"><span>'+escape(label(p.category))+' / '+escape(p.audience)+'</span><span>'+String(index+1).padStart(2,"0")+'</span></div>'+
          '<button class="product-name" data-view="'+escape(p.id)+'" type="button">'+escape(p.name)+'</button>'+
          '<div class="product-card-foot"><strong>'+escape(fmt.format(p.price))+'</strong>'+
            '<button class="quick-add" data-view="'+escape(p.id)+'" type="button" aria-label="Elegir talla y color de '+escape(p.name)+'">Elegir opciones <span aria-hidden="true">↗</span></button>'+
          '</div>'+
        '</div></article>'
    ).join("");
  }
  function renderCart() {
    const s=core.summary(cart,products);
    ui.cartCount.textContent=s.count;
    ui.cartHeadingCount.textContent="("+s.count+")";
    ui.cartTotal.textContent=fmt.format(s.subtotal);
    ui.checkout.disabled=true; // Seguridad comercial: nada de pagos falsos.
    if (!s.rows.length) {
      ui.cartItems.innerHTML='<div class="empty-cart"><span aria-hidden="true">◇</span>'+
        '<h3>Tu bolsa está vacía</h3><p>Explora la colección y encuentra tu próxima pieza favorita.</p>'+
        '<button id="continueShopping" class="button button-dark" type="button">Explorar colección ↗</button></div>';
    } else {
      ui.cartItems.innerHTML=s.rows.map(row =>
        '<article class="cart-item">'+
          '<div class="cart-item-image"><img src="'+escape(row.product.image)+'" alt=""></div>'+
          '<div class="cart-item-content"><p class="cart-item-category">'+escape(label(row.product.category))+'</p>'+
            '<h3>'+escape(row.product.name)+'</h3>'+
            '<p class="cart-item-variant">Talla: '+escape(row.size.label)+' · '+escape(row.color.label)+'</p>'+
            '<strong class="cart-item-price">'+escape(fmt.format(row.product.price))+'</strong>'+
            '<div class="qty-controls">'+
              '<button type="button" data-quantity="'+escape(row.key)+'" data-delta="-1" aria-label="Quitar una unidad de '+escape(row.product.name)+'">−</button>'+
              '<span aria-label="Cantidad">'+row.quantity+'</span>'+
              '<button type="button" data-quantity="'+escape(row.key)+'" data-delta="1" '+(row.quantity>=core.MAX_QTY?"disabled":"")+' aria-label="Añadir otra unidad de '+escape(row.product.name)+'">+</button>'+
              '<button class="remove-item" type="button" data-remove="'+escape(row.key)+'">Eliminar</button>'+
            '</div>'+
          '</div></article>'
      ).join("");
    }
    store(CART_KEY,cart);
  }
  function toggleFavorite(id) {
    favorites=core.toggleFavorite(favorites,id,products);
    store(FAV_KEY,favorites);
    renderProducts();
    setToast(favorites.includes(id)?"Agregado a favoritos":"Quitado de favoritos");
  }
  function setCategory(value) {
    category=["all","ropa","calzado","accesorios"].includes(value)?value:"all";
    renderProducts();
  }
  function setAudience(value) {
    audience=["all","mujer","hombre","unisex"].includes(value)?value:"all";
    renderProducts();
  }
  function resetFilters() {
    category="all";audience="all";onlyFavorites=false;
    ui.search.value="";ui.sort.value="featured";
    renderProducts();
  }
  function closeMenu() {
    ui.nav.classList.remove("is-open");
    ui.menu.setAttribute("aria-expanded","false");
  }
  function openPanel(panel,focusElement) {
    if (activePanel) closePanel(false);
    closeMenu();
    returnFocus=document.activeElement;
    activePanel=panel;
    panel.inert=false;
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden","false");
    ui.backdrop.hidden=false;
    document.body.classList.add("no-scroll");
    ui.cartToggle.setAttribute("aria-expanded",String(panel===ui.cartPanel));
    (focusElement || panel).focus();
  }
  function closePanel(restoreFocus=true) {
    if (!activePanel) return;
    activePanel.classList.remove("is-open");
    activePanel.setAttribute("aria-hidden","true");
    activePanel.inert=true;
    activePanel=null;
    ui.backdrop.hidden=true;
    document.body.classList.remove("no-scroll");
    ui.cartToggle.setAttribute("aria-expanded","false");
    if (restoreFocus && returnFocus && typeof returnFocus.focus==="function") returnFocus.focus();
  }
  function trapDialogFocus(event) {
    if (event.key!=="Tab" || !activePanel) return;
    const els=Array.from(activePanel.querySelectorAll(
      'a[href],button:not([disabled]):not([hidden]),input:not([disabled]),select:not([disabled]),[tabindex="0"]'
    )).filter(el => !el.closest("[hidden]"));
    if (!els.length) {event.preventDefault();activePanel.focus();return;}
    const first=els[0],last=els[els.length-1];
    if (event.shiftKey && document.activeElement===first) {event.preventDefault();last.focus();}
    else if (!event.shiftKey && document.activeElement===last) {event.preventDefault();first.focus();}
  }
  function selectOptions() {
    if (!currentProduct) return;
    ui.selectedColor.textContent=currentProduct.colors.find(c=>c.id===currentColor)?.label || "";
    ui.selectedSize.textContent=currentProduct.sizes.find(s=>s.id===currentSize)?.label || "— Selecciona";
    ui.colorOptions.innerHTML=currentProduct.colors.map(color =>
      '<button class="color-option '+(color.id===currentColor?"is-selected":"")+'" type="button" data-color="'+escape(color.id)+'" aria-label="Color '+escape(color.label)+'" aria-pressed="'+(color.id===currentColor)+'" title="'+escape(color.label)+'"><span style="--swatch:'+escape(color.hex)+'"></span></button>'
    ).join("");
    ui.sizeOptions.innerHTML=currentProduct.sizes.map(size =>
      '<button class="size-option '+(size.id===currentSize?"is-selected":"")+'" type="button" data-size="'+escape(size.id)+'" aria-pressed="'+(size.id===currentSize)+'">'+escape(size.label)+'</button>'
    ).join("");
    ui.selectionError.hidden=true;
  }
  function showProduct(id) {
    const product=products.find(p=>p.id===id);
    if (!product) return;
    currentProduct=product;
    currentColor=product.colors[0].id;
    currentSize=product.sizes.length===1?product.sizes[0].id:null;
    ui.detailImage.src=product.image;
    ui.detailImage.alt="Fotografía ilustrativa: "+product.name;
    ui.detailImage.hidden=false;
    ui.detailCategory.textContent=label(product.category)+" / "+product.audience.toUpperCase();
    ui.detailTitle.textContent=product.name;
    ui.detailPrice.textContent=fmt.format(product.price);
    ui.detailDescription.textContent=product.description;
    ui.sizeGuide.hidden=true;
    ui.sizeGuideButton.setAttribute("aria-expanded","false");
    selectOptions();
    openPanel(ui.productPanel,ui.closeProduct);
  }
  function addSelection() {
    if (!currentProduct) return;
    if (!currentSize) {
      ui.selectionError.textContent="Selecciona una talla para continuar.";
      ui.selectionError.hidden=false;
      ui.sizeOptions.querySelector("button")?.focus();
      return;
    }
    const key=core.makeKey(currentProduct,currentSize,currentColor);
    if (!key) {setToast("Selecciona una variante válida.");return;}
    if ((cart[key]||0)>=core.MAX_QTY) {setToast("Máximo de 10 unidades por variante.");return;}
    cart=core.changeQuantity(cart,key,1,products);
    renderCart();
    closePanel();
    setToast("Agregado a tu bolsa");
    openPanel(ui.cartPanel,ui.closeCart);
  }
  function navigateFromLink(link) {
    if (link.dataset.goAudience) {
      category="all";setAudience(link.dataset.goAudience);
    } else if (link.dataset.goCategory) {
      audience="all";setCategory(link.dataset.goCategory);
    }
    onlyFavorites=false;
    renderProducts();
    closeMenu();
  }
  ui.grid.addEventListener("click",event => {
    const view=event.target.closest("[data-view]");
    const fav=event.target.closest("[data-favorite]");
    if (fav) toggleFavorite(fav.dataset.favorite);
    else if (view) showProduct(view.dataset.view);
    else if (event.target.closest("#emptyReset")) resetFilters();
  });
  ui.grid.addEventListener("error",event => {
    if (event.target.tagName==="IMG") event.target.hidden=true;
  },true);
  ui.categories.addEventListener("click",event => {
    const chip=event.target.closest("[data-category]");
    if (chip) {onlyFavorites=false;setCategory(chip.dataset.category);}
  });
  ui.audience.addEventListener("change",event => {
    onlyFavorites=false;setAudience(event.target.value);
  });
  ui.search.addEventListener("input",renderProducts);
  ui.sort.addEventListener("change",renderProducts);
  ui.reset.addEventListener("click",resetFilters);
  ui.favoriteToggle.addEventListener("click",() => {
    onlyFavorites=!onlyFavorites;renderProducts();
    document.getElementById("coleccion").scrollIntoView({behavior:"smooth",block:"start"});
  });
  document.querySelectorAll("[data-go-audience],[data-go-category]").forEach(link => {
    link.addEventListener("click",() => navigateFromLink(link));
  });
  ui.cartToggle.addEventListener("click",() => openPanel(ui.cartPanel,ui.closeCart));
  ui.closeCart.addEventListener("click",() => closePanel());
  ui.closeProduct.addEventListener("click",() => closePanel());
  ui.backdrop.addEventListener("click",() => closePanel());
  ui.cartItems.addEventListener("error",event => {
    if (event.target.tagName==="IMG") event.target.hidden=true;
  },true);
  ui.detailImage.addEventListener("error",() => {ui.detailImage.hidden=true;});
  ui.cartItems.addEventListener("click",event => {
    const change=event.target.closest("[data-quantity]");
    const remove=event.target.closest("[data-remove]");
    if (change) {
      cart=core.changeQuantity(cart,change.dataset.quantity,Number(change.dataset.delta),products);
      renderCart();
    } else if (remove) {
      cart=core.changeQuantity(cart,remove.dataset.remove,-core.MAX_QTY,products);
      renderCart();
    } else if (event.target.closest("#continueShopping")) {
      closePanel();
      document.getElementById("coleccion").scrollIntoView({behavior:"smooth",block:"start"});
    }
  });
  ui.colorOptions.addEventListener("click",event => {
    const button=event.target.closest("[data-color]");
    if (button) {currentColor=button.dataset.color;selectOptions();}
  });
  ui.sizeOptions.addEventListener("click",event => {
    const button=event.target.closest("[data-size]");
    if (button) {currentSize=button.dataset.size;selectOptions();}
  });
  ui.sizeGuideButton.addEventListener("click",() => {
    const expanded=ui.sizeGuideButton.getAttribute("aria-expanded")==="true";
    ui.sizeGuide.hidden=expanded;
    ui.sizeGuideButton.setAttribute("aria-expanded",String(!expanded));
  });
  ui.addSelected.addEventListener("click",addSelection);
  ui.menu.addEventListener("click",() => {
    const open=ui.nav.classList.toggle("is-open");
    ui.menu.setAttribute("aria-expanded",String(open));
  });
  ui.nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click",closeMenu);
  });
  document.addEventListener("keydown",event => {
    if (event.key==="Escape") {closePanel();closeMenu();}
    trapDialogFocus(event);
  });
  window.addEventListener("resize",() => {if (window.innerWidth>780) closeMenu();});

  ui.cartPanel.inert=true;
  ui.productPanel.inert=true;
  cart=core.loadCart(read(CART_KEY),products);
  favorites=core.loadFavorites(read(FAV_KEY),products);
  renderProducts();
  renderCart();
})();