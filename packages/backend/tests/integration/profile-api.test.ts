import { describe, test, expect, beforeAll } from '@jest/globals';
import request from 'supertest';

// ⚠️ IMPORTANTE: Aquí hay dos formas de hacerlo.
// Opción A: Probar con tu servidor local encendido (Asegúrate de correr pnpm dev primero)
const API_URL = 'http://localhost:3002/api/v1';

describe('RF-003: Gestión de Perfil de Usuario (Pruebas de Integración)', () => {

    let tokenDePrueba = '';

    beforeAll(async () => {
        // ⚠️ ATENCIÓN: Como esto pega a la API real, necesitamos un token real.
        // Hacemos login con un usuario que ya exista en tu base de datos para obtener su token.
        const loginRes = await request(API_URL)
            .post('/auth/login')
            .send({
                email: 'mguevara4348@uta.edu.ec', // Cambia esto por un correo de tu BD
                password: 'Marlon182004@'                  // Cambia esto por la contraseña
            });

        if (loginRes.status === 200 && loginRes.body.data?.token) {
            tokenDePrueba = `Bearer ${loginRes.body.data.token}`;
        } else {
            console.error("No se pudo iniciar sesión. Asegúrate de que el usuario exista.", loginRes.body);
        }
    });

    test('CF-RF003: Debe actualizar teléfono y zona, pero bloquear el correo institucional', async () => {
        // Simulamos la petición que enviaría React al darle a "Guardar"
        const payload = {
            phone: '0987654321',
            zone: 'Izamba',
            email: 'hacker@gmail.com' // Intento de cambio ilegal
        };

        const res = await request(API_URL)
            .put('/users/profile')
            .set('Authorization', tokenDePrueba)
            .send(payload);

        // Verificamos que la petición fue exitosa (Status 200 OK)
        expect(res.status).toBe(200);

        // Los datos viven dentro de res.body.data
        const perfilActualizado = res.body.data;

        // Verificamos que los datos permitidos SÍ cambiaron
        expect(perfilActualizado.phone).toBe('0987654321');
        expect(perfilActualizado.zone).toBe('Izamba');

        // Verificamos que el correo de la UTA sigue intacto en la respuesta
        expect(perfilActualizado.email).not.toBe('hacker@gmail.com');
        expect(perfilActualizado.email).toContain('@uta.edu.ec');
    });

    // ----------------------------------------------------------------------
    // 2. PRUEBA DE HISTORIAL Y CALIFICACIÓN (CF-RF003-03)
    // ----------------------------------------------------------------------
    test('CF-RF003-03: El perfil debe cargar el historial de viajes y la calificación', async () => {
        // Simulamos la carga inicial de la página de Perfil (GET)
        const res = await request(API_URL)
            .get('/users/profile')
            .set('Authorization', tokenDePrueba);

        expect(res.status).toBe(200);

        const perfil = res.body.data;

        // toHaveProperty verifica que la llave exista en el JSON que devuelve tu backend
        // Según tus DTOs, se llaman totalRatings y reputation
        expect(perfil).toHaveProperty('totalRatings');
        expect(perfil).toHaveProperty('reputation');
    });

    // ----------------------------------------------------------------------
    // 3. ENFOQUE TÉCNICO: PRUEBA DE PERSISTENCIA
    // ----------------------------------------------------------------------
    test('Enfoque Técnico: Los cambios deben mantenerse al recargar la página (Lectura DB)', async () => {
        // PASO 1: Hacemos un cambio (PUT)
        await request(API_URL)
            .put('/users/profile')
            .set('Authorization', tokenDePrueba)
            .send({ zone: 'Huachi Chico' });

        // PASO 2: Simulamos presionar "F5" o recargar la página en React (GET)
        const res = await request(API_URL)
            .get('/users/profile')
            .set('Authorization', tokenDePrueba);

        // PASO 3: Confirmamos que la Base de Datos guardó el cambio y lo devuelve
        expect(res.status).toBe(200);
        expect(res.body.data.zone).toBe('Huachi Chico');
    });

});