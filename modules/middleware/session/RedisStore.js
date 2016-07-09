const d = require("describe-property");
const redis = require("redis");
const makeToken = require("../../utils/makeToken");
const Promise = require("../../utils/Promise");
const {parse: parseURL} = require("url").parse;

function sendCommand(client, command, args) {
    args = args || [];

    return new Promise(function (resolve, reject) {
        client.send_command(command, args, function (error, value) {
            if (error) {
                reject(error);
            } else {
                resolve(value);
            }
        });
    });
}

function makeUniqueKey(client, keyLength) {
    const key = makeToken(keyLength);

  // Try to set an empty string to reserve the key.
    return sendCommand(client, "setnx", [key, ""]).then(function (result) {
        if (result === 1) {
            return key; // The key was available.
        }

        return makeUniqueKey(client, keyLength); // Try again.
    });
}

/**
 * Server-side storage for sessions using Redis.
 *
 * Options may be any of the following:
 *
 * - url              The URL of the Redis instance
 * - keyLength        The length (in bytes) that will be used for unique
 *                    cache keys. Defaults to 32
 * - expireAfter      The number of seconds after which sessions expire.
 *                    Defaults to 0 (no expiration)
 *
 * Additionally, all options are passed through to `redis.createClient`.
 *
 * Example:
 *
 *   let RedisStore = require('mach/middleware/session/RedisStore');
 *
 *   app.use(mach.session, {
 *     store: new RedisStore({ url: 'redis://127.0.0.1:6379' })
 *   });
 *
 * Note: This store always checks for availability of keys in Redis before
 * using them, so it should be safe to use alongside other programs that are
 * using the same database. However, if you purge the store of all keys it will
 * issue a FLUSHDB command to the database, so be careful. This operation never
 * happens automatically.
 */
function RedisStore(options) {
    options = options || {};

    this.options = options;
    this.keyLength = options.keyLength || 32;
    this.ttl = options.expireAfter ?
        1000 * options.expireAfter :
        0;
}

Object.defineProperties(RedisStore.prototype, {

    getClient: d(function () {
        if (!this._client) {
            const options = this.options;

            let hostname, port;
            if (typeof options.url === "string") {
                const parsedURL = parseURL(options.url);
                hostname = parsedURL.hostname;
                port = parsedURL.port;
            }

            this._client = redis.createClient(port, hostname, options);
        }

        return this._client;
    }),

    load: d(function (value) {
        return sendCommand(this.getClient(), "get", [value]).then(function (json) {
            return json ? JSON.parse(json) : {};
        });
    }),

    save: d(function (session) {
        const client = this.getClient();
        const keyLength = this.keyLength;
        const ttl = this.ttl;

        return Promise.resolve(session._id || makeUniqueKey(client, keyLength)).then(function (key) {
            session._id = key;

            const json = JSON.stringify(session);

            let promise;
            if (ttl) {
                promise = sendCommand(client, "psetex", [key, ttl, json]);
            } else {
                promise = sendCommand(client, "set", [key, json]);
            }

            return promise.then(function () {
                return key;
            });
        });
    }),

    purge: d(function (key) {
        if (key) {
            return sendCommand(this.getClient(), "del", [key]);
        }

        return sendCommand(this.getClient(), "flushdb");
    }),

    destroy: d(function () {
        return sendCommand(this.getClient(), "quit");
    })

});

module.exports = RedisStore;
