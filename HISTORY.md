
## 0.8.1 / 2011-09-01

 * Supports passing the URI as a string to client or server.
 * Host is now an optional parameter for client or server.
 * Fixes bug when performing a method call multiple times.
 * Removes node_modules directory. Use `npm install .` if cloning.

## 0.8.0 / 2011-08-14

 * Supports HTTPS server and client.
 * Improves Basic Auth support.
 * Errors returned are now an instance of Error, not a String.
 * Fixes bug with structs and whitespace.
 * Fixes bug with empty arrays responses.

## 0.7.1 / 2011-08-02

 * Handles chunked method responses.
 * Fixes parsing multi-line strings values in the String parameter.
 * Allows for custom headers in the HTTP request.

## 0.7.0 / 2011-07-12

 * Renames Client.call() to Client.methodCall().
 * Adds better support for sending and parsing empty String parameters.
 * Client handles errors on http request. Includes handling of invalid URLs.
 * Updates documentation.

## 0.6.2 / 2011-06-15

 * Fixes issue with parsing non-value whitespace in method calls.

## 0.6.1 / 2011-06-03

  * Supports CDATA when generating XML calls or responses.

## 0.6.0 / 2011-05-18

  * Initial release to NPM. Considered stable enough for public use.

