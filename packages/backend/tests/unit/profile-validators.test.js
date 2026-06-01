"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
// Mejoramos la validación: Solo números Y exactamente 10 dígitos
const validatePhone = (phone) => /^\d{10}$/.test(phone);
const validateImageSize = (sizeMB) => sizeMB <= 2; // Máximo 2MB
// Función que simula el filtrado de datos antes de guardar en DB (Apoya el CF-RF003)
const filterAllowedFields = (payload) => {
    // Extraemos el correo para descartarlo y nos quedamos con el resto
    const { correo_institucional, ...allowedUpdates } = payload;
    return allowedUpdates;
};
// =========================================================
// 2. CASOS DE PRUEBA (Test Suites)
// =========================================================
(0, globals_1.describe)('CF-RF003-02: Validar formatos de Perfil (Pruebas Unitarias)', () => {
    (0, globals_1.test)('Debe rechazar teléfonos con letras como "099Q911"', () => {
        const resultado = validatePhone('099Q911');
        (0, globals_1.expect)(resultado).toBe(false);
    });
    (0, globals_1.test)('Debe rechazar teléfonos incompletos (menos de 10 dígitos)', () => {
        const resultado = validatePhone('0987654'); // Solo 7 dígitos
        (0, globals_1.expect)(resultado).toBe(false);
    });
    (0, globals_1.test)('Debe aceptar un teléfono válido de exactamente 10 números', () => {
        const resultado = validatePhone('0987654321');
        (0, globals_1.expect)(resultado).toBe(true);
    });
    (0, globals_1.test)('Debe rechazar fotos que pesen más de 2MB', () => {
        const resultado = validateImageSize(5); // 5MB es demasiado
        (0, globals_1.expect)(resultado).toBe(false);
    });
    (0, globals_1.test)('Debe aceptar fotos que pesen exactamente 2MB o menos', () => {
        const resultado = validateImageSize(1.5);
        (0, globals_1.expect)(resultado).toBe(true);
    });
});
(0, globals_1.describe)('Lógica de Soporte para CF-RF003 (Protección de Datos Críticos)', () => {
    (0, globals_1.test)('Debe eliminar el correo institucional de los datos permitidos para editar', () => {
        // Simulamos un hacker intentando enviar su correo junto con datos válidos
        const payloadMalicioso = {
            telefono: '0999999999',
            zona: 'Ficoa',
            correo_institucional: 'hacker@uta.edu.ec'
        };
        const datosLimpios = filterAllowedFields(payloadMalicioso);
        // Verificamos que se mantengan los datos permitidos
        (0, globals_1.expect)(datosLimpios.telefono).toBe('0999999999');
        (0, globals_1.expect)(datosLimpios.zona).toBe('Ficoa');
        // Verificamos que el correo HAYA SIDO ELIMINADO del objeto
        (0, globals_1.expect)(datosLimpios.correo_institucional).toBeUndefined();
    });
});
//# sourceMappingURL=profile-validators.test.js.map