/**
 * Resolves `@/` to `.test-build/src` when running compiled tests with Node (tsc does not rewrite paths).
 */
const path = require("path");
const Module = require("module");
const buildSrc = path.resolve(__dirname, "../.test-build/src");
const orig = Module._resolveFilename.bind(Module);
Module._resolveFilename = function (request, parent, isMain, options) {
  if (typeof request === "string" && request.startsWith("@/")) {
    request = path.join(buildSrc, request.slice(2));
  }
  return orig(request, parent, isMain, options);
};
