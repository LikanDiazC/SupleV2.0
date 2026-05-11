import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const CERCHA_TENANT_ID = '629876df-1c2a-49ac-9d6d-0a53e1f6b312';

const ds = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  synchronize: false,
  entities: [],
});

const config = {
  tenantId: CERCHA_TENANT_ID,
  orderTypes: ['MUEBLE', 'CAMA', 'REPARACION', 'VISITA_SHOWROOM'],
  orderStatuses: [
    { key: 'PENDIENTE',      label: 'Pendiente',       color: 'gray'   },
    { key: 'EN_CONFECCION',  label: 'En Confección',   color: 'blue'   },
    { key: 'LISTO',          label: 'Listo',           color: 'green'  },
    { key: 'POR_ENTREGAR',   label: 'Por Entregar',    color: 'teal'   },
    { key: 'ENTREGADO',      label: 'Entregado',       color: 'slate'  },
    { key: 'CON_CORRECCION', label: 'Con Corrección',  color: 'yellow' },
    { key: 'ATRASADO',       label: 'Atrasado',        color: 'red'    },
    { key: 'URGENTE',        label: 'Urgente',         color: 'orange' },
    { key: 'CAMBIO',         label: 'Cambio',          color: 'orange' },
    { key: 'POR_DEFINIR',    label: 'Por Definir',     color: 'gray'   },
  ],
  extraFields: [
    { key: 'color',   label: 'Color',   type: 'text', required: false },
    { key: 'comuna',  label: 'Comuna',  type: 'text', required: false },
    { key: 'horario', label: 'Horario', type: 'text', required: false },
  ],
  notifSteps: [
    { key: 'OT', label: 'OT enviada'         },
    { key: 'D',  label: 'Diseño enviado'     },
    { key: 'EC', label: 'Entró a confección' },
    { key: 'ML', label: 'Mueble listo'       },
    { key: 'FC', label: 'Fecha coordinada'   },
  ],
};

async function seed() {
  await ds.initialize();
  console.log('Conectado a Railway PostgreSQL');

  await ds.query(`
    INSERT INTO tenant_config ("tenantId", "orderTypes", "orderStatuses", "extraFields", "notifSteps")
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT ("tenantId") DO UPDATE SET
      "orderTypes"    = EXCLUDED."orderTypes",
      "orderStatuses" = EXCLUDED."orderStatuses",
      "extraFields"   = EXCLUDED."extraFields",
      "notifSteps"    = EXCLUDED."notifSteps",
      "updatedAt"     = now()
  `, [
    config.tenantId,
    JSON.stringify(config.orderTypes),
    JSON.stringify(config.orderStatuses),
    JSON.stringify(config.extraFields),
    JSON.stringify(config.notifSteps),
  ]);

  console.log('✅ Config de Cercha Studio insertada.');
  await ds.destroy();
}

seed().catch(e => { console.error('❌', e.message); process.exit(1); });
