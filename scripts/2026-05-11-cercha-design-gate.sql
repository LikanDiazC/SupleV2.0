-- Migración Cercha: etapa de diseño + auto-notif + dealType
-- Fecha: 2026-05-11
-- Tenant objetivo: Cercha Studio (629876df-1c2a-49ac-9d6d-0a53e1f6b312)

BEGIN;

-- 1. Columna dealType en crm_deals
ALTER TABLE "crm_deals"
  ADD COLUMN IF NOT EXISTS "dealType" TEXT;

-- 2. Columnas nuevas en tenant_config
ALTER TABLE "tenant_config"
  ADD COLUMN IF NOT EXISTS "requireDesignConfirmation" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE "tenant_config"
  ADD COLUMN IF NOT EXISTS "notifAutoTriggers" JSONB NOT NULL DEFAULT '{}';

-- 3. Activar gate de diseño + auto-triggers para Cercha
UPDATE "tenant_config"
SET
  "requireDesignConfirmation" = TRUE,
  "notifAutoTriggers" = '{
    "ORDER_RECEIVED":    ["OT"],
    "DESIGN_CONFIRMED":  ["D"],
    "IN_PRODUCTION":     ["EC"],
    "MANUFACTURED":      ["ML"],
    "SHIPPED":           ["FC"]
  }'::jsonb,
  "orderTypes" = '["MUEBLE","CAMA","REPARACION","MUDANZA","VISITA_SHOWROOM"]'::jsonb
WHERE "tenantId" = '629876df-1c2a-49ac-9d6d-0a53e1f6b312';

-- 4. Agregar label de DESIGN_CONFIRMED a orderStatuses de Cercha (si no existe ya)
UPDATE "tenant_config"
SET "orderStatuses" = (
  SELECT jsonb_agg(elem)
  FROM (
    SELECT jsonb_array_elements("orderStatuses") AS elem
    WHERE "tenantId" = '629876df-1c2a-49ac-9d6d-0a53e1f6b312'
    UNION ALL
    SELECT '{"key":"DESIGN_CONFIRMED","label":"Diseño Confirmado","color":"#6366F1"}'::jsonb
    WHERE NOT EXISTS (
      SELECT 1
      FROM jsonb_array_elements((SELECT "orderStatuses" FROM "tenant_config" WHERE "tenantId" = '629876df-1c2a-49ac-9d6d-0a53e1f6b312')) AS s
      WHERE s->>'key' = 'DESIGN_CONFIRMED'
    )
  ) AS sub
)
WHERE "tenantId" = '629876df-1c2a-49ac-9d6d-0a53e1f6b312';

COMMIT;

-- Verificación rápida (correr aparte):
-- SELECT "tenantId", "requireDesignConfirmation", "notifAutoTriggers", "orderTypes", "orderStatuses"
-- FROM "tenant_config" WHERE "tenantId" = '629876df-1c2a-49ac-9d6d-0a53e1f6b312';
