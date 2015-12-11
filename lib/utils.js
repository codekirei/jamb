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
// TODO jsdoc
const arsTo2DAr = (a, b) => a.map((_a, i) => [_a, b[i]])

// TODO jsdoc
const arToOb = ar => {const ob = {}; ob[ar[0]] = ar[1]; return ob}

// TODO jsdoc
const flatOb = (prev, cur) => Object.assign(prev, cur)

// TODO jsdoc
const obToAr = (ob, fn) =>
  Object.keys(ob).reduce((ar, k) => {ar.push(fn(ob, k)); return ar}, [])

// TODO jsdoc
const flatAr = ars => ars.reduce((a, b) => a.concat(b), [])

//----------------------------------------------------------
// strings and buffers
//----------------------------------------------------------
// TODO jsdoc
const buf = str => new Buffer(str, 'utf8')

// TODO jsdoc
function bufTransform(data, fn) {
  ['preview', 'content'].map(key => {
    if (data[key]) data[key] = buf(fn(data[key].toString()).trim())
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
const writeObj = obj => Object.keys(obj).map(k => write(k, obj[k]))

//----------------------------------------------------------
// other
//----------------------------------------------------------
// TODO jsdoc
function genSitemap(content, hostname) {
  const convertor = (ob, k) => {return {url: `/${ob[k].sitemapUrl}`}}
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
  , arToOb
  , buf
  , bufTransform
  , errHandler
  , flatAr
  , flatOb
  , genSitemap
  , obToAr
  , read
  , readContent
  , readTemplates
  , write
  , writeObj
  }
