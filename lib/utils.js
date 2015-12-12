'use strict'
//----------------------------------------------------------
// modules
//----------------------------------------------------------
// npm
const fs = require('fs-extra')
const globby = require('globby')
const P = require('bluebird')
const sm = require('sitemap')

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
  Convert a 2D array into an object.

  @param {Array} ar - 2D array
  @returns {Object} object with k:v pairs from 2D array
  @example
  var ar = [['foo', 1]]
  obFrom2Dar(ar)
    // => {foo: 1}
 */
const obFrom2DAr = ar => {const ob = {}; ob[ar[0]] = ar[1]; return ob}

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
  Create an array from an object by applying a function to each top-level
  key: value pair.

  @param {Object} ob - object to convert
  @param {Function} fn - function that does converting; takes (val, key) params
  @returns {Array} array created
  @example
  var ob = {foo: 1, bar: 2, baz: 3}
  obToAr(ob, val => val + 1)
    // => [2, 3, 4]
 */
const obToAr = (ob, fn) =>
  Object.keys(ob).reduce((ar, k) => {ar.push(fn(ob[k], k)); return ar}, [])

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
// TODO jsdoc
function bufTransform(data, fn) {
  ['preview', 'content'].map(k => {
    if (data[k]) data[k] = new Buffer(fn(data[k].toString()).trim(), 'utf8')
  })
  return data
}

//----------------------------------------------------------
// io
//----------------------------------------------------------
// TODO jsdoc
const read = path => P.promisify(fs.readFile)(path, 'utf8')

// TODO jsdoc
function* readContent(glob) {
  const paths = yield globby(glob)
  return yield paths.map(read)
}

// TODO jsdoc
function* readTemplates(glob) {
  const paths = yield globby(glob)
  const strs = yield paths.map(read)
  return arsTo2DAr(paths, strs)
}

// TODO jsdoc
const write = P.promisify(fs.outputFile)

// TODO jsdoc
const write2D = ar => ar.map(_ar => write(_ar[0], _ar[1]))

//----------------------------------------------------------
// other
//----------------------------------------------------------
// TODO jsdoc
function genSitemap(content, hostname) {
  const convertor = val => {return {url: `/${val.sitemapUrl}`}}
  const urls = obToAr(content, convertor)
  return sm.createSitemap({hostname, urls}).toString()
}

// TODO jsdoc
const errHandler = err => {console.log(err.stack); throw new Error(err)}

//----------------------------------------------------------
// exports
//----------------------------------------------------------
module.exports =
  { arsTo2DAr
  , bufTransform
  , errHandler
  , flatAr
  , flatOb
  , genSitemap
  , obFrom2DAr
  , obToAr
  , read
  , readContent
  , readTemplates
  , write
  , write2D
  }
