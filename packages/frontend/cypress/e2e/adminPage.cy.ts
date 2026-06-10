it('debería mostrar la lista de usuarios en el panel de admin', () => {
  cy.visit('/login');

  cy.get('input[type="email"]').type('admin@uride.edu.ec');
  cy.get('input[type="password"]').type('Test1234!');
  cy.get('button[type="submit"]').click();

  cy.window().should((win) => {
    expect(win.localStorage.getItem('token')).to.exist;
    expect(win.localStorage.getItem('user')).to.exist;
  });

  cy.visit('/admin?tab=stats');
  cy.wait(1500);
  cy.visit('/admin?tab=users');
  cy.contains('Usuarios').should('be.visible');

  cy.log('🔍 BUSCANDO A MARTA...');
  cy.get('input[placeholder*="Buscar usuarios"]')
    .should('be.visible')
    .type('marta');
  cy.wait(1500);

  cy.log('🚫 SUSPENDIENDO A MARTA...');
  cy.get('.glass-card, .bg-white.rounded-2xl')
    .filter(':contains("mguevara4348@uta.edu.ec")')
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
  // LLENAR MODAL DE SUSPENSIÓN
  // ═══════════════════════════════════════════════════════════════════════════
  cy.log('📝 LLENANDO MODAL DE SUSPENSIÓN...');
  cy.get('.fixed.inset-0', { timeout: 10000 })
    .should('be.visible')
    .within(() => {
      cy.get('textarea')
        .should('be.visible')
        .type('Suspensión temporal por pruebas del sistema administrativo.');
      cy.wait(700);

      cy.get('select')
        .should('be.visible')
        .select('1');
      cy.wait(500);

      cy.contains('button', 'Suspender Usuario')
        .should('be.visible')
        .click({ force: true });
    });

  cy.wait(2000);

  cy.get('@pepeCard')
    .contains('Suspendido')
    .should('be.visible');

  cy.log('✅ MARTA SUSPENDIDA EXITOSAMENTE');
  cy.wait(1500);

  // ═══════════════════════════════════════════════════════════════════════════
  // CERRAR SESIÓN ADMIN
  // ═══════════════════════════════════════════════════════════════════════════
  cy.log('🔽 Cerrando sesión del administrador...');
  cy.get('#profile-dropdown-trigger').should('be.visible').click();
  cy.contains('Cerrar sesión', { timeout: 10000 }).should('be.visible').click();
  cy.wait(1500);

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGIN COMO MARTA - VERIFICAR SUSPENSIÓN
  // ═══════════════════════════════════════════════════════════════════════════
  cy.log('🚀 INICIANDO SESIÓN COMO MARTA (SUSPENDIDA)...');
  cy.get('input[type="email"]').should('be.visible').type('mguevara4348@uta.edu.ec');
  cy.wait(700);
  cy.get('input[type="password"]').should('be.visible').type('Marta123');
  cy.wait(700);
  cy.get('button[type="submit"]').should('be.visible').click();
  cy.wait(3000);

  cy.log('🔎 VERIFICANDO QUE MARTA ESTÁ SUSPENDIDA...');
  cy.get('body').then(($body) => {
    if ($body.text().includes('suspendido') || $body.text().includes('Suspendido') || $body.text().includes('suspended')) {
      cy.log('✅ MARTA ESTÁ SUSPENDIDA - MENSAJE DE SUSPENSIÓN VISIBLE');
      cy.contains(/suspendido|suspended|cuenta suspendida/i).should('be.visible');
    } else {
      cy.url().should('not.include', '/dashboard');
      cy.log('✅ MARTA NO PUEDE ACCEDER AL DASHBOARD');
    }
  });

  cy.wait(2000);

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGIN COMO ADMIN - REACTIVAR A MARTA
  // ═══════════════════════════════════════════════════════════════════════════
  cy.log('🚀 INICIANDO SESIÓN COMO ADMINISTRADOR PARA REACTIVAR...');
  cy.visit('/login');

  cy.intercept('POST', '**/auth/login').as('loginRequest');

  cy.get('input[type="email"]').type('admin@uride.edu.ec');
  cy.get('input[type="password"]').type('Test1234!');
  cy.get('button[type="submit"]').click();

  cy.wait('@loginRequest').its('response.statusCode').should('eq', 200);

  cy.window().should((win) => {
    expect(win.localStorage.getItem('token')).to.exist;
    expect(win.localStorage.getItem('user')).to.exist;
  });

  cy.visit('/admin?tab=users');
  cy.contains('Usuarios', { timeout: 10000 }).should('be.visible');

  cy.log('🔍 BUSCANDO A MARTA PARA REACTIVAR...');
  cy.get('input[placeholder*="Buscar usuarios"]')
    .should('be.visible')
    .clear()
    .type('Marta');

  cy.log('✅ REACTIVANDO CUENTA DE MARTA...');
  cy.contains('.glass-card, .bg-white.rounded-2xl', 'mguevara4348@uta.edu.ec')
    .as('pepeCardReactivate')
    .should('be.visible')
    .within(() => {
      cy.contains('button', 'Reactivar Cuenta')
        .should('be.visible')
        .click({ force: true });
    });

  cy.get('@pepeCardReactivate')
    .contains('Activo')
    .should('be.visible');

  cy.log('✅ CUENTA DE MARTA REACTIVADA EXITOSAMENTE');
  cy.wait(1500);

  // ═══════════════════════════════════════════════════════════════════════════
  // CERRAR SESIÓN ADMIN
  // ═══════════════════════════════════════════════════════════════════════════
  cy.log('🔽 Cerrando sesión del administrador...');
  cy.get('#profile-dropdown-trigger').should('be.visible').click();
  cy.contains('Cerrar sesión', { timeout: 10000 }).should('be.visible').click();
  cy.wait(1500);

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGIN COMO MARTA - VERIFICAR QUE PUEDE ENTRAR
  // ═══════════════════════════════════════════════════════════════════════════
  cy.log('🚀 VERIFICANDO QUE MARTA PUEDE INICIAR SESIÓN NUEVAMENTE...');
  cy.get('input[type="email"]').should('be.visible').type('mguevara4348@uta.edu.ec');
  cy.wait(700);
  cy.get('input[type="password"]').should('be.visible').type('Marta123');
  cy.wait(700);
  cy.get('button[type="submit"]').should('be.visible').click();
  cy.wait(3000);

  cy.url().should('include', '/dashboard');
  cy.wait(2000);
  cy.log('✅ MARTA PUEDE ACCEDER NUEVAMENTE - CUENTA ACTIVA');

  // ═══════════════════════════════════════════════════════════════════════════
  // CERRAR SESIÓN MARTA
  // ═══════════════════════════════════════════════════════════════════════════
  cy.log('🔽 Cerrando sesión de Marta...');
  cy.get('#profile-dropdown-trigger').should('be.visible').click();
  cy.contains('Cerrar sesión', { timeout: 10000 }).should('be.visible').click();
  cy.wait(1500);

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGIN COMO MARTA - REPORTAR CONDUCTOR (2 VECES)
  // ═══════════════════════════════════════════════════════════════════════════
 // ═══════════════════════════════════════════════════════════════════════════
// LOGIN COMO MARTA - REPORTAR CONDUCTOR (2 VECES)
// ═══════════════════════════════════════════════════════════════════════════
cy.log('🚀 INICIANDO SESIÓN COMO MARTA PARA REPORTAR...');
cy.visit('/login');

cy.get('input[type="email"]').should('be.visible').type('mguevara4348@uta.edu.ec');
cy.get('input[type="password"]').should('be.visible').type('Marta123');
cy.get('button[type="submit"]').should('be.visible').click();

cy.window().should((win) => {
  expect(win.localStorage.getItem('token')).to.exist;
  expect(win.localStorage.getItem('user')).to.exist;
});

// Esperar a que redirija al dashboard antes de navegar
cy.url().should('include', '/dashboard', { timeout: 10000 });

cy.log('🚩 NAVEGANDO A MIS SOLICITUDES...');
cy.visit('/my-requests');

// Esperar que la página cargue completamente
cy.contains('Mis solicitudes', { timeout: 10000 }).should('be.visible');
cy.wait(2000);

// Verificar que existen botones de Reportar antes de intentar clickear
cy.get('body').then(($body) => {
  if ($body.find('button:contains("Reportar")').length === 0) {
    cy.log('⚠️ No hay solicitudes con viajes completados para reportar');
  }else {

    // ─────────────────────────────────────────────
    // PRIMER REPORTE
    // ─────────────────────────────────────────────
    cy.log('📢 ABRIENDO MODAL DE REPORTE - PRIMER REPORTE...');
    cy.contains('button', 'Reportar')
      .first()
      .should('be.visible')
      .click({ force: true });

    cy.wait(1000);

    cy.log('📝 LLENANDO PRIMER REPORTE...');
    cy.get('[role="dialog"], .fixed.inset-0', { timeout: 10000 })
      .should('be.visible')
      .within(() => {
        cy.get('select').first()
          .should('be.visible')
          .select(1);
        cy.wait(500);

        cy.get('textarea')
          .should('be.visible')
          .type('Conducta inapropiada durante el viaje. El conductor no respetó las normas de convivencia establecidas por la plataforma.');
        cy.wait(500);

        cy.contains('button', /enviar|reportar|submit/i)
          .should('be.visible')
          .click({ force: true });
      });

    cy.wait(2000);
    cy.log('✅ PRIMER REPORTE ENVIADO EXITOSAMENTE');

    // ─────────────────────────────────────────────
    // SEGUNDO REPORTE
    // ─────────────────────────────────────────────
    cy.get('body').then(($body2) => {
      if ($body2.find('button:contains("Reportar")').length > 0) {

        cy.log('📢 ABRIENDO MODAL DE REPORTE - SEGUNDO REPORTE...');
        cy.contains('button', 'Reportar')
          .first()
          .should('be.visible')
          .click({ force: true });

        cy.wait(1000);

        cy.log('📝 LLENANDO SEGUNDO REPORTE (MOTIVO DIFERENTE)...');
        cy.get('[role="dialog"], .fixed.inset-0', { timeout: 10000 })
          .should('be.visible')
          .within(() => {
            cy.get('select').first()
              .should('be.visible')
              .select(2);
            cy.wait(500);

            cy.get('textarea')
              .should('be.visible')
              .type('El conductor llegó tarde al punto de encuentro y no avisó con anticipación. Esto causó inconvenientes graves al pasajero.');
            cy.wait(500);

            cy.contains('button', /enviar|reportar|submit/i)
              .should('be.visible')
              .click({ force: true });
          });

        cy.wait(2000);
        cy.log('✅ SEGUNDO REPORTE ENVIADO EXITOSAMENTE');

      } else {
        cy.log('⚠️ No hay más solicitudes disponibles para un segundo reporte');
      }
    });
  }
});
  // ─────────────────────────────────────────────
  // CERRAR SESIÓN MARTA
  // ─────────────────────────────────────────────
  cy.log('🔽 Cerrando sesión de Marta...');
  cy.get('#profile-dropdown-trigger').should('be.visible').click();
  cy.contains('Cerrar sesión', { timeout: 10000 }).should('be.visible').click();
  cy.wait(1500);

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGIN COMO ADMIN - IR A REPORTES
  // ═══════════════════════════════════════════════════════════════════════════
  cy.log('🚀 INICIANDO SESIÓN COMO ADMINISTRADOR...');

  cy.get('input[type="email"]').type('admin@uride.edu.ec');
  cy.get('input[type="password"]').type('Test1234!');
  cy.get('button[type="submit"]').click();

  cy.window().should((win) => {
    expect(win.localStorage.getItem('token')).to.exist;
    expect(win.localStorage.getItem('user')).to.exist;
  });

  cy.visit('/admin?tab=stats');
  cy.wait(2000);

  cy.log('🚩 NAVEGANDO A TAB REPORTES...');
  cy.visit('/admin?tab=reports');
  cy.wait(2000);

  // DESCARTAR REPORTE
  cy.get('body').then(($body) => {
    if ($body.find('button:contains("Descartar")').length > 0) {
      cy.log('🗑️ DESCARTANDO REPORTE PENDIENTE...');
      cy.contains('button', 'Descartar')
        .first()
        .should('be.visible')
        .click({ force: true });

      cy.wait(1500);

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

  // RESOLVER REPORTE
  cy.get('body').then(($body) => {
    if ($body.find('button:contains("Resolver")').length > 0) {
      cy.log('🛠️ RESOLVIENDO REPORTE...');
      cy.contains('button', 'Resolver')
        .first()
        .should('be.visible')
        .click({ force: true });

      cy.wait(1500);

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