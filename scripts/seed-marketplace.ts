import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { DataSource } from 'typeorm';
import { MarketplaceProductOrmEntity } from '../src/modules/marketplace/infrastructure/persistence/MarketplaceProductOrmEntity';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const ds = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432'),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  synchronize: true,
  entities: [MarketplaceProductOrmEntity],
});

const BATCH_SIZE = 200;

function toInt(v: unknown): number | undefined {
  const n = Number(v);
  return isNaN(n) ? undefined : Math.round(n);
}

function toDecimal(v: unknown): number | undefined {
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

function parseSheet(filePath: string): any[] {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  const headers: string[] = raw[1] as string[];
  return raw.slice(2).map((row: any[]) => {
    const obj: Record<string, any> = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

async function seed() {
  await ds.initialize();
  try {
    const repo = ds.getRepository(MarketplaceProductOrmEntity);

    await repo.query('TRUNCATE TABLE marketplace_products RESTART IDENTITY CASCADE');
    console.log('Tabla vaciada.');

    const recursosDir = path.resolve(__dirname, '../../recursos');
    const files = [
      path.join(recursosDir, 'catalogo_normalizado_sodimac.xlsx'),
      path.join(recursosDir, 'catalogo_normalizado_easy.xlsx'),
    ];

    let total = 0;

    for (const file of files) {
      if (!fs.existsSync(file)) {
        console.warn(`File not found, skipping: ${file}`);
        continue;
      }
      console.log(`Procesando: ${path.basename(file)}`);
      const rows = parseSheet(file);

      const batch: Partial<MarketplaceProductOrmEntity>[] = [];

      for (const r of rows) {
        if (!r['Título'] || !r['Tienda']) continue;
        batch.push({
          tienda:          r['Tienda'],
          sku:             String(r['SKU'] ?? ''),
          marca:           r['Marca'] ?? undefined,
          titulo:          r['Título'],
          urlProducto:     r['URL Producto'] ?? '',
          urlImagen:       r['URL Imagen'] ?? undefined,
          precioCLP:       toInt(r['Precio CLP']),
          precioNormalCLP: toInt(r['Precio Normal CLP']),
          descuentoPct:    toDecimal(r['Descuento %']),
          rating:          r['Rating'] != null ? toDecimal(r['Rating']) : undefined,
          categorias: {
            cat1: r['Categoría 1'] ?? undefined,
            cat2: r['Categoría 2'] ?? undefined,
            cat3: r['Categoría 3'] ?? undefined,
            cat4: r['Categoría 4'] ?? undefined,
          },
          atributos: {
            largo:           r['Largo (mm)'] ?? undefined,
            diametro:        r['Diámetro (mm)'] ?? undefined,
            medida:          r['Medida cruda'] ?? undefined,
            material:        r['Material'] ?? undefined,
            tipoCabeza:      r['Tipo cabeza'] ?? undefined,
            tipoRosca:       r['Tipo rosca'] ?? undefined,
            tipoPunta:       r['Tipo punta'] ?? undefined,
            color:           r['Color'] ?? undefined,
            cantidadEmpaque: r['Cantidad empaque'] ?? undefined,
            ean:             r['EAN'] ?? undefined,
          },
          disponibilidad: r['Disponibilidad'] ?? undefined,
        });
      }

      for (let i = 0; i < batch.length; i += BATCH_SIZE) {
        const chunk = batch.slice(i, i + BATCH_SIZE);
        await repo.insert(chunk as any);
        total += chunk.length;
        console.log(`  ${total} productos insertados...`);
      }
    }

    console.log(`\nSeed completo: ${total} productos insertados.`);
  } finally {
    await ds.destroy();
  }
}

seed().catch((e) => { console.error(e); process.exit(1); });
