'use strict'

//----------------------------------------------------------
// modules
//----------------------------------------------------------
// npm
const fs = require('fs-extra')
const globby = require('globby')
const P = require('bluebird')

//----------------------------------------------------------
// objects and arrays
//----------------------------------------------------------
/**
  Convert a pair of arrays into a 2D array of pairs.

  @param {Array} a - first array
  @param {Array} b - second array
  @returns {Array} 2D array
  @example
  var foo = ['a', 'b', 'c']
  var bar = [1, 2, 3]
  arsTo2DAr(foo, bar)
    // => [['a', 1], ['b', 2], ['c', 3]]
 */
const arsTo2DAr = (a, b) => a.map((_a, i) => [_a, b[i]])

/**
  Convert a array of paired values into an object.

  @param {Array} ar - array of paired values
  @returns {Object} object with k:v pair
  @example
  var ar = ['foo', 1]
  airToOb(ar)
    // => {foo: 1}
 */
const arToOb = ar => {const ob = {}; ob[ar[0]] = ar[1]; return ob}

/**
  Create a flat object with Array.prototype.reduce().

  @param {Object} prev - previous object
  @param {Object} cur - current object
  @returns {Object} combined flat object
  @example
  var obs = [{foo: 1}, {bar: 2}]
  obs.reduce(flatOb)
    // => {foo: 1, bar: 2}
 */
const flatOb = (prev, cur) => Object.assign(prev, cur)

/**
  Flatten an array of arrays.

  @param {Array} ars - an array of arrays
  @returns {Array} a flat array
  @example
  var foo = [1, 2, 3]
  var bar = [4, 5, 6]
  flatAr([foo, bar])
    // => [1, 2, 3, 4, 5, 6]
 */
const flatAr = ars => ars.reduce((a, b) => a.concat(b), [])

//----------------------------------------------------------
// strings and buffers
//----------------------------------------------------------
/**
  Convenience wrapper to transform buffers in 'preview' and 'content' fields in
  a data object if they exist.

  @param {Object} data - data object to transform
  @param {Function} fn - transform function; takes val.toString() as param
  @returns {Object} data object with mutated fields
 */
function bufTransform(data, fn) {
  ['preview', 'content'].map(k => {
    if (data[k]) data[k] = new Buffer(fn(data[k].toString()).trim(), 'utf8')
  })
  return data
}

//----------------------------------------------------------
// io
//----------------------------------------------------------
/**
  Promisifed, curried fs.readFile.

  @param {String} path - path to read
  @returns {String} contents of file at path
 */
const read = path => P.promisify(fs.readFile)(path, 'utf8')

/**
  Generator fn to read files that match glob.

  @param {String|String[]} glob - file glob(s) to match
  @returns {String[]} contents of files
 */
function* readContent(glob) {
  const paths = yield globby(glob)
  return yield paths.map(read)
}

/**
  Generator fn to read files that match glob and retain paths.

  @param {String|String[]} glob - file glob(s) to match
  @returns {Array[]} 2D array with path and file content pairs
 */
function* readTemplates(glob) {
  const paths = yield globby(glob)
  const strs = yield paths.map(read)
  return arsTo2DAr(paths, strs)
}

/**
  Promisified fs.outputFile fn.

  @param {String} path - path to write to
  @param {String} data - data to write
  @returns {undefined}
 */
const write = (path, data) => P.promisify(fs.outputFile)(path, data)

/**
  Iterative write fn that reads 2D array for params.

  @param {Array[]} ar - 2D array with [path, data] subarrays
  @returns {undefined}
 */
const write2D = ar => ar.map(_ar => write(_ar[0], _ar[1]))

//----------------------------------------------------------
// other
//----------------------------------------------------------
/**
  Handle errors.

  @param {Object} err - error object
  @throws
 */
const errHandler = err => {console.log(err.stack); throw new Error(err)}

//----------------------------------------------------------
// exports
//----------------------------------------------------------
module.exports =
  { arsTo2DAr
  , arToOb
  , bufTransform
  , errHandler
  , flatAr
  , flatOb
  , read
  , readContent
  , readTemplates
  , write
  , write2D
  }
