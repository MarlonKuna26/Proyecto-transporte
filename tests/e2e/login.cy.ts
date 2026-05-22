/// <reference types="cypress" />
describe('Login U-Ride', () => {

  it('Debe iniciar sesión correctamente', () => {

    cy.visit('/login')

    cy.get("input[type='email']")
      .type('jfiallos7065@uta.edu.ec')

    cy.get("input[type='password']")
      .type('Josu123456')

    cy.get("button[type='submit']")
      .click()

    cy.url().should('include', '/dashboard')

  })

})