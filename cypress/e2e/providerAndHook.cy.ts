/// <reference types="cypress" />

import { TEST_URL } from "../constants";

describe("useBatchRouter", () => {
    it("throws error if there is no provider", () => {
        cy.visit(TEST_URL + "/tests/errorOnNoProvider");
        cy.get("#caught_error")
            .first()
            .should(
                "have.text",
                "Error: Could not find BatchRouter. Please ensure the component is wrapped in a <BatchRouterProvider>"
            );
    });
});
