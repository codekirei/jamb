'use strict'

//----------------------------------------------------------
// modules
//----------------------------------------------------------
// node
const p = require('path')

// npm
const md = require('markdown-it')().use(require('markdown-it-highlightjs'))
const jade = require('jade')

// local
const u = require('./utils')
const bufTransform = u.bufTransform
const strToBuf     = u.strToBuf

//----------------------------------------------------------
// assign default template if no template provided
//----------------------------------------------------------
// TODO jsdoc
const defaultTemplate = template => obj =>
  obj.template ? obj : Object.assign(obj, {template})

//----------------------------------------------------------
// render markdown
//----------------------------------------------------------
/**
  Render markdown data fields.
  @param {Object} data - data object
  @returns {Object} data object with markdown rendered
  */
const markdown = data => bufTransform(data, raw => md.render(raw))

//----------------------------------------------------------
// estimate reading time
//----------------------------------------------------------
// TODO jsdoc
const ertCalc = (buf, wpm) => Math.ceil(buf.toString().split(' ').length / wpm)

// TODO jsdoc
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
  , {preview: strToBuf(strs[0])}
  , {content: strToBuf(strs[1])}
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
const render = need => (content, posts, templates) =>
  content.map(data => {
    const t = data.template
    if (need.indexOf(t) > -1) Object.assign(data, {posts})
    return [data.out, templates[t]({data})]
  })

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
  , markdown
  , render
  , splitPreview
  , urlToPath
  }
