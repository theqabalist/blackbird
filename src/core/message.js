const R = require("ramda");


function Context(request, store) {
    let bodyConsumed = false;
    this.socket = request.socket;
    this.httpVersion = request.httpVersion;
    this.method = request.method;
    this.url = request.url;
    this.headers = request.headers;
    this.store = store || {};

    this.isBodyConsumed = () => bodyConsumed;
    this.consumeBody = (cont) => {
        if (bodyConsumed) {
            throw new Error("Body has already been consumed");
        }
        bodyConsumed = true;
        cont(request);
    };
}

const context = R.construct(Context);

const statusCodeLens = R.lensProp("statusCode");
const headersLens = R.lensProp("headers");
const bodyLens = R.lensProp("body");

const inflateBufferBody = (buffer) => ({
    statusCode: 200,
    headers: {"content-type": "application/octet-stream"},
    body: buffer
});

const bufferFromUtf8 = R.compose(R.curry, R.flip, R.nAry(2))(Buffer.from)("utf-8");

const inflateStringBody = (string) => ({
    statusCode: 200,
    headers: {"content-type": "text/plain; charset=utf-8"},
    body: bufferFromUtf8(string)
});

const statusCodeView = R.view(statusCodeLens);
const headersView = R.view(headersLens);
const bodyView = R.view(bodyLens);

const isStringMap = R.compose(R.all(R.is(String)), R.values);
const statusCodeIsNumber = R.compose(R.is(Number), statusCodeView);
const headersIsStringMap = R.compose(isStringMap, headersView);
const headersIsUndefined = R.compose(R.isNil, headersView);
const bodyIsBuffer = R.compose(R.is(Buffer), bodyView);

const isConformingResponse = R.allPass([
    R.complement(R.isNil),
    statusCodeIsNumber,
    R.anyPass([headersIsUndefined, headersIsStringMap]),
    bodyIsBuffer
]);

const malformedResponse = {
    statusCode: 500,
    headers: {"content-type": "text/plain; charset=utf-8"},
    body: bufferFromUtf8("App produced a malformed response object")
};

const coerceResponse = R.cond([
    [R.is(Buffer), inflateBufferBody],
    [R.is(String), inflateStringBody],
    [isConformingResponse, R.identity],
    [R.T, R.always(malformedResponse)]
]);

module.exports = {
    bufferFromUtf8,
    inflateStringBody,
    inflateBufferBody,
    isConformingResponse,
    coerceResponse,
    malformedResponse,
    context
};