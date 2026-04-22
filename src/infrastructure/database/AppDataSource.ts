import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Esto le dice al sistema que lea el archivo .env que acabamos de crear
dotenv.config(); 

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'suple_db',
  
  // ¡MUY IMPORTANTE! 
  // synchronize en 'false' significa que nosotros controlaremos los cambios en la BD manualmente (Migraciones).
  // Es la forma segura de hacerlo en proyectos reales.
  synchronize: false, 
  logging: true,
  
  // Aquí registraremos nuestras tablas más adelante
  entities: [], 
  migrations: [], 
});