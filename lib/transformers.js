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

// TODO jsdoc
const fm = (strs, delim) => fmOb(strs, fmContent(strs, delim))

// TODO jsdoc
const fmOb = (strs, content) => Object.assign(yaml.load(strs[1]), {content})

// TODO jsdoc
const fmContent = (strs, delim) => strToBuf(strs.slice(2).join(delim))

// TODO jsdoc
const frontmatter = delim => str => fm(str.split(delim), delim)

/**
  Render markdown data fields.
  @param {Object} data - data object
  @returns {Object} data object with markdown rendered
  */
const markdown = data => bufTransform(data, raw => md.render(raw))

// TODO jsdoc
function outPath(dist) {
  return function(data) {
    const url = data.url
    const path = url === 'index' ? `${url}.html` : `${url}${p.sep}index.html`
    data.sitemapUrl = path
    data.out = p.join(dist, path)
    return data
  }
}

// TODO jsdoc
function preview(delim) {
  return function(data) {
    const str = data.content.toString()
    if (str.includes(delim)) {
      const split = str.split(delim)
      data.preview = strToBuf(split[0])
      data.content = strToBuf(split[1])
      return data
    }
    return data
  }
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
  { compile
  , defaultTemplate
  , ert
  , ertCalc
  , fm
  , fmOb
  , fmContent
  , frontmatter
  , markdown
  , outPath
  , preview
  , render
  }
