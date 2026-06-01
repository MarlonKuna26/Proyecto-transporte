--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2
-- Dumped by pg_dump version 17.2

-- Started on 2026-04-08 21:15:27

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
--SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 78224)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 5085 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 3 (class 3079 OID 78261)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 5086 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 226 (class 1259 OID 78396)
-- Name: calificaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calificaciones (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    viaje_id uuid NOT NULL,
    calificador_id uuid NOT NULL,
    calificado_id uuid NOT NULL,
    puntuacion integer NOT NULL,
    comentario character varying(500),
    rol_en_viaje character varying(20) NOT NULL,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT calificaciones_puntuacion_check CHECK (((puntuacion >= 1) AND (puntuacion <= 5))),
    CONSTRAINT calificaciones_rol_en_viaje_check CHECK (((rol_en_viaje)::text = ANY (ARRAY[('DRIVER'::character varying)::text, ('PASSENGER'::character varying)::text])))
);


--
-- TOC entry 219 (class 1259 OID 78272)
-- Name: chequeo_salud; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chequeo_salud (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 221 (class 1259 OID 78296)
-- Name: codigos_verificacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.codigos_verificacion (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    usuario_id uuid NOT NULL,
    codigo character varying(6) NOT NULL,
    tipo character varying(20) DEFAULT 'EMAIL'::character varying NOT NULL,
    expira_en timestamp without time zone NOT NULL,
    usado boolean DEFAULT false,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT codigos_verificacion_tipo_check CHECK (((tipo)::text = ANY (ARRAY[('EMAIL'::character varying)::text, ('PASSWORD_RESET'::character varying)::text])))
);


--
-- TOC entry 232 (class 1259 OID 78509)
-- Name: eventos_viaje; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.eventos_viaje (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    viaje_id uuid NOT NULL,
    tipo_evento character varying(50) NOT NULL,
    descripcion text,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 230 (class 1259 OID 78480)
-- Name: pagos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pagos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    solicitud_viaje_id uuid NOT NULL,
    monto numeric(10,2) NOT NULL,
    metodo_pago character varying(50) DEFAULT 'CASH'::character varying,
    estado character varying(20) DEFAULT 'PENDING'::character varying,
    referencia_transaccion character varying(255),
    comprobante_url text,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pagos_estado_check CHECK (((estado)::text = ANY (ARRAY[('PENDING'::character varying)::text, ('COMPLETED'::character varying)::text, ('REFUNDED'::character varying)::text, ('FAILED'::character varying)::text]))),
    CONSTRAINT pagos_metodo_pago_check CHECK (((metodo_pago)::text = ANY (ARRAY[('CASH'::character varying)::text, ('TRANSFER'::character varying)::text, ('WALLET'::character varying)::text])))
);


--
-- TOC entry 222 (class 1259 OID 78311)
-- Name: perfiles_usuario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.perfiles_usuario (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    usuario_id uuid NOT NULL,
    carrera character varying(255),
    url_foto text,
    telefono character varying(20),
    zona character varying(255),
    barrio character varying(255),
    biografia character varying(500),
    contacto_emergencia character varying(255),
    telefono_emergencia character varying(20),
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    url_qr_cuenta text
);


--
-- TOC entry 233 (class 1259 OID 78523)
-- Name: registros_auditoria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registros_auditoria (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tipo_entidad character varying(50) NOT NULL,
    id_entidad uuid NOT NULL,
    accion character varying(50) NOT NULL,
    cambios jsonb,
    realizado_por uuid,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 228 (class 1259 OID 78456)
-- Name: reglas_seguridad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reglas_seguridad (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    titulo character varying(255) NOT NULL,
    descripcion text NOT NULL,
    icono character varying(50),
    orden_mostrado integer DEFAULT 0 NOT NULL,
    esta_activa boolean DEFAULT true,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 227 (class 1259 OID 78424)
-- Name: reportes; Type: TABLE; Schema: public; Owner: -
--

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
    CONSTRAINT reportes_estado_check CHECK (((estado)::text = ANY (ARRAY[('PENDING'::character varying)::text, ('REVIEWING'::character varying)::text, ('RESOLVED'::character varying)::text, ('DISMISSED'::character varying)::text])))
);


--
-- TOC entry 229 (class 1259 OID 78468)
-- Name: seguimiento_viaje; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seguimiento_viaje (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    viaje_id uuid NOT NULL,
    latitud_actual numeric(10,8) NOT NULL,
    longitud_actual numeric(11,8) NOT NULL,
    rumbo integer,
    velocidad numeric(5,2),
    ultima_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 225 (class 1259 OID 78370)
-- Name: solicitudes_viaje; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solicitudes_viaje (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    viaje_id uuid NOT NULL,
    pasajero_id uuid NOT NULL,
    estado character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    mensaje character varying(500),
    asientos_solicitados integer DEFAULT 1 NOT NULL,
    respondido_en timestamp without time zone,
    motivo_rechazo character varying(255),
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT solicitudes_viaje_asientos_solicitados_check CHECK ((asientos_solicitados >= 1)),
    CONSTRAINT solicitudes_viaje_estado_check CHECK (((estado)::text = ANY (ARRAY[('PENDING'::character varying)::text, ('ACCEPTED'::character varying)::text, ('REJECTED'::character varying)::text, ('CANCELLED'::character varying)::text])))
);


--
-- TOC entry 231 (class 1259 OID 78497)
-- Name: ubicaciones_guardadas_usuario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ubicaciones_guardadas_usuario (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    usuario_id uuid NOT NULL,
    etiqueta character varying(50),
    nombre_direccion character varying(255),
    latitud numeric(10,8),
    longitud numeric(11,8),
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 220 (class 1259 OID 78279)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

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
    CONSTRAINT usuarios_rol_check CHECK (((rol)::text = ANY (ARRAY[('STUDENT'::character varying)::text, ('ADMIN'::character varying)::text])))
);


--
-- TOC entry 223 (class 1259 OID 78328)
-- Name: vehiculos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehiculos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    propietario_id uuid NOT NULL,
    placa character varying(20) NOT NULL,
    marca character varying(100) NOT NULL,
    modelo character varying(100) NOT NULL,
    color character varying(50) NOT NULL,
    anio integer,
    capacidad integer DEFAULT 4 NOT NULL,
    url_foto text,
    esta_activo boolean DEFAULT true,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT vehiculos_capacidad_check CHECK (((capacidad >= 1) AND (capacidad <= 8)))
);


--
-- TOC entry 224 (class 1259 OID 78346)
-- Name: viajes; Type: TABLE; Schema: public; Owner: -
--

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
    CONSTRAINT viajes_asientos_disponibles_check CHECK ((asientos_disponibles >= 1)),
    CONSTRAINT viajes_estado_check CHECK (((estado)::text = ANY (ARRAY[('PUBLISHED'::character varying)::text, ('FULL'::character varying)::text, ('IN_PROGRESS'::character varying)::text, ('COMPLETED'::character varying)::text, ('CANCELLED'::character varying)::text])))
);


--
-- TOC entry 4896 (class 2606 OID 78406)
-- Name: calificaciones calificaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calificaciones
    ADD CONSTRAINT calificaciones_pkey PRIMARY KEY (id);


--
-- TOC entry 4898 (class 2606 OID 78408)
-- Name: calificaciones calificaciones_viaje_id_calificador_id_calificado_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calificaciones
    ADD CONSTRAINT calificaciones_viaje_id_calificador_id_calificado_id_key UNIQUE (viaje_id, calificador_id, calificado_id);


--
-- TOC entry 4869 (class 2606 OID 78278)
-- Name: chequeo_salud chequeo_salud_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chequeo_salud
    ADD CONSTRAINT chequeo_salud_pkey PRIMARY KEY (id);


--
-- TOC entry 4879 (class 2606 OID 78305)
-- Name: codigos_verificacion codigos_verificacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codigos_verificacion
    ADD CONSTRAINT codigos_verificacion_pkey PRIMARY KEY (id);


--
-- TOC entry 4911 (class 2606 OID 78517)
-- Name: eventos_viaje eventos_viaje_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eventos_viaje
    ADD CONSTRAINT eventos_viaje_pkey PRIMARY KEY (id);


--
-- TOC entry 4907 (class 2606 OID 78491)
-- Name: pagos pagos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_pkey PRIMARY KEY (id);


--
-- TOC entry 4881 (class 2606 OID 78320)
-- Name: perfiles_usuario perfiles_usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.perfiles_usuario
    ADD CONSTRAINT perfiles_usuario_pkey PRIMARY KEY (id);


--
-- TOC entry 4883 (class 2606 OID 78322)
-- Name: perfiles_usuario perfiles_usuario_usuario_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.perfiles_usuario
    ADD CONSTRAINT perfiles_usuario_usuario_id_key UNIQUE (usuario_id);


--
-- TOC entry 4915 (class 2606 OID 78531)
-- Name: registros_auditoria registros_auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_auditoria
    ADD CONSTRAINT registros_auditoria_pkey PRIMARY KEY (id);


--
-- TOC entry 4902 (class 2606 OID 78467)
-- Name: reglas_seguridad reglas_seguridad_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reglas_seguridad
    ADD CONSTRAINT reglas_seguridad_pkey PRIMARY KEY (id);


--
-- TOC entry 4900 (class 2606 OID 78435)
-- Name: reportes reportes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes
    ADD CONSTRAINT reportes_pkey PRIMARY KEY (id);


--
-- TOC entry 4904 (class 2606 OID 78474)
-- Name: seguimiento_viaje seguimiento_viaje_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seguimiento_viaje
    ADD CONSTRAINT seguimiento_viaje_pkey PRIMARY KEY (id);


--
-- TOC entry 4892 (class 2606 OID 78383)
-- Name: solicitudes_viaje solicitudes_viaje_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_viaje
    ADD CONSTRAINT solicitudes_viaje_pkey PRIMARY KEY (id);


--
-- TOC entry 4894 (class 2606 OID 78385)
-- Name: solicitudes_viaje solicitudes_viaje_viaje_id_pasajero_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_viaje
    ADD CONSTRAINT solicitudes_viaje_viaje_id_pasajero_id_key UNIQUE (viaje_id, pasajero_id);


--
-- TOC entry 4909 (class 2606 OID 78503)
-- Name: ubicaciones_guardadas_usuario ubicaciones_guardadas_usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ubicaciones_guardadas_usuario
    ADD CONSTRAINT ubicaciones_guardadas_usuario_pkey PRIMARY KEY (id);


--
-- TOC entry 4872 (class 2606 OID 78295)
-- Name: usuarios usuarios_correo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_correo_key UNIQUE (correo);


--
-- TOC entry 4876 (class 2606 OID 78293)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 4885 (class 2606 OID 78340)
-- Name: vehiculos vehiculos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehiculos
    ADD CONSTRAINT vehiculos_pkey PRIMARY KEY (id);


--
-- TOC entry 4889 (class 2606 OID 78359)
-- Name: viajes viajes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viajes
    ADD CONSTRAINT viajes_pkey PRIMARY KEY (id);


--
-- TOC entry 4912 (class 1259 OID 78532)
-- Name: registros_auditoria_creado_en_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX registros_auditoria_creado_en_idx ON public.registros_auditoria USING btree (creado_en DESC);


--
-- TOC entry 4913 (class 1259 OID 78533)
-- Name: registros_auditoria_entidad_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX registros_auditoria_entidad_idx ON public.registros_auditoria USING btree (tipo_entidad, id_entidad);


--
-- TOC entry 4905 (class 1259 OID 78541)
-- Name: seguimiento_viaje_viaje_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX seguimiento_viaje_viaje_id_idx ON public.seguimiento_viaje USING btree (viaje_id);


--
-- TOC entry 4890 (class 1259 OID 78540)
-- Name: solicitudes_viaje_estado_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX solicitudes_viaje_estado_idx ON public.solicitudes_viaje USING btree (estado);


--
-- TOC entry 4870 (class 1259 OID 78534)
-- Name: usuarios_correo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX usuarios_correo_idx ON public.usuarios USING btree (correo);


--
-- TOC entry 4873 (class 1259 OID 78535)
-- Name: usuarios_esta_suspendido_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX usuarios_esta_suspendido_idx ON public.usuarios USING btree (esta_suspendido);


--
-- TOC entry 4874 (class 1259 OID 78536)
-- Name: usuarios_esta_verificado_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX usuarios_esta_verificado_idx ON public.usuarios USING btree (esta_verificado);


--
-- TOC entry 4877 (class 1259 OID 78537)
-- Name: usuarios_rol_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX usuarios_rol_idx ON public.usuarios USING btree (rol);


--
-- TOC entry 4886 (class 1259 OID 78539)
-- Name: viajes_estado_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX viajes_estado_idx ON public.viajes USING btree (estado);


--
-- TOC entry 4887 (class 1259 OID 78538)
-- Name: viajes_fecha_hora_salida_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX viajes_fecha_hora_salida_idx ON public.viajes USING btree (fecha_salida, hora_salida);


--
-- TOC entry 4923 (class 2606 OID 78419)
-- Name: calificaciones calificaciones_calificado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calificaciones
    ADD CONSTRAINT calificaciones_calificado_id_fkey FOREIGN KEY (calificado_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- TOC entry 4924 (class 2606 OID 78414)
-- Name: calificaciones calificaciones_calificador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calificaciones
    ADD CONSTRAINT calificaciones_calificador_id_fkey FOREIGN KEY (calificador_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- TOC entry 4925 (class 2606 OID 78409)
-- Name: calificaciones calificaciones_viaje_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calificaciones
    ADD CONSTRAINT calificaciones_viaje_id_fkey FOREIGN KEY (viaje_id) REFERENCES public.viajes(id) ON DELETE CASCADE;


--
-- TOC entry 4916 (class 2606 OID 78306)
-- Name: codigos_verificacion codigos_verificacion_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codigos_verificacion
    ADD CONSTRAINT codigos_verificacion_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- TOC entry 4933 (class 2606 OID 78518)
-- Name: eventos_viaje eventos_viaje_viaje_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eventos_viaje
    ADD CONSTRAINT eventos_viaje_viaje_id_fkey FOREIGN KEY (viaje_id) REFERENCES public.viajes(id) ON DELETE CASCADE;


--
-- TOC entry 4931 (class 2606 OID 78492)
-- Name: pagos pagos_solicitud_viaje_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_solicitud_viaje_id_fkey FOREIGN KEY (solicitud_viaje_id) REFERENCES public.solicitudes_viaje(id) ON DELETE CASCADE;


--
-- TOC entry 4917 (class 2606 OID 78323)
-- Name: perfiles_usuario perfiles_usuario_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.perfiles_usuario
    ADD CONSTRAINT perfiles_usuario_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- TOC entry 4926 (class 2606 OID 78441)
-- Name: reportes reportes_reportado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes
    ADD CONSTRAINT reportes_reportado_id_fkey FOREIGN KEY (reportado_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- TOC entry 4927 (class 2606 OID 78436)
-- Name: reportes reportes_reportante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes
    ADD CONSTRAINT reportes_reportante_id_fkey FOREIGN KEY (reportante_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- TOC entry 4928 (class 2606 OID 78451)
-- Name: reportes reportes_resuelto_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes
    ADD CONSTRAINT reportes_resuelto_por_fkey FOREIGN KEY (resuelto_por) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- TOC entry 4929 (class 2606 OID 78446)
-- Name: reportes reportes_viaje_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes
    ADD CONSTRAINT reportes_viaje_id_fkey FOREIGN KEY (viaje_id) REFERENCES public.viajes(id) ON DELETE SET NULL;


--
-- TOC entry 4930 (class 2606 OID 78475)
-- Name: seguimiento_viaje seguimiento_viaje_viaje_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seguimiento_viaje
    ADD CONSTRAINT seguimiento_viaje_viaje_id_fkey FOREIGN KEY (viaje_id) REFERENCES public.viajes(id) ON DELETE CASCADE;


--
-- TOC entry 4921 (class 2606 OID 78391)
-- Name: solicitudes_viaje solicitudes_viaje_pasajero_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_viaje
    ADD CONSTRAINT solicitudes_viaje_pasajero_id_fkey FOREIGN KEY (pasajero_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- TOC entry 4922 (class 2606 OID 78386)
-- Name: solicitudes_viaje solicitudes_viaje_viaje_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_viaje
    ADD CONSTRAINT solicitudes_viaje_viaje_id_fkey FOREIGN KEY (viaje_id) REFERENCES public.viajes(id) ON DELETE CASCADE;


--
-- TOC entry 4932 (class 2606 OID 78504)
-- Name: ubicaciones_guardadas_usuario ubicaciones_guardadas_usuario_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ubicaciones_guardadas_usuario
    ADD CONSTRAINT ubicaciones_guardadas_usuario_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- TOC entry 4918 (class 2606 OID 78341)
-- Name: vehiculos vehiculos_propietario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehiculos
    ADD CONSTRAINT vehiculos_propietario_id_fkey FOREIGN KEY (propietario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- TOC entry 4919 (class 2606 OID 78360)
-- Name: viajes viajes_conductor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viajes
    ADD CONSTRAINT viajes_conductor_id_fkey FOREIGN KEY (conductor_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- TOC entry 4920 (class 2606 OID 78365)
-- Name: viajes viajes_vehiculo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viajes
    ADD CONSTRAINT viajes_vehiculo_id_fkey FOREIGN KEY (vehiculo_id) REFERENCES public.vehiculos(id) ON DELETE SET NULL;


--
-- TOC entry 5084 (class 0 OID 0)
-- Dependencies: 7
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

GRANT ALL ON SCHEMA public TO u_ride_user;


--
-- TOC entry 2147 (class 826 OID 78542)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE u_ride_user IN SCHEMA public GRANT ALL ON SEQUENCES TO u_ride_user;


--
-- TOC entry 2148 (class 826 OID 78543)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE u_ride_user IN SCHEMA public GRANT ALL ON FUNCTIONS TO u_ride_user;


--
-- TOC entry 2149 (class 826 OID 78544)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE u_ride_user IN SCHEMA public GRANT ALL ON TABLES TO u_ride_user;


-- Completed on 2026-04-08 21:15:27

--
-- PostgreSQL database dump complete
--

