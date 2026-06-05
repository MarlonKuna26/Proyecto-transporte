it('debería mostrar la lista de usuarios en el panel de admin', () => {
  cy.visit('/login');

  cy.get('input[type="email"]').type('admin@uride.edu.ec');
  cy.get('input[type="password"]').type('Test1234!');
  cy.get('button[type="submit"]').click();

  // Esperar a redirigir al panel de administración
  cy.url().should('include', '/admin');

  cy.visit('/admin?tab=stats');
  cy.wait(1500);
cy.visit('/admin?tab=users');
  cy.contains('Usuarios').should('be.visible');
  cy.log('🔍 BUSCANDO A MARTA...');
    cy.get('input[placeholder*="Buscar usuarios"]')
      .should('be.visible')
      .type('marta');
    cy.wait(1500);

    // Buscar la tarjeta de Marta y click en Suspender
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
    // 7. LOGIN COMO MARTA - VERIFICAR SUSPENSIÓN
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('🚀 INICIANDO SESIÓN COMO MARTA (SUSPENDIDO)...');
    cy.get('input[type="email"]').should('be.visible').type('mguevara4348@uta.edu.ec');
    cy.wait(700);
    cy.get('input[type="password"]').should('be.visible').type('Marta123');
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

cy.get('input[type="email"]').type('admin@uride.edu.ec');
cy.get('input[type="password"]').type('Test1234!');

cy.get('button[type="submit"]').click();

// Esperar a redirigir al panel de administración
cy.url().should('include', '/admin');

// 🚫 SOLO UNA VISITA
cy.visit('/admin?tab=users');

// 🔥 ESPERA REAL (NO wait)
cy.contains('Usuarios', { timeout: 10000 }).should('be.visible');


// ═══════════════════════════════════════════════
// 🔍 BUSCAR A MARTA
// ═══════════════════════════════════════════════
cy.log('🔍 BUSCANDO A MARTA PARA REACTIVAR...');

cy.get('input[placeholder*="Buscar usuarios"]')
  .should('be.visible')
  .clear()
  .type('marta');


// ═══════════════════════════════════════════════
// ✅ REACTIVAR CUENTA
// ═══════════════════════════════════════════════
cy.log('✅ REACTIVANDO CUENTA DE MARTA...');

cy.contains('.glass-card, .bg-white.rounded-2xl', 'mguevara4348@uta.edu.ec')
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
    // 10. LOGIN COMO MARTA - VERIFICAR QUE PUEDE ENTRAR
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
    // 11. CERRAR SESIÓN MARTA - VOLVER A ADMIN
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('🔽 Cerrando sesión de Marta...');
    cy.get('#profile-dropdown-trigger').should('be.visible').click();
    cy.contains('Cerrar sesión', { timeout: 10000 }).should('be.visible').click();
    cy.wait(1500);
    
    cy.log('🚀 INICIANDO SESIÓN COMO ADMINISTRADOR ..');
   
 
  cy.get('input[type="email"]').type('admin@uride.edu.ec');
  cy.get('input[type="password"]').type('Test1234!');
  cy.get('button[type="submit"]').click();

  // Esperar a redirigir al panel de administración
  cy.url().should('include', '/admin');

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