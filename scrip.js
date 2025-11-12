// Datos de productos ampliados
const products = [
    // LAPTOPS
    {
        id: 1,
        name: "MacBook Pro 16\" M2 Max",
        price: 3299.99,
        category: "laptops",
        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        description: "Laptop profesional con chip M2 Max, 32GB RAM y 1TB SSD. Ideal para creativos y desarrolladores."
    },
    {
        id: 2,
        name: "Dell XPS 13 Plus",
        price: 1499.99,
        category: "laptops",
        image: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        description: "Ultrabook premium con pantalla InfinityEdge 4K y procesador Intel i7 de 12va generación."
    },
    {
        id: 3,
        name: "ASUS ROG Zephyrus G14",
        price: 1799.99,
        category: "laptops",
        image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        description: "Laptop gaming con RTX 4060, AMD Ryzen 9 y pantalla 144Hz. Potencia en formato compacto."
    },
    {
        id: 4,
        name: "Lenovo ThinkPad X1 Carbon",
        price: 1899.99,
        category: "laptops",
        image: "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        description: "Laptop empresarial ultraligera con teclado ergonómico y máxima seguridad biométrica."
    },
    {
        id: 5,
        name: "HP Spectre x360 14",
        price: 1399.99,
        category: "laptops",
        image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        description: "Convertible 2-en-1 con pantalla OLED 4K y diseño premium de aluminio tallado."
    },

    // SMARTPHONES
    {
        id: 6,
        name: "iPhone 15 Pro Max",
        price: 1299.99,
        category: "smartphones",
        image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        description: "Flagship de Apple con cámara de 48MP, Dynamic Island y chip A17 Pro."
    },
    {
        id: 7,
        name: "Samsung Galaxy S24 Ultra",
        price: 1199.99,
        category: "smartphones",
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        description: "Smartphone con S Pen integrado, cámara de 200MP y pantalla Dynamic AMOLED 2X."
    },
    {
        id: 8,
        name: "Google Pixel 8 Pro",
        price: 999.99,
        category: "smartphones",
        image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        description: "Teléfono con la mejor cámara de Google, Tensor G3 y actualizaciones por 7 años."
    },
    {
        id: 9,
        name: "OnePlus 12",
        price: 899.99,
        category: "smartphones",
        image: "https://images.unsplash.com/photo-1556656793-08538906a9f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        description: "Flagship con carga de 100W, Snapdragon 8 Gen 3 y pantalla Fluid AMOLED 120Hz."
    },
    {
        id: 10,
        name: "Xiaomi 14 Ultra",
        price: 1099.99,
        category: "smartphones",
        image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        description: "Smartphone fotográfico con colaboración Leica, cámara 1\" y carga inalámbrica rápida."
    },

    // TABLETS
    {
        id: 11,
        name: "iPad Pro 12.9\" M2",
        price: 1299.99,
        category: "tablets",
        image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        description: "Tablet profesional con chip M2, pantalla Liquid Retina XDR y compatibilidad con Magic Keyboard."
    },
    {
        id: 12,
        name: "Samsung Galaxy Tab S9 Ultra",
        price: 1099.99,
        category: "tablets",
        image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        description: "Tablet Android premium con S Pen incluido, pantalla Dynamic AMOLED 2X de 14.6\"."
    },
    {
        id: 13,
        name: "Microsoft Surface Pro 9",
        price: 1199.99,
        category: "tablets",
        image: "https://images.unsplash.com/photo-1561154464-82e9adf32764?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        description: "Tablet 2-en-1 con Windows 11, procesador Intel i7 y teclado Surface Pro Signature."
    },
    {
        id: 14,
        name: "iPad Air 5",
        price: 749.99,
        category: "tablets",
        image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        description: "Tablet versátil con chip M1, pantalla Liquid Retina y compatibilidad con Apple Pencil 2."
    },

    // CONSOLAS
    {
        id: 15,
        name: "PlayStation 5",
        price: 499.99,
        category: "consolas",
        image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        description: "Consola de última generación con SSD ultrarrápido, DualSense y gráficos 4K/120fps."
    },
    {
        id: 16,
        name: "Xbox Series X",
        price: 499.99,
        category: "consolas",
        image: "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        description: "Consola más poderosa con Game Pass, Quick Resume y retrocompatibilidad."
    },
    {
        id: 17,
        name: "Nintendo Switch OLED",
        price: 349.99,
        category: "consolas",
        image: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        description: "Consola híbrida con pantalla OLED de 7\", audio mejorado y modo tabletop."
    },
    {
        id: 18,
        name: "Steam Deck OLED",
        price: 549.99,
        category: "consolas",
        image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        description: "Handheld gaming PC con pantalla HDR OLED, AMD APU y almacenamiento NVMe rápido."
    },

    // ACCESORIOS
    {
        id: 19,
        name: "Apple Watch Series 9",
        price: 399.99,
        category: "accesorios",
        image: "https://images.unsplash.com/photo-1579586337278-3f436c25d4a1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        description: "Smartwatch con chip S9, pantalla Always-On y monitor de salud avanzado."
    },
    {
        id: 20,
        name: "AirPods Pro 2",
        price: 249.99,
        category: "accesorios",
        image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        description: "Audífonos inalámbricos con cancelación activa de ruido y resistencia al agua IPX4."
    },
    {
        id: 21,
        name: "Samsung Galaxy Watch 6",
        price: 329.99,
        category: "accesorios",
        image: "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        description: "Smartwatch con Wear OS, monitor de sueño avanzado y batería de 40 horas."
    },
    {
        id: 22,
        name: "Cargador Inalámbrico MagSafe",
        price: 39.99,
        category: "accesorios",
        image: "https://images.unsplash.com/photo-1609592810795-8c47e5b89ec8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        description: "Cargador magnético de 15W compatible con iPhone y AirPods con estuche MagSafe."
    },
    {
        id: 23,
        name: "Teclado Mecánico Logitech MX",
        price: 129.99,
        category: "accesorios",
        image: "https://images.unsplash.com/photo-1541140532154-b024d705b90a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        description: "Teclado mecánico inalámbrico con switches táctiles e iluminación RGB personalizable."
    },
    {
        id: 24,
        name: "Monitor Dell 32\" 4K",
        price: 499.99,
        category: "accesorios",
        image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        description: "Monitor UHD con HDR400, USB-C 90W y tecnología ComfortView Plus."
    },
    {
        id: 25,
        name: "Webcam Logitech Brio 4K",
        price: 199.99,
        category: "accesorios",
        image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        description: "Cámara web 4K con HDR, seguimiento automático y cancelación de ruido RightSight."
    },
    {
        id: 26,
        name: "Batería Externa Anker 20000mAh",
        price: 49.99,
        category: "accesorios",
        image: "https://images.unsplash.com/photo-1609592810795-8c47e5b89ec8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        description: "Power bank de alta capacidad con carga rápida Power Delivery 20W y USB-C."
    },

    // COMPONENTES
    {
        id: 27,
        name: "RTX 4080 16GB",
        price: 1199.99,
        category: "componentes",
        image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        description: "Tarjeta gráfica de gama alta con DLSS 3, ray tracing y 16GB GDDR6X."
    },
    {
        id: 28,
        name: "SSD Samsung 990 Pro 2TB",
        price: 179.99,
        category: "componentes",
        image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        description: "SSD NVMe PCIe 4.0 con velocidades de 7450MB/s lectura y 6900MB/s escritura."
    },
    {
        id: 29,
        name: "Procesador AMD Ryzen 9 7950X",
        price: 699.99,
        category: "componentes",
        image: "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        description: "CPU de 16 núcleos y 32 hilos con arquitectura Zen 4 y frecuencia boost hasta 5.7GHz."
    },
    {
        id: 30,
        name: "RAM Corsair Dominator 64GB",
        price: 299.99,
        category: "componentes",
        image: "https://images.unsplash.com/photo-1599045118108-bb9954c7949f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        description: "Kit de memoria DDR5 6400MHz con iluminación RGB y disipador de aluminio."
    }
];

