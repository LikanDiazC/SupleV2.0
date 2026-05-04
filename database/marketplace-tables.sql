-- Marketplace: run this against the Railway PostgreSQL instance before deploying
-- (TypeORM synchronize is disabled in production)

CREATE TABLE IF NOT EXISTS "marketplace_products" (
  "id"               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "tienda"           VARCHAR(20) NOT NULL,
  "sku"              VARCHAR(100) NOT NULL,
  "marca"            VARCHAR(200),
  "titulo"           TEXT NOT NULL,
  "urlProducto"      TEXT NOT NULL,
  "urlImagen"        TEXT,
  "precioCLP"        INTEGER,
  "precioNormalCLP"  INTEGER,
  "descuentoPct"     DECIMAL(5,2),
  "rating"           DECIMAL(3,1),
  "categorias"       JSONB,
  "atributos"        JSONB,
  "disponibilidad"   VARCHAR(20),
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mp_products_tienda ON "marketplace_products" ("tienda");
CREATE INDEX IF NOT EXISTS idx_mp_products_sku   ON "marketplace_products" ("sku");

CREATE TABLE IF NOT EXISTS "marketplace_carts" (
  "id"        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId"    UUID NOT NULL UNIQUE,
  "tenantId"  UUID NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mp_carts_userId   ON "marketplace_carts" ("userId");
CREATE INDEX IF NOT EXISTS idx_mp_carts_tenantId ON "marketplace_carts" ("tenantId");

CREATE TABLE IF NOT EXISTS "marketplace_cart_items" (
  "id"        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "cartId"    UUID NOT NULL REFERENCES "marketplace_carts"("id") ON DELETE CASCADE,
  "productId" UUID NOT NULL REFERENCES "marketplace_products"("id"),
  "quantity"  INTEGER NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
