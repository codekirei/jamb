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
  Make canonical link from hostname and slug.

  @param {String} host - hostname (e.g. http://example.com)
  @param {String} slug - slug (e.g. about)
  @returns {String} canonical link
 */
const makeCanonical = (host, slug) => slug === '/'
  ? host
  : `${host}${slug}`

/**
  Attach generated canonical link to Object.canonical.

  @param {String} host - hostname
  @returns {Function} curried function that mutates data object
 */
const addCanonical = host => ob =>
  Object.assign(ob, {canonical: makeCanonical(host, ob.slug)})

// TODO jsdoc
const addDateOb = ob => Object.assign(ob, {dateOb: new Date(ob.posted)})

// TODO jsdoc
const parseDate = d => `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`

// TODO jsdoc
const addDate = ob => Object.assign(ob, {date: parseDate(ob.dateOb)})

// TODO jsdoc
const addDateNum = ob => Object.assign(ob, {dateNum: ob.dateOb.valueOf()})

// TODO jsdoc
const byReverseDate = (a, b) => b.dateNum - a.dateNum

/**
  Attach generated path to Object.path.

  @param {String} dist - base dist dir to write to
  @returns {Function} curried function that mutates data object
 */
const addPath = dist => ob =>
  Object.assign(ob, {path: p.join(dist, ob.slug, 'index.html')})

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

/**
  Add author data to objects with unspecified author.

  @param {Object} author - default author
  @returns {Function} pure curried function that returns object
 */
const addAuthor = author => ob =>
  ob.author ? ob : Object.assign({}, ob, {author})

/**
  Add nav data to object.

  @param {Object} navLinks - links to include in site nav; each link must be an
    object with `text` and `link` entries
  @returns {Function} pure curried function that returns object
 */
const addNav = nav => ob => Object.assign({}, ob, {nav})

//----------------------------------------------------------
// render and compile templates
//----------------------------------------------------------
/**
  Compile a jade template.

  @param {Object} opts - options to pass to jade.compile
  @returns {Function} curried fn that mutates a pair of values in an array
    value 1: template name parsed from full path
    value 2: compiled jade template (function that accepts data to render HTML)
 */
const compile = opts => arr =>
  [p.basename(arr[0], '.jade'), jade.compile(arr[1], opts)]

/**
  Render all content objects with jade templates.

  @param {Object[]} content - ar of data objects
  @param {Object} templates - compiled templates to render with
  @returns {Array[]} 2D array of pairs with the following values:
    value 1: path to write to
    value 2: rendered HTML
 */
const render = (content, templates) =>
  content.map(data => [data.path, templates[data.template]({data})])

//----------------------------------------------------------
// exports
//----------------------------------------------------------
module.exports =
  { addAuthor
  , addCanonical
  , addDate
  , addDateOb
  , addDateNum
  , addNav
  , addPath
  , assignSplits
  , byReverseDate
  , compile
  , defaultTemplate
  , ert
  , ertCalc
  , injectPostData
  , makeCanonical
  , markdown
  , parseDate
  , render
  , splitPreview
  }
