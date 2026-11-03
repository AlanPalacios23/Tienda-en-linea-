# NOX — Fashion Storefront v0.2 (demo)

NOX es una futura tienda en línea de **ropa, moda, calzado y accesorios**, con identidad editorial premium, diseño responsive y selección de prendas por talla y color.

## Estado real
**Prototipo frontend; no es una tienda lista para vender.** El catálogo de 12 artículos, las fotos de referencia, las variantes, los precios en pesos mexicanos y las tallas son de demostración. No son ofertas, no son referencias de inventario ni confirman disponibilidad. No hay backend, cuentas, panel de gestión, órdenes, envíos, devoluciones o cobros. El botón de checkout está deshabilitado de forma intencional.

## Incluye
- Home/editorial de moda, navegación por categorías, audiencia (mujer/hombre/unisex), búsqueda y ordenamiento.
- Catálogo demo con fichas visuales y vista rápida con talla, color y guía de tallas orientativa.
- Carrito persistido por combinación **producto + talla + color**, con límites y subtotal derivado del catálogo.
- Favoritos locales en el navegador, sin sincronización ni cuentas.
- Estados vacíos, controles de teclado, controles visibles en móvil y compatibilidad con preferencia de movimiento reducido.
- Pruebas unitarias del catálogo y núcleo puro de variantes/carrito/favoritos en GitHub Actions.

## Archivos
- index.html: secciones y diálogos accesibles del storefront.
- style.css: diseño editorial, móvil y escritorio.
- catalog.js: catálogo ficticio (sustituir por fuente autorizada antes del lanzamiento).
- store-core.js: selección, validación y cálculos puramente frontend.
- scrip.js: interacciones y persistencia local.
- tests/store-core.test.cjs: batería de pruebas.
- .github/workflows/nox-checks.yml: CI Node 22.

Para ejecutar pruebas con Node 22: \`node --test tests/*.test.cjs\`. Para servir el frontend: \`python3 -m http.server 8080\`.

## Decisiones de seguridad
- Se utiliza un namespace nuevo en localStorage (nox_fashion_demo_*_v2), por lo que no se importan artículos del antiguo catálogo tecnológico.
- Nunca se persisten ni calculan precios desde el carrito. IDs, colores y tallas se cotejan con el catálogo.
- El checkout permanece **desactivado** hasta tener pedidos y pasarela reales verificados desde el servidor.
- No incorporar secretos, credenciales, precios administrativos ni operaciones sensibles en el frontend.

## Futuras fases
1. Definir marca comercial, colecciones y segmento; adquirir/licenciar fotos originales, descripciones y precios reales.
2. Backend de productos/SKU, variantes, existencias, reservas e imágenes administrables; PDP completo y tablas de tallas por producto.
3. Cuentas y direcciones, backoffice, pedidos, estados, cancelación y devoluciones.
4. Integración de Stripe con webhooks firmados, validaciones de importe en servidor, idempotencia y conciliación.
5. Logística, facturación, términos, privacidad, accesibilidad y E2E de compra antes de producción.