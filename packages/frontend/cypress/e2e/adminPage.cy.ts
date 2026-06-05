it('debería mostrar la lista de usuarios en el panel de admin', () => {
  cy.visit('/login');

  cy.get('input[type="email"]').type('hvillavicencio8210@uta.edu.ec');
  cy.get('input[type="password"]').type('Heidi2003');
  cy.get('button[type="submit"]').click();

  // 👇 ESPERA REAL (NO wait)
  cy.window().should((win) => {
    expect(win.localStorage.getItem('token')).to.exist;
    expect(win.localStorage.getItem('user')).to.exist;
  });

  cy.visit('/admin?tab=stats');
  cy.wait(1500);
cy.visit('/admin?tab=users');
  cy.contains('Usuarios').should('be.visible');
  cy.log('🔍 BUSCANDO A PEPE...');
    cy.get('input[placeholder*="Buscar usuarios"]')
      .should('be.visible')
      .type('pepe');
    cy.wait(1500);

    // Buscar la tarjeta de Pepe y click en Suspender
    cy.log('🚫 SUSPENDIENDO A PEPE...');
    cy.get('.glass-card, .bg-white.rounded-2xl')
      .filter(':contains("pepe@uta.edu.ec")')
      .first()
      .as('pepeCard')
      .should('be.visible')
      .within(() => {
        cy.contains('button', 'Suspender')
          .should('be.visible')
          .click({ force: true });
      });

    cy.wait(1500);
// ═══════════════════════════════════════════════════════════════════════════
    // 5. LLENAR MODAL DE SUSPENSIÓN
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('📝 LLENANDO MODAL DE SUSPENSIÓN...');
    cy.get('.fixed.inset-0', { timeout: 10000 })
      .should('be.visible')
      .within(() => {
        cy.get('textarea')
          .should('be.visible')
          .type('Suspensión temporal por pruebas del sistema administrativo.');
        cy.wait(700);

        // Seleccionar duración 1 día
        cy.get('select')
          .should('be.visible')
          .select('1');
        cy.wait(500);

        cy.contains('button', 'Suspender Usuario')
          .should('be.visible')
          .click({ force: true });
      });

    cy.wait(2000);

    // Verificar que Pepe ahora aparece como Suspendido
    cy.get('@pepeCard')
      .contains('Suspendido')
      .should('be.visible');

    cy.log('✅ PEPE SUSPENDIDO EXITOSAMENTE');
    cy.wait(1500);

    // ═══════════════════════════════════════════════════════════════════════════
    // 6. CERRAR SESIÓN ADMIN
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('🔽 Cerrando sesión del administrador...');
    cy.get('#profile-dropdown-trigger').should('be.visible').click();
    cy.contains('Cerrar sesión', { timeout: 10000 }).should('be.visible').click();
    cy.wait(1500);

    // ═══════════════════════════════════════════════════════════════════════════
    // 7. LOGIN COMO PEPE - VERIFICAR SUSPENSIÓN
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('🚀 INICIANDO SESIÓN COMO PEPE (SUSPENDIDO)...');
    cy.get('input[type="email"]').should('be.visible').type('pepe@uta.edu.ec');
    cy.wait(700);
    cy.get('input[type="password"]').should('be.visible').type('Pepe1234');
    cy.wait(700);
    cy.get('button[type="submit"]').should('be.visible').click();
    cy.wait(3000);

    // Verificar que Pepe no puede entrar (suspendido)
    cy.log('🔎 VERIFICANDO QUE PEPE ESTÁ SUSPENDIDO...');
    cy.get('body').then(($body) => {
      if ($body.text().includes('suspendido') || $body.text().includes('Suspendido') || $body.text().includes('suspended')) {
        cy.log('✅ PEPE ESTÁ SUSPENDIDO - MENSAJE DE SUSPENSIÓN VISIBLE');
        cy.contains(/suspendido|suspended|cuenta suspendida/i).should('be.visible');
      } else {
        cy.url().should('not.include', '/dashboard');
        cy.log('✅ PEPE NO PUEDE ACCEDER AL DASHBOARD');
      }
    });

    cy.wait(2000);

    // ═══════════════════════════════════════════════════════════════════════════
    // 8. LOGIN COMO ADMIN - REACTIVAR A PEPE
    // ═══════════════════════════════════════════════════════════════════════════
   cy.log('🚀 INICIANDO SESIÓN COMO ADMINISTRADOR PARA REACTIVAR...');

cy.visit('/login');

cy.get('input[type="email"]').type('hvillavicencio8210@uta.edu.ec');
cy.get('input[type="password"]').type('Heidi2003');

// 🔥 Interceptar login (MEJOR QUE window)
cy.intercept('POST', '**/login').as('loginRequest');

cy.get('button[type="submit"]').click();

cy.wait('@loginRequest').its('response.statusCode').should('eq', 200);

// ✅ VALIDAR TOKEN Y USUARIO REALES
cy.window().its('localStorage.token').should('exist');
cy.window().its('localStorage.user').should('exist');

// 🚫 SOLO UNA VISITA
cy.visit('/admin?tab=users');

// 🔥 VALIDAR QUE NO TE BOTÓ
cy.url().should('not.include', '/login');

// 🔥 ESPERA REAL (NO wait)
cy.contains('Usuarios', { timeout: 10000 }).should('be.visible');


// ═══════════════════════════════════════════════
// 🔍 BUSCAR A PEPE
// ═══════════════════════════════════════════════
cy.log('🔍 BUSCANDO A PEPE PARA REACTIVAR...');

cy.get('input[placeholder*="Buscar usuarios"]')
  .should('be.visible')
  .clear()
  .type('pepe');


// ═══════════════════════════════════════════════
// ✅ REACTIVAR CUENTA
// ═══════════════════════════════════════════════
cy.log('✅ REACTIVANDO CUENTA DE PEPE...');

cy.contains('.glass-card, .bg-white.rounded-2xl', 'pepe@uta.edu.ec')
  .as('pepeCardReactivate')
  .should('be.visible')
  .within(() => {
    cy.contains('button', 'Reactivar Cuenta')
      .should('be.visible')
      .click({ force: true });
  });


// 🔥 VALIDACIÓN FINAL
cy.get('@pepeCardReactivate')
  .contains('Activo')
  .should('be.visible');

cy.log('✅ CUENTA DE PEPE REACTIVADA EXITOSAMENTE');
    // Verificar que Pepe aparece como Activo
    cy.get('@pepeCardReactivate')
      .contains('Activo')
      .should('be.visible');

    cy.log('✅ CUENTA DE PEPE REACTIVADA EXITOSAMENTE');
    cy.wait(1500);

    // ═══════════════════════════════════════════════════════════════════════════
    // 9. CERRAR SESIÓN ADMIN
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('🔽 Cerrando sesión del administrador...');
    cy.get('#profile-dropdown-trigger').should('be.visible').click();
    cy.contains('Cerrar sesión', { timeout: 10000 }).should('be.visible').click();
    cy.wait(1500);

    // ═══════════════════════════════════════════════════════════════════════════
    // 10. LOGIN COMO PEPE - VERIFICAR QUE PUEDE ENTRAR
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('🚀 VERIFICANDO QUE PEPE PUEDE INICIAR SESIÓN NUEVAMENTE...');
    cy.get('input[type="email"]').should('be.visible').type('pepe@uta.edu.ec');
    cy.wait(700);
    cy.get('input[type="password"]').should('be.visible').type('Pepe1234');
    cy.wait(700);
    cy.get('button[type="submit"]').should('be.visible').click();
    cy.wait(3000);

    cy.url().should('include', '/dashboard');
    cy.wait(2000);
    cy.log('✅ PEPE PUEDE ACCEDER NUEVAMENTE - CUENTA ACTIVA');

    // ═══════════════════════════════════════════════════════════════════════════
    // 11. CERRAR SESIÓN PEPE - VOLVER A ADMIN
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('🔽 Cerrando sesión de Pepe...');
    cy.get('#profile-dropdown-trigger').should('be.visible').click();
    cy.contains('Cerrar sesión', { timeout: 10000 }).should('be.visible').click();
    cy.wait(1500);
    
    cy.log('🚀 INICIANDO SESIÓN COMO ADMINISTRADOR ..');
   

  cy.get('input[type="email"]').type('hvillavicencio8210@uta.edu.ec');
  cy.get('input[type="password"]').type('Heidi2003');
  cy.get('button[type="submit"]').click();

  // 👇 ESPERA REAL (NO wait)
  cy.window().should((win) => {
    expect(win.localStorage.getItem('token')).to.exist;
    expect(win.localStorage.getItem('user')).to.exist;
  });

  cy.visit('/admin?tab=stats');
  cy.wait(2000);
  
  cy.log('🚩 NAVEGANDO A TAB REPORTES...');
    cy.visit('/admin?tab=reports');
    cy.wait(2000);

    // Verificar que hay reportes pendientes
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Descartar")').length > 0) {
        cy.log('🗑️ DESCARTANDO REPORTE PENDIENTE...');
        cy.contains('button', 'Descartar')
          .first()
          .should('be.visible')
          .click({ force: true });

        cy.wait(1500);

        // Llenar modal de notas
        cy.log('📝 LLENANDO NOTAS DE DESCARTE...');
        cy.get('.fixed.inset-0', { timeout: 10000 })
          .should('be.visible')
          .within(() => {
            cy.get('textarea')
              .should('be.visible')
              .type('Reporte revisado y descartado. No se encontraron evidencias suficientes.');
            cy.wait(700);

            cy.contains('button', 'Aceptar Acción')
              .should('be.visible')
              .click({ force: true });
          });

        cy.wait(2000);
        cy.log('✅ REPORTE DESCARTADO EXITOSAMENTE');
      } else {
        cy.log('⚠️ No hay reportes pendientes para descartar');
        cy.contains('No hay reportes').should('be.visible');
      }
    });

    cy.wait(1500);
    // ═══════════════════════════════════════════════════════════════════════════
// RESOLVER REPORTE
// ═══════════════════════════════════════════════════════════════════════════
cy.get('body').then(($body) => {
  if ($body.find('button:contains("Resolver")').length > 0) {
    cy.log('🛠️ RESOLVIENDO REPORTE...');

    cy.contains('button', 'Resolver')
      .first()
      .should('be.visible')
      .click({ force: true });

    cy.wait(1500);

    // Modal de resolución
    cy.get('.fixed.inset-0', { timeout: 10000 })
      .should('be.visible')
      .within(() => {
        cy.log('📝 INGRESANDO NOTA DE RESOLUCIÓN...');

        cy.get('textarea')
          .should('be.visible')
          .clear()
          .type('Reporte revisado y resuelto correctamente. Se tomaron las acciones necesarias.');

        cy.wait(700);

        cy.contains('button', 'Aceptar Acción')
          .should('be.visible')
          .click({ force: true });
      });

    cy.wait(2000);

    cy.log('✅ REPORTE RESUELTO EXITOSAMENTE');
  } else {
    cy.log('⚠️ No hay reportes disponibles para resolver');
  }
});
  
});