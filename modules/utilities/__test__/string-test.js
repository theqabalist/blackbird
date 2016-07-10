const assert = require("assert");
const string = require("../string");

describe("string", function () {
    describe("#split", function () {
        it("should split at a token", function () {
            assert.deepEqual(string.split(":", "a:b:c"), ["a", "b", "c"]);
        });
    });
    describe("#trim", function () {
        it("should trim", function () {
            assert.equal(string.trim("   a "), "a");
        });
    });
    describe("#length", function () {
        it("should get length", function () {
            assert.equal(string.length("abc"), 3);
        });
    });
});