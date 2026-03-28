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
-- Users Table
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'STUDENT' CHECK (role IN ('STUDENT', 'ADMIN')),
    is_verified BOOLEAN DEFAULT false,
    reputation DECIMAL(3,2) DEFAULT 5.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for users
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
CREATE INDEX IF NOT EXISTS users_is_verified_idx ON users(is_verified);

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

-- Insert health check
INSERT INTO health_check (id) VALUES (uuid_generate_v4());

-- Insert test user para démonstración
-- Email: test@institucion.edu
-- Contraseña: password123
-- Rol: STUDENT
INSERT INTO users (id, email, name, hashed_password, role, is_verified, reputation)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'test@institucion.edu',
    'Usuario Test',
    'hashed_password123',
    'STUDENT',
    true,
    5.0
) ON CONFLICT (email) DO NOTHING;

-- ============================================
-- Verify installation
-- ============================================
SELECT 'PostgreSQL initialized successfully! ✅' AS status;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as health_check_count FROM health_check;
