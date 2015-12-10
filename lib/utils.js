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
// TODO jsdoc
const arrsToBinaryArr = (a, b) => a.map((_a, i) => [_a, b[i]])

// TODO jsdoc
function binaryArrToObj(accum, arr) {
  accum[arr[0]] = arr[1]
  return accum
}

/**
  Shallow merge two objects with array values.
  @param {Object} to - merge to
  @param {Object} from - merge from
  @returns {Object} merged object
  */
function shallowMerge(to, from) {
  Object.keys(from).map(key => to[key]
    ? from[key].map(data => to[key].push(data))
    : to[key] = from[key]
  )
  return to
}

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
  return arrsToBinaryArr(paths, strs)
}

// TODO jsdoc
const write = P.promisify(fs.outputFile)

// TODO jsdoc
const writeObj = obj => Object.keys(obj).map(path => write(path, obj[path]))

//----------------------------------------------------------
// errors
//----------------------------------------------------------
// TODO jsdoc
const errHandler = err => {console.log(err.stack); throw new Error(err)}

//----------------------------------------------------------
// exports
//----------------------------------------------------------
module.exports =
  { arrsToBinaryArr
  , binaryArrToObj
  , buf
  , bufTransform
  , errHandler
  , read
  , readContent
  , readTemplates
  , shallowMerge
  , write
  , writeObj
  }
