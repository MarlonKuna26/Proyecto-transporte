describe('U-Ride Ride Request Approval Flow', () => {
  beforeEach(() => {
    cy.config('defaultCommandTimeout', 10000);
    cy.log('🔄 Sembramos la base de datos para asegurar un estado limpio...');
    cy.exec('node ../packages/backend/scripts/seed-data.js');
  });

  it('handles passenger requesting and driver accepting the ride', () => {
    cy.log('🚀 PASAJERO (María) INICIA SESIÓN...');
    cy.visit('/login');
    cy.wait(1500);

    cy.get('input[type="email"]').type('maria.rodriguez@uride.edu.ec');
    cy.get('input[type="password"]').type('Test1234!');
    cy.get('button[type="submit"]').click();
    cy.wait(3000);

    cy.contains('a', 'Viajes').click();
    cy.wait(2000);

    // Reservar el viaje de Andrés López (Centro)
    cy.contains('.shadow-uber-sm', 'Centro').click();
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

    cy.log('🚀 CONDUCTOR (Andrés) INICIA SESIÓN PARA ACEPTAR...');
    cy.visit('/login');
    cy.wait(1500);

    cy.get('input[type="email"]').type('andres.lopez@uride.edu.ec');
    cy.get('input[type="password"]').type('Test1234!');
    cy.get('button[type="submit"]').click();
    cy.wait(3000);

    cy.contains('a', 'Mis viajes').click();
    cy.wait(2000);

    // Expandir solicitudes
    cy.get('.shadow-uber-sm')
      .filter(':contains("Centro")')
      .filter(':contains("Disponible")')
      .first()
      .within(() => {
        cy.contains('button', 'SOLICITUDES').click();
      });
    cy.wait(1500);

    // Clickear Aceptar en la solicitud de María
    cy.get('.shadow-uber-sm')
      .filter(':contains("Centro")')
      .filter(':contains("Disponible")')
      .first()
      .within(() => {
        cy.contains('button', 'ACEPTAR').click();
      });
    cy.wait(2500);

    cy.contains('Solicitud aceptada con éxito').should('be.visible');

    // Verificar que el estado cambie a Aceptado
    cy.get('.shadow-uber-sm')
      .filter(':contains("Centro")')
      .filter(':contains("Disponible")')
      .first()
      .within(() => {
        cy.contains('Aceptado').should('be.visible');
      });
    cy.wait(1000);
    cy.log('✅✅✅ PRUEBA PASADA CON ÉXITO ✅✅✅');
  });
});
