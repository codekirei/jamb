'use strict'

//----------------------------------------------------------
// modules
//----------------------------------------------------------
// node
const p = require('path')

// npm
const md = require('markdown-it')().use(require('markdown-it-highlightjs'))
const jade = require('jade')
const yaml = require('js-yaml')

// local
const u = require('./utils')
const bufTransform = u.bufTransform
const strToBuf     = u.strToBuf

//----------------------------------------------------------
// content transformers
//----------------------------------------------------------
// TODO jsdoc
const defaultTemplate = template => obj =>
  obj.template ? obj : Object.assign(obj, {template})

// TODO jsdoc
const ert = wpm => obj => Object.assign(obj, {ert: ertCalc(obj.content, wpm)})

// TODO jsdoc
const ertCalc = (buf, wpm) => Math.ceil(buf.toString().split(' ').length / wpm)

/**
  Render markdown data fields.
  @param {Object} data - data object
  @returns {Object} data object with markdown rendered
  */
const markdown = data => bufTransform(data, raw => md.render(raw))

// TODO jsdoc
const urlToPath = url => url === 'index'
  ? `${url}.html`
  : `${url}${p.sep}index.html`

// TODO jsdoc
const addPaths = dist => data => {
  const path = urlToPath(data.url)
  return Object.assign(data, {sitemapUrl: path}, {out: p.join(dist, path)})
}

// TODO jsdoc
const assignSplits = (strs, data) => Object.assign(data
  , {preview: strToBuf(strs[0])}
  , {content: strToBuf(strs[1])}
)

// TODO jsdoc
const preview = delim => data => {
  const str = data.content.toString()
  return str.includes(delim)
    ? assignSplits(str.split(delim), data)
    : data
}

//----------------------------------------------------------
// template transformers
//----------------------------------------------------------
// TODO jsdoc
const compile = opts => arr =>
  [p.basename(arr[0], '.jade'), jade.compile(arr[1], opts)]

// TODO jsdoc
function render(need) {
  return function(content, posts, templates) {
    const html = {}
    Object.keys(content).map(t => content[t].map(data => {
      if (need.indexOf(t) > -1) data.posts = posts
      html[data.out] = templates[t]({data})
    }))
    return html
  }
}

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
  , preview
  , render
  , urlToPath
  }
