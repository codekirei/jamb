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

//----------------------------------------------------------
// assign default template if no template provided
//----------------------------------------------------------
// TODO jsdoc
const defaultTemplate = template => obj =>
  obj.template ? obj : Object.assign(obj, {template})

//----------------------------------------------------------
// add post data to pages that require it
//----------------------------------------------------------
// TODO jsdoc
const addPostData = (need, content, posts) =>
  content.map(ob =>
    need.indexOf(ob.template) > -1
      ? Object.assign({}, ob, {posts})
      : ob
  )

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
  , addPostData
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
