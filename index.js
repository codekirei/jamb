'use strict'

//----------------------------------------------------------
// modules
//----------------------------------------------------------
// node
const p = require('path')

// npm
const P = require('bluebird')
const fs = require('fs-extra')
const md = require('markdown-it')()
  .use(require('markdown-it-highlightjs'))
const jade = require('jade')
const globby = require('globby')
const co = require('co')
const yaml = require('js-yaml')

//----------------------------------------------------------
// promisification
//----------------------------------------------------------
const read = path => P.promisify(fs.readFile)(path, 'utf8')
const write = P.promisify(fs.outputFile)

//----------------------------------------------------------
// shortcuts
//----------------------------------------------------------
const buf = str => new Buffer(str, 'utf8')

//----------------------------------------------------------
// logic
//----------------------------------------------------------
module.exports = class Jamb {
  constructor(cfg) {
    this._previewDelim = '--MORE--'
    this._yamlDelim = '---'
    this._defaultTemplate = 'page'
    this._dist = cfg.dist
    this._needPosts = ['index']
    this._wpm = 225
    this._paths =
      { pages: cfg.pages
      , posts: cfg.posts
      , templates: cfg.templates
      , dist: cfg.dist
      }
    this._opts =
      { jade:
        { basedir: './test/fixtures/templates'
        , pretty: true
        }
        // TODO globby opts?
        // TODO markdown-it opts?
      }

    return co(() => this.main()).catch(errHandler)
  }

  // TODO - JSDOC
  * main() {
    const pages = yield this.pages(this._paths.pages)
    const posts = yield this.posts(this._paths.posts)
    const content = shallowMerge(
      groupByTemplate(pages),
      groupByTemplate(posts)
    )
    const templates = yield this.templates(this._paths.templates)
    const html = render(this._needPosts)(content, posts, templates)
    yield writeObj(html)
    return Object.keys(html)
  }

  // TODO - JSDOC
  * pages(glob) {
    return P.resolve(yield readContent(glob))
      .map(frontmatter(this._yamlDelim))
      .map(preview(this._previewDelim))
      .map(markdown)
      .map(defaultTemplate(this._defaultTemplate))
      .map(out(this._paths.dist))
  }

  // TODO - jsdoc
  * posts(glob) {
    return P.resolve(yield this.pages(glob))
      .map(ert(this._wpm))
  }

  // TODO jsdoc
  * templates(glob) {
    return P.resolve(yield readTemplates(glob))
      .map(compile(this._opts.jade))
      .reduce(binaryArrToObj, {})
  }
}

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
// Util Fns
//----------------------------------------------------------
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

// TODO jsdoc
function binaryArrToObj(accum, arr) {
  accum[arr[0]] = arr[1]
  return accum
}

// TODO jsdoc
const writeObj = obj => Object.keys(obj).map(path => write(path, obj[path]))

// TODO jsdoc
function bufTransform(data, fn) {
  ['preview', 'content'].map(key => {
    if (data[key]) data[key] = buf(fn(data[key].toString()).trim())
  })
  return data
}

// TODO jsdoc
function* readContent(glob) {
  const paths = yield globby(glob)
  return yield paths.map(read)
}

function* readTemplates(glob) {
  const paths = yield globby(glob)
  const strs = yield paths.map(read)
  return binaryArr(paths, strs)
}

const binaryArr = (a, b) => a.map((_a, i) => [_a, b[i]])

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
// Curried Fns
//----------------------------------------------------------
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

const errHandler = err => {console.log(err.stack); throw new Error(err)}
  // errs(err) {
  //   console.log(err.stack)
  //   throw new Error(err)
  // }

// TODO jsdoc
