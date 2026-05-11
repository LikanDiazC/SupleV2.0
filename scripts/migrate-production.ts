import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const ds = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  synchronize: false,
  entities: [],
});

async function migrate() {
  await ds.initialize();
  console.log('✅ Conectado a Railway PostgreSQL');

  // ── Migración 1: Fix unique constraint orders.externalReference ──────────
  console.log('\n[1/4] Fix unique constraint externalReference...');
  for (const name of [
    'UQ_e57d5cadfa42aac52f84506ebbf',
    'UQ_orders_externalReference',
    'UQ_orders_externalreference',
  ]) {
    try {
      await ds.query(`ALTER TABLE orders DROP CONSTRAINT IF EXISTS "${name}"`);
    } catch { /* ya no existe */ }
  }
  await ds.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'UQ_orders_tenant_ref' AND conrelid = 'orders'::regclass
      ) THEN
        ALTER TABLE orders ADD CONSTRAINT "UQ_orders_tenant_ref"
          UNIQUE ("tenantId", "externalReference");
      END IF;
    END
    $$
  `);
  console.log('   OK');

  // ── Migración 2: Columnas nuevas en orders ───────────────────────────────
  console.log('\n[2/4] Columnas nuevas en orders...');
  const cols = [
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS "orderType"       varchar NULL`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS "description"     text    NULL`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS "fechaConfeccion" date    NULL`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS "fechaEntrega"    date    NULL`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS "horario"         varchar NULL`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS "comuna"          varchar NULL`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS "color"           varchar NULL`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS "mesVenta"        varchar NULL`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS "extraData"       jsonb   NULL`,
  ];
  for (const sql of cols) await ds.query(sql);
  console.log('   OK');

  // ── Migración 3: Tabla tenant_config ─────────────────────────────────────
  console.log('\n[3/4] Tabla tenant_config...');
  await ds.query(`
    CREATE TABLE IF NOT EXISTS tenant_config (
      id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenantId"      uuid UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
      "orderTypes"    jsonb NOT NULL DEFAULT '[]',
      "orderStatuses" jsonb NOT NULL DEFAULT '[]',
      "extraFields"   jsonb NOT NULL DEFAULT '[]',
      "notifSteps"    jsonb NOT NULL DEFAULT '[]',
      "createdAt"     timestamp NOT NULL DEFAULT now(),
      "updatedAt"     timestamp NOT NULL DEFAULT now()
    )
  `);
  console.log('   OK');

  // ── Migración 4: Tabla order_notifications ───────────────────────────────
  console.log('\n[4/4] Tabla order_notifications...');
  await ds.query(`
    CREATE TABLE IF NOT EXISTS order_notifications (
      id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "orderId"        uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      "tenantId"       uuid NOT NULL,
      step             varchar NOT NULL,
      "markedAt"       timestamp NOT NULL DEFAULT now(),
      "markedByUserId" uuid NOT NULL,
      UNIQUE ("orderId", step)
    )
  `);
  console.log('   OK');

  console.log('\n✅ Todas las migraciones completadas.');
  await ds.destroy();
}

migrate().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
