/// <reference types="cypress" />
describe('Login U-Ride', () => {

  it('Debe iniciar sesión correctamente', () => {

    cy.visit('/login')

    cy.get("input[type='email']")
      .type('vsarco7769@uta.edu.ec')

    cy.get("input[type='password']")
      .type('Viviana_123')

    cy.get("button[type='submit']")
      .click()

    cy.url().should('include', '/dashboard')

  })

})