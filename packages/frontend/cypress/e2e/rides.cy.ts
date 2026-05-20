describe('Módulo de Viajes (Rides)', () => {
  it('Flujo completo: Login, Crear, Editar, Iniciar y Cancelar Viaje', () => {
    // ==========================================
    // 1. LOGIN
    // ==========================================
    cy.visit('/login'); 
    
    // Interceptar la llamada de login
    cy.intercept('POST', '**/auth/login').as('loginReq');

    // Llenar credenciales
    cy.get('input[type="email"], input[name="email"]').type('jfiallos7065@uta.edu.ec');
    cy.get('input[type="password"], input[name="password"]').type('Marlon182004@');

    // Clic en iniciar sesión
    cy.contains('button', /ingresar|iniciar sesi[oó]n|login/i).click();

    // Esperar a que el backend procese el login y redirija
    cy.wait('@loginReq').its('response.statusCode').should('be.oneOf', [200, 201]);
    cy.url().should('not.include', '/login');
    
    // Ir a la pestaña de viajes
    cy.visit('/rides'); 

    // ==========================================
    // ==========================================
// 2. CREAR VIAJE
// ==========================================
// Cambiamos /crear viaje/i por /nuevo viaje/i que es tu botón real
cy.contains('button', /nuevo viaje/i).click();

// Como tus campos de origen y destino son <select>, usamos .select() en lugar de .type()
cy.get('select').first().select('Campus Huachi'); // Reemplaza por un valor real de CAMPUS_UTA
cy.get('select').eq(1).select('Zonas Ambato');    // Reemplaza por un valor real de ZONAS_AMBATO

cy.get('input[type="date"]').type('2026-12-31'); // Fecha futura
cy.get('input[type="time"]').type('08:00');
cy.get('input[type="number"]').first().clear().type('3'); // Tus asientos disponibles
cy.get('input[type="number"]').eq(1).clear().type('5.00'); // Tu precio por asiento

// El botón para enviar el formulario dice "Publicar viaje" en tu código
cy.contains('button', /publicar viaje/i).click();

// Esperar tu mensaje de confirmación real
cy.contains(/viaje publicado/i).should('be.visible');
    // ==========================================
    // ==========================================
// 3. EDITAR VIAJE
// ==========================================
cy.visit('/rides');
// Tu botón de edición está en minúsculas en el HTML ("Editar")
cy.contains('button', /editar/i).first().click();

// Cambiamos el destino en el select del modal de edición
cy.get('select').eq(1).select('Zonas Ambato'); // Elige otra zona para la prueba

// Tu botón de actualizar dice "Actualizar viaje"
cy.contains('button', /actualizar viaje/i).click();

// Tu mensaje real de éxito es "¡Viaje actualizado!"
cy.contains(/viaje actualizado/i).should('be.visible');
    // ==========================================
    // 4. INICIAR VIAJE
    // ==========================================
    cy.visit('/rides');
    cy.contains(/iniciar/i).first().click();
    cy.contains(/iniciado|éxito|success/i).should('be.visible');

    // ==========================================
    // 5. CANCELAR / ELIMINAR VIAJE
    // ==========================================
    cy.visit('/rides');
    cy.contains(/cancelar|eliminar/i).first().click();
    
    // Clic en el modal de confirmación (si hay uno)
    cy.contains('button', /confirmar|sí/i).click();

    cy.contains(/cancelado|eliminado|éxito|success/i).should('be.visible');
  });
});
