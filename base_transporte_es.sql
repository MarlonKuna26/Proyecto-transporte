-- Base de datos de transporte en español (PostgreSQL)
-- Traducción de tablas y atributos conservando relaciones.

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

SET default_tablespace = '';
SET default_table_access_method = heap;

-- ============================================
-- TABLAS
-- ============================================

CREATE TABLE public.chequeo_salud (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chequeo_salud_pkey PRIMARY KEY (id)
);

CREATE TABLE public.usuarios (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    correo character varying(255) NOT NULL,
    nombre character varying(255) NOT NULL,
    contrasena_hash character varying(255) NOT NULL,
    rol character varying(50) DEFAULT 'STUDENT'::character varying NOT NULL,
    esta_verificado boolean DEFAULT false,
    reputacion numeric(3,2) DEFAULT 5.0,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    esta_suspendido boolean DEFAULT false,
    motivo_suspension character varying(500),
    suspendido_hasta timestamp without time zone,
    CONSTRAINT usuarios_pkey PRIMARY KEY (id),
    CONSTRAINT usuarios_correo_key UNIQUE (correo),
    CONSTRAINT usuarios_rol_check CHECK (((rol)::text = ANY ((ARRAY['STUDENT'::character varying, 'ADMIN'::character varying])::text[])))
);

CREATE TABLE public.codigos_verificacion (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    usuario_id uuid NOT NULL,
    codigo character varying(6) NOT NULL,
    tipo character varying(20) DEFAULT 'EMAIL'::character varying NOT NULL,
    expira_en timestamp without time zone NOT NULL,
    usado boolean DEFAULT false,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT codigos_verificacion_pkey PRIMARY KEY (id),
    CONSTRAINT codigos_verificacion_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['EMAIL'::character varying, 'PASSWORD_RESET'::character varying])::text[]))),
    CONSTRAINT codigos_verificacion_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE
);

CREATE TABLE public.perfiles_usuario (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    usuario_id uuid NOT NULL,
    carrera character varying(255),
    url_foto character varying(500),
    telefono character varying(20),
    zona character varying(255),
    barrio character varying(255),
    biografia character varying(500),
    contacto_emergencia character varying(255),
    telefono_emergencia character varying(20),
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT perfiles_usuario_pkey PRIMARY KEY (id),
    CONSTRAINT perfiles_usuario_usuario_id_key UNIQUE (usuario_id),
    CONSTRAINT perfiles_usuario_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE
);

CREATE TABLE public.vehiculos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    propietario_id uuid NOT NULL,
    placa character varying(20) NOT NULL,
    marca character varying(100) NOT NULL,
    modelo character varying(100) NOT NULL,
    color character varying(50) NOT NULL,
    anio integer,
    capacidad integer DEFAULT 4 NOT NULL,
    url_foto character varying(500),
    esta_activo boolean DEFAULT true,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT vehiculos_pkey PRIMARY KEY (id),
    CONSTRAINT vehiculos_capacidad_check CHECK (((capacidad >= 1) AND (capacidad <= 8))),
    CONSTRAINT vehiculos_propietario_id_fkey FOREIGN KEY (propietario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE
);

CREATE TABLE public.viajes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    conductor_id uuid NOT NULL,
    vehiculo_id uuid,
    zona_origen character varying(255) NOT NULL,
    detalle_origen character varying(500),
    zona_destino character varying(255) NOT NULL,
    detalle_destino character varying(500),
    fecha_salida date NOT NULL,
    hora_salida time without time zone NOT NULL,
    asientos_disponibles integer NOT NULL,
    precio_por_asiento numeric(10,2) DEFAULT 0.00,
    estado character varying(20) DEFAULT 'PUBLISHED'::character varying NOT NULL,
    notas text,
    reglas text,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    latitud_origen numeric(10,8),
    longitud_origen numeric(11,8),
    latitud_destino numeric(10,8),
    longitud_destino numeric(11,8),
    inicio_real timestamp without time zone,
    fin_real timestamp without time zone,
    CONSTRAINT viajes_pkey PRIMARY KEY (id),
    CONSTRAINT viajes_asientos_disponibles_check CHECK ((asientos_disponibles >= 1)),
    CONSTRAINT viajes_estado_check CHECK (((estado)::text = ANY ((ARRAY['PUBLISHED'::character varying, 'FULL'::character varying, 'IN_PROGRESS'::character varying, 'COMPLETED'::character varying, 'CANCELLED'::character varying])::text[]))),
    CONSTRAINT viajes_conductor_id_fkey FOREIGN KEY (conductor_id) REFERENCES public.usuarios(id) ON DELETE CASCADE,
    CONSTRAINT viajes_vehiculo_id_fkey FOREIGN KEY (vehiculo_id) REFERENCES public.vehiculos(id) ON DELETE SET NULL
);

