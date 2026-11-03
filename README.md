# NOX — 6 playeras · Stripe Checkout · PostgreSQL

Proyecto NOX v0.3 en desarrollo: **tienda propia de ropa con solo seis diseños de playeras**, cada diseño con tres piezas **M** y dos piezas **L**.

Total inicial de 30 unidades físicas a registrar:
| Diseño | Talla M | Talla L | Total |
| --- | ---: | ---: | ---: |
| NOX ECLIPSE | 3 | 2 | 5 |
| NOX STATIC | 3 | 2 | 5 |
| NOX ORBIT | 3 | 2 | 5 |
| NOX PULSE | 3 | 2 | 5 |
| NOX SHIFT | 3 | 2 | 5 |
| NOX VOID | 3 | 2 | 5 |
| **Total** | **18** | **12** | **30** |

Los seis nombres y vectores SVG son **propuestas originales de diseño**, no fotografías ni mercancía fabricada; requieren aprobación final. La cifra de unidades refleja la instrucción del dueño, no un conteo físico verificado.

## Qué está implementado
- Home NOX responsive con seis fichas de playeras; tamaño M/L y unidades por variante.
- API Node/Express con catálogo real desde PostgreSQL, sin precios ni stock fijados por el navegador.
- Inventario total, reservado y vendido, con transacciones y bloqueo de filas para impedir sobreventa.
- Checkout hospedado de Stripe con redirección a Stripe, importe en centavos MXN reconstruido en backend.
- Webhook firmado con verificación de montos, idempotencia, pagos asíncronos, sesión expirada y liberación o venta de unidades.
- Página de estado que consulta el servidor y **no** declara pagos exitosos solo por el redirect.
- Reconciliación para sesiones registradas cuyo webhook no llegó.
- Pruebas automáticas de competencia por inventario, pagos repetidos, espera asíncrona y caducidad.

## ESTADO DE ACTIVACIÓN
**La tienda NO está lista para aceptar cobros LIVE.** Aunque el flujo de Stripe se desarrolló, el despliegue no se hizo y el checkout está desactivado por defecto. Ningún producto ni cobro se creó en Stripe con esta implementación.

