describe('Módulo de Viajes (Rides) - U-Ride', () => {
  it('Flujo completo: Login, Crear, Editar, Iniciar y Completar Viaje', () => {
    
    // ==========================================
    // 1. LOGIN
    // ==========================================
    cy.visit('/login'); 
    
    cy.intercept('POST', '**/auth/login').as('loginReq');

    // Llenar credenciales
    cy.get('input[type="email"], input[name="email"]').type('jfiallos7065@uta.edu.ec');
    cy.get('input[type="password"], input[name="password"]').type('Marlon182004@');

    // Clic en iniciar sesión
    cy.contains('button', /ingresar|iniciar sesi[oó]n|login/i).click();

    // Esperar a que el backend procese el login y redirija al dashboard
    cy.wait('@loginReq').its('response.statusCode').should('be.oneOf', [200, 201]);
    cy.url().should('not.include', '/login');

    // ==========================================
    // 1.5. MOCK DEL VEHÍCULO (Evita la redirección al perfil)
    // ==========================================
    // Engañamos al frontend haciéndole creer que el conductor ya tiene su auto registrado.
    cy.intercept('GET', '**/users/vehicles', {
      statusCode: 200,
      body: [
        { id: 'veh-1', plate: 'TBA-2004', brand: 'Mazda', model: 'Allegro', color: 'Plata' }
      ]
    }).as('mockVehicles');

    // ==========================================
    // 2. CREAR VIAJE
    // ==========================================
    cy.visit('/rides'); 
    
    // Abrir el modal de nuevo viaje
    cy.contains('button', /nuevo viaje/i).should('be.visible').click();
    
    // Llenar el formulario usando .select() para los combos
    cy.get('select').first().select('Campus Huachi'); // Asegúrate que 'Campus Huachi' exista en tus opciones
    cy.get('select').eq(1).select('Ficoa');           // Cambia 'Ficoa' por una zona real de tu array ZONAS_AMBATO

    cy.get('input[type="date"]').type('2026-12-31'); // Fecha futura
    cy.get('input[type="time"]').type('08:00');
    cy.get('input[type="number"]').first().clear().type('3'); // Asientos
    cy.get('input[type="number"]').eq(1).clear().type('1.50'); // Precio

    cy.contains('button', /publicar viaje/i).click();

    // Validar que aparezca la notificación de éxito
    cy.contains(/viaje publicado/i).should('be.visible');

    // ==========================================
    // 3. EDITAR VIAJE
    // ==========================================
    // Clic en el botón editar del viaje recién creado
    cy.contains('button', /editar/i).first().click();

    // Cambiamos el destino por otra zona válida
    cy.get('select').eq(1).select('Ingahurco'); // Cambia 'Ingahurco' por otra zona de tu array
    
    cy.contains('button', /actualizar viaje/i).click();
    cy.contains(/viaje actualizado/i).should('be.visible');

    // ==========================================
    // 4. INICIAR VIAJE (Desde la vista Mis Viajes)
    // ==========================================
    // Navegamos a la vista donde el conductor gestiona sus propios viajes
    cy.visit('/my-rides');
    
    // Iniciar el viaje
    cy.contains('button', /iniciar/i).first().click();
    cy.contains(/viaje iniciado/i).should('be.visible');

    // ==========================================
    // 5. COMPLETAR EL VIAJE
    // ==========================================
    // Una vez en curso, el botón cambia a Completar
    cy.contains('button', /completar/i).first().click();
    cy.contains(/viaje completado/i).should('be.visible');
    
  });
});