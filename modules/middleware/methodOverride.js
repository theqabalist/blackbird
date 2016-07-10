/* */
const normalizeHeaderName = require("../utils/normalizeHeaderName");
const {is} = require("ramda");
/**
 * A middleware that overrides the method of the request to a value that was
 * given either in a request parameter or a request header. Can be useful when
 * you need to use HTTP methods other than GET and POST with clients that don't
 * support them, like web browsers.
 *
 * For example, you could use the following HTML form:
 *
 *   <form method="POST" action="/">
 *     <input type="hidden" name="_method" value="PUT">
 *   </form>
 *
 * with an app that uses methodOverride:
 *
 *   let app = BB.stack();
 *   app.use(BB.params);
 *   app.use(BB.methodOverride);
 *   app.run(function (request) {
 *     return request.method; // PUT
 *   });
 *
 * Note: When using BB.methodOverride with POST parameters you need to put
 * BB.params in front of it so that the request parameters will be available.
 *
 * Options may be any of the following:
 *
 * - paramName        The name of the request param that contains the
 *                    request method. Defaults to "_method"
 * - headerName       The name of the HTTP header that will contain the
 *                    request method. This allows you to put the request
 *                    method in an HTTP header instead of a request param.
 *                    Defaults to "X-Http-Method-Override"
 */
function methodOverride(app, options) {
    options = options || {};

    if (is(String, options)) {
        options = {paramName: options};
    }

    const paramName = options.paramName || "_method";
    const headerName = normalizeHeaderName(options.headerName || "X-Http-Method-Override");

    return function (conn) {
        let method;
        if (conn.request.headers[headerName]) {
            method = conn.request.headers[headerName];
        } else if (!conn.params) {
            conn.onError(new Error("No params! Use BB.params in front of BB.methodOverride"));
        } else if (conn.params[paramName]) {
            method = conn.params[paramName];

      // If multiple _method parameters were used, use the last one.
            if (Array.isArray(method)) {
                method = method[method.length - 1];
            }
        }

        if (method) {
            conn.method = method.toUpperCase();
        }

        return conn.run(app);
    };
}

module.exports = methodOverride;
