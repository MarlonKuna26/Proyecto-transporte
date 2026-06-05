describe('U-Ride - Filter Rides', () => {

  beforeEach(() => {
    cy.config('defaultCommandTimeout', 10000);
  });

  it('filters rides safely with visual steps', () => {

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
    // 2. NAVEGAR A VIAJES
    // ═══════════════════════════════════════
    cy.log('📍 INGRESANDO A VIAJES...');

    cy.contains('Viajes').click();
    cy.url().should('include', '/rides');
    cy.get('select').first().should('be.visible');

    // ═══════════════════════════════════════
    // 3. FILTRO ORIGEN → Campus Huachi
    // ═══════════════════════════════════════
    cy.log('📍 FILTRO ORIGEN: Campus Huachi');

    cy.contains('label', /origen/i)
      .closest('div')
      .find('select')
      .should('be.visible')
      .select('Campus Huachi');

    // ═══════════════════════════════════════
    // 4. FILTRO DESTINO → Campus Querochaca
    // ═══════════════════════════════════════
    cy.log('📍 FILTRO DESTINO: Campus Querochaca');

    cy.contains('label', /destino/i)
      .closest('div')
      .find('select')
      .should('be.visible')
      .select('Campus Querochaca');

    // ═══════════════════════════════════════
    // 5. FILTRO FECHA
    // ═══════════════════════════════════════
    cy.log('📅 FILTRO FECHA');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    const date = `${yyyy}-${mm}-${dd}`;

    cy.get('input[type="date"]').should('be.visible').clear().type(date);

    // ═══════════════════════════════════════
    // 6. VALIDACIÓN DE RESULTADOS
    // ═══════════════════════════════════════
    cy.log('🔎 VALIDANDO RESULTADOS...');

    cy.get('body').then(($body) => {

      const rideCards = $body.find('.grid .cursor-pointer');

      if (rideCards.length > 0) {
        cy.log(`✅ Viajes encontrados: ${rideCards.length}`);
        cy.get('.grid .cursor-pointer').should('exist').and('be.visible');
      } else {
        cy.log('⚠️ No hay resultados con filtros');
        cy.contains('No se encontraron viajes').should('be.visible');
        cy.contains(/quitar filtros/i).should('be.visible');
      }
    });

    // ═══════════════════════════════════════
    // 7. LIMPIAR FILTROS
    // ═══════════════════════════════════════
    cy.log('🧹 LIMPIANDO FILTROS');

    cy.contains(/limpiar filtros/i).should('be.visible').click();

    cy.get('input[type="date"]').should('have.value', '');
    cy.get('select').first().should('have.value', '');

    cy.log('🎉 TEST COMPLETADO');
  });

});