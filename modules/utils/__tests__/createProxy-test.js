let expect = require("expect");
let callApp = require("../callApp");
let createProxy = require("../createProxy");

describe("a proxy", function () {
    let proxy;
    beforeEach(function () {
        proxy = createProxy("http://www.example.com/the/path?the=query");
    });

    it("has the correct proxyLocation", function () {
    // This test may take a while because it makes a real network connection.
        this.timeout(3000);

        return callApp(proxy, "https://example.org:5000/more/path?more=query").then(function (conn) {
            let location = conn.proxyLocation;

            expect(location.protocol).toEqual("http:");
            expect(location.host).toEqual("www.example.com");
            expect(location.pathname).toEqual("/the/path/more/path");
            expect(location.query).toEqual({
                the: "query",
                more: "query"
            });
        });
    });
});