// Estado de la aplicación
let cart = [];
let filteredProducts = [...products];

// Elementos del DOM
const productsGrid = document.getElementById('productsGrid');
const cartIcon = document.getElementById('cartIcon');
const cartModal = document.getElementById('cartModal');
const overlay = document.getElementById('overlay');
const closeCart = document.getElementById('closeCart');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');
const cartCount = document.querySelector('.cart-count');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const priceFilter = document.getElementById('priceFilter');
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    setupEventListeners();
    loadCartFromStorage();
    updateCart();
});

// Configurar event listeners
function setupEventListeners() {
    // Carrito
    cartIcon.addEventListener('click', toggleCart);
    closeCart.addEventListener('click', toggleCart);
    overlay.addEventListener('click', closeAllModals);
    checkoutBtn.addEventListener('click', checkout);
    
    // Filtros
    searchInput.addEventListener('input', filterProducts);
    categoryFilter.addEventListener('change', filterProducts);
    priceFilter.addEventListener('change', filterProducts);
    
    // Menú hamburguesa
    hamburger.addEventListener('click', toggleMobileMenu);
    
    // Cerrar menú al hacer clic en enlace
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                closeMobileMenu();
            }
        });
    });
    
    // Enlaces de categorías en el footer
    document.querySelectorAll('.footer-links a[data-category]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const category = e.target.getAttribute('data-category');
            categoryFilter.value = category;
            filterProducts();
            
            // Scroll a productos
            document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
        });
    });
    
    // Cerrar modales con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
    
    // Prevenir problemas de scroll en móviles
    window.addEventListener('resize', handleResize);
}

