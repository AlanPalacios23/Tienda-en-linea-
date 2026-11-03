# NOX — Preview visual en Netlify

Esta rama incorpora netlify.toml con una compilación estática que publica solo dist-preview/. No incluye backend de pagos, credenciales ni inventario verdadero. La colección visible utiliza 6 diseños conceptuales de playeras con precio de $499 MXN y tallas M/L (3 y 2 unidades ilustrativas por diseño).

## Conectar desde el panel Netlify
1. Abre el proyecto de NOX en Netlify.
2. En configuración de proyecto, conecta GitHub, repositorio AlanPalacios23/Tienda-en-linea-.
3. Selecciona la rama feat/nox-storefront-v1 (sin modificar main).
4. Confirma que Netlify lee netlify.toml y usa el comando node scripts/build-netlify-preview.cjs con publicación dist-preview.
5. Revisa el deploy Ready/Published y abre la URL del sitio.
6. En móvil prueba la colección, el carrito, búsqueda y el selector de entrega, siempre con pago desactivado.

Alternativa de configuración inicial con GitHub público:
https://app.netlify.com/start/deploy?repository=https://github.com/AlanPalacios23/Tienda-en-linea-&branch=feat/nox-storefront-v1

No habilitar Stripe LIVE ni reutilizar claves en Netlify. Esta publicación sirve solo para ver el diseño. Para vender se requiere backend HTTPS, PostgreSQL, webhooks firmados y las pruebas comerciales pendientes.
