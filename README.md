# NOX — tienda en línea (v0.1, demo)

Primer paso para transformar el antiguo prototipo **TechStore** en **NOX**, una tienda digital con enfoque inicial en tecnología y accesorios.

## Estado

**Demostración de frontend solamente.** NOX todavía no tiene backend, inventario real, usuarios, órdenes, cobros, envío, garantías ni panel de administración. **Ningún pedido ni pago puede realizarse** desde esta versión. Los artículos, fotos y precios en pesos mexicanos son exclusivamente ilustrativos y no constituyen ofertas comerciales.

## Qué funciona

- Diseño responsive para móvil, tableta y escritorio; navegación con teclado, cierre con Escape y soporte para reducir movimiento.
- Catálogo ilustrativo con búsqueda sin sensibilidad a acentos, categorías y orden por precio/nombre.
- Carrito local con incremento, decremento y eliminación de artículos; contador y subtotal.
- Persistencia opcional con localStorage, filtrado de IDs no reconocidos y límite de 20 unidades por producto.
- Estado vacío y mensajes informativos; compra desactivada para evitar un falso checkout.

## Estructura

- index.html: landing y estructura de la tienda.
- style.css: identidad visual y breakpoints.
- catalog.js: artículos demo, datos que deben sustituirse antes del lanzamiento.
- store-core.js: lógica pura del carrito, filtros y resumen.
- scrip.js: comportamiento de interfaz (se conserva el nombre del archivo anterior para minimizar cambios).
- tests/store-core.test.cjs: pruebas de carrito y filtros.
- .github/workflows/nox-checks.yml: comprobaciones en GitHub Actions.

## Desarrollo local

No requiere instalar dependencias: abre index.html en un navegador o levanta un servidor estático. Para las pruebas, con Node.js 22:

    node --test tests/*.test.cjs
    node --check scrip.js

## Próximas fases sugeridas

1. Confirmar giro comercial, catálogo real, precios, fotos autorizadas e identidad de marca.
2. API y base de datos: productos, variantes, inventario, impuestos, descuentos.
3. Cuentas, direcciones, pedidos, seguridad, administración y auditoría.
4. Pasarela de pagos con operaciones verificadas del lado servidor (sin secretos en el cliente), webhooks firmados, conciliación y políticas de reembolso.
5. Logística, información legal, protección de datos y pruebas E2E antes de lanzar.

> Historial original: la tienda antigua simulaba pagos exitosos y vaciaba el carrito. NOX elimina esa conducta; no debe reactivarse sin integración real de pedidos y pagos.