// Manejar redimensionado de ventana
function handleResize() {
    if (window.innerWidth > 768) {
        closeMobileMenu();
    }
}

// Renderizar productos
function renderProducts() {
    productsGrid.innerHTML = '';
    
    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-search"></i>
                <h3>No se encontraron productos</h3>
                <p>Intenta con otros términos de búsqueda o categorías</p>
            </div>
        `;
        return;
    }
    
    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <button class="add-to-cart" data-id="${product.id}">
                    <i class="fas fa-cart-plus"></i> Añadir al Carrito
                </button>
            </div>
        `;
        productsGrid.appendChild(productCard);
    });
    
    // Agregar event listeners a los botones de añadir al carrito
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = parseInt(e.target.closest('.add-to-cart').getAttribute('data-id'));
            addToCart(productId);
        });
    });
}

// Filtrar productos
function filterProducts() {
    const searchTerm = searchInput.value.toLowerCase();
    const category = categoryFilter.value;
    const priceRange = priceFilter.value;
    
    filteredProducts = products.filter(product => {
        // Filtro por búsqueda
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) || 
                             product.description.toLowerCase().includes(searchTerm);
        
        // Filtro por categoría
        const matchesCategory = category === 'all' || product.category === category;
        
        // Filtro por precio
        let matchesPrice = true;
        if (priceRange !== 'all') {
            if (priceRange === '0-100') {
                matchesPrice = product.price <= 100;
            } else if (priceRange === '100-500') {
                matchesPrice = product.price > 100 && product.price <= 500;
            } else if (priceRange === '500-1000') {
                matchesPrice = product.price > 500 && product.price <= 1000;
            } else if (priceRange === '1000-2000') {
                matchesPrice = product.price > 1000 && product.price <= 2000;
            } else if (priceRange === '2000+') {
                matchesPrice = product.price > 2000;
            }
        }
        
        return matchesSearch && matchesCategory && matchesPrice;
    });
    
    renderProducts();
}

// Funciones del carrito - CORREGIDAS
function addToCart(productId) {
    console.log('Añadiendo producto ID:', productId); // Debug
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }
    
    console.log('Carrito actual:', cart); // Debug
    updateCart();
    showNotification(`${product.name} añadido al carrito`, 'success');
}

