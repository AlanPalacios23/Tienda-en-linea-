"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const execFileSync=require("node:child_process").execFileSync;
const root=path.resolve(__dirname,"..");
execFileSync(process.execPath,[path.join(root,"scripts/build-netlify-preview.cjs")],{cwd:root});
const dist=path.join(root,"dist-preview");
const read=n=>fs.readFileSync(path.join(dist,n),"utf8");
test("six products, actual MXN price, inventory indicative only",()=>{
 const c=JSON.parse(read("preview-catalog.json"));
 assert.equal(c.products.length,6);
 assert.equal(c.checkout_enabled,false);
 assert.ok(c.products.every(p=>p.price_cents===49900));
 assert.ok(c.products.every(p=>p.variants.length===2 && p.variants[0].size==="M" &&
 p.variants[0].available===3 && p.variants[1].size==="L" && p.variants[1].available===2));
});
test("no backend or Stripe payment calls published",()=>{
 assert.match(read("index.html"),/VISTA PREVIA/);
 assert.match(read("index.html"),/noindex,nofollow/);
 assert.match(read("index.html"),/Compras no disponibles en la vista previa/);
 assert.match(read("scrip.js"),/fetch\("\/preview-catalog.json"/);
 assert.doesNotMatch(read("scrip.js"),/fetch\("\/api\/checkout"/);
 assert.ok(!fs.existsSync(path.join(dist,"server")));
 assert.ok(!fs.existsSync(path.join(dist,".env")));
 assert.match(read("_headers"),/Content-Security-Policy/);
});
test("all six product graphics included",()=>{
 for(let i=1;i<=6;i++)assert.match(read("assets/nox-0"+i+".svg"),/<svg/);
});
