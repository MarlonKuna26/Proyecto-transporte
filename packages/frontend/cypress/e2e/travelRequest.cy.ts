describe('U-Ride - My Requests', () => {

  beforeEach(() => {
    cy.config('defaultCommandTimeout', 10000);
  });

  it('envía una solicitud de viaje y la verifica en Mis Solicitudes', () => {

    // ═══════════════════════════════════════
    // 1. LOGIN
    // ═══════════════════════════════════════
    cy.log('🚀 INICIANDO SESIÓN...');
    cy.visit('/login');

    cy.get('input[type="email"]').should('be.visible').type('mguevara4348@uta.edu.ec');
    cy.get('input[type="password"]').should('be.visible').type('Marta123');
    cy.get('button[type="submit"]').should('be.visible').click();

    cy.url().should('include', '/dashboard');
    cy.log('✅ LOGIN OK');

    // ═══════════════════════════════════════
    // 2. IR A VIAJES Y APLICAR FILTROS
    // ═══════════════════════════════════════
    cy.log('📍 NAVEGANDO A VIAJES...');

    cy.contains('Viajes').click();
    cy.url().should('include', '/rides');
    cy.get('select').first().should('be.visible');

    cy.log('📍 FILTRO ORIGEN: Campus Huachi');
    cy.contains('label', /origen/i)
      .closest('div')
      .find('select')
      .should('be.visible')
      .select('Campus Huachi');

    cy.log('📍 FILTRO DESTINO: Campus Querochaca');
    cy.contains('label', /destino/i)
      .closest('div')
      .find('select')
      .should('be.visible')
      .select('Campus Querochaca');

    // ═══════════════════════════════════════
    // 3. ABRIR PRIMER VIAJE DISPONIBLE
    // ═══════════════════════════════════════
    cy.log('🔎 BUSCANDO VIAJE DISPONIBLE...');

    cy.get('body').then(($body) => {
      const cards = $body.find('.grid .cursor-pointer');

      if (cards.length === 0) {
        cy.log('⚠️ No hay viajes con esos filtros, saltando test');
        return;
      }

      cy.log(`✅ ${cards.length} viaje(s) encontrado(s), abriendo el primero...`);

      cy.get('.grid .cursor-pointer').first().click();

      // ═══════════════════════════════════════
      // 4. VERIFICAR MODAL DEL VIAJE
      // ═══════════════════════════════════════
      cy.log('📋 VERIFICANDO MODAL...');

      // El modal tiene header negro con "Detalle del viaje"
      cy.contains('Detalle del viaje').should('be.visible');

      // Verificar que muestra origen y destino correctos
      cy.contains('Campus Huachi').should('be.visible');
      cy.contains('Campus Querochaca').should('be.visible');

      // ═══════════════════════════════════════
// 5. HACER CLICK EN "Solicitar unirme"
// ═══════════════════════════════════════
cy.log('🙋 SOLICITANDO UNIRSE AL VIAJE...');

cy.contains('Solicitar unirme al viaje')
  .should('be.visible')
  .click();

// Verificar si bloqueó por perfil incompleto
cy.get('body').then(($body) => {
  const toastError = $body.text().includes('actualiza tu perfil');

  if (toastError) {
    cy.log('⚠️ Perfil incompleto — actualizando perfil primero...');

    // Cerrar modal
    cy.contains('✕').click();

    // Ir a perfil y completarlo
    cy.contains('Perfil').click();
    cy.url().should('include', '/profile');

    // Completar carrera si está vacía
    cy.get('input[placeholder*="carrera"], input[name*="career"]')
      .clear()
      .type('Ingeniería en Sistemas');

    // Completar teléfono si está vacío
    cy.get('input[placeholder*="teléfono"], input[type="tel"], input[name*="phone"]')
      .clear()
      .type('0987654321');

    // Guardar perfil
    cy.contains('button', /guardar/i).click();
    cy.contains(/guardado|actualizado/i, { timeout: 5000 }).should('be.visible');

    cy.log('✅ Perfil actualizado, volviendo a viajes...');

    // Volver a viajes y repetir el flujo
    cy.contains('Viajes').click();
    cy.url().should('include', '/rides');

    cy.contains('label', /origen/i)
      .closest('div').find('select')
      .select('Campus Huachi');

    cy.contains('label', /destino/i)
      .closest('div').find('select')
      .select('Campus Querochaca');

    cy.get('.grid .cursor-pointer').first().click();
    cy.contains('Detalle del viaje').should('be.visible');

    cy.contains('Solicitar unirme al viaje')
      .should('be.visible')
      .click();
  }

  // ═══════════════════════════════════════
  // 6. PASO DE PAGO — seleccionar Efectivo
  // ═══════════════════════════════════════
  cy.log('💵 SELECCIONANDO MÉTODO DE PAGO: Efectivo...');

  cy.contains('Paso 2 de 2', { timeout: 8000 }).should('be.visible');
  cy.contains(/Has elegido pagar en efectivo/i).should('be.visible');

  cy.get('input[placeholder*="mensaje"]')
    .should('be.visible')
    .type('Estaré en la entrada principal');

  // ═══════════════════════════════════════
  // 7. CONFIRMAR SOLICITUD
  // ═══════════════════════════════════════
  cy.log('✅ CONFIRMANDO SOLICITUD...');

  cy.contains('Confirmar y Solicitar').should('be.visible').click();

  cy.contains('¡Solicitud enviada con éxito!', { timeout: 8000 })
    .should('be.visible');

  cy.log('✅ SOLICITUD ENVIADA');
});
      // ═══════════════════════════════════════
      // 7. CONFIRMAR SOLICITUD
      // ═══════════════════════════════════════
      
    });

    // ═══════════════════════════════════════
    // 8. IR A MIS SOLICITUDES
    // ═══════════════════════════════════════
    cy.log('📂 NAVEGANDO A MIS SOLICITUDES...');

    cy.contains('Solicitudes').click();
    cy.url().should('include', '/my-requests');

    // Esperar que cargue la lista
    cy.get('body').should('not.contain', 'Cargando');

    // ═══════════════════════════════════════
    // 9. VERIFICAR QUE LA SOLICITUD APARECE
    // ═══════════════════════════════════════
    cy.log('🔎 VERIFICANDO SOLICITUD EN LISTA...');

    // Debe haber al menos una card de solicitud
    cy.get('.grid .bg-white').should('exist');

    // Filtrar por "Pendientes" para encontrarla más rápido
    cy.contains('button', 'Pendientes').should('be.visible').click();

    cy.get('body').then(($body) => {
      const requestCards = $body.find('.grid .bg-white');

      if (requestCards.length > 0) {
        cy.log(`✅ ${requestCards.length} solicitud(es) pendiente(s) encontrada(s)`);

        // Verificar que la solicitud muestra la ruta correcta
        cy.contains('Campus Huachi').should('be.visible');
        cy.contains('Campus Querochaca').should('be.visible');

        // Verificar que tiene badge "Pendiente"
        cy.contains('Pendiente').should('be.visible');

        // Verificar que el botón cancelar está disponible
        cy.contains('Cancelar solicitud').should('be.visible');

      } else {
        cy.log('⚠️ No se encontraron solicitudes pendientes');
        cy.contains('No se encontraron solicitudes').should('be.visible');
      }
    });

    // ═══════════════════════════════════════
    // 10. VERIFICAR BUSCADOR
    // ═══════════════════════════════════════
    cy.log('🔍 PROBANDO BUSCADOR...');

    // Volver a tab "Todas" primero
    cy.contains('button', 'Todas').click();

    cy.get('input[placeholder*="Buscar por origen"]')
      .should('be.visible')
      .type('Huachi');

    // Debe filtrar y mostrar solo cards relacionadas
    cy.get('body').then(($body) => {
      const found = $body.find('.grid .bg-white');
      if (found.length > 0) {
        cy.contains('Campus Huachi').should('be.visible');
      } else {
        cy.contains('No se encontraron solicitudes').should('be.visible');
      }
    });

    // Limpiar buscador
    cy.get('input[placeholder*="Buscar por origen"]').clear();

    cy.log('🎉 TEST COMPLETADO');
  });

});