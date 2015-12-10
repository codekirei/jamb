'use strict'

//----------------------------------------------------------
// modules
//----------------------------------------------------------
// node
const p = require('path')

// npm
const md = require('markdown-it')()
  .use(require('markdown-it-highlightjs'))
const jade = require('jade')
const yaml = require('js-yaml')


//----------------------------------------------------------
// fns
//----------------------------------------------------------
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

// TODO jsdoc
function frontmatter(delim) {
  return function(string) {
    const strings = string.split(delim)
    const dataObj = yaml.load(strings[1])
    dataObj.content = buf(strings.slice(2).join(delim))
    return dataObj
  }
}

// TODO jsdoc
function preview(delim) {
  return function(data) {
    const str = data.content.toString()
    if (str.includes(delim)) {
      const split = str.split(delim)
      data.preview = buf(split[0])
      data.content = buf(split[1])
      return data
    }
    return data
  }
}

// TODO jsdoc
function out(dist) {
  return function(data) {
    const url = data.url
    const path = url === 'index' ? `${url}.html` : `${url}${p.sep}index.html`
    data.out = p.join(dist, path)
    return data
  }
}

// TODO jsdoc
function ert(wpm) {
  return function(data) {
    data.ert = Math.ceil(data.content.toString().split(' ').length / wpm)
    return data
  }
}

/**
  Render markdown data fields.
  @param {Object} data - data object
  @returns {Object} data object with markdown rendered
  */
const markdown = data => bufTransform(data, val => md.render(val))

// TODO jsdoc
function defaultTemplate(template) {
  return function(data) {
    if (!data.template) data.template = template
    return data
  }
}

// TODO jsdoc
const base = path => p.basename(path, '.jade')

// TODO jsdoc
const compile = opts => arr => [base(arr[0]), jade.compile(arr[1], opts)]

/**
  Restructure array of data objects by data.template.
  @param {Object[]} dataArr - array of data objects
  @returns {Object} object with template keys and data array values
  */
function groupByTemplate(dataArr) {
  return dataArr.reduce((accum, data) => {
    const template = data.template
    accum[template]
      ? accum[template].push(data)
      : accum[template] = [data]
    return accum
  }, {})
}


//----------------------------------------------------------
// exports
//----------------------------------------------------------
// module.exports = 
