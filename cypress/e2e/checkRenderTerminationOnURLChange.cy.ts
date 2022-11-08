import { TEST_URL } from "../constants";

describe("batchRouterProvider", () => {
    it("Render terminates on URL change", () => {
        cy.visit(TEST_URL);
        cy.visit(TEST_URL + "/tests/checkRenderTerminationOnURLChange");

        cy.get("#counter").should("have.text", "1");

        cy.get("#checkRenderTerminationOnURLChange").first().click();

        cy.location("search").should("eq", "?foo=bar");
        cy.get("#query").should("have.text", JSON.stringify({ foo: "bar" }));

        // Provider is rendered 3 times, but because of termination, child is rendered only 2 times.
        cy.get("#counter").should("have.text", "2");

        cy.go("back");
        cy.location("pathname").should(
            "eq",
            "/tests/checkRenderTerminationOnURLChange"
        );
        cy.location("search").should("eq", "");
        cy.get("#query").should("have.text", JSON.stringify({}));

        cy.go("back");
        cy.location("pathname").should("eq", "/");
    });
});
