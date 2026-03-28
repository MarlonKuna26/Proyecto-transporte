import { Pool, PoolClient } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

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

  static getInstance(): Pool {
    if (!this.instance) {
      const config: DatabaseConfig = {
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '182004',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'u_ride_dev',
      };

      this.instance = new Pool(config);

      // Error handler
      this.instance.on('error', (err: Error) => {
        console.error('Unexpected error on idle client', err);
        process.exit(-1);
      });
    }

    return this.instance;
  }

  static async connect(): Promise<void> {
    const pool = this.getInstance();
    try {
      const client = await pool.connect();
      console.log('✅ Database connected successfully');
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
