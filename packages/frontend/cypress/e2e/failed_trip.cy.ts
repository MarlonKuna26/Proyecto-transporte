/// <reference types="cypress" />

describe('Creación de Viaje - Validaciones (versión estable)', () => {
  const testUser = {
    id: 'test-user-id',
    email: 'hvillavicencio8210@uta.edu.ec',
    name: 'Heidi Villavicencio',
    role: 'STUDENT',
    isVerified: true,
    reputation: 5
  }

  const profile = {
    userId: testUser.id,
    email: testUser.email,
    name: testUser.name,
    role: testUser.role,
    phone: '0999999999',
    emergencyContact: 'Juan Padre',
    emergencyPhone: '0988888888'
  }

  const vehicle = {
    id: 'vehicle-test-id',
    ownerId: testUser.id,
    plate: 'TST-1234',
    brand: 'Toyota',
    model: 'Yaris',
    color: 'Rojo',
    year: 2023,
    capacity: 4,
    isActive: true
  }

  beforeEach(() => {
    Cypress.on('uncaught:exception', (err, runnable) => {
      return false
    })

    cy.intercept('GET', '**/users/profile**', {
      statusCode: 200,
      body: { data: profile }
    }).as('getProfile')

    cy.intercept('GET', '**/users/vehicles**', {
      statusCode: 200,
      body: { data: [vehicle] }
    }).as('getVehicles')

    cy.intercept('GET', '**/rides/my-rides**', {
      statusCode: 200,
      body: { data: [] }
    }).as('getMyRides')

    cy.intercept('POST', '**/rides**').as('createRide')

    cy.visit('/my-rides?create=true', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', 'fake-token')
        win.localStorage.setItem('user', JSON.stringify(testUser))
      }
    })

    cy.wait(['@getProfile', '@getVehicles', '@getMyRides'])

    cy.get('form').should('be.visible')
  })

  // 🔴 1. Formulario vacío no debe enviar
  it('Debe mostrar validación si se envía formulario vacío', () => {
    cy.get("form button[type='submit']").click()

    cy.get('@createRide.all').should('have.length', 0)

    cy.get("form").then($form => {
      expect($form[0].checkValidity()).to.be.false
    })
  })

  // 🔴 2. Vehículo obligatorio
  it('Debe requerir selección de vehículo', () => {
    cy.get("form button[type='submit']").click()

    cy.get("form").then($form => {
      expect($form[0].checkValidity()).to.be.false
    })
  })

  // 🔴 3. Zonas obligatorias
  it('Debe requerir zona de origen y destino', () => {
    cy.get("form select").first().select(vehicle.id)

    cy.get("form button[type='submit']").click()

    cy.contains(/zona|origen|destino|requerido/i).should('exist')
  })

  // 🔴 4. Fecha y hora obligatorias
  it('Debe requerir fecha y hora', () => {
    cy.get("form select").first().select(vehicle.id)
    cy.get("form select").eq(1).select(1)
    cy.get("form select").eq(2).select(1)

    cy.get("form button[type='submit']").click()

    cy.get("input[type='date']")
  .should(($input) => {
    expect(($input[0] as HTMLInputElement).validity.valid).to.eq(false)
  })

    cy.get("input[type='time']")
  .should(($input) => {
    const el = $input[0] as HTMLInputElement
    expect(el.validity.valid).to.eq(false)
  })
  })

  // 🔴 5. Asientos obligatorios
  it('Debe requerir número de asientos', () => {
    cy.get("form select").first().select(vehicle.id)
    cy.get("form select").eq(1).select(1)
    cy.get("form select").eq(2).select(1)

    cy.get("input[type='date']").type('2026-06-10')
    cy.get("input[type='time']").type('10:00')

    cy.get("input[type='number']").first().clear()

    cy.get("form button[type='submit']").click()

    cy.get("input[type='number']").first()
  .should(($input) => {
    expect(($input[0] as HTMLInputElement).validity.valid).to.eq(false)
  })
  })

  // 🔴 6. Asientos >= 1
  it('Debe validar que los asientos no sean menores a 1', () => {
    cy.get("form select").first().select(vehicle.id)
    cy.get("form select").eq(1).select(1)
    cy.get("form select").eq(2).select(1)

    cy.get("input[type='date']").type('2026-06-10')
    cy.get("input[type='time']").type('10:00')

    cy.get("input[type='number']")
      .first()
      .clear()
      .type('0')

    cy.get("input[type='number']")
      .first()
  .should(($input) => {
    expect(($input[0] as HTMLInputElement).validity.valid).to.eq(false)
  })
  })

  // 🔴 7. No debe enviar request si está incompleto
  it('No debe crear viaje si faltan campos', () => {
    cy.get("form select").first().select(vehicle.id)

    cy.get("form button[type='submit']").click()

    cy.get('@createRide.all').should('have.length', 0)
  })
})