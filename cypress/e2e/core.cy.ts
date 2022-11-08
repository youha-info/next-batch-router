import { TEST_URL } from "../constants";

describe("batchRouter basic cases", () => {
    it("single push", () => {
        cy.visit(TEST_URL);
        cy.visit(TEST_URL + "/tests");
        cy.get("#singlePush").first().click();

        cy.location("search").should("eq", "?foo=bar");
        cy.get("#query").should("have.text", JSON.stringify({ foo: "bar" }));

        cy.go("back");
        cy.location("pathname").should("eq", "/tests");
        cy.location("search").should("eq", "");
        cy.get("#query").should("have.text", JSON.stringify({}));

        cy.go("back");
        cy.location("pathname").should("eq", "/");
    });

    it("single replace", () => {
        cy.visit(TEST_URL);
        cy.visit(TEST_URL + "/tests");
        cy.get("#singleReplace").first().click();

        cy.location("search").should("eq", "?foo=bar");
        cy.get("#query").should("have.text", JSON.stringify({ foo: "bar" }));

        cy.go("back");
        cy.location("pathname").should("eq", "/");
    });

    it("multiple push", () => {
        cy.visit(TEST_URL);
        cy.visit(TEST_URL + "/tests");
        cy.get("#multiplePush").first().click();

        checkF1F2F3Pushed();
    });

    it("multiple replace", () => {
        cy.visit(TEST_URL);
        cy.visit(TEST_URL + "/tests");
        cy.get("#multipleReplace").first().click();

        cy.location("search").should("eq", "?f1=1&f2=2&f3=3");
        cy.get("#query").should(
            "have.text",
            JSON.stringify({ f1: "1", f2: "2", f3: "3" })
        );

        cy.go("back");
        cy.location("pathname").should("eq", "/");
    });

    it("push replace mixed results in push", () => {
        cy.visit(TEST_URL);
        cy.visit(TEST_URL + "/tests");
        cy.get("#multipleMixed").first().click();

        checkF1F2F3Pushed();
    });
});

function checkF1F2F3Pushed() {
    cy.location("search").should("eq", "?f1=1&f2=2&f3=3");
    cy.get("#query").should(
        "have.text",
        JSON.stringify({ f1: "1", f2: "2", f3: "3" })
    );

    cy.go("back");
    cy.location("pathname").should("eq", "/tests");
    cy.location("search").should("eq", "");
    cy.get("#query").should("have.text", JSON.stringify({}));

    cy.go("back");
    cy.location("pathname").should("eq", "/");
}

describe("batchRouter useEffectMultiplePush", () => {
    it("multiple component useEffect", () => {
        cy.visit(TEST_URL);
        cy.visit(TEST_URL + "/tests/useEffectMultiplePush");
        cy.location("search").should("eq", "");
        cy.get("#query").should("have.text", JSON.stringify({}));

        cy.wait(100);
        cy.location("search").should("eq", "?f1=1&f2=2&f3=3");
        cy.get("#query").should(
            "have.text",
            JSON.stringify({ f1: "1", f2: "2", f3: "3" })
        );

        cy.go("back");
        cy.location("pathname").should("eq", "/tests/useEffectMultiplePush");
        cy.location("search").should("eq", "");
        cy.get("#query").should("have.text", JSON.stringify({}));

        cy.go("back");
        cy.location("pathname").should("eq", "/");
    });
});

describe("batchRouter outsideRenderLoop", () => {
    it("setTimeout", () => {
        cy.visit(TEST_URL);
        cy.visit(TEST_URL + "/tests");
        cy.get("#pushWithSetTimeout").first().click();

        cy.wait(500 + 50);

        checkF1F2F3Pushed();
    });

    it("nextTick", () => {
        cy.visit(TEST_URL);
        cy.visit(TEST_URL + "/tests");
        cy.get("#pushWithNextTick").first().click();

        cy.wait(50);

        checkF1F2F3Pushed();
    });

    it("queueMicrotask", () => {
        cy.visit(TEST_URL);
        cy.visit(TEST_URL + "/tests");
        cy.get("#pushWithQueueMicrotask").first().click();

        cy.wait(50);

        checkF1F2F3Pushed();
    });
});

describe("batchRouter functional update", () => {
    it("clear query", () => {
        cy.visit(TEST_URL);
        cy.visit(TEST_URL + "/tests?f1=1&f2=2&f3=3");

        cy.location("search").should("eq", "?f1=1&f2=2&f3=3");
        cy.get("#query").should(
            "have.text",
            JSON.stringify({ f1: "1", f2: "2", f3: "3" })
        );

        cy.get("#clearQuery").first().click();

        cy.location("search").should("eq", "");
        cy.get("#query").should("have.text", JSON.stringify({}));
    });

    it("append to string", () => {
        cy.visit(TEST_URL);
        cy.visit(TEST_URL + "/tests?foo=bar");

        cy.location("search").should("eq", "?foo=bar");
        cy.get("#query").should("have.text", JSON.stringify({ foo: "bar" }));

        cy.get("#appendFoo").first().click();

        cy.location("search").should("eq", "?foo=barbar");
        cy.get("#query").should("have.text", JSON.stringify({ foo: "barbar" }));
    });
});

