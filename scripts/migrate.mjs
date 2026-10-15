import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { readFile } from 'node:fs/promises';
const connection=process.env.MIGRATION_DATABASE_URL;
if(!connection)throw new Error('Set MIGRATION_DATABASE_URL for a separate database owner.');
const client=postgres(connection,{max:1});
try {
 await migrate(drizzle(client),{migrationsFolder:'drizzle'});
 // Custom guards are tracked independently because drizzle-kit does not model triggers.
 await client`CREATE TABLE IF NOT EXISTS public.stokvel_guard_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`;
 await client.begin(async tx=>{
  await tx`SELECT pg_advisory_xact_lock(73109211)`;
  const existing=await tx`SELECT name FROM public.stokvel_guard_migrations WHERE name='0001_financial_guards'`;
  if(!existing.length){await tx.unsafe(await readFile('drizzle/0001_financial_guards.sql','utf8'));await tx`INSERT INTO public.stokvel_guard_migrations(name) VALUES ('0001_financial_guards')`;}
  const domain=await tx`SELECT name FROM public.stokvel_guard_migrations WHERE name='0002_domain_storage'`;
  if(!domain.length){await tx.unsafe(await readFile('drizzle/0002_domain_storage.sql','utf8'));await tx`INSERT INTO public.stokvel_guard_migrations(name) VALUES ('0002_domain_storage')`;}
 });
 console.log('Schema and financial guards migrated. Apply reviewed runtime grants separately.');
}finally{await client.end();}
