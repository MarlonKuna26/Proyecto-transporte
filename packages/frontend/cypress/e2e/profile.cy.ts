describe('Pruebas de Sistema - Perfil de Usuario', () => {

  const testUser = {
    id: 'test-user-id',
    email: 'test@uta.edu.ec',
    name: 'Usuario Test',
    role: 'STUDENT',
    isVerified: true,
    reputation: 5
  };

  const profile = {
    userId: testUser.id,
    email: testUser.email,
    name: testUser.name,
    role: testUser.role,
    phone: '0999999999',
    emergencyContact: 'Contacto',
    emergencyPhone: '0988888888'
  };

  const ratings = { ratings: [], average: 5, count: 0 };

  let vehiclesArr: any[] = [];

  beforeEach(() => {
    vehiclesArr = [];

    // 🔹 INTERCEPTS
    cy.intercept('GET', '**/users/profile**', {
      statusCode: 200,
      body: { data: profile }
    }).as('getProfile');

    cy.intercept('GET', '**/users/vehicles**', (req) => {
      req.reply({ statusCode: 200, body: { data: vehiclesArr } });
    }).as('getVehicles');

    cy.intercept('GET', '**/ratings/user/*', {
      statusCode: 200,
      body: { data: ratings }
    }).as('getRatings');

    cy.intercept('PUT', '**/users/profile', (req) => {
      Object.assign(profile, req.body);
      req.reply({ statusCode: 200, body: { data: { ...profile } } });
    }).as('updateProfile');

    cy.intercept('POST', '**/users/vehicles', (req) => {
      const created = { id: 'veh-' + Date.now(), ...req.body };
      vehiclesArr.push(created);
      req.reply({ statusCode: 200, body: { data: created } });
    }).as('createVehicle');

    // 🔹 LOGIN FAKE
    cy.visit('/profile', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', 'fake-token');
        win.localStorage.setItem('user', JSON.stringify(testUser));
      }
    });

    // 🔹 SINCRONIZACIÓN REAL
    cy.wait('@getProfile');
    cy.wait('@getVehicles');
    cy.wait('@getRatings');

    // 🔹 VALIDACIÓN CLAVE (evita redirección silenciosa)
    cy.contains(testUser.email).should('be.visible');
  });

  // ─────────────────────────────────────────────
  it('Debe cargar correctamente el perfil', () => {
    cy.contains('Completa tu perfil').should('be.visible');
    cy.contains('Información de la Cuenta').should('be.visible');
  });

  // ─────────────────────────────────────────────
  it('Debe permitir editar el perfil correctamente', () => {
    cy.contains('Editar perfil').click();

    cy.contains('label', 'Nombre')
      .parent()
      .find('input')
      .clear()
      .type('Usuario Editado');

    cy.get('input[name="phone"]').clear().type('0991234567');

    cy.contains('Guardar Cambios').click();

    cy.wait('@updateProfile');

    cy.contains('Perfil actualizado').should('exist');
  });

  // ─────────────────────────────────────────────
  it('Debe validar teléfono incorrecto', () => {
    cy.contains('Editar perfil').click();

    cy.get('input[name="phone"]').clear().type('12345');

    cy.contains('Guardar Cambios').click();

    cy.contains('El teléfono personal debe ser un número válido')
      .should('be.visible');
  });

  // ─────────────────────────────────────────────
  // ─────────────────────────────────────────────
it('Debe registrar un vehículo correctamente', () => {
  cy.contains('Mis Vehículos').scrollIntoView();

  cy.contains('+ Agregar').click();

  // ✅ Escribir directamente con .type() — el handler auto-inserta el guion
  // al llegar a 3 chars, así que tipamos sin guion y dejamos que lo formatee
  cy.get('input[name="plate"]').type('ABC1234');

  cy.get('select[name="brand"]').select(1);
  cy.get('input[name="model"]').type('Aveo');
  cy.get('select[name="color"]').select(1);
  cy.get('input[name="capacity"]').clear().type('4');

  cy.contains('Registrar Vehículo').click();

  cy.wait('@createVehicle');
  cy.wait('@getVehicles');

  cy.contains('Vehículo registrado').should('exist');
});

  // ─────────────────────────────────────────────
  it('Debe validar placa incorrecta', () => {
    cy.contains('+ Agregar').click();

    cy.get('input[name="plate"]').type('123-ABC');
    cy.get('select[name="brand"]').select(1);
    cy.get('input[name="model"]').type('Test');
    cy.get('select[name="color"]').select(1);
    cy.get('input[name="capacity"]').clear().type('4');

    cy.contains('Registrar Vehículo').click();

    cy.contains('La placa no es válida').should('be.visible');
  });

  // ─────────────────────────────────────────────
  it('Debe registrar dos vehículo correctamente', () => {
  cy.contains('Mis Vehículos').scrollIntoView();

  cy.contains('+ Agregar').click();

  // ✅ Escribir directamente con .type() — el handler auto-inserta el guion
  // al llegar a 3 chars, así que tipamos sin guion y dejamos que lo formatee
  cy.get('input[name="plate"]').type('ABC1234');

  cy.get('select[name="brand"]').select(1);
  cy.get('input[name="model"]').type('Aveo');
  cy.get('select[name="color"]').select(1);
  cy.get('input[name="capacity"]').clear().type('4');

  cy.contains('Registrar Vehículo').click();

  cy.wait('@createVehicle');
  cy.wait('@getVehicles');

  cy.contains('Vehículo registrado').should('exist');
  cy.contains('Mis Vehículos').scrollIntoView();

  cy.contains('+ Agregar').click();

  // 
  // al llegar a 3 chars, así que tipamos sin guion y dejamos que lo formatee
  cy.get('input[name="plate"]').type('TDF1890');

  cy.get('select[name="brand"]').select(1);
  cy.get('input[name="model"]').type('Aveo');
  cy.get('select[name="color"]').select(1);
  cy.get('input[name="capacity"]').clear().type('4');

  cy.contains('Registrar Vehículo').click();

  cy.wait('@createVehicle');
  cy.wait('@getVehicles');

  cy.contains('Vehículo registrado').should('exist');

  
});
 // ─────────────────────────────────────────────

});