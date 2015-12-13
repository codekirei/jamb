'use strict'

//----------------------------------------------------------
// modules
//----------------------------------------------------------
// node
const p = require('path')

// npm
const mdi = require('markdown-it')().use(require('markdown-it-highlightjs'))
const jade = require('jade')

// local
const u = require('./utils')
const bufTransform = u.bufTransform

//----------------------------------------------------------
// transformers
//----------------------------------------------------------
/**
  Set default template for data sets with no template specified.

  @param {String} template - default template
  @returns {Function} curried function
 */
const defaultTemplate = template => obj =>
  obj.template ? obj : Object.assign(obj, {template})

/**
  Inject post data into content that will use a template requiring post data.

  @param {String[]} need - templates that require post data
  @param {Object[]} content - content data objects
  @param {Object[]} posts - post data objects
  @returns {Object[]} content data objects with post data conditionally injected
 */
const injectPostData = (need, content, posts) =>
  content.map(ob =>
    need.indexOf(ob.template) > -1
      ? Object.assign({}, ob, {posts})
      : ob
  )

/**
  Render markdown data to html with markdown-it.

  @param {Object} data - object with buffers to render
  @returns {Object} object with markdown rendered
  */
const markdown = data => bufTransform(data, md => mdi.render(md))

/**
  Calculate the estimated reading time of a buffer.

  @param {Buffer} buf - buffer of content
  @param {Number} wpm - average word per minute to use in calculation
  @returns {Number} estimated reading time in minutes
 */
const ertCalc = (buf, wpm) => Math.ceil(buf.toString().split(' ').length / wpm)

/**
  Curried fn to calculate the reading time of content in the obj.content buffer.

  @param {Number} wpm - average word per minute to use in calculation
  @returns {Function} fn that accepts an object and returns a mutated object
 */
const ert = wpm => obj => Object.assign(obj, {ert: ertCalc(obj.content, wpm)})

//----------------------------------------------------------
// build sitemap and output paths
//----------------------------------------------------------
// TODO jsdoc
const urlToPath = url => url === 'index'
  ? `${url}.html`
  : `${url}${p.sep}index.html`

// TODO jsdoc
const addPaths = dist => data => {
  const path = urlToPath(data.url)
  return Object.assign(data, {sitemapUrl: path}, {out: p.join(dist, path)})
}

//----------------------------------------------------------
// split content by preview delimiter
//----------------------------------------------------------
// TODO jsdoc
const assignSplits = (strs, data) => Object.assign(data
  , {preview: new Buffer(strs[0], 'utf8')}
  , {content: new Buffer(strs[1], 'utf8')}
)

// TODO jsdoc
const splitPreview = delim => data => {
  const str = data.content.toString()
  return str.includes(delim)
    ? assignSplits(str.split(delim), data)
    : data
}

//----------------------------------------------------------
// render and compile templates
//----------------------------------------------------------
// TODO jsdoc
const compile = opts => arr =>
  [p.basename(arr[0], '.jade'), jade.compile(arr[1], opts)]

// TODO jsdoc
const render = (content, templates) =>
  content.map(data => [data.out, templates[data.template]({data})])

//----------------------------------------------------------
// exports
//----------------------------------------------------------
module.exports =
  { addPaths
  , assignSplits
  , compile
  , defaultTemplate
  , ert
  , ertCalc
  , injectPostData
  , markdown
  , render
  , splitPreview
  , urlToPath
  }
