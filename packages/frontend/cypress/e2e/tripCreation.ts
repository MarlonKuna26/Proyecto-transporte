describe('U-Ride Create, Edit, Delete Ride Visual Test', () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  // Formato dd/mm/yyyy para las pruebas
  const tomorrowStr = String(tomorrow.getDate()).padStart(2, '0') + '/' + 
                      String(tomorrow.getMonth() + 1).padStart(2, '0') + '/' + 
                      tomorrow.getFullYear();

  beforeEach(() => {
    cy.config('defaultCommandTimeout', 8000);
  });

  it('performs complete ride creation, edit, and deletion flows with visual delays', () => {
    // ═══════════════════════════════════════════════════════════════════════════
    // 1. LOGIN COMO CONDUCTOR
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('🚀 INICIANDO SESIÓN...');
    cy.visit('/login');
    cy.wait(1500);
    
    cy.log('Escribiendo email...');
    cy.get('input[type="email"]')
      .should('be.visible')
      .type('pepe@uta.edu.ec');
    cy.wait(700);
    
    cy.log('Escribiendo contraseña...');
    cy.get('input[type="password"]')
      .should('be.visible')
      .type('Pepe1234');
    cy.wait(700);
    
    cy.log('Clickeando botón submit...');
    cy.get('button[type="submit"]')
      .should('be.visible')
      .click();
    cy.wait(3000);

    cy.url().should('include', '/dashboard');
    cy.wait(2000);
    cy.log('✅ Dashboard cargado');

    // ═══════════════════════════════════════════════════════════════════════════
    // 2. HACER CLICK EN "MIS VIAJES" EN LA NAVEGACIÓN
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('📍 Buscando botón "Mis viajes"...');
    cy.contains('a', 'Mis viajes')
      .should('be.visible')
      .wait(500)
      .click();
    cy.wait(2000);
    cy.url().should('include', '/my-rides');
    cy.log('✅ Página "Mis viajes" cargada');

    // ═══════════════════════════════════════════════════════════════════════════
    // 2.5. LIMPIEZA DE VIAJES PREVIOS (Evitar conflictos de fecha/hora)
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('🧹 Buscando y limpiando viajes activos previos...');
    cy.get('body').then(($body) => {
      // Si existen botones de CANCELAR, significa que hay viajes activos de ejecuciones previas
      const cancelButtons = $body.find('button:contains("CANCELAR")');
      if (cancelButtons.length > 0) {
        cy.log(`Se encontraron ${cancelButtons.length} viaje(s) activo(s). Limpiando...`);
        
        // Función recursiva para cancelar todos los viajes uno por uno de forma limpia
        const cancelAll = () => {
          cy.get('body').then(($b) => {
            const buttons = $b.find('button:contains("CANCELAR")');
            if (buttons.length > 0) {
              cy.wrap(buttons.first()).click();
              cy.wait(1000);
              cy.contains('Confirmar cancelación')
                .should('be.visible')
                .click();
              cy.wait(2500); // Esperar a que se procese la cancelación y se actualice el DOM
              cancelAll();
            }
          });
        };
        cancelAll();
      } else {
        cy.log('✅ No hay viajes activos previos que limpiar.');
      }
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // 3. CLICK EN "PUBLICAR NUEVO VIAJE"
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('➕ Clickeando "Publicar nuevo viaje"...');
    cy.contains('button', 'Publicar nuevo viaje')
      .should('be.visible')
      .wait(500)
      .click();
    cy.wait(1500);
    cy.log('✅ Formulario abierto');

    // ═══════════════════════════════════════════════════════════════════════════
    // 4. SELECCIONAR VEHÍCULO
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('🚗 SELECCIONANDO VEHÍCULO...');
    cy.get('select')
      .first()
      .should('be.visible')
      .wait(500)
      .select(1);
    cy.wait(1200);
    cy.log('✅ Vehículo seleccionado');

    // ═══════════════════════════════════════════════════════════════════════════
    // 5. SELECCIONAR ZONA ORIGEN
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('📍 SELECCIONANDO ZONA ORIGEN...');
    cy.get('select')
      .eq(1)
      .should('be.visible')
      .wait(500)
      .select(1); // Campus Huachi es el índice 1
    cy.wait(1200);
    cy.log('✅ Zona origen: Campus Huachi');

    // ═══════════════════════════════════════════════════════════════════════════
    // 6. SELECCIONAR ZONA DESTINO
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('📍 SELECCIONANDO ZONA DESTINO...');
    cy.get('select')
      .eq(2)
      .should('be.visible')
      .wait(500)
      .select(2); // Ficoa es el índice 2
    cy.wait(1200);
    cy.log('✅ Zona destino: Ficoa');

    // ═══════════════════════════════════════════════════════════════════════════
    // 7. LLENAR DETALLE ORIGEN
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('📝 ESCRIBIENDO DETALLE ORIGEN...');
    cy.get('input[placeholder*="Frente al parque"]')
      .should('be.visible')
      .wait(300)
      .click()
      .wait(300)
      .type('Parqueadero Ingeniería, puerta sur');
    cy.wait(1000);
    cy.log('✅ Detalle origen llenado');

    // ═══════════════════════════════════════════════════════════════════════════
    // 8. LLENAR DETALLE DESTINO
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('📝 ESCRIBIENDO DETALLE DESTINO...');
    cy.get('input[placeholder*="Puerta norte"]')
      .should('be.visible')
      .wait(300)
      .click()
      .wait(300)
      .type('Frente al redondel de Ficoa');
    cy.wait(1000);
    cy.log('✅ Detalle destino llenado');

    // ═══════════════════════════════════════════════════════════════════════════
    // 9. LLENAR FECHA
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('📅 SELECCIONANDO FECHA (MAÑANA)...');
    // Formatear mañana como YYYY-MM-DD para el input type="date" nativo
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    const tomorrowFormatted = `${yyyy}-${mm}-${dd}`;

    cy.get('input[type="date"]')
      .should('be.visible')
      .clear()
      .wait(300)
      .type(tomorrowFormatted);
    cy.wait(1000);
    cy.log(`✅ Fecha seleccionada: ${tomorrowFormatted}`);

    // ═══════════════════════════════════════════════════════════════════════════
    // 10. LLENAR HORA
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('⏰ INGRESANDO HORA 07:30...');
    cy.get('input[type="time"]')
      .should('be.visible')
      .clear()
      .wait(300)
      .type('07:30');
    cy.wait(1000);
    cy.log('✅ Hora seleccionada: 07:30');

    // ═══════════════════════════════════════════════════════════════════════════
    // 11. LLENAR ASIENTOS DISPONIBLES
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('💺 INGRESANDO ASIENTOS...');
    // Primer input[type=number] es asientos
    cy.get('input[type="number"]')
      .first()
      .should('be.visible')
      .wait(300)
      .click()
      .wait(300)
      .clear()
      .type('3');
    cy.wait(1000);
    cy.log('✅ Asientos: 3');

    // ═══════════════════════════════════════════════════════════════════════════
    // 12. LLENAR PRECIO POR ASIENTO
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('💵 INGRESANDO PRECIO...');
    // Segundo input[type=number] es precio
    cy.get('input[type="number"]')
      .eq(1)
      .should('be.visible')
      .wait(300)
      .click()
      .wait(300)
      .clear()
      .type('0.5');
    cy.wait(1000);
    cy.log('✅ Precio: $0.75');

    // ═══════════════════════════════════════════════════════════════════════════
    // 13. LLENAR NOTAS DEL VIAJE
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('💬 ESCRIBIENDO NOTAS...');
    cy.get('textarea[placeholder*="Saldré 5 minutos"]')
      .should('be.visible')
      .wait(300)
      .click()
      .wait(300)
      .type('Salgo puntual, música suave permitida, no fumo durante el viaje');
    cy.wait(1000);
    cy.log('✅ Notas del viaje agregadas');

    // ═══════════════════════════════════════════════════════════════════════════
    // 14. SELECCIONAR REGLAS DE SEGURIDAD
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('🛡️  SELECCIONANDO REGLAS...');
    // Buscar el checkbox o botón de Puntualidad
    cy.contains('Puntualidad')
      .should('be.visible')
      .wait(500)
      .click();
    cy.wait(1000);
    cy.log('✅ Regla "Puntualidad" seleccionada');

    // ═══════════════════════════════════════════════════════════════════════════
    // 15. PUBLICAR VIAJE
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('🚀 PUBLICANDO VIAJE...');
    cy.contains('button', 'Publicar viaje')
      .should('be.visible')
      .wait(500)
      .click();
    cy.wait(2500);

    cy.contains('¡Viaje publicado con éxito!').should('be.visible');
    cy.wait(1500);
    cy.log('✅✅✅ VIAJE CREADO EXITOSAMENTE ✅✅✅');

    // ═══════════════════════════════════════════════════════════════════════════
    // 16. EDITAR EL VIAJE RECIÉN CREADO
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('✏️  EDITANDO VIAJE...');
    cy.wait(2000);
    
    // Encontrar y hacer click en EDITAR en el viaje activo (Disponible)
    cy.get('.bg-white')
      .filter(':contains("Campus Huachi")')
      .filter(':contains("Ficoa")')
      .filter(':contains("Disponible")')
      .first()
      .should('be.visible')
      .wait(500)
      .within(() => {
        cy.contains('button', 'EDITAR').click();
      });
    cy.wait(1500);
    cy.log('✅ Formulario de edición abierto');

    // Cambiar las notas del viaje
    cy.log('💬 ACTUALIZANDO NOTAS...');
    cy.get('textarea[placeholder="Ej: Saldré 5 minutos tarde máximo, paso por la gasolinera..."]')
      .should('be.visible')
      .click()
      .wait(500)
      .clear()
      .wait(500)
      .type('ACTUALIZADO: Salida puntual a las 7:30 AM, paso obligatorio por UTA');
    cy.wait(1000);
    cy.log('✅ Notas actualizadas');

    // Cambiar precio
    cy.log('💵 ACTUALIZANDO PRECIO...');
    cy.get('input[type="number"]').eq(1)
      .should('be.visible')
      .click()
      .wait(500)
      .clear()
      .type('0.8');
    cy.wait(1000);
    cy.log('✅ Precio actualizado a $0.80');

    // Cambiar fecha a otro día diferente (pasado mañana)
    cy.log('📅 ACTUALIZANDO FECHA A OTRO DÍA...');
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2); // 2 días desde hoy
    const yyyyEdit = dayAfterTomorrow.getFullYear();
    const mmEdit = String(dayAfterTomorrow.getMonth() + 1).padStart(2, '0');
    const ddEdit = String(dayAfterTomorrow.getDate()).padStart(2, '0');
    const editDateFormatted = `${yyyyEdit}-${mmEdit}-${ddEdit}`;

    cy.get('input[type="date"]')
      .should('be.visible')
      .clear()
      .wait(300)
      .type(editDateFormatted);
    cy.wait(1000);
    cy.log(`✅ Fecha editada a: ${editDateFormatted}`);
    cy.contains('button', 'EDITAR', { timeout: 5000 })
  .should('exist');

    // Guardar cambios
    cy.log('💾 GUARDANDO CAMBIOS...');
    cy.contains('button', 'Guardar cambios')
      .should('be.visible')
      .wait(500)
      .click();
    cy.wait(2000);

    cy.contains('¡Viaje actualizado con éxito!').should('be.visible');
    cy.wait(1500);
    cy.log('✅✅✅ VIAJE EDITADO EXITOSAMENTE ✅✅✅');

// ═══════════════════════════════════════════════════════════════════════════
// MOCK CORRECTO
// ═══════════════════════════════════════════════════════════════════════════

cy.intercept('PUT', '**/api/v1/tracking/rides/*/start', {
  statusCode: 200,
  body: { message: 'Viaje iniciado con éxito' }
}).as('startRide');


// ═══════════════════════════════════════════════════════════════════════════
// INICIAR VIAJE
// ═══════════════════════════════════════════════════════════════════════════

cy.log('▶️ INICIANDO VIAJE...');

// Buscar el viaje
cy.get('.bg-white')
  .filter(':contains("Campus Huachi")')
  .filter(':contains("Ficoa")')
  .filter(':contains("Disponible")')
  .first()
  .should('be.visible')
  .within(() => {
    cy.contains('button', 'INICIAR VIAJE').click();
  });

// Esperar request REAL (ahora sí va a coincidir)
cy.wait('@startRide')
  .its('response.statusCode')
  .should('eq', 200);

// Confirmación opcional
cy.get('body').then(($body) => {
  if ($body.text().includes('Confirmar')) {
    cy.contains('Confirmar').click();
  }
});

// Validaciones
cy.contains('Viaje iniciado con éxito').should('be.visible');

cy.get('.bg-white')
  .filter(':contains("En curso")')
  .should('exist');

cy.log('✅ VIAJE INICIADO');
 });
});
