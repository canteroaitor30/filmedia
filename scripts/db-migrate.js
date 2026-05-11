#!/usr/bin/env node
/**
 * Ejecuta migraciones SQL contra Supabase usando la service role key.
 * Uso: node scripts/db-migrate.js <archivo.sql>
 */
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function migrate(sqlFile) {
  const sql = fs.readFileSync(sqlFile, "utf8");
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  for (const stmt of statements) {
    const { error } = await supabase.rpc("exec_sql", { sql: stmt });
    if (error) {
      console.error("Error en:", stmt.slice(0, 80));
      console.error(error.message);
    } else {
      console.log("OK:", stmt.slice(0, 60));
    }
  }
}

const file = process.argv[2];
if (!file) {
  console.error("Uso: node scripts/db-migrate.js <archivo.sql>");
  process.exit(1);
}

migrate(path.resolve(file)).catch(console.error);
