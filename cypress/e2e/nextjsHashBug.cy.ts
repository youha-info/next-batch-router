import { TEST_URL } from "../constants";

describe("Next.js hash bug", () => {
   
    it("Can't clear query when hash exists", () => {
        cy.visit(TEST_URL + "/tests?foo=bar#hash");

        cy.location("search").should("eq", "?foo=bar");
        cy.location("hash").should("eq", "#hash");
        cy.get("#query").should("have.text", JSON.stringify({ foo: "bar" }));

        // clear query
        cy.get("#clearQuery").first().click();

        /// THIS SEEMS TO BE A BUG OF NEXTJS.
        /// query can't be cleared if hash exists.
        cy.location("search").should("eq", "?foo=bar");
        cy.location("hash").should("eq", "#hash");
        cy.get("#query").should("have.text", JSON.stringify({ foo: "bar" }));
    });

    it("Next.js router has the problem", () => {
        cy.visit(TEST_URL + "/tests?foo=bar#hash");

        cy.location("search").should("eq", "?foo=bar");
        cy.location("hash").should("eq", "#hash");

        // clear query with Next.js router
        cy.get("#clearQueryWithNextjs").first().click();

        /// THIS SEEMS TO BE A BUG OF NEXTJS.
        /// query can't be cleared if hash exists.
        cy.location("search").should("eq", "?foo=bar");
        cy.location("hash").should("eq", "#hash");
    });

    it("clearing query and hash together works", () => {
        cy.visit(TEST_URL + "/tests?foo=bar#hash");

        cy.location("search").should("eq", "?foo=bar");
        cy.location("hash").should("eq", "#hash");
        cy.get("#query").should("have.text", JSON.stringify({ foo: "bar" }));

        // clear query works fine without bug.
        cy.get("#clearQueryAndHash").first().click();

        cy.location("search").should("eq", "");
        cy.location("hash").should("eq", "");
        cy.get("#query").should("have.text", JSON.stringify({}));
    });
});
