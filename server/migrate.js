"use strict";
const fs=require("node:fs");
const path=require("node:path");
const {Pool}=require("pg");
async function run() {
  if(!process.env.DATABASE_URL) throw new Error("DATABASE_URL no configurada");
  const pool=new Pool({connectionString:process.env.DATABASE_URL});
  try {
    await pool.query(fs.readFileSync(path.join(__dirname,"schema.sql"),"utf8"));
    const result=await pool.query("SELECT COUNT(*)::integer AS designs, (SELECT SUM(total)::integer FROM inventory) AS stock FROM designs");
    console.log("NOX_SCHEMA_READY",result.rows[0]);
  } finally {await pool.end();}
}
if(require.main===module)run().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={run};
