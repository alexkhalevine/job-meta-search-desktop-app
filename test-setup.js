// Register ts-node with proper module resolution
require('ts-node/register')

// Set up module alias resolution
const Module = require('module')
const path = require('path')

const originalResolveFilename = Module._resolveFilename
Module._resolveFilename = function (request, parent, isMain) {
  if (request.startsWith('@utils/')) {
    request = request.replace('@utils/', './src/utils/')
    request = path.resolve(request)
  }
  if (request.startsWith('@main/')) {
    request = request.replace('@main/', './src/main/')
    request = path.resolve(request)
  }
  return originalResolveFilename.call(this, request, parent, isMain)
}
