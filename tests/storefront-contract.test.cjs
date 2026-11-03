const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const html=fs.readFileSync("index.html","utf8");
const server=fs.readFileSync("server/index.js","utf8");
test("checkout real: endpoint servidor + callback sin confirmar pagos por URL",()=>{
 assert.match(html,/Comprar con Stripe/);
 assert.match(html,/checkoutStatus/);
 assert.match(server,/stripe\.webhooks\.constructEvent/);
 assert.match(server,/checkout\.sessions\.create/);
 assert.match(server,/app\.post\("\/api\/stripe\/webhook"/);
 assert.match(fs.readFileSync("success.js","utf8"),/\/api\/orders\//);
});
test("no se exponen claves Stripe ni precios de demostración en frontend",()=>{
 assert.doesNotMatch(html,/sk_live_|rk_live_|sk_test_/);
 assert.doesNotMatch(fs.readFileSync("scrip.js","utf8"),/sk_live_|rk_live_|sk_test_/);
 assert.doesNotMatch(html,/TechStore|laptops|smartphones/);
});
