// ═══════════════════════════════════════════════════════════
//  U-Ride · Payments Page · Passenger E2E Test
//  Verifica navegación por los 5 filtros de estado
// ═══════════════════════════════════════════════════════════

describe('U-Ride – Pagos (Pasajero)', () => {

  const PASSENGER_EMAIL    = 'pepe@uta.edu.ec';
  const PASSENGER_PASSWORD = 'Pepe1234';
  const PAYMENT_CARD       = '.grid div.rounded-2xl.bg-white';

  // ─── Login + ir a Pagos ───────────────────────────────
  beforeEach(() => {
    cy.config('defaultCommandTimeout', 12000);

    cy.visit('/login');
    cy.get('input[type="email"]').type(PASSENGER_EMAIL);
    cy.get('input[type="password"]').type(PASSENGER_PASSWORD);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');

    cy.contains('Pagos').click();
    cy.url().should('include', '/payments');
  });

  // ─── Helper ───────────────────────────────────────────
  const applyFilterAndVerify = (label) => {
    cy.contains('button', label).click();

    // El botón debe quedar activo (bg-black)
    cy.contains('button', label).should('have.class', 'bg-black');

    // Hay cards o hay mensaje de vacío — nunca un estado roto
    cy.get('body').then(($body) => {
      if ($body.text().includes('No hay pagos')) {
        cy.log(`ℹ️  Filtro "${label}": sin resultados`);
      } else {
        cy.get(PAYMENT_CARD).should('have.length.gte', 1);
        cy.log(`✅ Filtro "${label}": ${$body.find(PAYMENT_CARD).length} card(s)`);
      }
    });
  };

  // ═══════════════════════════════════════════════════════
  //  Test único: navegar por los 5 filtros en orden
  // ═══════════════════════════════════════════════════════
  it('Navega por Todos → Pendientes → Completados → Reembolsados → Fallidos', () => {

    cy.log('📋 Todos');
    applyFilterAndVerify('Todos');

    cy.log('⏳ Pendientes');
    applyFilterAndVerify('Pendientes');

    cy.log('✔️  Completados');
    applyFilterAndVerify('Completados');

    cy.log('↩️  Reembolsados');
    applyFilterAndVerify('Reembolsados');

    cy.log('❌ Fallidos');
    applyFilterAndVerify('Fallidos');

    cy.log('🎉 Navegación por filtros completada');
  });

});