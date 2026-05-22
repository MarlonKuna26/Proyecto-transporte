/// <reference types="cypress" />

describe('Registro U-Ride', () => {

  it('Debe registrar un usuario y pasar a verificación', () => {

    cy.visit('/register')

    cy.get("input[type='text']")
      .type('Juan Perez')

    cy.get("input[type='email']")
      .type('juanito@uta.edu.ec')

    cy.get("input[type='password']").eq(0)
      .type('Password123')

    cy.get("input[type='password']").eq(1)
      .type('Password123')

    cy.get("button[type='submit']")
      .click()

    // Verifica que cambió al paso de verificación
    cy.contains('Código de verificación')

  })

  it('Debe mostrar error si el correo no es institucional', () => {

    cy.visit('/register')

    cy.get("input[type='text']")
      .type('Juan Perez')

    cy.get("input[type='email']")
      .type('juan@gmail.com')

    cy.get("input[type='password']").eq(0)
      .type('Password123')

    cy.get("input[type='password']").eq(1)
      .type('Password123')

    cy.get("button[type='submit']")
      .click()

    cy.contains('Solo se permiten correos institucionales')

  })

  it('Debe validar contraseñas diferentes', () => {

    cy.visit('/register')

    cy.get("input[type='text']")
      .type('Juan Perez')

    cy.get("input[type='email']")
      .type('juan@uta.edu.ec')

    cy.get("input[type='password']").eq(0)
      .type('Password123')

    cy.get("input[type='password']").eq(1)
      .type('Password456')

    cy.get("button[type='submit']")
      .click()

    cy.contains('Las contraseñas no coinciden')

  })

  it('Debe verificar el código y redirigir al login', () => {

    cy.visit('/register')

    cy.get("input[type='text']")
      .type('Juan Perez')

    cy.get("input[type='email']")
      .type('juanito@uta.edu.ec')

    cy.get("input[type='password']").eq(0)
      .type('Password123')

    cy.get("input[type='password']").eq(1)
      .type('Password123')

    cy.get("button[type='submit']")
      .click()

    // Ingresar código (simulado)
    cy.intercept('POST', '**/verify-email', {
  statusCode: 200,
  body: { success: true }
}).as('verifyEmail')

cy.get("input[placeholder='000000']")
  .type('123456')

cy.contains('Verificar email').click()

cy.wait('@verifyEmail')

cy.url().should('include', '/login')

  })

})