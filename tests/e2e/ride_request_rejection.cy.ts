describe('U-Ride Ride Request Rejection Flow', () => {
  beforeEach(() => {
    cy.config('defaultCommandTimeout', 10000);
    cy.log('🔄 Sembramos la base de datos para asegurar un estado limpio...');
    cy.exec('node ../packages/backend/scripts/seed-data.js');
  });

  it('handles passenger requesting and driver rejecting the ride', () => {
    cy.log('🚀 PASAJERO (Laura) INICIA SESIÓN...');
    cy.visit('/login');
    cy.wait(1500);

    cy.get('input[type="email"]').type('laura.gonzalez@uride.edu.ec');
    cy.get('input[type="password"]').type('Test1234!');
    cy.get('button[type="submit"]').click();
    cy.wait(3000);

    cy.contains('a', 'Viajes').click();
    cy.wait(2000);

    // Reservar el viaje de Diego Herrera (Izamba)
    cy.contains('.shadow-uber-sm', 'Izamba').click();
    cy.wait(1500);
    cy.contains('button', 'Solicitar unirme al viaje').click();
    cy.wait(1000);
    cy.contains('button', 'Efectivo').click();
    cy.wait(500);
    cy.contains('button', 'Confirmar y Solicitar').click();
    cy.wait(2500);
    cy.contains('¡Solicitud enviada con éxito!').should('be.visible');

    // Cerrar sesión
    cy.get('#profile-dropdown-trigger').click();
    cy.wait(500);
    cy.contains('button', 'Cerrar sesión').click();
    cy.wait(2000);

    cy.log('🚀 CONDUCTOR (Diego) INICIA SESIÓN PARA RECHAZAR...');
    cy.visit('/login');
    cy.wait(1500);

    cy.get('input[type="email"]').type('diego.herrera@uride.edu.ec');
    cy.get('input[type="password"]').type('Test1234!');
    cy.get('button[type="submit"]').click();
    cy.wait(3000);

    cy.contains('a', 'Mis viajes').click();
    cy.wait(2000);

    // Expandir solicitudes
    cy.get('.shadow-uber-sm')
      .filter(':contains("Izamba")')
      .filter(':contains("Disponible")')
      .first()
      .within(() => {
        cy.contains('button', 'SOLICITUDES').click();
      });
    cy.wait(1500);

    // Clickear Rechazar
    cy.get('.shadow-uber-sm')
      .filter(':contains("Izamba")')
      .filter(':contains("Disponible")')
      .first()
      .within(() => {
        cy.contains('button', 'RECHAZAR').click();
      });
    cy.wait(1500);

    // Escribir motivo del rechazo en el textarea del modal y enviar
    cy.get('textarea[placeholder*="Ej: Lo siento"]')
      .should('be.visible')
      .type('Lo siento, ruta modificada temporalmente.');
    cy.wait(500);

    cy.contains('button', 'Enviar y Rechazar').click();
    cy.wait(2500);

    cy.contains('Solicitud rechazada con éxito').should('be.visible');

    // Verificar que el estado cambie a Rechazado
    cy.get('.shadow-uber-sm')
      .filter(':contains("Izamba")')
      .filter(':contains("Disponible")')
      .first()
      .within(() => {
        cy.contains('Rechazado').should('be.visible');
      });
    cy.wait(1000);
    cy.log('✅✅✅ PRUEBA 4 PASADA CON ÉXITO ✅✅✅');
  });
});
