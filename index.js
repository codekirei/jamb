'use strict'

//----------------------------------------------------------
// modules
//----------------------------------------------------------
// node
const p = require('path')

// npm
const fs = require('fs-extra')
const fm = require('front-matter')
const md = require('markdown-it')()
const jade = require('jade')

//----------------------------------------------------------
// logic
//----------------------------------------------------------
const jadeOpts = {
  basedir: './src/templates',
  pretty: true
}

function split(obj) {
  const indicator = '\n--MORE--\n'
  if (obj.body.includes(indicator)) {
    const strings = obj.body.split(indicator)
    obj.preview = strings[0]
    obj.body = strings[1]
    return obj
  }
  return obj
}

function renderMd(obj) {
  if (obj.preview) obj.preview = md.render(obj.preview).trim()
  obj.body = md.render(obj.body).trim()
  return obj
}

function unwrapAttrs(obj) {
  Object.keys(obj.attributes).map(key => {
    obj[key] = obj.attributes[key]
  })
  delete obj.attributes
  return obj
}

function groupByTemplate(accum, obj) {
  const template = obj.template || 'page'
  if (obj.template) delete obj.template
  accum[template]
    ? accum[template].push(obj)
    : accum[template] = [obj]
  return accum
}

function getContent(dir) {
  return fs.readdirSync(dir)
    .filter(path => p.extname(path) === '.md')
    .map(path => fs.readFileSync(p.join(dir, path), 'utf8'))
    .map(fm)
    .map(split)
    .map(renderMd)
    .map(unwrapAttrs)
}

function getContentByTemplate(dir) {
  return getContent(dir)
    .reduce(groupByTemplate, {})
}

function merge(obj1, obj2) {
  Object.keys(obj2).map(key => {
    obj1[key]
      ? obj2[key].map(obj => obj1[key].push(obj))
      : obj1[key] = obj2[key]
  })
  return obj1
}

function toTemplatesObj(accum, pair) {
  accum[pair[0]] = pair[1]
  return accum
}

function getTemplates(dir) {
  return fs.readdirSync(dir)
    .filter(path => p.extname(path) === '.jade')
    .map(path => [p.basename(path, '.jade'), p.join(dir, path)])
    .map(_ => [_[0], fs.readFileSync(_[1], 'utf8')])
    .map(_ => [_[0], jade.compile(_[1], jadeOpts)])
    .reduce(toTemplatesObj, {})
}

function render(content, posts, templates) {
  const pages = {}
  Object.keys(content).map(template => {
    content[template].map(data => {
      data.posts = posts
      pages[data.url] = templates[template]({data})
    })
  })
  return pages
}

function write(html) {
  return Object.keys(html).map(url => {
    const path = url === 'index'
      ? `${url}.html`
      : `${url}${p.sep}index.html`
    fs.outputFileSync(p.join('dist', path), html[url])
  })
}

function blog(cb) {
  const content = merge(
    getContentByTemplate('src/content'),
    getContentByTemplate('src/content/posts')
  )
  const posts = getContent('src/content/posts')
  const templates = getTemplates('src/templates')
  const html = render(content, posts, templates)
  write(html)
  return cb()
}

//----------------------------------------------------------
// exports
//----------------------------------------------------------
module.exports = blog