Pendientes bloqueantes:
1. Precio real de cada diseño en MXN; la columna \`price_cents\` inicia **NULL** para evitar precios imaginados.
2. Confirmar diseños/arte final, materiales, fotografías autorizadas y piezas disponibles reales.
3. Tarifa de envío o decisión explícita de envío gratis / recogida; zona de entrega y transportista.
4. Política de devoluciones, cambios, privacidad, términos y facturación/IVA aplicable.
5. Configurar secreto Stripe y secreto de webhook **de la cuenta correcta para NOX**, sin reutilizar credenciales de otros proyectos; separar entornos de prueba/producción.
6. QA de pago real en Stripe TEST/sandbox, incluida expiración, webhook duplicado, pago asíncrono, cancelación, error, refund, desconexión y conciliación de existencias.
7. Publicar backend y HTTPS, monitorización de webhooks, backup PostgreSQL, cron de reconciliación y soporte al cliente.
8. Decidir email de confirmación, logística de envíos y administración de pedidos.

## Arquitectura
- \`index.html\`, \`style.css\`, \`scrip.js\`: storefront y carrito local de presentación.
- \`assets/nox-01.svg\` ... \`assets/nox-06.svg\`: prototipos visuales con diseño gráfico distinto.
- \`server/schema.sql\`: catálogo, inventario y pedidos.
- \`server/inventory.js\`: reserva concurrente de stock y cumplimiento idempotente desde eventos Stripe.
- \`server/index.js\`: API y Checkout Sessions.
- \`server/reconcile.js\`: conciliación para sesiones **registradas** al vencer; estados sin session_id deben revisarse manualmente antes de liberar stock.
- \`server/set-price.js\`: mantenimiento manual de precios por diseño (sin cambiar stock).
- \`server/test/\`: pruebas de inventario/Stripe/seguridad.

## Desarrollo local
Requiere Node 22+ y PostgreSQL 15+.
1. Crear una base de datos exclusiva para NOX (en PostgreSQL, sin tocar Tala Eats ni otros negocios).
2. En el servidor, crear el archivo privado \`server/.env\` con base en \`server/.env.example\`, o inyectar las variables mediante el gestor de secretos. **No subir .env al repositorio**.
3. Configurar \`DATABASE_URL\` y \`PUBLIC_BASE_URL=http://localhost:8080\`.
4. Ejecutar \`cd server && npm install && npm run migrate\`.
5. Levantar la API con \`npm start\`; la tienda estará en \`http://localhost:8080\`.
6. Precios reales: \`DATABASE_URL=... node server/set-price.js nox-01 599.00\` (repetir con cada diseño; el valor es solo un ejemplo de sintaxis, no una sugerencia comercial).

Antes de habilitar pagos, configurar en el gestor de secretos:
- \`STRIPE_API_KEY\`: preferir clave restringida \`rk_\` de mínimo privilegio, distinta por entorno.
- \`STRIPE_WEBHOOK_SECRET\`: secreto del destino Stripe para \`POST /api/stripe/webhook\`.
- \`SHIPPING_CENTS\`: importe fijo confirmado en centavos de peso; poner \`0\` **solo** si se ofrece envío gratis.
- \`CHECKOUT_ENABLED=true\` cuando todo esté aprobado y testeado.
- \`ALLOW_LIVE_CHECKOUT=true\` **solo** para un lanzamiento LIVE explícitamente aprobado. Evitar usar claves LIVE en CI.

En Stripe configurar suscripciones de eventos de Checkout: \`checkout.session.completed\`, \`checkout.session.async_payment_succeeded\`, \`checkout.session.async_payment_failed\`, \`checkout.session.expired\`. Mantener registro y observabilidad; **no** crear pedidos pagados desde el navegador.

### Reservas escasas
- Al pulsar pagar, el backend bloquea filas de stock (PostgreSQL \`FOR UPDATE\`) y reserva antes de crear una sesión Stripe.
- La sesión Checkout vence a los 35 minutos, con un mínimo de 30 minutos para cumplir límites de Stripe.
- Confirmación pagada: decrementa \`reserved\` y aumenta \`sold\`, **una sola vez**.
- Expiración o fallo asíncrono: devuelve \`reserved\` al disponible.
- Un Checkout abandonado conserva la reserva hasta que Stripe confirme la expiración.
- La conciliación consulta a Stripe, nunca libera unidades únicamente por el reloj.
- Si la creación de Stripe falla después de reservar y no consta un \`session_id\`, **no liberar manualmente a ciegas**: verificar la transacción en Stripe antes de corregir.
- La liberación post-reembolso o devolución física exige una decisión de administración, no se hace sola.

### Seguridad y límites
- El carrito local no es un sistema de precios ni de disponibilidad autorizado.
- Checkout no se habilita si falta alguna de las seis tarifas, el envío o la integración.
- No introducir datos de tarjeta en NOX; Stripe los captura directamente.
- No guardar claves de Stripe en HTML, JS, archivos .env versionados ni logs.
- Este MVP aún requiere rate limits delante de /api/checkout, cookies/sesiones y observabilidad/alertas para un despliegue serio.
- El webhook firma y valida los eventos, pero el servidor debe recibirlo mediante HTTPS con una ruta de entrega segura.
- Los números de factura o impuestos requieren política fiscal confirmada. No habilitar automatic_tax sin registros fiscales apropiados.

## Pruebas
\`node --test tests/*.test.cjs\` valida interfaz estática.
\`npm --prefix server test\` valida lógica y PostgreSQL (requiere \`DATABASE_URL\` apuntando a una base de prueba aislada).
GitHub Actions arranca PostgreSQL 16 efímero, migra y ejecuta pruebas, sin claves reales ni transacciones de Stripe.