describe("batchRouter array value handling", () => {
    it("clear query", () => {
        cy.visit(TEST_URL + "/tests");

        cy.get("#setArrayValues").first().click();

        cy.location("search").should("eq", "?a=1&a=2&b=3&b=4");
        cy.get("#query").should(
            "have.text",
            JSON.stringify({ a: ["1", "2"], b: ["3", "4"] })
        );
    });

    it("functional update of array value", () => {
        cy.visit(TEST_URL + "/tests?a=1&a=2");

        cy.get("#arrayValueFunctionalUpdate").first().click();

        cy.location("search").should("eq", "?a=1&a=2&a=10&a=11");
        cy.get("#query").should(
            "have.text",
            JSON.stringify({ a: ["1", "2", "10", "11"] })
        );
    });
});

describe("batchRouter hash behavior", () => {
    it("hash is preserved", () => {
        cy.visit(TEST_URL);
        cy.visit(TEST_URL + "/tests#hash");

        cy.location("hash").should("eq", "#hash");

        cy.get("#singlePush").first().click();

        cy.location("search").should("eq", "?foo=bar");
        cy.get("#query").should("have.text", JSON.stringify({ foo: "bar" }));

        // hash is preserved!
        cy.location("hash").should("eq", "#hash");

        cy.go("back");
        cy.location("pathname").should("eq", "/tests");
        cy.location("search").should("eq", "");
        cy.location("hash").should("eq", "#hash");
        cy.get("#query").should("have.text", JSON.stringify({}));

        cy.go("back");
        cy.location("pathname").should("eq", "/");
        cy.location("hash").should("eq", "");
    });

    it("last hash is used", () => {
        cy.visit(TEST_URL + "/tests");

        cy.get("#setHashTogether").first().click();

        cy.location("search").should("eq", "?f1=1&f2=2&f3=3");
        cy.get("#query").should(
            "have.text",
            JSON.stringify({ f1: "1", f2: "2", f3: "3" })
        );

        cy.location("hash").should("eq", "#h3");
    });

    it("hash is removed if last was null", () => {
        cy.visit(TEST_URL + "/tests");

        cy.get("#setHashWithLastNull").first().click();

        cy.location("search").should("eq", "?f1=1&f2=2&f3=3");
        cy.get("#query").should(
            "have.text",
            JSON.stringify({ f1: "1", f2: "2", f3: "3" })
        );

        cy.location("hash").should("eq", "");
    });

    it("hash is removed if last was empty", () => {
        cy.visit(TEST_URL + "/tests");

        cy.get("#setHashWithLastEmpty").first().click();

        cy.location("search").should("eq", "?f1=1&f2=2&f3=3");
        cy.get("#query").should(
            "have.text",
            JSON.stringify({ f1: "1", f2: "2", f3: "3" })
        );

        cy.location("hash").should("eq", "");
    });
});

describe("batchRouter as behavior", () => {
    it("query and URL can be different", () => {
        cy.visit(TEST_URL);
        cy.visit(TEST_URL + "/tests");

        cy.get("#testAs").first().click();

        cy.get("#query").should("have.text", JSON.stringify({ q: "1" }));
        cy.location("search").should("eq", "?a=2");
    });

    it("query state can be hidden", () => {
        cy.visit(TEST_URL);
        cy.visit(TEST_URL + "/tests");

        // push
        cy.get("#hideQueryFromURL").first().click();

        cy.get("#query").should("have.text", JSON.stringify({ q: "1" }));
        cy.location("search").should("eq", "");

        // changing other params doesn't erase it
        cy.get("#singlePush").first().click();

        cy.get("#query").should(
            "have.text",
            JSON.stringify({ q: "1", foo: "bar" })
        );
        cy.location("search").should("eq", "?foo=bar");
    });

    it("only URL can be changed", () => {
        cy.visit(TEST_URL + "/tests");

        cy.get("#onlyChangeAs").first().click();

        cy.get("#query").should("have.text", JSON.stringify({}));
        cy.location("search").should("eq", "?a=2");
    });

    it("as.query and as.hash is separately defaulted to href", () => {
        cy.visit(TEST_URL + "/tests");

        cy.get("#asAttributesDefaultsToQuery").first().click();

        cy.get("#query").should(
            "have.text",
            JSON.stringify({ q: "1", a: "3" })
        );
        cy.location("search").should("eq", "?a=2&b=4");
        cy.location("hash").should("eq", "#hash");
    });

    it("as.query supports functional update", () => {
        cy.visit(TEST_URL + "/tests?a=2");

        cy.get("#functionalUpdateOnAs").first().click();

        cy.get("#query").should(
            "have.text",
            JSON.stringify({ a: "2", q: "1" })
        );
        cy.location("search").should("eq", "?a=2append");
    });
});

describe("edge cases", () => {
    it("query and URL can be different", () => {
        cy.visit(TEST_URL);
        cy.visit(TEST_URL + "/tests?foo=bar#hash");

        cy.get("#emptyArgs").first().click();

        cy.get("#query").should("have.text", JSON.stringify({ foo: "bar" }));
        cy.location("search").should("eq", "?foo=bar");
        cy.location("hash").should("eq", "#hash");

        // no change not added to history
        cy.go("back");
        cy.location("pathname").should("eq", "/");
    });
});
