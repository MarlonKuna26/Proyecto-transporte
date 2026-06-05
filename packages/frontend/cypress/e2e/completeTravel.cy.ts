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
      .type('hvillavicencio8210@uta.edu.ec');
    cy.wait(700);

    cy.log('Escribiendo contraseña...');
    cy.get('input[type="password"]')
      .should('be.visible')
      .type('Josu123456');
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

    cy.log('🔽 Abriendo menú de usuario...');

    // Click en el botón del perfil
    cy.get('#profile-dropdown-trigger')
      .should('be.visible')
      .click();


    cy.contains('Cerrar sesión', { timeout: 10000 })
      .should('be.visible')
      .click();
    // Verifica redirección


    cy.log('Escribiendo email...');
    cy.get('input[type="email"]')
      .should('be.visible')
      .type('mguevara4348@uta.edu.ec');
    cy.wait(700);

    cy.log('Escribiendo contraseña...');
    cy.get('input[type="password"]')
      .should('be.visible')
      .type('Marta123');
    cy.wait(700);

    cy.log('Clickeando botón submit...');
    cy.get('button[type="submit"]')
      .should('be.visible')
      .click();
    cy.wait(3000);

    cy.url().should('include', '/dashboard');
    cy.wait(2000);
    cy.log('✅ Dashboard cargado');
    cy.log('📍 INGRESANDO A VIAJES...');

    cy.contains('Viajes').click();
    cy.url().should('include', '/rides');
    cy.get('select').first().should('be.visible');

    // ═══════════════════════════════════════════════════════════════════════════
    // FILTROS - CORREGIDO: destino es Ficoa, no Campus Ingahurco
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('📍 FILTRO ORIGEN: Campus Huachi');
    cy.contains('label', /origen/i)
      .closest('div')
      .find('select')
      .should('be.visible')
      .select('Campus Huachi');

    cy.wait(500);

    cy.log('📍 FILTRO DESTINO: Ficoa');
    cy.contains('label', /destino/i)
      .closest('div')
      .find('select')
      .should('be.visible')
      .select('Campus Ingahurco'); // ✅ CORREGIDO: el viaje creado tiene destino Ficoa

    cy.wait(1500);

    // ═══════════════════════════════════════════════════════════════════════════
    // SELECCIONAR TARJETA POR COSTO $0.8
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('🧾 Seleccionando tarjeta de viaje con costo $0,8...');
    cy.contains('$0,8')
      .closest('[class*="rounded-2xl"]')
      .should('be.visible')
      .click();

    cy.wait(1500);

    // ═══════════════════════════════════════════════════════════════════════════
    // VERIFICAR MODAL Y SOLICITAR
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('📦 Verificando modal...');
    cy.get('.fixed.inset-0', { timeout: 10000 }).should('be.visible');
    cy.wait(1000);

    cy.log('✋ Solicitando unirme al viaje...');
    cy.contains('Solicitar unirme al viaje')
      .should('be.visible')
      .click();

    cy.wait(1500);

    // ═══════════════════════════════════════════════════════════════════════════
    // SELECCIONAR EFECTIVO - esperar que el paso de pago esté visible
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('💵 Seleccionando pago en efectivo...');
    cy.contains('Efectivo', { timeout: 10000 })
      .should('be.visible')
      .click({ force: true });

    cy.wait(1500);

    // ═══════════════════════════════════════════════════════════════════════════
    // CONFIRMAR SOLICITUD
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('✅ Confirmando solicitud...');
    cy.contains('Confirmar y Solicitar', { timeout: 10000 })
      .should('be.visible')
      .click({ force: true });

    cy.wait(2000);

    // ═══════════════════════════════════════════════════════════════════════════
    // LOGIN PEPE - VERIFICAR SOLICITUD
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('🔽 Abriendo menú de usuario...');
    cy.get('#profile-dropdown-trigger').should('be.visible').click();
    cy.contains('Cerrar sesión', { timeout: 10000 }).should('be.visible').click();

    cy.get('input[type="email"]').should('be.visible').type('hvillavicencio8210@uta.edu.ec');
    cy.wait(700);
    cy.get('input[type="password"]').should('be.visible').type('Josu123456');
    cy.wait(700);
    cy.get('button[type="submit"]').should('be.visible').click();
    cy.wait(3000);

    cy.url().should('include', '/dashboard');
    cy.wait(2000);

    // ═══════════════════════════════════════════════════════════════════════════
    // NAVEGAR A MIS SOLICITUDES - CORREGIDO: hay que navegar explícitamente
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('📍 NAVEGANDO A MIS SOLICITUDES...');
    cy.visit('/my-requests'); // ✅ CORREGIDO: navegar explícitamente
    cy.wait(2000);
    cy.url().should('include', '/my-requests');

    // ═══════════════════════════════════════════════════════════════════════════
    // NAVEGAR A MIS VIAJES COMO PEPE
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('📍 NAVEGANDO A MIS VIAJES...');
    cy.visit('/my-rides');
    cy.wait(2000);
    cy.url().should('include', '/my-rides');
    cy.log('✅ Página "Mis viajes" cargada');
    // ═══════════════════════════════════════════════════════════════════════════
    // BUSCAR LA TARJETA DEL VIAJE CREADO
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('🔍 BUSCANDO TARJETA DEL VIAJE...');
    cy.get('.bg-white.rounded-2xl')
      .filter(':contains("Campus Huachi")')
      .filter(':contains("Ficoa")')
      .filter(':contains("Disponible")')
      .first()
      .as('rideCard')
      .should('be.visible');

    cy.wait(1000);

    // ═══════════════════════════════════════════════════════════════════════════
    // EXPANDIR SOLICITUDES
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('📋 ABRIENDO SOLICITUDES...');
    cy.get('@rideCard')
      .find('button')
      .contains('SOLICITUDES')
      .should('be.visible')
      .click({ force: true });

    cy.wait(1500);

    // ═══════════════════════════════════════════════════════════════════════════
    // ACEPTAR SOLICITUD DE MARTA
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('✅ ACEPTANDO SOLICITUD DE MARTA...');
    cy.get('@rideCard')
      .contains('button', 'ACEPTAR')
      .should('be.visible')
      .click({ force: true });

    cy.wait(2000);

    // Verificar que la solicitud fue aceptada
    cy.get('@rideCard')
      .contains('Aceptado')
      .should('be.visible');

    cy.log('✅ SOLICITUD ACEPTADA EXITOSAMENTE');

    cy.wait(1000);

    // ═══════════════════════════════════════════════════════════════════════════
    // INICIAR EL VIAJE
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('🚗 INICIANDO VIAJE...');
    cy.get('@rideCard')
      .find('button')
      .contains('INICIAR VIAJE')
      .should('be.visible')
      .click({ force: true });

    cy.wait(2000);

    // Verificar que el viaje quedó EN CURSO
    cy.get('@rideCard')
      .contains('En curso')
      .should('be.visible');

    cy.log('✅✅✅ VIAJE INICIADO EXITOSAMENTE ✅✅✅');

    // ═══════════════════════════════════════════════════════════════════════════
    // VER SEGUIMIENTO LIVE COMO PEPE (CONDUCTOR)
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('🗺️ ABRIENDO SEGUIMIENTO LIVE...');
    cy.get('@rideCard')
      .find('a')
      .contains('SEGUIMIENTO LIVE')
      .should('be.visible')
      .click({ force: true });

    cy.wait(2000);
    cy.url().should('include', '/tracking/');
    cy.log('✅ SEGUIMIENTO LIVE ABIERTO');

    cy.wait(2000);

    // ═══════════════════════════════════════════════════════════════════════════
    // CERRAR SESIÓN PEPE
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('🔽 Abriendo menú de usuario...');
    cy.get('#profile-dropdown-trigger')
      .should('be.visible')
      .click();

    cy.contains('Cerrar sesión', { timeout: 10000 })
      .should('be.visible')
      .click();

    cy.wait(1500);

    // ═══════════════════════════════════════════════════════════════════════════
    // LOGIN MARTA
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('🚀 INICIANDO SESIÓN COMO MARTA...');
    cy.get('input[type="email"]').should('be.visible').type('mguevara4348@uta.edu.ec');
    cy.wait(700);
    cy.get('input[type="password"]').should('be.visible').type('Marta123');
    cy.wait(700);
    cy.get('button[type="submit"]').should('be.visible').click();
    cy.wait(3000);

    cy.url().should('include', '/dashboard');
    cy.wait(2000);
    cy.log('✅ Dashboard cargado');

    // ═══════════════════════════════════════════════════════════════════════════
    // NAVEGAR A MIS SOLICITUDES
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('📍 NAVEGANDO A MIS SOLICITUDES...');
    cy.visit('/my-requests');
    cy.wait(2000);
    cy.url().should('include', '/my-requests');
    cy.log('✅ Página "Mis solicitudes" cargada');

    // ═══════════════════════════════════════════════════════════════════════════
    // BUSCAR TARJETA CON SOLICITUD ACEPTADA Y VER SEGUIMIENTO
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('🔍 BUSCANDO TARJETA DE SOLICITUD ACEPTADA...');
    cy.get('.bg-white.rounded-2xl')
      .filter(':contains("Campus Huachi")')
      .filter(':contains("Campus Ingahurco")')
      .filter(':contains("Aceptada")')
      .first()
      .as('requestCard')
      .should('be.visible');

    cy.wait(1000);

    cy.log('🗺️ ABRIENDO SEGUIMIENTO DESDE MIS SOLICITUDES...');
    cy.get('@requestCard')
      .find('a')
      .contains('Ver seguimiento')
      .should('be.visible')
      .click({ force: true });

    cy.wait(2000);
    cy.url().should('include', '/tracking/');
    cy.log('✅ SEGUIMIENTO ABIERTO COMO PASAJERO');

    cy.wait(2000);

    // ═══════════════════════════════════════════════════════════════════════════
    // REGRESAR A MIS VIAJES COMO PEPE Y COMPLETAR EL VIAJE
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('🔽 Cerrando sesión de Marta...');
    cy.get('#profile-dropdown-trigger')
      .should('be.visible')
      .click();

    cy.contains('Cerrar sesión', { timeout: 10000 })
      .should('be.visible')
      .click();

    cy.wait(1500);

    // LOGIN PEPE
    cy.log(' INICIANDO SESIÓN COMO PEPE...');
    cy.get('input[type="email"]').should('be.visible').type('hvillavicencio8210@uta.edu.ec');
    cy.wait(700);
    cy.get('input[type="password"]').should('be.visible').type('Josu123456');
    cy.wait(700);
    cy.get('button[type="submit"]').should('be.visible').click();
    cy.wait(3000);

    cy.url().should('include', '/dashboard');
    cy.wait(2000);
    cy.log('✅ Dashboard cargado');

    // ═══════════════════════════════════════════════════════════════════════════
    // NAVEGAR A MIS VIAJES
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('📍 NAVEGANDO A MIS VIAJES...');
    cy.visit('/my-rides');
    cy.wait(2000);
    cy.url().should('include', '/my-rides');

    // ═══════════════════════════════════════════════════════════════════════════
    // BUSCAR TARJETA EN CURSO Y COMPLETAR
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('🔍 BUSCANDO VIAJE EN CURSO...');
    cy.get('.bg-white.rounded-2xl')
      .filter(':contains("Campus Huachi")')
      .filter(':contains("Campus Ingahurco")')
      .filter(':contains("En curso")')
      .first()
      .as('rideCardInProgress')
      .should('be.visible');

    cy.wait(1000);

    cy.log('🏁 FINALIZANDO VIAJE...');
    cy.get('@rideCardInProgress')
      .find('button')
      .contains('COMPLETAR')
      .should('be.visible')
      .click({ force: true });

    cy.wait(2000);

    // Verificar que el viaje quedó COMPLETADO
    cy.get('.bg-white.rounded-2xl')
      .filter(':contains("Campus Huachi")')
      .filter(':contains("Campus Ingahurco")')
      .filter(':contains("Completado")')
      .first()
      .should('be.visible');

    cy.log('✅✅✅ VIAJE COMPLETADO EXITOSAMENTE ✅✅✅');
    cy.wait(1500);

    // ═══════════════════════════════════════════════════════════════════════════
    // CERRAR SESIÓN PEPE
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('🔽 Cerrando sesión de Pepe...');
    cy.get('#profile-dropdown-trigger')
      .should('be.visible')
      .click();

    cy.contains('Cerrar sesión', { timeout: 10000 })
      .should('be.visible')
      .click();

    cy.wait(1500);

    // ═══════════════════════════════════════════════════════════════════════════
    // LOGIN MARTA
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('🚀 INICIANDO SESIÓN COMO MARTA...');
    cy.get('input[type="email"]').should('be.visible').type('mguevara4348@uta.edu.ec');
    cy.wait(700);
    cy.get('input[type="password"]').should('be.visible').type('Marta123');
    cy.wait(700);
    cy.get('button[type="submit"]').should('be.visible').click();
    cy.wait(3000);

    cy.url().should('include', '/dashboard');
    cy.wait(2000);
    cy.log('✅ Dashboard cargado');

    // ═══════════════════════════════════════════════════════════════════════════
    // NAVEGAR A MIS SOLICITUDES
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('📍 NAVEGANDO A MIS SOLICITUDES...');
    cy.visit('/my-requests');
    cy.wait(2000);
    cy.url().should('include', '/my-requests');

    // ═══════════════════════════════════════════════════════════════════════════
    // BUSCAR TARJETA COMPLETADA Y ABRIR MODAL DE CALIFICACIÓN
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('🔍 BUSCANDO TARJETA DE SOLICITUD COMPLETADA...');
    cy.get('.bg-white.rounded-2xl')
      .filter(':contains("Campus Huachi")')
      .filter(':contains("Campus Ingahurco")')
      .first()
      .as('requestCard')
      .should('be.visible');

    cy.wait(1000);

    cy.log('⭐ ABRIENDO MODAL DE CALIFICACIÓN...');
    cy.get('@requestCard')
      .find('button')
      .contains('Calificar')
      .should('be.visible')
      .click({ force: true });

    cy.wait(1500);

    // ═══════════════════════════════════════════════════════════════════════════
    // SELECCIONAR 4 ESTRELLAS
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('⭐ SELECCIONANDO 4 ESTRELLAS...');
    cy.get('.fixed.inset-0', { timeout: 10000 })
      .should('be.visible')
      .within(() => {
        // Las estrellas son botones, seleccionar la 4ta
        cy.get('button')
          .filter(':has(svg polygon)')
          .eq(3) // índice 3 = 4ta estrella
          .should('be.visible')
          .click({ force: true });
      });

    cy.wait(1000);

    // Verificar que se seleccionaron 4 estrellas
    cy.get('.fixed.inset-0')
      .contains('Muy buen viaje')
      .should('be.visible');

    cy.log('✅ 4 ESTRELLAS SELECCIONADAS');

    // ═══════════════════════════════════════════════════════════════════════════
    // ESCRIBIR COMENTARIO
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('💬 ESCRIBIENDO COMENTARIO...');
    cy.get('.fixed.inset-0')
      .find('textarea')
      .should('be.visible')
      .click()
      .type('Excelente conductor, muy puntual y amable durante el viaje.');

    cy.wait(1000);
    cy.log('✅ COMENTARIO ESCRITO');

    // ═══════════════════════════════════════════════════════════════════════════
    // ENVIAR CALIFICACIÓN
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('📤 ENVIANDO CALIFICACIÓN...');
    cy.get('.fixed.inset-0')
      .find('button')
      .contains('Enviar calificación')
      .should('be.visible')
      .click({ force: true });

    cy.wait(2000);

    // Verificar que la calificación fue enviada
    cy.get('@requestCard')
      .contains('Calificado')
      .should('be.visible');

    cy.log(' CALIFICACIÓN ENVIADA EXITOSAMENTE ');


    // ═══════════════════════════════════════════════════════════════════════════
    // 🎉 ¡PRUEBA COMPLETADA EXITOSAMENTE!
    // ═══════════════════════════════════════════════════════════════════════════
    cy.log('🎉🎉🎉 TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE 🎉🎉🎉');
  });
});