function removeFromCart(productId) {
    console.log('Eliminando producto ID:', productId); // Debug
    const product = cart.find(item => item.id === productId);
    cart = cart.filter(item => item.id !== productId);
    updateCart();
    showNotification(`${product.name} eliminado del carrito`, 'warning');
}

function updateQuantity(productId, change) {
    console.log('Actualizando cantidad producto ID:', productId, 'Cambio:', change); // Debug
    const item = cart.find(item => item.id === productId);
    
    if (item) {
        item.quantity += change;
        
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            updateCart();
        }
    }
}

function updateCart() {
    console.log('Actualizando carrito...'); // Debug
    
    // Actualizar contador
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    console.log('Total items:', totalItems); // Debug
    
    // Actualizar items del carrito
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h3>Tu carrito está vacío</h3>
                <p>Agrega algunos productos para continuar</p>
            </div>
        `;
        checkoutBtn.disabled = true;
        console.log('Carrito vacío'); // Debug
    } else {
        console.log('Renderizando', cart.length, 'productos en el carrito'); // Debug
        
        cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn decrease" data-id="${item.id}">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn increase" data-id="${item.id}">+</button>
                    </div>
                    <button class="remove-item" data-id="${item.id}">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            `;
            cartItems.appendChild(cartItem);
        });
        
        checkoutBtn.disabled = false;
        
        // Agregar event listeners a los botones del carrito
        document.querySelectorAll('.decrease').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = parseInt(e.target.getAttribute('data-id'));
                updateQuantity(productId, -1);
            });
        });
        
        document.querySelectorAll('.increase').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = parseInt(e.target.getAttribute('data-id'));
                updateQuantity(productId, 1);
            });
        });
        
        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = parseInt(e.target.closest('.remove-item').getAttribute('data-id'));
                removeFromCart(productId);
            });
        });
    }
    
    // Actualizar total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `$${total.toFixed(2)}`;
    console.log('Total calculado:', total); // Debug
    
    // Guardar en localStorage
    saveCartToStorage();
}

function toggleCart() {
    console.log('Abriendo/cerrando carrito'); // Debug
    cartModal.classList.toggle('active');
    overlay.classList.toggle('active');
    
    if (cartModal.classList.contains('active')) {
        document.body.classList.add('cart-open');
        closeMobileMenu(); // Cerrar menú móvil si está abierto
    } else {
        document.body.classList.remove('cart-open');
    }
}

function toggleMobileMenu() {
    navLinks.classList.toggle('active');
    hamburger.classList.toggle('active');
    
    if (navLinks.classList.contains('active')) {
        document.body.classList.add('menu-open');
        closeCartModal(); // Cerrar carrito si está abierto
    } else {
        document.body.classList.remove('menu-open');
    }
}

function closeMobileMenu() {
    navLinks.classList.remove('active');
    hamburger.classList.remove('active');
    document.body.classList.remove('menu-open');
}

function closeCartModal() {
    cartModal.classList.remove('active');
    overlay.classList.remove('active');
    document.body.classList.remove('cart-open');
}

function closeAllModals() {
    closeMobileMenu();
    closeCartModal();
}

function checkout() {
    if (cart.length === 0) return;
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    // Simular proceso de pago
    showNotification(`¡Compra realizada! ${totalItems} productos por $${total.toFixed(2)}. Gracias por tu compra.`, 'success');
    
    // Limpiar carrito
    cart = [];
    updateCart();
    closeCartModal();
}

// Funciones de utilidad
function showNotification(message, type = 'info') {
    // Crear notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="close-notification">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Event listener para cerrar notificación
    notification.querySelector('.close-notification').addEventListener('click', () => {
        notification.remove();
    });
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Persistencia del carrito
function saveCartToStorage() {
    localStorage.setItem('techstore_cart', JSON.stringify(cart));
    console.log('Carrito guardado en localStorage:', cart); // Debug
}

function loadCartFromStorage() {
    const savedCart = localStorage.getItem('techstore_cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        console.log('Carrito cargado desde localStorage:', cart); // Debug
    }
}