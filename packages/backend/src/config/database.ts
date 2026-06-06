import { Pool, PoolClient } from 'pg';
import * as dotenv from 'dotenv';

// Only load .env if not already configured by test setup files
if (!process.env.JWT_SECRET || process.env.NODE_ENV !== 'test') {
  dotenv.config();
}

// Interface para tipar la configuración
interface DatabaseConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  database: string;
}

// Patrón Singleton para la conexión
class DatabaseConnection {
  private static instance: Pool;
  private static isMocked = false;

  static getInstance(): Pool {
    if (!this.instance) {
      // If DB_HOST is not defined, we're in a unit test environment - return a mock
      if (!process.env.DB_HOST) {
        console.warn('⚠️  DB_HOST not defined - using mock database connection (unit test mode)');
        this.isMocked = true;
        // Return a minimal mock that won't try to connect
        return {
          query: async () => ({ rows: [] }),
          connect: async () => ({} as PoolClient),
          end: async () => {},
          on: () => {}
        } as unknown as Pool;
      }

      const config: DatabaseConfig = {
        user: process.env.DB_USER || 'u_ride_user',
        password: process.env.DB_PASSWORD || 'secure_password_123',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5433'),
        database: process.env.DB_NAME || 'u_ride_dev',
      };

      this.instance = new Pool(config);

      // Error handler
      this.instance.on('error', (err: Error) => {
        console.error('Unexpected error on idle client', err);
        process.exit(-1);
      });
    }
    if (!this.isMocked) {
      console.log("🔥 ENV CHECK:");
      console.log("DB_HOST =", process.env.DB_HOST);
      console.log("DB_PORT =", process.env.DB_PORT);
      console.log("DB_NAME =", process.env.DB_NAME);
      console.log("DB_USER =", process.env.DB_USER);
    }
    return this.instance;
  }

  static async connect(): Promise<void> {
    const pool = this.getInstance();
    try {
      const client = await pool.connect();
      console.log('✅ Database connected successfully');
      
      // Run the migration automatically
      try {
        await client.query('ALTER TABLE public.solicitudes_viaje ADD COLUMN IF NOT EXISTS motivo_rechazo character varying(255);');
        console.log('✅ SQL Migration: motivo_rechazo column verified/added successfully');
      } catch (migrationError) {
        console.error('❌ SQL Migration failed:', migrationError);
      }

      try {
        await client.query('ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS comprobante_url text;');
        console.log('✅ SQL Migration: comprobante_url column verified/added successfully');
      } catch (migrationError) {
        console.error('❌ SQL Migration failed for comprobante_url:', migrationError);
      }

      client.release();
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  static async disconnect(): Promise<void> {
    const pool = this.getInstance();
    await pool.end();
    console.log('✅ Database disconnected');
  }
}

export { DatabaseConnection };
