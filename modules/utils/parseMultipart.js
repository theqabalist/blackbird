var Promise = require('bluebird');
var Stream = require('bufferedstream');
var getByteLength = require('./getByteLength');

// TODO: Refactor to eliminate this circular dependency:
// Message => parseMultipart => Parser => Part => Message
var Parser;

function defaultPartHandler(part) {
  return part.bufferContent();
}

/**
 * Parses a multipart message and returns a promise for an object of
 * the parts it contains, keyed by the name of that part. The partHandler
 * argument is a function that should be used to resolve the value of
 * a part. It defaults to collecting all the content in a buffer.
 */
function parseMultipart(content, boundary, maxLength, partHandler) {
  if (typeof maxLength === 'function') {
    partHandler = maxLength;
    maxLength = null;
  }

  if (typeof Parser === 'undefined')
    Parser = require('../multipart/Parser');

  partHandler = partHandler || defaultPartHandler;
  maxLength = maxLength || Infinity;

  return new Promise(function (resolve, reject) {
    if (!(content instanceof Stream))
      content = new Stream(content);

    var parts = {};
    var contentLength = 0;

    var parser = new Parser(boundary, function (part) {
      parts[part.name] = partHandler(part);
    });

    content.on('error', reject);

    content.on('data', function (chunk) {
      var length = getByteLength(chunk);

      contentLength += length;

      if (maxLength && contentLength > maxLength) {
        reject(new MaxLengthExceededError(maxLength));
      } else {
        var parsedLength = parser.execute(chunk);

        if (parsedLength !== length)
          reject(new Error('Error parsing multipart body: ' + parsedLength + ' of ' + length + ' bytes parsed'));
      }
    });

    content.on('end', function () {
      try {
        parser.finish();
        resolve(Promise.props(parts));
      } catch (error) {
        reject(new Error('Error parsing multipart body: ' + error.message));
      }
    });

    content.resume();
  });
}

module.exports = parseMultipart;
