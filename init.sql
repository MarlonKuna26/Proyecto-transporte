-- ============================================
-- PostgreSQL Initialization Script for U-Ride
-- Ejecutar con: psql -U postgres -d postgres -f init.sql
-- ============================================

-- Crear base de datos si no existe
CREATE DATABASE u_ride_dev ENCODING 'UTF8' LC_COLLATE 'C' LC_CTYPE 'C';

-- Conectar a la BD
\c u_ride_dev

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for secure password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- Health Check Table (for monitoring)
-- ============================================
CREATE TABLE IF NOT EXISTS health_check (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Audit Log Table (future use)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    changes JSONB,
    performed_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for audit logs
CREATE INDEX IF NOT EXISTS audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================
-- Grant permissions to postgres user
-- ============================================
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- Ensure future tables/sequences get same permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;

-- ============================================
-- Insert test data
-- ============================================
INSERT INTO health_check (id) VALUES (uuid_generate_v4());

-- Verify installation
SELECT 'PostgreSQL initialized successfully!' AS status;
SELECT COUNT(*) as health_check_count FROM health_check;
