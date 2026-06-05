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

  beforeEach(() => {
    let vehiclesArr: any[] = [];

    cy.intercept('GET', '**/users/profile**', { statusCode: 200, body: { data: profile } }).as('getProfile');
    cy.intercept('GET', '**/users/vehicles**', (req) => {
      req.reply({ statusCode: 200, body: { data: vehiclesArr } });
    }).as('getVehicles');
    cy.intercept('GET', `**/ratings/user/*`, { statusCode: 200, body: { data: ratings } }).as('getRatings');

    cy.intercept('PUT', '**/users/profile', (req) => {
      const body = req.body || {};
      // simulate update
      Object.assign(profile, body);
      req.reply({ statusCode: 200, body: { data: { ...profile } } });
    }).as('updateProfile');

    cy.intercept('POST', '**/users/vehicles', (req) => {
      const body = req.body || {};
      const created = { id: 'veh-' + Date.now(), ...body };
      vehiclesArr.push(created);
      req.reply({ statusCode: 200, body: { data: created } });
    }).as('createVehicle');

    cy.visit('/profile', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', 'fake-token');
        win.localStorage.setItem('user', JSON.stringify(testUser));
      }
    });

    cy.wait(['@getProfile', '@getVehicles', '@getRatings']);
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
      .find('input[type="text"]')
      .clear()
      .type('Usuario Test');

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

    cy.contains('El teléfono personal debe ser un número válido').should('exist');
  });

  // ─────────────────────────────────────────────
  it('Debe registrar un vehículo correctamente', () => {
    cy.contains('Mis Vehículos').scrollIntoView();

    cy.contains('+ Agregar').click();

    cy.get('input[name="plate"]').type('ABC-1234');

    cy.get('select[name="brand"]').select(1);
    cy.get('input[name="model"]').type('Aveo');
    cy.get('select[name="color"]').select(1);
    cy.get('input[name="capacity"]').clear().type('4');

    cy.contains('Registrar Vehículo').click();

    cy.wait('@createVehicle');
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

    cy.contains('La placa no es válida').should('exist');
  });

  // ─────────────────────────────────────────────
  it('Debe impedir registrar más de 2 vehículos', () => {
    cy.contains('Mis Vehículos').scrollIntoView();

    for (let i = 0; i < 3; i++) {
      cy.contains('+ Agregar').click();

      cy.get('input[name="plate"]').type(`ABC012${i}`);

      cy.get('select[name="brand"]').select(1);
      cy.get('input[name="model"]').type('Auto');
      cy.get('select[name="color"]').select(1);
      cy.get('input[name="capacity"]').clear().type('4');

      cy.contains('Registrar Vehículo').click();
      cy.wait('@createVehicle');
      // after creation the page fetches vehicles - wait for that to reflect
      cy.wait('@getVehicles');
    }

    cy.contains('Solo puedes registrar un máximo de 2 vehículos').should('exist');
  });

});