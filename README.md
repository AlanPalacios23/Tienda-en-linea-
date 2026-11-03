# NOX — First Drop v0.4 · 6 oversize · Stripe Checkout

Marca propia NOX: **seis diseños de playera/camisa oversize** con inventario inicial fijo **3 talla M + 2 talla L por diseño = 30 prendas**. Los SVG son conceptos originales para revisión; no sustituyen las fotografías del producto real.

## Precios comerciales aprobados (MXN)

- Cada playera: **$499**.
- Envío a México fuera de la ciudad de Tala: **$149** con DHL Express; **$0** en compras con subtotal de prendas **estrictamente mayor que $1,399**. Con 3 prendas ($1,497) aplica.
- Entrega en ciudad Tala, Jalisco: **$49**, objetivo de entrega VIP en menos de 90 minutos, sujeto a horario, personal y viabilidad.
- Promoción local **NOXTALA**: precio equivalente a **$399 por playera** (descuento de $100 por prenda) cuando se aplica el código en **Stripe Checkout** y el pedido cumple domicilio local; siempre se añaden $49 por entrega.
- Envío nacional DHL Express 2–3 días: **plazo estimado a validar** con operador, cobertura y hora de corte, no garantía en esta fase.

| Caso | Prendas | Entrega | Cupón | Total |
| --- | ---: | ---: | --- | ---: |
| 1 nacional | $499 | $149 | — | **$648** |
| 2 nacionales | $998 | $149 | — | **$1,147** |
| 3 nacionales | $1,497 | $0 | — | **$1,497** |
| 1 Tala | $499 | $49 | NOXTALA | **$448** |
| 3 Tala | $1,497 | $49 | NOXTALA | **$1,246** |

Los totales no incluyen posibles impuestos adicionales no configurados; requieren definir la política fiscal real. La promoción local no aplica a envíos nacionales.

## Código NOXTALA en Stripe

La sesión de Stripe habilita \`allow_promotion_codes\` solo al elegir **Entrega Tala**. **No se ha creado ningún cupón en Stripe LIVE** ni se ha activado el checkout.

1. En un sandbox/TEST exclusivo de NOX, crear un cupón \`percent_off: 20.04\`, \`duration: once\` con nombre "NOX Tala". Sobre precio de $499 MXN equivale a $100 de descuento por prenda en los SKUs permitidos (verificar redondeo en pruebas de Stripe).
2. Crear un código promocional activo exactamente \`NOXTALA\` apuntando al cupón. Configurar código específico para NOX; si se comparte la cuenta Stripe con otras empresas, debe restringirse su alcance a productos NOX o migrar a una cuenta aislada antes de LIVE.
3. Proporcionar su identificador \`promo_...\` en \`STRIPE_NOXTALA_PROMO_ID\` como secreto/configuración de servidor. El backend valida código activo y porcentaje antes de reservar una compra local.
4. Cliente selecciona Tala, introduce CP elegible y luego escribe NOXTALA dentro del Checkout hospedado de Stripe.
5. El webhook verifica la firma de Stripe, moneda, importe, descuento permitido, zona y dirección final del checkout. Si hay inconsistencia, la orden queda \`needs_review\`, **no se cumple** y el stock sigue retenido hasta resolver el pago y una devolución/manual.
6. **No activar LIVE** hasta probar en el sandbox descuentos para 1–5 prendas, compra multivariante, otros códigos promocionales activos, discrepancia postal, reembolso, métodos asíncronos y reconciliación. El control por dirección/importe del webhook evita despacho indebido, pero **no evita por sí solo el cobro previo a una dirección alterada dentro de Stripe**; confirmar esta experiencia y política de reembolso antes del lanzamiento.

### Cobertura Tala

Por precaución, la primera versión habilita la ciudad **Tala** solo con CP \`45300, 45302, 45303, 45305, 45306, 45307, 45308\` y coincidencia de ciudad \`Tala\`, estado \`Jalisco\`, país \`MX\`. **No** se extiende automáticamente a todas las localidades del municipio (como Cuisillos). Revisar y confirmar la matriz postal oficial con operación local y actualizarla cuando corresponda.

## Arquitectura y estado

- \`server/schema.sql\` y \`server/migrations/002_nox_commercial_rules.sql\`: modelo de 12 SKUs, precio fijo en centavos, reservas, órdenes y reglas comerciales.
- \`server/pricing.js\`: cálculo de envío, elegibilidad Tala y validación de dinero y dirección del pago.
- \`server/inventory.js\`: transacciones PostgreSQL \`FOR UPDATE\` y webhooks idempotentes.
- \`server/index.js\`: Express, Stripe Checkout Sessions, health, catálogo, checkout, estado de pedido, webhook firmado.
- \`server/reconcile.js\`: conciliación de sesiones caducadas según el estado real en Stripe, nunca por mero reloj.
- \`index.html\`, \`scrip.js\`, \`style.css\`: frontend dark/premium responsive con 6 diseños, selector M/L, bolsa, entrega y promoción.
- \`assets/\`: seis prototipos SVG originales de estampados.

**Estado de operación: desarrollo, no desplegado.** El checkout sigue apagado por defecto y no existen órdenes, pagos ni entregas LIVE. La cuenta Stripe conectada no fue modificada.

## Arranque de pruebas

Requiere Node >=22 y PostgreSQL >=15. Una base de datos **separada para NOX**, nunca la base de Tala Eats.

\`\`\`bash
cd server
npm install
DATABASE_URL='postgresql://...' npm run migrate
PUBLIC_BASE_URL=http://localhost:8080 DATABASE_URL='postgresql://...' npm start
\`\`\`

La API atiende \`GET /api/catalog\`, \`GET /api/healthz\`, \`POST /api/checkout\`, \`POST /api/stripe/webhook\`.
Configurar secretos exclusivamente por gestor de secretos o variables privadas de proceso; jamás subir \`.env\` real a GitHub.

- \`STRIPE_API_KEY\`: preferentemente clave restringida \`rk_test_...\` de permisos mínimos.
- \`STRIPE_WEBHOOK_SECRET\`: secreto del destino webhook de este entorno.
- \`STRIPE_NOXTALA_PROMO_ID\`: ID de promoción creado en este mismo entorno Stripe.
- \`CHECKOUT_ENABLED=true\`: solo tras aprobar pruebas de extremo a extremo, políticas y diseños reales.
- \`ALLOW_LIVE_CHECKOUT=true\`: **exclusivamente con permiso explícito de lanzamiento LIVE**, además de \`CHECKOUT_ENABLED\`.
- \`PUBLIC_BASE_URL\`: HTTPS en despliegue (HTTP solo localhost).

**No** usar Stripe Tax automático sin registro fiscal aplicable. Definir términos, políticas de cambio/devolución, factura IVA, soporte, imágenes y horario local. Además, certificar DHL (precios y cobertura), empaques, direcciones, disponibilidad del repartidor, seguimiento, monitorización de webhook, backups de base de datos y pruebas reales del código antes de publicar anuncios como promesas garantizadas.

### Pruebas automatizadas

GitHub Actions instala Node y PostgreSQL 16 efímero, ejecuta migraciones, tests de pagos y stock concurrente y smoke HTTP (sin credenciales Stripe ni dinero). Pruebas locales:
\`\`\`bash
node --test tests/*.test.cjs
DATABASE_URL='postgresql://...pruebas' npm --prefix server test
\`\`\`

El proyecto no cuenta todavía con autenticación administrativa, facturación ni automatización logística; esas funciones son prioridades posteriores al checkout E2E.
