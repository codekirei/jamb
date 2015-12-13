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
  Set default template for data objects that have no template specified.

  @param {String} template - default template
  @returns {Function} curried function that mutates data object
 */
const defaultTemplate = template => ob =>
  ob.template ? ob : Object.assign(ob, {template})

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

/**
  Build full path, accounting for nested indices, from URL shorthand.

  @param {String} url - shorthand url
  @returns {String} full path
  @example
  urlToPath('index')
    // => 'index.html'
  urlToPath('blog/post1')
    // => 'blog/post1/index.html'
 */
const urlToPath = url => url === 'index'
  ? `${url}.html`
  : `${url}${p.sep}index.html`

/**
  Add sitemap url to data object with urlToPath fn.

  @param {Object} ob - data object to parse
  @returns {Object} mutated object with sitemapUrl added
 */
const addSitemapUrl = ob => Object.assign(ob, {sitemapUrl: urlToPath(ob.url)})

/**
  Add out path to data object based on specified dist path.

  @param {String} dist - base dist dir to write to
  @returns {Function} curried function that mutates a data object
 */
const addOutPath = dist => ob =>
  Object.assign(ob, {out: p.join(dist, ob.sitemapUrl)})

/**
  Assign split string to object.preview and object.content.

  @param {String[]} strs - array of two strings
  @param {Object} ob - object to mutate
  @returns {Object} mutated object
 */
const assignSplits = (strs, ob) => Object.assign(ob
  , {preview: new Buffer(strs[0], 'utf8')}
  , {content: new Buffer(strs[1], 'utf8')}
)

/**
  Split object.content by preview delimiter.

  @param {String} delim - delimiter to split around
  @returns {Function} curried fn that mutates object with assignSplits if delim
    is found
 */
const splitPreview = delim => ob => {
  const content = ob.content.toString()
  return content.includes(delim)
    ? assignSplits(content.split(delim), ob)
    : ob
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
  { addOutPath
  , addSitemapUrl
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
