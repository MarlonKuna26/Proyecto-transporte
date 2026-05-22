describe('U-Ride Passenger Request Lifecycle Flow', () => {
  beforeEach(() => {
    cy.config('defaultCommandTimeout', 10000);
    cy.log('🔄 Sembramos la base de datos para asegurar un estado limpio...');
    cy.exec('node ../packages/backend/scripts/seed-data.js');
  });

  it('allows passenger to view, reserve, and cancel a ride request', () => {
    cy.log('🚀 INICIANDO SESIÓN COMO PASAJERO (María)...');
    cy.visit('/login');
    cy.wait(1500);

    cy.get('input[type="email"]')
      .should('be.visible')
      .type('maria.rodriguez@uride.edu.ec');
    cy.wait(500);

    cy.get('input[type="password"]')
      .should('be.visible')
      .type('Test1234!');
    cy.wait(500);

    cy.get('button[type="submit"]')
      .should('be.visible')
      .click();
    cy.wait(3000);

    cy.url().should('include', '/dashboard');
    cy.wait(1000);

    cy.log('🔍 Navegando a buscar viajes...');
    cy.contains('a', 'Viajes')
      .should('be.visible')
      .click();
    cy.wait(2000);
    cy.url().should('include', '/rides');

    // Visualizar detalles del viaje de Diego (Izamba)
    cy.log('👀 Visualizando viaje desde Izamba...');
    cy.contains('.shadow-uber-sm', 'Izamba')
      .should('be.visible')
      .click();
    cy.wait(1500);

    // Solicitar unirme al viaje (Reservar)
    cy.log('✍️ Reservando/solicitando viaje...');
    cy.contains('button', 'Solicitar unirme al viaje')
      .should('be.visible')
      .click();
    cy.wait(1000);

    // Seleccionar método de pago: Efectivo
    cy.contains('button', 'Efectivo')
      .should('be.visible')
      .click();
    cy.wait(500);

    // Escribir mensaje opcional
    cy.get('input[placeholder*="Escribe un mensaje"]')
      .should('be.visible')
      .type('Hola Diego, voy con una mochila mediana.');
    cy.wait(500);

    cy.contains('button', 'Confirmar y Solicitar')
      .should('be.visible')
      .click();
    cy.wait(2500);

    cy.contains('¡Solicitud enviada con éxito!').should('be.visible');
    cy.wait(1000);

    // Cancelar la solicitud desde Mis Solicitudes
    cy.log('🧹 Cancelando solicitud enviada...');
    cy.get('#profile-dropdown-trigger').click();
    cy.wait(500);
    cy.contains('a', 'Solicitudes').click();
    cy.wait(2000);
    cy.url().should('include', '/my-requests');

    cy.contains('.shadow-uber-sm', 'Izamba')
      .should('be.visible')
      .within(() => {
        cy.contains('button', 'Cancelar solicitud').click();
      });
    cy.wait(1000);

    cy.contains('button', 'Confirmar y Retirar')
      .should('be.visible')
      .click();
    cy.wait(2500);

    cy.contains('Solicitud cancelada con éxito').should('be.visible');
    
    // Verificar estado es Cancelada
    cy.contains('.shadow-uber-sm', 'Izamba')
      .within(() => {
        cy.contains('Cancelada').should('be.visible');
      });
    cy.wait(1000);
    cy.log('✅✅✅ PRUEBA PASADA CON ÉXITO ✅✅✅');
  });
});
