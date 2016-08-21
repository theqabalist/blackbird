const R = require("ramda");
const {expect} = require("chai");
const {parallel, lib} = require("../loader");
const {Right, Left} = require("fantasy-eithers");
const {
    responder,
    decoder,
    encoder,
    parsePrio,
    ensurePrio,
    omitPrio,
    filterDecodingResponders,
    isSuitableMediaEncoderPair
} = parallel(require, __filename);
const {media} = lib(require, "./media");

// const {response: {response, statusCodes}} = lib(require, "./core");

describe("negotiator", () => {
    describe("parsePrio", () => {
        it("should parse the priority of a media type", () => {
            expect(parsePrio(media("text", "html", {q: "0.8"})))
                .to.eql(Right(media("text", "html", {q: 0.8})));
        });
        it("should reject invalid priorities", () => {
            expect(parsePrio(media("text", "html", {q: "a"})))
                .to.be.an.instanceof(Left);
        });
    });
    describe("ensurePrio", () => {
        it("should add priority to media types where it is unspecified", () => {
            expect(ensurePrio(media("text", "html", {encoding: "utf8"})))
                .to.eql(media("text", "html", {encoding: "utf8", q: "1"}));
        });
        it("should do nothing when a quality is already present", () => {
            expect(ensurePrio(media("text", "html", {q: "0.8"})))
                .to.eql(media("text", "html", {q: "0.8"}));
        });
    });
    describe("omitPrio", () => {
        it("should strip priority", () => {
            expect(omitPrio(media("text", "html", {q: 0.8})))
                .to.eql(media("text", "html", {}));
        });
    });
    describe("filterDecodingResponders", () => {
        const responders = [
            responder(null, R.identity, encoder(media("text", "html", {}))),
            responder(
                decoder(media("text", "plain", {}), R.identity),
                encoder(media("text", "html", {}), R.identity),
                null
            )
        ];
        it("if no content type, only responders with no decoder should be selected", () => {
            expect(filterDecodingResponders(null, responders))
                .to.eql(Right([responders[0]]));
        });
        it("if a content type is set, only responders that can decode that type should be selected", () => {
            expect(filterDecodingResponders(media("text", "plain", {encoding: "utf8"}), responders))
                .to.eql(Right([responders[1]]));
        });
        it("if a content type is set but there is no valid decoder for that type but there are responders" +
                "that do not decode input, those may be selected", () => {
            expect(filterDecodingResponders(media("text", "xml", {}), responders))
                .to.eql(Right([responders[0]]));
        });
        it("if no handlers for the content type exist unsupported media type should be returned", () => {
            expect(filterDecodingResponders(media("text", "xml", {}), [responders[1]]))
                .to.be.instanceof(Left);
        });
    });
    describe("isSuitableMediaEncoderPair", () => {
        const html = media("text", "html", {});
        const xml = media("text", "xml", {});
        it("should return true when the encoder is null", () => {
            expect(isSuitableMediaEncoderPair([html, responder(null, null, null)]))
                .to.equal(true);
        });
        it("should return true when the encoder matches", () => {
            expect(isSuitableMediaEncoderPair([html, responder(null, encoder(html, null), null)]))
                .to.equal(true);
        });
        it("should return false when the encoder does not match", () => {
            expect(isSuitableMediaEncoderPair([xml, responder(null, encoder(html, null), null)]))
                .to.equal(false);
        });
    });
    describe("selectEncodingResponder", () => {

    });
});