CREATE TABLE public.solicitudes_viaje (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    viaje_id uuid NOT NULL,
    pasajero_id uuid NOT NULL,
    estado character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    mensaje character varying(500),
    asientos_solicitados integer DEFAULT 1 NOT NULL,
    respondido_en timestamp without time zone,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT solicitudes_viaje_pkey PRIMARY KEY (id),
    CONSTRAINT solicitudes_viaje_viaje_id_pasajero_id_key UNIQUE (viaje_id, pasajero_id),
    CONSTRAINT solicitudes_viaje_asientos_solicitados_check CHECK ((asientos_solicitados >= 1)),
    CONSTRAINT solicitudes_viaje_estado_check CHECK (((estado)::text = ANY ((ARRAY['PENDING'::character varying, 'ACCEPTED'::character varying, 'REJECTED'::character varying, 'CANCELLED'::character varying])::text[]))),
    CONSTRAINT solicitudes_viaje_viaje_id_fkey FOREIGN KEY (viaje_id) REFERENCES public.viajes(id) ON DELETE CASCADE,
    CONSTRAINT solicitudes_viaje_pasajero_id_fkey FOREIGN KEY (pasajero_id) REFERENCES public.usuarios(id) ON DELETE CASCADE
);

CREATE TABLE public.calificaciones (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    viaje_id uuid NOT NULL,
    calificador_id uuid NOT NULL,
    calificado_id uuid NOT NULL,
    puntuacion integer NOT NULL,
    comentario character varying(500),
    rol_en_viaje character varying(20) NOT NULL,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT calificaciones_pkey PRIMARY KEY (id),
    CONSTRAINT calificaciones_viaje_id_calificador_id_calificado_id_key UNIQUE (viaje_id, calificador_id, calificado_id),
    CONSTRAINT calificaciones_rol_en_viaje_check CHECK (((rol_en_viaje)::text = ANY ((ARRAY['DRIVER'::character varying, 'PASSENGER'::character varying])::text[]))),
    CONSTRAINT calificaciones_puntuacion_check CHECK (((puntuacion >= 1) AND (puntuacion <= 5))),
    CONSTRAINT calificaciones_viaje_id_fkey FOREIGN KEY (viaje_id) REFERENCES public.viajes(id) ON DELETE CASCADE,
    CONSTRAINT calificaciones_calificador_id_fkey FOREIGN KEY (calificador_id) REFERENCES public.usuarios(id) ON DELETE CASCADE,
    CONSTRAINT calificaciones_calificado_id_fkey FOREIGN KEY (calificado_id) REFERENCES public.usuarios(id) ON DELETE CASCADE
);

CREATE TABLE public.reportes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    reportante_id uuid NOT NULL,
    reportado_id uuid NOT NULL,
    viaje_id uuid,
    motivo character varying(100) NOT NULL,
    descripcion text NOT NULL,
    url_evidencia character varying(500),
    estado character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    notas_admin text,
    resuelto_por uuid,
    resuelto_en timestamp without time zone,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reportes_pkey PRIMARY KEY (id),
    CONSTRAINT reportes_estado_check CHECK (((estado)::text = ANY ((ARRAY['PENDING'::character varying, 'REVIEWING'::character varying, 'RESOLVED'::character varying, 'DISMISSED'::character varying])::text[]))),
    CONSTRAINT reportes_reportante_id_fkey FOREIGN KEY (reportante_id) REFERENCES public.usuarios(id) ON DELETE CASCADE,
    CONSTRAINT reportes_reportado_id_fkey FOREIGN KEY (reportado_id) REFERENCES public.usuarios(id) ON DELETE CASCADE,
    CONSTRAINT reportes_viaje_id_fkey FOREIGN KEY (viaje_id) REFERENCES public.viajes(id) ON DELETE SET NULL,
    CONSTRAINT reportes_resuelto_por_fkey FOREIGN KEY (resuelto_por) REFERENCES public.usuarios(id) ON DELETE SET NULL
);

