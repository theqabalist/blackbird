const {expect} = require("chai");
const BB = require("../../index");

const getFixture = require("../../multipart/__tests__/getFixture");

describe("extensions/multipart", function () {
    beforeEach(function () {
        BB.extend(require("../multipart"));
    });

    let message;

    describe("a multipart message", function () {
        beforeEach(function () {
            message = new BB.Message(
        getFixture("content_type_no_filename"),
                {"Content-Type": "multipart/form-data; boundary=AaB03x"}
      );
        });

        it("knows its multipart boundary", function () {
            expect(message.multipartBoundary).to.equal("AaB03x");
        });

        it("parses its content correctly", function () {
            return message.parseContent().then(function (params) {
                expect(params.text).to.equal("contents");
            });
        });
    });

    describe("a message that is part of a multipart message", function () {
        beforeEach(function () {
            message = new BB.Message(
        "contents",
                {"Content-Disposition": "form-data; name=\"files\"; filename=\"escape \\\"quotes\""}
      );
        });

        it("knows its name", function () {
            expect(message.name).to.equal("files");
        });

        it("knows its filename", function () {
            expect(message.filename).to.equal("escape \"quotes");
        });
    });
});