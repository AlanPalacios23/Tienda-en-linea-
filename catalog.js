/* Muestrario ilustrativo NOX v0.2. Ninguna ficha implica inventario, marca o precio real. */
(function(root) {
  "use strict";
  const clothingSizes = ["XS","S","M","L","XL"].map(label => ({id:label.toLowerCase(),label}));
  const baseSizes = ["S","M","L","XL"].map(label => ({id:label.toLowerCase(),label}));
  const shoes = ["23","24","25","26","27","28","29"].map(id => ({id,label:id+" MX"}));
  const oneSize = [{id:"unica",label:"Única"}];
  const c = (id,label,hex) => ({id,label,hex});
  const hueso = c("hueso","Hueso","#eae3d6");
  const negro = c("negro","Negro","#242426");
  const arena = c("arena","Arena","#c7b7a3");
  const azul = c("azul","Azul índigo","#3f536e");
  const gris = c("gris","Gris","#8b8e8e");
  const cafe = c("cafe","Café","#806451");
  const blanco = c("blanco","Blanco","#fafafa");

  root.NoxCatalog = Object.freeze([
    {id:"nox-101",name:"Playera Essential",category:"ropa",audience:"unisex",price:449,tag:"BÁSICOS",
     description:"Una silueta limpia para cualquier combinación.",sizes:clothingSizes,colors:[negro,hueso,gris],
     image:"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85",tags:["playera","camiseta","t-shirt"]},
    {id:"nox-102",name:"Camisa Atelier",category:"ropa",audience:"unisex",price:899,tag:"EDIT 01",
     description:"Líneas relajadas y estilo contemporáneo.",sizes:baseSizes,colors:[blanco,negro,azul],
     image:"https://images.unsplash.com/photo-1598032895397-b9472444bf93?auto=format&fit=crop&w=900&q=85",tags:["camisa","oversize"]},
    {id:"nox-103",name:"Pantalón Wide Fit",category:"ropa",audience:"unisex",price:1099,tag:"",
     description:"Volumen, movimiento y una nueva proporción.",sizes:clothingSizes,colors:[negro,arena],
     image:"https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=85",tags:["pantalon","jeans","denim"]},
    {id:"nox-104",name:"Sudadera Core",category:"ropa",audience:"unisex",price:1199,tag:"FAVORITO",
     description:"Una pieza cálida de estética esencial.",sizes:clothingSizes,colors:[gris,negro,hueso],
     image:"https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=85",tags:["hoodie","sudadera"]},
    {id:"nox-105",name:"Blazer Studio",category:"ropa",audience:"mujer",price:1799,tag:"NUEVO",
     description:"Una interpretación moderna de la sastrería.",sizes:clothingSizes,colors:[negro,arena],
     image:"https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=900&q=85",tags:["blazer","saco"]},
    {id:"nox-106",name:"Chaqueta Utility",category:"ropa",audience:"hombre",price:1699,tag:"",
     description:"Capas versátiles y detalles funcionales.",sizes:baseSizes,colors:[cafe,negro],
     image:"https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=900&q=85",tags:["chamarra","chaqueta"]},
    {id:"nox-107",name:"Tenis Forma",category:"calzado",audience:"unisex",price:1599,tag:"NUEVO",
     description:"Silueta urbana para seguir tu ritmo.",sizes:shoes,colors:[blanco,negro],
     image:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85",tags:["sneakers","tenis"]},
    {id:"nox-108",name:"Botín Nomad",category:"calzado",audience:"mujer",price:1899,tag:"",
     description:"Diseño de líneas precisas para todos los días.",sizes:shoes.slice(0,5),colors:[negro,cafe],
     image:"https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=85",tags:["botas","botines"]},
    {id:"nox-109",name:"Bolso Mini",category:"accesorios",audience:"mujer",price:799,tag:"EDIT 01",
     description:"Un básico compacto con presencia.",sizes:oneSize,colors:[negro,arena],
     image:"https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=85",tags:["bolsa","bolso","bag"]},
    {id:"nox-110",name:"Gorra Form",category:"accesorios",audience:"unisex",price:449,tag:"",
     description:"El acento final de un buen look.",sizes:oneSize,colors:[negro,azul],
     image:"https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=900&q=85",tags:["gorra","cap"]},
    {id:"nox-111",name:"Lentes Halo",category:"accesorios",audience:"unisex",price:599,tag:"",
     description:"Detalles que transforman lo cotidiano.",sizes:oneSize,colors:[negro,cafe],
     image:"https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=85",tags:["lentes","gafas"]},
    {id:"nox-112",name:"Cinturón Mono",category:"accesorios",audience:"unisex",price:499,tag:"",
     description:"Una pieza discreta de estilo definido.",sizes:[{id:"s",label:"S"},{id:"m",label:"M"},{id:"l",label:"L"}],colors:[negro,cafe],
     image:"https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=900&q=85",tags:["cinturon","belt"]}
  ]);
})(typeof globalThis !== "undefined" ? globalThis : this);