CREATE TABLE public.reglas_seguridad (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    titulo character varying(255) NOT NULL,
    descripcion text NOT NULL,
    icono character varying(50),
    orden_mostrado integer DEFAULT 0 NOT NULL,
    esta_activa boolean DEFAULT true,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reglas_seguridad_pkey PRIMARY KEY (id)
);

CREATE TABLE public.seguimiento_viaje (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    viaje_id uuid NOT NULL,
    latitud_actual numeric(10,8) NOT NULL,
    longitud_actual numeric(11,8) NOT NULL,
    rumbo integer,
    velocidad numeric(5,2),
    ultima_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT seguimiento_viaje_pkey PRIMARY KEY (id),
    CONSTRAINT seguimiento_viaje_viaje_id_fkey FOREIGN KEY (viaje_id) REFERENCES public.viajes(id) ON DELETE CASCADE
);

CREATE TABLE public.pagos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    solicitud_viaje_id uuid NOT NULL,
    monto numeric(10,2) NOT NULL,
    metodo_pago character varying(50) DEFAULT 'CASH'::character varying,
    estado character varying(20) DEFAULT 'PENDING'::character varying,
    referencia_transaccion character varying(255),
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pagos_pkey PRIMARY KEY (id),
    CONSTRAINT pagos_metodo_pago_check CHECK (((metodo_pago)::text = ANY ((ARRAY['CASH'::character varying, 'TRANSFER'::character varying, 'WALLET'::character varying])::text[]))),
    CONSTRAINT pagos_estado_check CHECK (((estado)::text = ANY ((ARRAY['PENDING'::character varying, 'COMPLETED'::character varying, 'REFUNDED'::character varying, 'FAILED'::character varying])::text[]))),
    CONSTRAINT pagos_solicitud_viaje_id_fkey FOREIGN KEY (solicitud_viaje_id) REFERENCES public.solicitudes_viaje(id) ON DELETE CASCADE
);

CREATE TABLE public.ubicaciones_guardadas_usuario (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    usuario_id uuid NOT NULL,
    etiqueta character varying(50),
    nombre_direccion character varying(255),
    latitud numeric(10,8),
    longitud numeric(11,8),
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ubicaciones_guardadas_usuario_pkey PRIMARY KEY (id),
    CONSTRAINT ubicaciones_guardadas_usuario_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE
);

CREATE TABLE public.eventos_viaje (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    viaje_id uuid NOT NULL,
    tipo_evento character varying(50) NOT NULL,
    descripcion text,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT eventos_viaje_pkey PRIMARY KEY (id),
    CONSTRAINT eventos_viaje_viaje_id_fkey FOREIGN KEY (viaje_id) REFERENCES public.viajes(id) ON DELETE CASCADE
);

CREATE TABLE public.registros_auditoria (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tipo_entidad character varying(50) NOT NULL,
    id_entidad uuid NOT NULL,
    accion character varying(50) NOT NULL,
    cambios jsonb,
    realizado_por uuid,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT registros_auditoria_pkey PRIMARY KEY (id)
);

-- ============================================
-- INDICES
-- ============================================

CREATE INDEX registros_auditoria_creado_en_idx ON public.registros_auditoria USING btree (creado_en DESC);
CREATE INDEX registros_auditoria_entidad_idx ON public.registros_auditoria USING btree (tipo_entidad, id_entidad);

CREATE INDEX usuarios_correo_idx ON public.usuarios USING btree (correo);
CREATE INDEX usuarios_esta_suspendido_idx ON public.usuarios USING btree (esta_suspendido);
CREATE INDEX usuarios_esta_verificado_idx ON public.usuarios USING btree (esta_verificado);
CREATE INDEX usuarios_rol_idx ON public.usuarios USING btree (rol);

CREATE INDEX viajes_fecha_hora_salida_idx ON public.viajes USING btree (fecha_salida, hora_salida);
CREATE INDEX viajes_estado_idx ON public.viajes USING btree (estado);

CREATE INDEX solicitudes_viaje_estado_idx ON public.solicitudes_viaje USING btree (estado);
CREATE INDEX seguimiento_viaje_viaje_id_idx ON public.seguimiento_viaje USING btree (viaje_id);

-- ============================================
-- ACL (opcional)
-- ============================================

GRANT ALL ON SCHEMA public TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
